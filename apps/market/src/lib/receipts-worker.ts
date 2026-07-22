/**
 * The receipts worker — the attestation path. The market is a pull-based
 * verifier: it fetches each live listing's published `activity/v1` attestation
 * (a signed aggregate `{head, count, cumulative_cents, as_of}`), verifies the
 * signature against the seller's PUBLIC identity registry (key resolution only —
 * never a spend log), enforces monotonicity against its own stored history, and
 * earns `proven-live` from growth the market itself WITNESSED across probes.
 *
 * What this worker never does (the privacy contract): fetch or parse a per-call
 * row. The raw log stays on the seller's infra; the counterparty graph is never
 * published. A rollback / bad signature marks the listing `verification_stale`
 * with the exact reason — failures are loud, never hidden.
 *
 * Sibling `audit.json` beside the attestation names `{registry_git_url, agent,
 * root}` for IDENTITY resolution only.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServiceClient } from '@/lib/supabase/service';
import { loadVerifier } from '@/lib/auth/agent-verifier';
import type { Listing } from '@/lib/listings';
import {
  computeLiveness,
  resolveVerifiedAnchor,
  type VerifiedAnchorSummary,
} from '@/lib/attestation-view';


/** One append-only witnessing observation (see attestation_checkpoints). */
export interface AttestationCheckpoint {
  listing_id: string;
  head: string;
  cumulative_cents: number;
  count: number;
  as_of: string;
  anchor_tier: string;
  anchor_threshold: number | null;
  anchor_witnesses: number | null;
  observed_at: string;
}

interface AuditManifest {
  registry_git_url: string;
  agent: string;
  root: string;
}

interface ActivityDoc {
  version: string;
  suite: string;
  subject: { root: string; agent: string };
  head: string;
  count: number;
  cumulative_cents: number;
  as_of: { ts: string; anchor?: unknown };
  signature: string;
}

/** The trailing window growth must be witnessed inside (badge rule). */
const WITNESS_WINDOW_DAYS = 90;

/**
 * Surface the loaded verifier's anchor posture in the logs before a derivation
 * run. An anchor-aware addon restates a verified quorum as an `anchor` field;
 * an addon that predates the witness network omits it, and every observation
 * correctly stays `first-seen`. That is the accepted posture while the market
 * runs on the pre-anchor SDK release, so this is a non-fatal log, not a hard
 * stop: it flags a verifier that cannot resolve attestations at all (which
 * would leave every listing invalid) and records that the witness tier lights
 * up automatically once the anchor-aware release is pinned.
 *
 * Args:
 * * `sdk`: the loaded verifier addon.
 *
 * Usage:
 * ```ignore
 * const sdk = loadVerifier();
 * if (sdk) assertAnchorAwareSdk(sdk);
 * ```
 */
export function assertAnchorAwareSdk(sdk: {
  verifyActivityAttestation?: (attestationJson: string, registryPath: string) => string;
}): void {
  if (typeof sdk.verifyActivityAttestation !== 'function') {
    console.error(
      'receipts-worker: verifier addon exposes no verifyActivityAttestation — every listing will read invalid',
    );
    return;
  }
  console.info(
    'receipts-worker: verifier loaded; witness tier is granted only when the addon restates a verified anchor — unanchored builds stay first-seen',
  );
}

async function deriveListing(
  listing: Listing,
  lastCheckpoint: AttestationCheckpoint | null,
): Promise<
  | { ok: true; doc: ActivityDoc; anchor: VerifiedAnchorSummary | null }
  | { ok: false; reason: string }
