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
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createServiceClient } from '@/lib/supabase/service';
import type { Listing } from '@/lib/listings';

const run = promisify(execFile);

/** The worker's proven end-state for one listing's log (see receipt_checkpoints). */
export interface ReceiptCheckpoint {
  log_hash: string;
  prefix_bytes: number;
  verified_len: number;
  last_binding: string;
  last_cents: number;
}

interface AuditManifest {
  registry_git_url: string;
  agent: string;
  root: string;
}

async function deriveListing(listing: Listing, checkpoint?: ReceiptCheckpoint | null): Promise<
  | {
      ok: true;
      calls: number;
      cents: number;
      logHash: string;
      days: Map<string, { calls: number; cents: number; rails: Record<string, number> }>;
      checkpoint: ReceiptCheckpoint | null;
    }
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
    // init, fetch ONLY the identity refs plus the published branch (never the
    // remote's whole refspace), and materialize the branch when one exists
    // (verify-spend reads the counter from the working tree). A blob filter is
    // attempted first to skip historical blobs; remotes that cannot serve
    // partial fetches (dumb HTTP) fall back to the same bounded refspecs,
    // unfiltered — the boundedness comes from the refspecs either way.
    const boundedRefspecs = ['refs/auths/*:refs/auths/*', 'refs/heads/*:refs/heads/*'];
    await run('git', ['init', '--quiet', registryPath], { timeout: 15_000 });
    try {
      await run(
        'git',
        ['-C', registryPath, 'fetch', '--quiet', '--filter=blob:none',
          manifest.registry_git_url, ...boundedRefspecs],
        { timeout: 60_000 },
      );
    } catch {
      await run(
        'git',
        ['-C', registryPath, 'fetch', '--quiet', manifest.registry_git_url, ...boundedRefspecs],
        { timeout: 60_000 },
      );
    }
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
    // Incremental re-verification: when the stored prefix hash still matches the
    // fetched bytes, resume after the records this worker already proved — only
    // the suffix re-verifies. Any prefix mutation misses the hash → full audit.
    const logBuf = Buffer.from(logText);
    const prefixUnchanged = !!checkpoint
      && logBuf.length >= checkpoint.prefix_bytes
      && createHash('sha256').update(logBuf.subarray(0, checkpoint.prefix_bytes)).digest('hex')
        === checkpoint.log_hash;
    if (checkpoint && prefixUnchanged) {
      verifyArgs.push(
        '--resume-index', String(checkpoint.verified_len),
        '--resume-binding', checkpoint.last_binding,
        '--resume-cents', String(checkpoint.last_cents),
      );
    }
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
    const calls = Number.parseInt(consistent[1], 10);
    const cents = Math.round(Number.parseFloat(consistent[2]) * 100);
    // Per-day breakdown from each record's OWN timestamp (display aggregation of the
    // just-verified log; the authoritative total stays verify-spend's). A settled
    // call's cents are the cumulative delta; its rail attributes the rail_split.
    const days = new Map<string, { calls: number; cents: number; rails: Record<string, number> }>();
    let prevCumulative = 0;
    for (const line of readFileSync(logPath, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      const receipt = JSON.parse(line).receipt ?? {};
      const day = String(receipt.at ?? '').slice(0, 10);
      if (day.length !== 10) continue;
      const bucket = days.get(day) ?? { calls: 0, cents: 0, rails: {} };
      bucket.calls += 1;
      const cumulative = Number(receipt.cumulative_cents ?? prevCumulative);
      const delta = cumulative - prevCumulative;
      prevCumulative = cumulative;
      if (delta > 0) {
        bucket.cents += delta;
        const rail = String(receipt.rail ?? 'unmetered');
        bucket.rails[rail] = (bucket.rails[rail] ?? 0) + delta;
      }
      days.set(day, bucket);
    }
    const daySum = [...days.values()].reduce((a, b) => a + b.cents, 0);
    if (daySum !== cents) {
      return {
        ok: false,
        reason: `per-day breakdown (${daySum}c) diverged from the re-derived total (${cents}c)`,
      };
    }
    const cp = out.match(/checkpoint: records=(\d+) settled_cents=(\d+) binding=([0-9a-f]+)/);
    const nextCheckpoint: ReceiptCheckpoint | null = cp
      ? {
          log_hash: logHash,
          prefix_bytes: logBuf.length,
          verified_len: Number.parseInt(cp[1], 10),
          last_binding: cp[3],
          last_cents: Number.parseInt(cp[2], 10),
        }
      : null;
    return { ok: true, calls, cents, logHash, days, checkpoint: nextCheckpoint };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

export async function deriveAll(): Promise<{ derived: number; invalid: number }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from('listings').select('*').eq('status', 'live');
  if (error) throw new Error(`listing query failed: ${error.message}`);

  const listingIds = ((data ?? []) as Listing[]).map((l) => l.id);
  const { data: checkpointRows } = listingIds.length
    ? await supabase.from('receipt_checkpoints').select('*').in('listing_id', listingIds)
    : { data: [] };
  const checkpoints = new Map<string, ReceiptCheckpoint>(
    (checkpointRows ?? []).map((row) => [row.listing_id as string, row as ReceiptCheckpoint]),
  );

  let derived = 0;
  let invalid = 0;
  for (const listing of (data ?? []) as Listing[]) {
    if (!listing.spend_log_url) continue;
    const result = await deriveListing(listing, checkpoints.get(listing.id) ?? null).catch(
      (e: Error) => ({ ok: false as const, reason: `derivation error: ${e.message}` }),
    );
    if (result.ok) {
      derived += 1;
      const derivedAt = new Date().toISOString();
      const rows = [...result.days.entries()].map(([day, bucket]) => ({
        listing_id: listing.id,
        day,
        calls: bucket.calls,
        cents_settled: bucket.cents,
        rail_split: bucket.rails,
        log_hash: result.logHash,
        derived_at: derivedAt,
      }));
      // The whole breakdown re-derives from the log each run — replace, never accrete.
      await supabase.from('receipt_summaries').delete().eq('listing_id', listing.id);
      if (rows.length > 0) await supabase.from('receipt_summaries').insert(rows);
      if (result.checkpoint) {
        await supabase
          .from('receipt_checkpoints')
          .upsert({ listing_id: listing.id, ...result.checkpoint, derived_at: derivedAt });
      }
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
