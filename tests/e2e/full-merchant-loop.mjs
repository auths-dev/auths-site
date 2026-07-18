#!/usr/bin/env node
/**
 * The FULL merchant loop, end to end, no humans anywhere:
 *
 *   seller agent mints identity → lists a REAL x402 MCP endpoint →
 *   the prober takes it live → a buyer agent wraps the listed endpoint
 *   with its own budget, makes a paid test-mode call, is REFUSED over
 *   budget → the seller publishes the signed spend log → the receipts
 *   worker re-derives it with verify-spend → the listing earns
 *   live_proven_at and the public API shows only re-derived numbers.
 *
 * Everything is real: a live dev server, the live Supabase project, real
 * KEL-authenticated presentations, the real prober, the published
 * @auths-dev/mcp gateway, and the x402 adapter downstream (LIVE on-chain
 * base-sepolia settle when the root .env wallet is funded; the recorded
 * settlement shape otherwise — the mode is disclosed, never faked).
 *
 * Manual run (not CI):
 *   node tests/e2e/full-merchant-loop.mjs
 *
 * Env (all optional):
 *   AUTHS_CLI     — auths binary        (default ../auths/target/debug/auths)
 *   X402_ADAPTER  — downstream server   (default ../auths-mcp/examples/payments/adapters/x402-adapter/server.mjs)
 *   MARKET_URL    — running dev server  (default: starts its own on :3002)
 *
 * Secrets are read at runtime from auths-site/.env (x402 wallet) and
 * apps/market/.env.local (Supabase service key, CRON_SECRET) — never printed.
 */

import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const HERE = import.meta.dirname;
const SITE = resolve(HERE, '../..');
const APP = join(SITE, 'apps/market');
const CLI = process.env.AUTHS_CLI ?? resolve(SITE, '../auths/target/debug/auths');
const ADAPTER = process.env.X402_ADAPTER
  ?? resolve(SITE, '../auths-mcp/examples/payments/adapters/x402-adapter/server.mjs');
const AUDIENCE = 'market.auths.dev';

// ── secrets, read at runtime, never printed ─────────────────────────────────────
function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
const x402Env = parseEnvFile(join(SITE, '.env'));
const marketEnv = parseEnvFile(join(APP, '.env.local'));
const SUPABASE = marketEnv.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = marketEnv.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = marketEnv.CRON_SECRET;
if (!SUPABASE || !SERVICE_KEY || !CRON_SECRET) {
  console.error('apps/market/.env.local must provide SUPABASE url, service key, CRON_SECRET');
  process.exit(1);
}

// ── plumbing ────────────────────────────────────────────────────────────────────
let passed = 0;
function check(label, cond, detail) {
  if (!cond) {
    console.error(`✗ ${label}${detail !== undefined ? ` — ${JSON.stringify(detail)?.slice(0, 600)}` : ''}`);
    cleanup();
    process.exit(1);
  }
  passed += 1;
  console.log(`✓ ${label}`);
}

const MARKET = process.env.MARKET_URL ?? 'http://localhost:3002';
let devServer = null;
const tempDirs = [];
let fileServer = null;

function cleanup() {
  for (const child of [devServer, fileServer]) child?.kill?.('SIGKILL');
  try { execFileSync('bash', ['-c', 'lsof -ti tcp:3002 -sTCP:LISTEN | xargs kill -9 2>/dev/null || true']); } catch { /* noop */ }
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true });
}

async function api(path, options = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await fetch(`${MARKET}${path}`, options);
      const body = await res.json().catch(() => ({}));
      return { status: res.status, body };
    } catch (err) {
      if (attempt >= 1 || err?.cause?.code !== 'ECONNRESET') throw err;
    }
  }
}

