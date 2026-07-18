#!/usr/bin/env node
/**
 * LIVE on-chain agent fleet — real base-sepolia USDC settlements through the
 * PUBLISHED @auths-dev/mcp gateway, viewable on Basescan.
 *
 *   one root delegates budget to N agents under ONE treasury cap → each agent
 *   runs its own real gateway wrap over the x402 adapter → each makes a REAL
 *   on-chain USDC micro-settle on base-sepolia (funded wallet + facilitator) →
 *   once the shared cap is exhausted the next agent is refused
 *   `usage-cap-exceeded` → every settlement's on-chain tx hash is printed as a
 *   Basescan link, and the combined signed logs re-derive `consistent`.
 *
 * Settlements run SEQUENTIALLY: all agents share one x402 wallet, so serial
 * settles avoid on-chain nonce races.
 *
 * Requires: a funded base-sepolia wallet + facilitator in auths-site/.env
 *   (X402_WALLET_PRIVATE_KEY, X402_PAY_TO, X402_USDC_ASSET, X402_FACILITATOR_URL).
 * Launcher: MCP_CMD (default `auths-mcp`, the globally-installed released package).
 *
 * Usage: node tests/e2e/live-onchain-fleet.mjs
 */

import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const HERE = import.meta.dirname;
const SITE = resolve(HERE, '../..');
const MCP_CMD = (process.env.MCP_CMD ?? 'auths-mcp').split(' ');
const ADAPTER = process.env.X402_ADAPTER
  ?? resolve(SITE, '../auths-mcp/examples/payments/adapters/x402-adapter/server.mjs');
const FLEET_SIZE = Number(process.env.FLEET_SIZE ?? 3);
const CALL_ATOMIC = 10_000;              // $0.01 per settle (USDC 6-decimals)
const CALL_CENTS = 1;
const FLEET_CAP_CENTS = FLEET_SIZE;      // exactly one settle per agent fits; the next is refused
const TREASURY_PORT = 7846;
const FLEET_ID = 'live-onchain-fleet';
const EXPLORER = 'https://sepolia.basescan.org/tx/';

// Wallet secrets: read at runtime, never printed.
function parseEnv(p) {
  const out = {};
  if (!existsSync(p)) return out;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
const wallet = parseEnv(join(SITE, '.env'));
for (const k of ['X402_WALLET_PRIVATE_KEY', 'X402_FACILITATOR_URL', 'X402_PAY_TO']) {
  if (!wallet[k]) { console.error(`missing ${k} in auths-site/.env — a LIVE run needs a funded wallet`); process.exit(1); }
}

let passed = 0;
const children = [];
const tempDirs = [];
function cleanup() {
  for (const c of children) { try { c.kill('SIGKILL'); } catch { /* gone */ } }
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true });
}
function check(label, cond, detail) {
  if (!cond) { console.error(`✗ ${label}${detail !== undefined ? ` — ${JSON.stringify(detail)?.slice(0, 500)}` : ''}`); cleanup(); process.exit(1); }
  passed += 1; console.log(`✓ ${label}`);
}
function treasuryRpc(request) {
  return new Promise((resolveP, rejectP) => {
    const sock = connect(TREASURY_PORT, '127.0.0.1');
    let buf = '';
    sock.on('data', (d) => { buf += d; if (buf.includes('\n')) { sock.end(); resolveP(JSON.parse(buf)); } });
    sock.on('error', rejectP);
    sock.write(`${JSON.stringify(request)}\n`);
  });
}
class StdioMcp {
  constructor(command, args, env) {
    this.child = spawn(command, args, { env, stdio: ['pipe', 'pipe', 'pipe'] });
    children.push(this.child);
    this.buf = ''; this.pending = new Map(); this.nextId = 1; this.stderr = '';
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (chunk) => {
      this.buf += chunk; let nl;
      while ((nl = this.buf.indexOf('\n')) >= 0) {
        const line = this.buf.slice(0, nl).trim(); this.buf = this.buf.slice(nl + 1);
        if (!line) continue;
        try { const msg = JSON.parse(line); if (msg.id !== undefined && this.pending.has(msg.id)) { this.pending.get(msg.id)(msg); this.pending.delete(msg.id); } } catch { /* non-JSON */ }
      }
    });
    this.child.stderr.setEncoding('utf8');
    this.child.stderr.on('data', (c) => { this.stderr += c; });
  }
  request(method, params, timeoutMs = 120_000) {
    const id = this.nextId++;
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    return new Promise((resolveP, rejectP) => {
      const t = setTimeout(() => { this.pending.delete(id); rejectP(new Error(`${method} timed out (stderr: ${this.stderr.slice(-300)})`)); }, timeoutMs);
      this.pending.set(id, (m) => { clearTimeout(t); resolveP(m); });
    });
  }
  notify(method) { this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method }) + '\n'); }
}

