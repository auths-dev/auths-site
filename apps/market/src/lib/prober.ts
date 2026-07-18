/**
 * The verification prober (US-005): the platform is every listing's first
 * test-mode customer. For each pending (or re-probe-due) listing it:
 *
 *   (a) spawns the listing's endpoint behind a REAL `@auths-dev/mcp wrap`
 *       (test-mode, its own small budget) and speaks MCP over stdio:
 *       initialize → tools/list must cover every listed tool. HARD check.
 *   (b) drives one metered tools/call and re-derives the probe's own spend
 *       log via verify-spend, comparing the settled price to the listing.
 *       Runs when the listing offers x402 and prober testnet credentials
 *       exist; otherwise recorded as skipped in probe detail. SOFT in v0.
 *   (c) fetches the seller's published spend-log URL: must be reachable
 *       and JSONL-shaped. Full re-derivation of seller logs is the
 *       receipts worker's job (US-007). HARD check (reachability only).
 *
 * v0 honesty: the Verified badge's tooltip claims exactly what (a)+(c)
 * prove plus (b) when it ran; probe_runs.detail records every skipped
 * check so deepening the probe later never rewrites history.
 *
 * Runs anywhere Node + npx exist: the cron route calls probePending(),
 * and scripts/run-prober.mjs runs it standalone (Fly/CI fallback per
 * PRD §7.4).
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServiceClient } from '@/lib/supabase/service';
import type { Listing } from '@/lib/listings';

const PROBE_TIMEOUT_MS = 120_000;

interface ProbeResult {
  verdict: 'pass' | 'fail';
  failReason?: string;
  detail: Record<string, unknown>;
}

interface JsonRpcMsg {
  jsonrpc: '2.0';
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { message?: string };
}

/** Speaks newline-delimited JSON-RPC to a child MCP server. */
class StdioMcp {
  private child;
  private buf = '';
  private pending = new Map<number, (msg: JsonRpcMsg) => void>();
  private nextId = 1;
  stderr = '';

  constructor(command: string, args: string[], env: NodeJS.ProcessEnv) {
    this.child = spawn(command, args, { env, stdio: ['pipe', 'pipe', 'pipe'] });
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (chunk: string) => {
      this.buf += chunk;
      let nl;
      while ((nl = this.buf.indexOf('\n')) >= 0) {
        const line = this.buf.slice(0, nl).trim();
        this.buf = this.buf.slice(nl + 1);
        if (!line) continue;
        try {
          const msg = JSON.parse(line) as JsonRpcMsg;
          if (msg.id !== undefined && this.pending.has(msg.id)) {
            this.pending.get(msg.id)!(msg);
            this.pending.delete(msg.id);
          }
        } catch {
          // non-JSON stdout line from the downstream — ignore
        }
      }
    });
    this.child.stderr.setEncoding('utf8');
    this.child.stderr.on('data', (c: string) => {
      this.stderr += c;
    });
  }

  request(method: string, params: unknown, timeoutMs = 30_000): Promise<JsonRpcMsg> {
    const id = this.nextId++;
    const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    this.child.stdin.write(msg + '\n');
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(id, (m) => {
        clearTimeout(t);
        resolve(m);
      });
    });
  }

  notify(method: string): void {
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method }) + '\n');
  }

  kill(): void {
    this.child.kill('SIGKILL');
  }
}

function endpointArgv(listing: Listing): string[] | null {
  if (listing.endpoint.transport === 'stdio' && listing.endpoint.command) {
    return listing.endpoint.command.split(/\s+/);
  }
  if (listing.endpoint.transport === 'url' && listing.endpoint.url) {
    return ['npx', '-y', 'mcp-remote', listing.endpoint.url];
  }
  return null;
}