/** Supabase REST with the service role — the ops side of the test (row patches, assertions). */
async function db(method, pathAndQuery, body) {
  const res = await fetch(`${SUPABASE}/rest/v1/${pathAndQuery}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json().catch(() => []);
}

function agentEnv(home) {
  return {
    ...process.env,
    HOME: home,
    AUTHS_HOME: join(home, '.auths'),
    AUTHS_KEYCHAIN_BACKEND: 'file',
    AUTHS_KEYCHAIN_FILE: join(home, 'keys.enc'),
    AUTHS_PASSPHRASE: 'Test-Passphrase-1!',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: join(home, '.gitconfig'),
    GIT_AUTHOR_NAME: 'merchant-e2e',
    GIT_AUTHOR_EMAIL: 'e2e@auths.dev',
    GIT_COMMITTER_NAME: 'merchant-e2e',
    GIT_COMMITTER_EMAIL: 'e2e@auths.dev',
  };
}

function makeAgentHome(name) {
  const home = mkdtempSync(join(tmpdir(), `merchant-${name}-`));
  tempDirs.push(home);
  const repo = join(home, 'workdir');
  mkdirSync(repo);
  const env = agentEnv(home);
  const sh = (cmd, args, opts = {}) =>
    execFileSync(cmd, args, { env, cwd: repo, encoding: 'utf8', ...opts });
  const auths = (...args) => {
    const out = sh(CLI, ['--json', ...args]);
    const parsed = JSON.parse(out);
    if (parsed.status && parsed.status !== 'success') throw new Error(`auths ${args[0]} failed: ${out}`);
    return parsed.data ?? parsed;
  };
  return { home, repo, env, sh, auths };
}

/** Minimal newline-delimited JSON-RPC over a child's stdio (the MCP wire). */
class StdioMcp {
  constructor(command, args, env) {
    this.child = spawn(command, args, { env, stdio: ['pipe', 'pipe', 'pipe'] });
    this.buf = '';
    this.pending = new Map();
    this.nextId = 1;
    this.stderr = '';
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (chunk) => {
      this.buf += chunk;
      let nl;
      while ((nl = this.buf.indexOf('\n')) >= 0) {
        const line = this.buf.slice(0, nl).trim();
        this.buf = this.buf.slice(nl + 1);
        if (!line) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id !== undefined && this.pending.has(msg.id)) {
            this.pending.get(msg.id)(msg);
            this.pending.delete(msg.id);
          }
        } catch { /* non-JSON stdout */ }
      }
    });
    this.child.stderr.setEncoding('utf8');
    this.child.stderr.on('data', (c) => { this.stderr += c; });
  }
  request(method, params, timeoutMs = 90_000) {
    const id = this.nextId++;
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    return new Promise((resolveP, rejectP) => {
      const t = setTimeout(() => {
        this.pending.delete(id);
        rejectP(new Error(`${method} timed out (stderr tail: ${this.stderr.slice(-400)})`));
      }, timeoutMs);
      this.pending.set(id, (m) => { clearTimeout(t); resolveP(m); });
    });
  }
  notify(method) {
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method }) + '\n');
  }
  kill() { this.child.kill('SIGKILL'); }
}

// ── phase 0: the market, and a place to publish the spend log ───────────────────
// The prober and the buyer both run the LOCAL launcher over the freshly built
// gateway — no per-probe npm fetch of the published package (a fresh-HOME cold
// install pays a ~70 MB registry download inside every probe's 90 s budget).
const LAUNCHER = process.env.AUTHS_MCP_LAUNCHER
  ?? resolve(SITE, '../auths-mcp/packages/auths-mcp/bin/auths-mcp.mjs');
process.env.AUTHS_MCP_LAUNCHER = LAUNCHER;
process.env.GATEWAY_BIN = process.env.GATEWAY_BIN
  ?? resolve(SITE, '../auths/target/debug/auths-mcp-gateway');

if (!process.env.MARKET_URL) {
  execFileSync('bash', ['-c', 'lsof -ti tcp:3002 -sTCP:LISTEN | xargs kill -9 2>/dev/null || true']);
  devServer = spawn('bun', ['run', 'dev'], { cwd: APP, stdio: 'ignore', detached: false });
  for (let i = 0; i < 120; i += 1) {
    try { await fetch(`${MARKET}/api/v1/endpoints`); break; } catch { await new Promise((r) => setTimeout(r, 1000)); }
  }
}
check('market dev server is up', (await api('/api/v1/endpoints')).status === 200);

const publishDir = mkdtempSync(join(tmpdir(), 'merchant-publish-'));
tempDirs.push(publishDir);
writeFileSync(join(publishDir, 'spend.jsonl'), '');
fileServer = createServer((req, res) => {
  const name = req.url?.split('?')[0].replace(/^\/+/, '') || '';
  const file = join(publishDir, name);
  if (!name || !existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => fileServer.listen(0, '127.0.0.1', r));
const publishUrl = `http://127.0.0.1:${fileServer.address().port}`;

// ── phase 1: the seller onboards and lists a REAL endpoint ─────────────────────
const seller = makeAgentHome('seller');
seller.sh('git', ['init', '-q', '.']);
seller.sh('git', ['config', 'user.name', 'seller']);
seller.sh('git', ['config', 'user.email', 's@e2e.local']);
seller.sh(CLI, ['init', '--non-interactive', '--profile', 'developer']);
const sellerDid = seller.auths('id', 'show').controller_did;
const cred = seller.auths('credential', 'issue', '--issuer', 'main', '--to', sellerDid, '--cap', 'market:sell');
const challenge = await api('/api/v1/challenge', { method: 'POST' });
const presented = seller.auths('credential', 'present', '--subject', 'main', '--said', cred.credential_said,
  '--audience', AUDIENCE, '--nonce', challenge.body.nonce, '--with-evidence');

const slug = `x402-paid-call-${Date.now().toString(36)}`;
const created = await api('/api/v1/listings', {
  method: 'POST',
  headers: { authorization: presented.authorization, 'content-type': 'application/json' },
  body: JSON.stringify({
    evidence: presented.evidence,
    listing: {
      slug,
      name: 'x402 paid call (merchant e2e)',
      description: 'Settles an x402 test-mode payment per call; listed by an autonomous agent in the merchant-loop e2e.',
      priceCents: 3,
      rails: ['x402'],
      transport: 'stdio',
      endpointValue: `node ${ADAPTER}`,
      spendLogUrl: 'https://example.com/placeholder/spend.jsonl',
      docsUrl: '',
      tools: ['paid_call — settle an x402/USDC test payment and return the settlement'],
    },
  }),
});
check('seller agent listed a real x402 endpoint (201)', created.status === 201, created);

// Point the listing at the local publish server (create-time validation demands
// https; the prober and receipts worker only demand fetchable).
const patched = await db('PATCH', `listings?slug=eq.${slug}`, { spend_log_url: `${publishUrl}/spend.jsonl` });
check('spend-log URL points at the publish server', patched?.[0]?.spend_log_url?.startsWith(publishUrl), patched);

// ── phase 2: the prober takes it live ──────────────────────────────────────────
const probe = await api('/api/cron/probe', {
  method: 'GET',
  headers: { authorization: `Bearer ${CRON_SECRET}` },
});
check('prober ran', probe.status === 200 && probe.body.probed >= 1, probe);
const afterProbe = (await db('GET', `listings?slug=eq.${slug}&select=status,verified_at,fail_reason`))[0];
check('prober took the listing LIVE (tools served, log reachable)',
  afterProbe?.status === 'live' && !!afterProbe.verified_at,
  afterProbe);

// ── phase 3: a buyer agent buys — and is refused over budget ───────────────────
const buyerHome = mkdtempSync(join(tmpdir(), 'merchant-buyer-'));
tempDirs.push(buyerHome);
const liveDir = join(buyerHome, 'live');
// X402_LIVE=1 opts the buy leg into a REAL on-chain base-sepolia settle using
// the wallet in auths-site/.env (needs a FUNDED testnet wallet — the adapter
// refuses to fake an on-chain settle). Default: the recorded settlement shape,
// which exercises the identical metering/receipts path deterministically.
const liveLeg = process.env.X402_LIVE === '1';
const buyerEnv = {
  ...agentEnv(buyerHome),
  AUTHS_MCP_LIVE_DIR: liveDir,
  ...(liveLeg ? x402Env : {}),
};
const detail = await api(`/api/v1/endpoints/${slug}`);
check('public API serves the live listing with its integration', detail.status === 200 && !!detail.body.integration, detail.body);

const wrap = new StdioMcp(process.execPath, [
  LAUNCHER, 'wrap',
  '--scope', 'paid.call',
  '--budget', '$1',
  '--ttl', '30m',
  '--rail', 'x402',
  '--test-mode',
  '--', 'node', ADAPTER,
], buyerEnv);

try {
  const init = await wrap.request('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'merchant-e2e-buyer', version: '0.1.0' },
  }, 180_000);
  check('buyer wrap initialized against the listed endpoint', !init.error, init);
  wrap.notify('notifications/initialized');

  const tools = await wrap.request('tools/list', {});
  check('listed tool is served through the buyer wrap',
    (tools.result?.tools ?? []).some((t) => t.name === 'paid_call'), tools.result);

  const paid = await wrap.request('tools/call', {
    name: 'paid_call',
    arguments: { amount_atomic: 30_000, network: 'base-sepolia', endpoint: '/paid-call' },
  }, 120_000);
  const paidText = JSON.stringify(paid);
  check('a $0.03 test-mode call is allowed and settles', !paid.error && !paidText.includes('usage-cap-exceeded'), paid);
  console.log(`  · settle mode: ${liveLeg ? 'LIVE on-chain base-sepolia (X402_LIVE=1)' : 'recorded settlement shape (X402_LIVE=1 for on-chain)'}`);

  const over = await wrap.request('tools/call', {
    name: 'paid_call',
    arguments: { amount_atomic: 1_400_000, network: 'base-sepolia', endpoint: '/paid-call' },
  }, 120_000);
  check('a $1.40 call is REFUSED over the $1 budget (usage-cap-exceeded)',
    JSON.stringify(over).includes('usage-cap-exceeded'), over);
} finally {
  wrap.kill();
}

// ── phase 4: the seller publishes the signed log; receipts re-derive it ─────────
const orgRepo = join(liveDir, 'registry');
const spendLogDir = join(orgRepo, 'spend-log');
check('the gateway wrote a signed spend log', existsSync(spendLogDir) && readdirSync(spendLogDir).length > 0,
  existsSync(liveDir) ? readdirSync(liveDir) : 'no live dir');
const logFile = readdirSync(spendLogDir).find((f) => f.endsWith('.jsonl'));
const agentDid = `did:keri:${logFile.replace(/\.jsonl$/, '')}`;
const rootDid = JSON.parse(
  execFileSync(CLI, ['--json', 'id', 'show'], {
    env: { ...agentEnv(buyerHome), AUTHS_HOME: orgRepo, AUTHS_REPO: orgRepo },
    encoding: 'utf8',
  }),
).data.controller_did;

// Publish = commit the registry's working state (budget counter + spend log)
// so the verifier's copy materializes the same counter the wire advanced.
const gitPublish = (args) =>
  execFileSync('git', ['-C', orgRepo, '-c', 'user.name=merchant-e2e', '-c', 'user.email=e2e@auths.dev', ...args], {
    env: buyerEnv,
    encoding: 'utf8',
  });
gitPublish(['add', '-A']);
gitPublish(['commit', '--quiet', '-m', 'published spend bundle']);

writeFileSync(join(publishDir, 'spend.jsonl'), readFileSync(join(spendLogDir, logFile)));
writeFileSync(join(publishDir, 'audit.json'), JSON.stringify({
  registry_git_url: orgRepo,
  agent: agentDid,
  root: rootDid,
}));

const receipts = await api('/api/cron/receipts', {
  method: 'GET',
  headers: { authorization: `Bearer ${CRON_SECRET}` },
});
check('receipts worker ran verify-spend over the published log', receipts.status === 200, receipts);
const listingRow = (await db('GET', `listings?slug=eq.${slug}&select=id,receipts_invalid,fail_reason,live_proven_at`))[0];
check('the log re-derived CONSISTENT (never seller-reported)',
  listingRow?.receipts_invalid === false, listingRow);
const finalSummary = (await db('GET', `receipt_summaries?listing_id=eq.${listingRow.id}&select=calls,cents_settled,log_hash`))[0];
check('re-derived receipts show settled calls and cents',
  finalSummary?.calls >= 1 && finalSummary?.cents_settled >= 1, finalSummary);
check('the listing earned Proven-live (first re-derived settled cents)',
  !!listingRow.live_proven_at, listingRow);

// ── phase 5: the public story ───────────────────────────────────────────────────
const publicView = await api(`/api/v1/endpoints/${slug}`);
check('public API shows the live listing as Proven-live',
  publicView.status === 200 && !!publicView.body.live_proven_at,
  publicView.body);
const publicReceipts = await api(`/api/v1/endpoints/${slug}/receipts`);
check('public receipts API serves the re-derived aggregates',
  publicReceipts.status === 200 && JSON.stringify(publicReceipts.body).includes('cents'),
  publicReceipts.body);

console.log(`\nfull merchant loop proven — ${passed} checks green`);
console.log(`  seller ${sellerDid.slice(0, 28)}… listed ${slug}`);
console.log(`  buyer agent ${agentDid.slice(0, 28)}… paid, was capped, and its signed log re-derived`);
cleanup();
process.exit(0);
