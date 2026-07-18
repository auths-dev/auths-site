#!/usr/bin/env node
/**
 * Headless agent FLEET under ONE root and ONE shared cap, at throughput:
 *
 *   a treasury coordinator serves one fleet budget → 8 headless agents are
 *   delegated under a single shared root registry → each runs its own real
 *   gateway wrap over the x402 adapter downstream → all 8 drive concurrent
 *   metered test-mode micro-calls ($0.01) → the aggregate spend crosses the
 *   fleet cap and EVERY agent is refused with `usage-cap-exceeded` → the
 *   combined signed spend logs re-derive `consistent`, their sum equals the
 *   total the test observed, and the coordinator's signed checkpoint trail
 *   cross-checks against that same sum.
 *
 * Reports aggregate calls/second and p50/p95 per-call latency; FAILS below
 * 20 aggregate calls/second.
 *
 * Env (all optional):
 *   GATEWAY_BIN   — gateway binary  (default ../auths/target/debug/auths-mcp-gateway)
 *   X402_ADAPTER  — downstream      (default ../auths-mcp/examples/payments/adapters/x402-adapter/server.mjs)
 *   FLEET_SIZE    — agents          (default 8)
 */

import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const HERE = import.meta.dirname;
const SITE = resolve(HERE, '../..');
const BIN = process.env.GATEWAY_BIN ?? resolve(SITE, '../auths/target/debug/auths-mcp-gateway');
const ADAPTER = process.env.X402_ADAPTER
  ?? resolve(SITE, '../auths-mcp/examples/payments/adapters/x402-adapter/server.mjs');
const FLEET_SIZE = Number(process.env.FLEET_SIZE ?? 8);
const FLEET_CAP_CENTS = 100;            // one $1.00 cap across the whole fleet
const CALL_ATOMIC = 10_000;             // $0.01 micro-transactions (USDC 6-decimals)
const CALL_CENTS = 1;
const MIN_CPS = 20;
const TREASURY_PORT = 7845;
const FLEET_ID = 'fleet-throughput-e2e';

let passed = 0;
const children = [];
const tempDirs = [];
function cleanup() {
  for (const c of children) { try { c.kill('SIGKILL'); } catch { /* gone */ } }
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true });
}
function check(label, cond, detail) {
  if (!cond) {
    console.error(`✗ ${label}${detail !== undefined ? ` — ${JSON.stringify(detail)?.slice(0, 500)}` : ''}`);
    cleanup();
    process.exit(1);
  }
  passed += 1;
  console.log(`✓ ${label}`);
}

/** One JSON line to the coordinator, one line back. */
function treasuryRpc(request) {
  return new Promise((resolveP, rejectP) => {
    const sock = connect(TREASURY_PORT, '127.0.0.1');
    let buf = '';
    sock.on('data', (d) => {
      buf += d;
      if (buf.includes('\n')) { sock.end(); resolveP(JSON.parse(buf)); }
    });
    sock.on('error', rejectP);
    sock.write(`${JSON.stringify(request)}\n`);
  });
}

/** Minimal newline-delimited JSON-RPC over a child's stdio (the MCP wire). */
class StdioMcp {
  constructor(command, args, env) {
    this.child = spawn(command, args, { env, stdio: ['pipe', 'pipe', 'pipe'] });
    children.push(this.child);
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
  request(method, params, timeoutMs = 120_000) {
    const id = this.nextId++;
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    return new Promise((resolveP, rejectP) => {
      const t = setTimeout(() => {
        this.pending.delete(id);
        rejectP(new Error(`${method} timed out (stderr tail: ${this.stderr.slice(-300)})`));
      }, timeoutMs);
      this.pending.set(id, (m) => { clearTimeout(t); resolveP(m); });
    });
  }
  notify(method) {
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method }) + '\n');
  }
}

// ── phase 0: one lab, one coordinator ───────────────────────────────────────────
check('gateway binary present', existsSync(BIN), BIN);
check('x402 adapter present', existsSync(ADAPTER), ADAPTER);

const lab = mkdtempSync(join(tmpdir(), 'fleet-e2e-'));
tempDirs.push(lab);
const liveDir = join(lab, 'live');
mkdirSync(liveDir, { recursive: true });
const treasuryState = join(lab, 'treasury');