> {
  const res = await fetch(listing.attestation_url!, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) return { ok: false, reason: `attestation fetch: ${res.status}` };
  const rawDoc = await res.text();
  let doc: ActivityDoc;
  try {
    doc = JSON.parse(rawDoc) as ActivityDoc;
  } catch {
    return { ok: false, reason: 'attestation is not JSON' };
  }
  if (doc.version !== 'activity/v1') {
    return { ok: false, reason: `attestation version ${doc.version ?? '(none)'} is not activity/v1` };
  }

  const auditUrl = new URL('audit.json', listing.attestation_url!).toString();
  const auditRes = await fetch(auditUrl, { signal: AbortSignal.timeout(15_000) });
  if (!auditRes.ok) {
    return { ok: false, reason: `audit.json beside the attestation is required (got ${auditRes.status})` };
  }
  const manifest = (await auditRes.json()) as AuditManifest;
  if (!manifest.registry_git_url || !manifest.agent || !manifest.root) {
    return { ok: false, reason: 'audit.json must name registry_git_url, agent, root' };
  }
  if (doc.subject?.root !== manifest.root || doc.subject?.agent !== manifest.agent) {
    return { ok: false, reason: 'attestation subject does not match audit.json' };
  }

  const sdk = loadVerifier();
  if (!sdk?.verifyActivityAttestation) {
    return { ok: false, reason: 'verifier unavailable (SDK addon missing verifyActivityAttestation)' };
  }

  if (typeof sdk.fetchRegistry !== 'function') {
    return { ok: false, reason: 'verifier unavailable (SDK addon missing fetchRegistry)' };
  }

  const work = mkdtempSync(join(tmpdir(), 'market-attest-'));
  try {
    // Fetch the PUBLIC identity registry in-process (the SDK's libgit2 carries
    // its own HTTPS transport — serverless hosts have no git binary). Identity
    // refs + heads only: this is key resolution; no spend data exists at this
    // URL. The SDK also materializes the branch's working files, the same
    // layout the CLI writes.
    const registryPath = join(work, 'registry');
    sdk.fetchRegistry(manifest.registry_git_url, registryPath);

    // 1. Authenticity: the signature must verify under the agent's CURRENT keys
    //    from the public KEL, and the agent must be delegated by the claimed
    //    root. When the document embeds a quorum anchor, the SDK re-checks the
    //    finalization too — an anchored document with a bad anchor fails whole.
    const check = JSON.parse(sdk.verifyActivityAttestation(rawDoc, registryPath)) as {
      ok: boolean;
      reason?: string;
      anchor?: VerifiedAnchorSummary | null;
    };
    if (!check.ok) {
      return { ok: false, reason: `attestation signature: ${check.reason ?? 'invalid'}` };
    }

    // 2. Monotonicity vs the market's own last stored observation — the seller's
    //    absolute claim is never credited; regressions are named and fail loud.
    if (lastCheckpoint && sdk.attestationMonotonicityViolation) {
      const violation = sdk.attestationMonotonicityViolation(
        lastCheckpoint.head,
        lastCheckpoint.count,
        lastCheckpoint.cumulative_cents,
        lastCheckpoint.as_of,
        rawDoc,
      );
      if (violation) return { ok: false, reason: `attestation ${violation}` };
    }

    // 3. The tier is derived, never claimed: `witness` comes only from the
    //    SDK's verified-anchor summary. A tier string inside the document
    //    itself is a seller claim and is never credited.
    const anchor = resolveVerifiedAnchor(check);
    return { ok: true, doc, anchor };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

export async function deriveAll(): Promise<{ derived: number; invalid: number }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('listings').select('*').eq('status', 'live');
  if (error) throw new Error(`listing query failed: ${error.message}`);

  let derived = 0;
  let invalid = 0;
  for (const listing of (data ?? []) as Listing[]) {
    if (!listing.attestation_url) continue;
    const { data: history } = await supabase
      .from('attestation_checkpoints')
      .select('*')
      .eq('listing_id', listing.id)
      .order('observed_at', { ascending: false })
      .limit(1);
    const last = ((history ?? [])[0] as AttestationCheckpoint | undefined) ?? null;

    const result = await deriveListing(listing, last).catch((e: Error) => ({
      ok: false as const,
      reason: `derivation error: ${e.message}`,
    }));
    if (!result.ok) {
      invalid += 1;
      await supabase
        .from('listings')
        .update({ verification_stale: true, receipts_invalid: true, fail_reason: result.reason })
        .eq('id', listing.id);
      continue;
    }

    derived += 1;
    const observedAt = new Date().toISOString();
    // 3. Witnessing: append this observation to the history (append-only — the
    //    market's own record of what it saw, when).
    await supabase.from('attestation_checkpoints').insert({
      listing_id: listing.id,
      head: result.doc.head,
      cumulative_cents: result.doc.cumulative_cents,
      count: result.doc.count,
      as_of: result.doc.as_of.ts,
      anchor_tier: result.anchor ? 'witness' : 'first-seen',
      anchor_threshold: result.anchor?.threshold ?? null,
      anchor_witnesses: result.anchor?.witnesses ?? null,
      observed_at: observedAt,
    });

    // 4. The badge: proven-live iff the market itself WITNESSED cumulative growth
    //    within the trailing window — never the seller's absolute claim. One
    //    observation proves nothing; growth needs two points the market saw.
    const windowStart = new Date(Date.now() - WITNESS_WINDOW_DAYS * 86_400_000).toISOString();
    const { data: windowRows } = await supabase
      .from('attestation_checkpoints')
      .select('cumulative_cents, observed_at')
      .eq('listing_id', listing.id)
      .gte('observed_at', windowStart)
      .order('observed_at');
    const window = (windowRows ?? []) as { cumulative_cents: number }[];
    const witnessedDelta =
      window.length >= 2
        ? window[window.length - 1].cumulative_cents - window[0].cumulative_cents
        : 0;

    const update = computeLiveness({
      live_proven_at: listing.live_proven_at,
      witnessedDelta,
      observedAt,
    });
    await supabase.from('listings').update(update).eq('id', listing.id);
  }
  return { derived, invalid };
}
