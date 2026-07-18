/**
 * The receipts worker (US-007): dashboards render only numbers this module
 * re-derived. It pulls each live listing's published spend log, runs the
 * gateway's offline auditor (`verify-spend`) against it, and upserts one
 * aggregate row per day carrying the log's content hash — every figure is
 * reproducible from the referenced log, or it does not render.
 *
 * Published-bundle format (documented on /sell): the spend-log URL points
 * at `spend.jsonl`; an `audit.json` beside it (same directory) names the
 * verify-spend inputs: {"registry_git_url": …, "agent": …, "root": …}.
 * A log that fails re-derivation marks the listing receipts_invalid with
 * the exact verdict — failures are loud, never hidden.
 *
 * v0 granularity: one row per run-day holding all-time totals (the spend
 * log's own timestamps will drive true day-bucketing once per-entry
 * parsing lands). log_hash keeps the aggregates reproducible either way.
 */

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createServiceClient } from '@/lib/supabase/service';
import type { Listing } from '@/lib/listings';

const run = promisify(execFile);

interface AuditManifest {
  registry_git_url: string;
  agent: string;
  root: string;
}

async function deriveListing(listing: Listing): Promise<
  | { ok: true; calls: number; cents: number; logHash: string }
  | { ok: false; reason: string }
> {
  const logRes = await fetch(listing.spend_log_url!, { signal: AbortSignal.timeout(20_000) });
  if (!logRes.ok) return { ok: false, reason: `spend log fetch: ${logRes.status}` };
  const logText = await logRes.text();
  if (!logText.trim()) return { ok: false, reason: 'spend log is empty' };
  const logHash = createHash('sha256').update(logText).digest('hex');

  const auditUrl = new URL('audit.json', listing.spend_log_url!).toString();
  const auditRes = await fetch(auditUrl, { signal: AbortSignal.timeout(15_000) });
  if (!auditRes.ok) {
    return { ok: false, reason: `audit.json beside the log is required (got ${auditRes.status})` };
  }
  const manifest = (await auditRes.json()) as AuditManifest;
  if (!manifest.registry_git_url || !manifest.agent || !manifest.root) {
    return { ok: false, reason: 'audit.json must name registry_git_url, agent, root' };
  }

  const work = mkdtempSync(join(tmpdir(), 'market-receipts-'));
  try {
    const logPath = join(work, 'spend.jsonl');
    writeFileSync(logPath, logText);
    const registryPath = join(work, 'registry');
    // The registry lives under refs/auths/* (git-as-storage) with the durable
    // budget counter and spend log as committed working files: a plain clone
    // neither fetches the identity refs nor tolerates a repo with no HEAD, so
    // init, fetch EVERY ref, and materialize the published branch when one
    // exists (verify-spend reads the counter from the working tree).
    await run('git', ['init', '--quiet', registryPath], { timeout: 15_000 });
    await run(
      'git',
      ['-C', registryPath, 'fetch', '--quiet', manifest.registry_git_url, 'refs/*:refs/*'],
      { timeout: 60_000 },
    );
    const { stdout: heads } = await run(
      'git',
      ['-C', registryPath, 'for-each-ref', 'refs/heads', '--format=%(refname:short)'],
      { timeout: 15_000 },
    );
    const head = heads.split('\n').find(Boolean);
    if (head) {
      await run('git', ['-C', registryPath, 'checkout', '--quiet', '--force', head], {
        timeout: 30_000,
      });
    }

    // Same launcher rule as the prober: `AUTHS_MCP_LAUNCHER` pins a local
    // `auths-mcp.mjs` (no npm fetch inside the verification window); the default
    // cold-installs the published package under the worker's fresh HOME.
    const launcher = process.env.AUTHS_MCP_LAUNCHER;
    const verifyArgs = [
      'verify-spend',
      '--log', logPath,
      '--registry', registryPath,
      '--agent', manifest.agent,
      '--root', manifest.root,
    ];
    const { stdout, stderr } = await run(
      launcher ? process.execPath : 'npx',
      launcher ? [launcher, ...verifyArgs] : ['-y', '@auths-dev/mcp', ...verifyArgs],
      { timeout: 120_000, env: { ...process.env, HOME: work } },
    ).catch((e: Error & { stdout?: string; stderr?: string }) => ({
      stdout: e.stdout ?? '',
      stderr: `${e.stderr ?? ''}\n${e.message}`,
    }));

    const out = `${stdout}\n${stderr}`;
    const consistent = out.match(/consistent — (\d+) call\(s\), \$([0-9.]+) re-derived/);
    if (!consistent) {
      const verdict = out.match(/(tampered-proof|dropped-call|budget-mismatch|cost-mismatch|revoked)/);
      return {
        ok: false,
        reason: verdict ? `verify-spend: ${verdict[1]}` : `verify-spend did not re-derive consistent`,
      };
    }
    return {
      ok: true,
      calls: Number.parseInt(consistent[1], 10),
      cents: Math.round(Number.parseFloat(consistent[2]) * 100),
      logHash,
    };
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
    if (!listing.spend_log_url) continue;
    const result = await deriveListing(listing).catch(
      (e: Error) => ({ ok: false as const, reason: `derivation error: ${e.message}` }),
    );
    if (result.ok) {
      derived += 1;
      const today = new Date().toISOString().slice(0, 10);
      await supabase.from('receipt_summaries').upsert(
        {
          listing_id: listing.id,
          day: today,
          calls: result.calls,
          cents_settled: result.cents,
          rail_split: {},
          log_hash: result.logHash,
          derived_at: new Date().toISOString(),
        },
        { onConflict: 'listing_id,day' },
      );
      const update: Record<string, unknown> = { receipts_invalid: false };
      // Badge tier 2: first re-derived settled cents prove the live rail.
      if (!listing.live_proven_at && result.cents > 0) {
        update.live_proven_at = new Date().toISOString();
      }
      await supabase.from('listings').update(update).eq('id', listing.id);
    } else {
      invalid += 1;
      await supabase
        .from('listings')
        .update({ receipts_invalid: true, fail_reason: result.reason })
        .eq('id', listing.id);
    }
  }
  return { derived, invalid };
}