execFileSync('bash', ['-c', `lsof -ti tcp:${TREASURY_PORT} -sTCP:LISTEN | xargs kill -9 2>/dev/null || true`]);
const coordinator = spawn(BIN, [
  'treasury', 'serve',
  '--listen', `127.0.0.1:${TREASURY_PORT}`,
  '--fleet', FLEET_ID,
  '--cap', `$${(FLEET_CAP_CENTS / 100).toFixed(2)}`,
  '--state-dir', treasuryState,
  '--checkpoint-secs', '1',
], { stdio: ['ignore', 'pipe', 'pipe'] });
children.push(coordinator);
let coordinatorErr = '';
coordinator.stderr.setEncoding('utf8');
coordinator.stderr.on('data', (c) => { coordinatorErr += c; });
let status0 = null;
for (let i = 0; i < 40 && !status0; i += 1) {
  await new Promise((r) => setTimeout(r, 250));
  status0 = await treasuryRpc({ op: 'status', fleet: FLEET_ID }).catch(() => null);
}
check('treasury coordinator serves the fleet cap',
  status0?.outcome === 'status' && status0?.cap_cents === FLEET_CAP_CENTS,
  status0 ?? coordinatorErr.slice(-300));

// ── phase 1: 8 delegations under ONE shared root ────────────────────────────────
const baseEnv = {
  ...process.env,
  HOME: lab,
  AUTHS_HOME: join(liveDir, 'registry'),
  AUTHS_REPO: join(liveDir, 'registry'),
  AUTHS_KEYCHAIN_BACKEND: 'file',
  AUTHS_KEYCHAIN_FILE: join(lab, 'keys.enc'),
  AUTHS_PASSPHRASE: 'Fleet-Throughput-1!',
  AUTHS_MCP_LIVE_DIR: liveDir,
  TREASURY_URL: `tcp://127.0.0.1:${TREASURY_PORT}`,
  TREASURY_FLEET: FLEET_ID,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: join(lab, '.gitconfig'),
  GIT_AUTHOR_NAME: 'fleet-e2e',
  GIT_AUTHOR_EMAIL: 'fleet@auths.dev',
  GIT_COMMITTER_NAME: 'fleet-e2e',
  GIT_COMMITTER_EMAIL: 'fleet@auths.dev',
};

const agents = [];
for (let i = 1; i <= FLEET_SIZE; i += 1) {
  const wrap = new StdioMcp(BIN, [
    'wrap',
    '--scope', 'paid.call',
    '--budget', '$5',                    // loose local cap: the FLEET cap must bind
    '--ttl', '15m',
    '--rail', 'x402',
    '--test-mode',
    '--', 'node', ADAPTER,
  ], { ...baseEnv, AUTHS_MCP_AGENT_LABEL: `agent-${i}` });
  const init = await wrap.request('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: `fleet-agent-${i}`, version: '0.1.0' },
  }, 120_000);
  if (init.error) {
    check(`agent-${i} initialized (delegated under the shared root)`, false,
      { error: init.error, stderr: wrap.stderr.slice(-300) });
  }
  wrap.notify('notifications/initialized');
  agents.push(wrap);
}
check(`${FLEET_SIZE} agents delegated under one root, one gateway each`, agents.length === FLEET_SIZE);

// ── phase 2: one warmup call per agent (first-call signing ceremony), then the
//    concurrent micro-call storm until the FLEET cap refuses every agent ─────────
const latencies = [];
const perAgent = agents.map(() => ({ granted: 0, refused: 0 }));
const paidCall = (wrap) => wrap.request('tools/call', {
  name: 'paid_call',
  arguments: { amount_atomic: CALL_ATOMIC, network: 'base-sepolia', endpoint: '/paid-call' },
}, 60_000);

await Promise.all(agents.map(async (wrap, idx) => {
  const res = await paidCall(wrap);
  if (JSON.stringify(res).includes('usage-cap-exceeded')) perAgent[idx].refused += 1;
  else if (!res.error) perAgent[idx].granted += 1;
  else check(`agent-${idx + 1} warmup call failed`, false, res.error);
}));
console.log(`  warmup: one signed call per agent (per-session key + template setup paid once)`);

const stormStart = process.hrtime.bigint();
await Promise.all(agents.map(async (wrap, idx) => {
  const stats = perAgent[idx];
  while (stats.refused < 2) {
    const t0 = process.hrtime.bigint();
    const res = await paidCall(wrap);
    latencies.push(Number(process.hrtime.bigint() - t0) / 1e6);
    const text = JSON.stringify(res);
    if (text.includes('usage-cap-exceeded')) stats.refused += 1;
    else if (!res.error) stats.granted += 1;
    else check(`agent-${idx + 1} call neither settled nor cap-refused`, false, res.error);
  }
}));