async function probeListing(listing: Listing): Promise<ProbeResult> {
  const detail: Record<string, unknown> = { checks: {} };
  const checks = detail.checks as Record<string, unknown>;
  const downstream = endpointArgv(listing);
  if (!downstream) return { verdict: 'fail', failReason: 'endpoint is malformed', detail };

  // (c) published spend log reachable + JSONL-shaped
  try {
    const res = await fetch(listing.spend_log_url!, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      checks.spend_log = `unreachable (${res.status})`;
      return {
        verdict: 'fail',
        failReason: `the listing's spend-log URL (${listing.spend_log_url}) returned HTTP ${res.status} — dashboards can only render re-derived numbers, so the log must be publicly fetchable; fix the URL and relist`,
        detail,
      };
    }
    const head = (await res.text()).slice(0, 4096).trim();
    const firstLine = head.split('\n')[0] ?? '';
    if (head && firstLine) {
      try {
        JSON.parse(firstLine);
        checks.spend_log = 'reachable, JSONL-shaped';
      } catch {
        checks.spend_log = 'reachable, not yet JSONL';
      }
    } else {
      checks.spend_log = 'reachable, empty (no receipts yet)';
    }
  } catch (e) {
    checks.spend_log = `fetch failed: ${(e as Error).message}`;
    return { verdict: 'fail', failReason: 'spend-log URL could not be fetched', detail };
  }

  // (a) tools/list through a real test-mode wrap
  const lab = mkdtempSync(join(tmpdir(), 'market-probe-'));
  const rail = listing.rails.includes('x402') ? 'x402' : 'stripe';
  // The wrap launcher: `AUTHS_MCP_LAUNCHER` names a local `auths-mcp.mjs` (no npm
  // fetch at all — the operator/e2e pins the exact launcher + GATEWAY_BIN); the
  // default cold-installs the published package per probe, which pays a ~70 MB
  // registry fetch + extraction inside the probe's own fresh HOME every time.
  const launcher = process.env.AUTHS_MCP_LAUNCHER;
  const wrapTail = [
    'wrap',
    '--scope', 'paid.call',
    '--budget', '$1',
    '--ttl', '15m',
    '--rail', rail,
    '--test-mode',
    '--',
    ...downstream,
  ];
  const wrapCmd = launcher ? process.execPath : 'npx';
  const wrapArgs = launcher ? [launcher, ...wrapTail] : ['-y', '@auths-dev/mcp', ...wrapTail];
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    HOME: lab,
    AUTHS_HOME: join(lab, 'registry'),
    AUTHS_REPO: join(lab, 'registry'),
    AUTHS_KEYCHAIN_BACKEND: 'file',
    AUTHS_KEYCHAIN_FILE: join(lab, 'keys.enc'),
    AUTHS_PASSPHRASE: 'Market-Probe-1!',
    AUTHS_MCP_LIVE_DIR: join(lab, 'live'),
    GIT_CONFIG_GLOBAL: join(lab, '.gitconfig'),
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_AUTHOR_NAME: 'Market Prober',
    GIT_AUTHOR_EMAIL: 'prober@auths.dev',
    GIT_COMMITTER_NAME: 'Market Prober',
    GIT_COMMITTER_EMAIL: 'prober@auths.dev',
  };

  const mcp = new StdioMcp(wrapCmd, wrapArgs, env);
  try {
    const init = await Promise.race([
      (async () => {
        const r = await mcp.request('initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'auths-market-prober', version: '0.1.0' },
        }, 90_000);
        mcp.notify('notifications/initialized');
        return r;
      })(),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error('initialize timed out')), PROBE_TIMEOUT_MS),
      ),
    ]);
    if (init.error) {
      return {
        verdict: 'fail',
        failReason: `endpoint failed MCP initialize: ${init.error.message}`,
        detail,
      };
    }

    const toolsRes = await mcp.request('tools/list', {});
    const served = new Set(
      ((toolsRes.result as { tools?: { name: string }[] })?.tools ?? []).map((t) => t.name),
    );
    const missing = listing.tools.map((t) => t.name).filter((n) => !served.has(n));
    checks.tools = { served: [...served], missing };
    if (missing.length > 0) {
      return {
        verdict: 'fail',
        failReason: `listed tool(s) not served by the endpoint: ${missing.join(', ')}`,
        detail,
      };
    }

    // (b) one metered call — only when x402 testnet credentials are present
    if (rail === 'x402' && process.env.PROBER_X402_WALLET_PRIVATE_KEY) {
      checks.metered_call = 'attempted';
      const first = listing.tools[0]?.name;
      const call = await mcp.request('tools/call', { name: first, arguments: {} }, 60_000);
      checks.metered_call = call.error ? `errored: ${call.error.message}` : 'completed';
    } else {
      checks.metered_call =
        rail === 'x402'
          ? 'skipped: prober has no testnet wallet configured'
          : 'skipped: stripe-only listing (badge reflects test-mode depth)';
    }

    return { verdict: 'pass', detail };
  } catch (e) {
    detail.stderr_tail = mcp.stderr.slice(-2000);
    return { verdict: 'fail', failReason: (e as Error).message, detail };
  } finally {
    mcp.kill();
    rmSync(lab, { recursive: true, force: true });
  }
}

/** Probes every pending listing plus live ones past the weekly freshness bar. */
export async function probePending(): Promise<{ probed: number; passed: number }> {
  const supabase = createServiceClient();
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .or(`status.eq.pending_verification,and(status.eq.live,verified_at.lt.${weekAgo})`);
  if (error) throw new Error(`listing query failed: ${error.message}`);

  let passed = 0;
  for (const listing of (data ?? []) as Listing[]) {
    const result = await probeListing(listing);
    await supabase.from('probe_runs').insert({
      listing_id: listing.id,
      verdict: result.verdict,
      detail: { ...result.detail, fail_reason: result.failReason ?? null },
    });
    if (result.verdict === 'pass') {
      passed += 1;
      await supabase
        .from('listings')
        .update({
          status: 'live',
          verified_at: new Date().toISOString(),
          verification_stale: false,
          fail_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', listing.id);
    } else if (listing.status === 'live') {
      // A live listing that starts failing goes visibly stale, never silent.
      await supabase
        .from('listings')
        .update({ verification_stale: true, fail_reason: result.failReason ?? null })
        .eq('id', listing.id);
    } else {
      await supabase
        .from('listings')
        .update({ status: 'failed', fail_reason: result.failReason ?? null })
        .eq('id', listing.id);
    }
  }
  return { probed: data?.length ?? 0, passed };
}