// ── phase 0: one coordinator, one shared cap ────────────────────────────────────
const lab = mkdtempSync(join(tmpdir(), 'live-fleet-'));
tempDirs.push(lab);
const liveDir = join(lab, 'live');
mkdirSync(liveDir, { recursive: true });
execFileSync('bash', ['-c', `lsof -ti tcp:${TREASURY_PORT} -sTCP:LISTEN | xargs kill -9 2>/dev/null || true`]);
const coordinator = spawn(MCP_CMD[0], [...MCP_CMD.slice(1),
  'treasury', 'serve', '--listen', `127.0.0.1:${TREASURY_PORT}`, '--fleet', FLEET_ID,
  '--cap', `$${(FLEET_CAP_CENTS / 100).toFixed(2)}`, '--state-dir', join(lab, 'treasury'), '--checkpoint-secs', '1',
], { stdio: ['ignore', 'pipe', 'pipe'] });
children.push(coordinator);
let status0 = null;
for (let i = 0; i < 60 && !status0; i += 1) { await new Promise((r) => setTimeout(r, 500)); status0 = await treasuryRpc({ op: 'status', fleet: FLEET_ID }).catch(() => null); }
check('treasury coordinator serves the fleet cap', status0?.cap_cents === FLEET_CAP_CENTS, status0);

// ── phase 1: N agents delegated under one root, each with the funded wallet ──────
const baseEnv = {
  ...process.env, ...wallet,
  HOME: lab, AUTHS_HOME: join(liveDir, 'registry'), AUTHS_REPO: join(liveDir, 'registry'),
  AUTHS_KEYCHAIN_BACKEND: 'file', AUTHS_KEYCHAIN_FILE: join(lab, 'keys.enc'), AUTHS_PASSPHRASE: 'Live-Fleet-1!',
  AUTHS_MCP_LIVE_DIR: liveDir, TREASURY_URL: `tcp://127.0.0.1:${TREASURY_PORT}`, TREASURY_FLEET: FLEET_ID,
  GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: join(lab, '.gitconfig'),
  GIT_AUTHOR_NAME: 'live-fleet', GIT_AUTHOR_EMAIL: 'fleet@auths.dev',
  GIT_COMMITTER_NAME: 'live-fleet', GIT_COMMITTER_EMAIL: 'fleet@auths.dev',
};
const agents = [];
for (let i = 1; i <= FLEET_SIZE; i += 1) {
  const wrap = new StdioMcp(MCP_CMD[0], [...MCP_CMD.slice(1),
    'wrap', '--scope', 'paid.call', '--budget', '$5', '--ttl', '15m', '--rail', 'x402', '--test-mode',
    '--', 'node', ADAPTER,
  ], { ...baseEnv, AUTHS_MCP_AGENT_LABEL: `agent-${i}` });
  const init = await wrap.request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: `live-agent-${i}`, version: '0.1.0' } }, 180_000);
  if (init.error) check(`agent-${i} initialized`, false, { error: init.error, stderr: wrap.stderr.slice(-300) });
  wrap.notify('notifications/initialized');
  agents.push(wrap);
}
check(`${FLEET_SIZE} agents delegated under one root, one shared cap`, agents.length === FLEET_SIZE);