const stormSecs = Number(process.hrtime.bigint() - stormStart) / 1e9;
const totalGranted = perAgent.reduce((a, s) => a + s.granted, 0);
const totalCalls = latencies.length;
const grantedCents = totalGranted * CALL_CENTS;

check('every agent was refused with usage-cap-exceeded (the ONE cap is fleet-wide)',
  perAgent.every((s) => s.refused >= 1), perAgent);
check('the fleet could not spend past the shared cap',
  grantedCents <= FLEET_CAP_CENTS, { grantedCents, FLEET_CAP_CENTS });
check('the fleet exhausted the shared cap before refusals began',
  grantedCents === FLEET_CAP_CENTS, { grantedCents, FLEET_CAP_CENTS });

const sorted = [...latencies].sort((a, b) => a - b);
const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
const cps = totalCalls / stormSecs;
const totalRefused = perAgent.reduce((a, s) => a + s.refused, 0);
console.log(`  throughput: ${totalCalls} storm calls in ${stormSecs.toFixed(2)}s`
  + ` → ${cps.toFixed(1)} calls/s aggregate; latency p50=${pct(50).toFixed(0)}ms p95=${pct(95).toFixed(0)}ms`
  + ` (fleet total incl. warmup: ${totalGranted} settled, ${totalRefused} refused)`);
check(`aggregate throughput sustains ≥ ${MIN_CPS} calls/s`, cps >= MIN_CPS, { cps });

// ── phase 3: the combined logs re-derive, and the checkpoints cross-check ───────
const registry = join(liveDir, 'registry');
const spendLogDir = join(registry, 'spend-log');
const logDirs = readdirSync(spendLogDir).filter((f) => !f.startsWith('.'));
check(`one signed spend log per delegation (${FLEET_SIZE})`, logDirs.length === FLEET_SIZE, logDirs);

const treasuryStatus = await treasuryRpc({ op: 'status', fleet: FLEET_ID });
check('the coordinator settled exactly the granted total',
  treasuryStatus.settled_cents === grantedCents, { treasuryStatus, grantedCents });

for (const wrap of agents) wrap.child.kill('SIGKILL');

const rootDid = JSON.parse(execFileSync(BIN.replace(/auths-mcp-gateway$/, 'auths'),
  ['--repo', registry, '--json', 'id', 'show'], { env: baseEnv, encoding: 'utf8' }),
).data.controller_did;

let rederivedCents = 0;
let rederivedCalls = 0;
for (const logDir of logDirs) {
  const agentDid = `did:keri:${logDir.replace(/\.jsonl$/, '')}`;
  const out = execFileSync(BIN, [
    'verify-spend',
    '--log', join(spendLogDir, logDir),
    '--registry', registry,
    '--agent', agentDid,
    '--root', rootDid,
  ], { env: baseEnv, encoding: 'utf8' });
  const m = out.match(/consistent — (\d+) call\(s\), \$([0-9.]+) re-derived/);
  check(`log ${logDir.slice(0, 12)}… re-derived consistent`, !!m, out.slice(0, 300));
  rederivedCalls += Number(m[1]);
  rederivedCents += Math.round(Number(m[2]) * 100);
}
check('the re-derived fleet total equals the sum the test observed',
  rederivedCents === grantedCents, { rederivedCents, grantedCents });

const checkpointsFile = join(treasuryState, 'checkpoints.jsonl');
await new Promise((r) => setTimeout(r, 1_500));
check('the coordinator wrote a signed checkpoint trail',
  existsSync(checkpointsFile) && readFileSync(checkpointsFile, 'utf8').trim().length > 0);
const crossCheck = execFileSync(BIN, [
  'verify-spend',
  '--log', join(spendLogDir, logDirs[0]),
  '--registry', registry,
  '--agent', `did:keri:${logDirs[0].replace(/\.jsonl$/, '')}`,
  '--root', rootDid,
  '--treasury-checkpoints', checkpointsFile,
  '--expect-cumulative', String(grantedCents),
], { env: baseEnv, encoding: 'utf8' });
check('the signed checkpoint trail cross-checks against the re-derived total',
  crossCheck.includes('treasury-checkpoints: valid'), crossCheck.slice(0, 300));

console.log(`\nfleet throughput proven — ${passed} checks green`);
console.log(`  ${FLEET_SIZE} agents under one root, one $${(FLEET_CAP_CENTS / 100).toFixed(2)} cap, `
  + `${cps.toFixed(1)} calls/s, every agent cap-refused, ${rederivedCalls} calls re-derived consistent`);
cleanup();
process.exit(0);