// ── phase 2: SEQUENTIAL live on-chain settles until the shared cap refuses ───────
const paidCall = (wrap) => wrap.request('tools/call', {
  name: 'paid_call',
  arguments: { amount_atomic: CALL_ATOMIC, network: 'base-sepolia', endpoint: '/paid-call' },
}, 180_000);
let settled = 0, refused = 0;
console.log(`\n  settling on-chain (base-sepolia), one agent at a time…`);
for (let round = 0; round < 2; round += 1) {
  for (let i = 0; i < agents.length; i += 1) {
    const res = await paidCall(agents[i]);
    const text = JSON.stringify(res);
    if (text.includes('usage-cap-exceeded')) { refused += 1; console.log(`  · agent-${i + 1}: refused (usage-cap-exceeded) — the shared cap held`); }
    else if (!res.error) { settled += 1; console.log(`  · agent-${i + 1}: settled on-chain`); }
    else check(`agent-${i + 1} settle`, false, res.error);
  }
}
check('at least one agent settled a real on-chain payment', settled >= 1, { settled });
check('the shared cap refused an agent once exhausted (budget delegated, not per-agent)', refused >= 1, { settled, refused });

for (const w of agents) w.child.kill('SIGKILL');

// ── phase 3: the on-chain transactions (Basescan) + offline re-derivation ────────
const registry = join(liveDir, 'registry');
const spendDir = join(registry, 'spend-log');
const logDirs = existsSync(spendDir) ? readdirSync(spendDir).filter((f) => !f.startsWith('.')) : [];
const txs = [];
for (const d of logDirs) {
  const dd = join(spendDir, d);
  for (const f of readdirSync(dd).filter((x) => x.endsWith('.jsonl'))) {
    for (const line of readFileSync(join(dd, f), 'utf8').split('\n')) {
      if (!line.trim()) continue;
      const r = JSON.parse(line).receipt ?? {};
      if (r.rail === 'x402' && typeof r.charge_ref === 'string' && r.charge_ref.startsWith('0x') && r.charge_ref.length >= 66) {
        txs.push({ tx: r.charge_ref, agent: d.slice(0, 20) });
      }
    }
  }
}
check('every settled call recorded an on-chain base-sepolia tx hash', txs.length >= settled && txs.length >= 1, { txs: txs.length, settled });

console.log(`\n  ${txs.length} on-chain base-sepolia settlement(s) — verify on Basescan:`);
for (const t of txs) console.log(`    ${EXPLORER}${t.tx}   (agent ${t.agent}…)`);

const AUTHS = process.env.AUTHS_CLI ?? 'auths';
const rootDid = JSON.parse(execFileSync(AUTHS,
  ['--repo', registry, '--json', 'id', 'show'], { env: baseEnv, encoding: 'utf8' })).data.controller_did;
let ok = 0;
for (const d of logDirs) {
  const agentDid = `did:keri:${d.replace(/\.jsonl$/, '')}`;
  const out = execFileSync(MCP_CMD[0], [...MCP_CMD.slice(1), 'verify-spend', '--log', join(spendDir, d), '--registry', registry, '--agent', agentDid, '--root', rootDid], { env: baseEnv, encoding: 'utf8' });
  if (/consistent/.test(out)) ok += 1;
}
check('every agent’s signed spend log re-derived consistent offline', ok === logDirs.length, { ok, total: logDirs.length });

console.log(`\nlive on-chain fleet proven — ${passed} checks green`);
console.log(`  ${FLEET_SIZE} budget-delegated agents · ${settled} real on-chain settle(s) · shared cap held · logs re-derived`);
cleanup();
process.exit(0);
