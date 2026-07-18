// microbench.mjs — decompose the per-call cost into its measured primitives so the gap to
// 100k TPS is attributable, not hand-waved. Each paid_call does, on the hot path:
//
//   ~1 ed25519 SSHSIG verify (dual-KEL replay), ~2 ed25519 signs (call + settlement),
//   1 RFC-8785 canonicalization, 1 temp-write+rename (SettledCounter::settle),
//   1 file append (spend-log).
//
// We measure each primitive here with Node's own crypto/fs (a faithful proxy for the Rust
// costs — ed25519 and POSIX fs are the same underlying work), single-core AND scaled across
// all cores, so we can say which primitive is the wall. Crypto parallelizes; durable fs
// writes serialize per counter — that contrast is the whole point.

import { Worker } from 'node:worker_threads';
import { writeFileSync, renameSync, openSync, writeSync, closeSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { availableParallelism } from 'node:os';

const CORES = availableParallelism();

// A CJS worker (eval): run one ed25519 op in a tight loop for durationMs, report the count.
const CRYPTO_WORKER = `
  const { parentPort, workerData } = require('worker_threads');
  const crypto = require('node:crypto');
  const { op, durationMs } = workerData;
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const msg = Buffer.from('auths-mcp canonical call proof commit — a representative ~140 byte payload standing in for the RFC-8785 bytes a paid_call signs and the verifier checks');
  const sig = crypto.sign(null, msg, privateKey);
  let n = 0; const end = Date.now() + durationMs;
  if (op === 'verify') { while (Date.now() < end) { crypto.verify(null, msg, publicKey, sig); n++; } }
  else { while (Date.now() < end) { crypto.sign(null, msg, privateKey); n++; } }
  parentPort.postMessage(n);
`;

function cryptoRun(op, workers, durationMs) {
  return new Promise((resolve) => {
    const counts = [];
    const start = Date.now();
    let done = 0;
    for (let i = 0; i < workers; i += 1) {
      const w = new Worker(CRYPTO_WORKER, { eval: true, workerData: { op, durationMs } });
      w.on('message', (n) => {
        counts.push(n);
        w.terminate();
        if (++done === workers) {
          const secs = (Date.now() - start) / 1000;
          resolve(Math.round(counts.reduce((a, b) => a + b, 0) / secs));
        }
      });
    }
  });
}

// Durable-write primitives, single-thread (the per-counter reality). rename mirrors
// SettledCounter::settle (temp-write + atomic rename); append mirrors spend-log::append.
function fsRun(kind, durationMs) {
  const dir = mkdtempSync(join(tmpdir(), 'perf-fs-'));
  const target = join(dir, 'counter.json');
  const log = join(dir, 'spend.jsonl');
  const payload = JSON.stringify({ delegation: 'did:keri:'.padEnd(60, 'x'), settled_high_water_cents: 123456 });
  const line = `${JSON.stringify({ receipt: { cumulative_cents: 42, at: '2026-07-18T00:00:00Z' } })}\n`;
  let n = 0; const end = Date.now() + durationMs;
  try {
    if (kind === 'rename') {
      let i = 0;
      while (Date.now() < end) {
        const tmp = `${target}.${i++ & 1}.tmp`;
        writeFileSync(tmp, payload); renameSync(tmp, target); n++;
      }
    } else {
      while (Date.now() < end) {
        const fd = openSync(log, 'a'); writeSync(fd, line); closeSync(fd); n++;
      }
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
  return Math.round(n / (durationMs / 1000));
}

function canonicalizeRun(durationMs) {
  const call = { tool: 'paid_call', args: { amount_atomic: 10000, network: 'base-sepolia', endpoint: '/paid-call' } };
  const canon = (o) => JSON.stringify(o, Object.keys(o).sort ? undefined : undefined);
  let n = 0; const end = Date.now() + durationMs;
  // RFC-8785 ≈ stable-key JSON; approximate with a recursive sorted-key stringify.
  const stable = (v) => Array.isArray(v) ? `[${v.map(stable).join(',')}]`
    : (v && typeof v === 'object')
      ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`
      : JSON.stringify(v);
  while (Date.now() < end) { stable(call); n++; }
  void canon;
  return Math.round(n / (durationMs / 1000));
}

export async function runMicrobench({ durationMs = 2000, log = console.log } = {}) {
  log(`  cores=${CORES}; measuring per-call primitives (${durationMs}ms each)…`);

  const verify1 = await cryptoRun('verify', 1, durationMs);
  const verifyN = await cryptoRun('verify', CORES, durationMs);
  const sign1 = await cryptoRun('sign', 1, durationMs);
  const signN = await cryptoRun('sign', CORES, durationMs);
  const rename1 = fsRun('rename', durationMs);
  const append1 = fsRun('append', durationMs);
  const canon1 = canonicalizeRun(durationMs);

  // Per-call floor from the primitives (single-thread), and the parallel crypto ceiling.
  const perCallCryptoMs = (2 / sign1 + 1 / verify1) * 1000;      // 2 signs + 1 verify, one core
  const perCallDurableMs = (1 / rename1 + 1 / append1) * 1000;   // 1 rename + 1 append, one writer
  const perCallCanonMs = (1 / canon1) * 1000;
  const durableCeiling = Math.min(rename1, append1);             // serial durable writer cap
  const cryptoCeilingAgg = Math.round(1 / (2 / signN + 1 / verifyN)); // crypto across all cores

  const out = {
    scenario: 'microbench', cores: CORES, duration_ms: durationMs,
    crypto: {
      ed25519_verify_per_s_1core: verify1, ed25519_verify_per_s_allcores: verifyN,
      ed25519_sign_per_s_1core: sign1, ed25519_sign_per_s_allcores: signN,
    },
    durability: { rename_per_s: rename1, append_per_s: append1 },
    canonicalize_per_s: canon1,
    derived: {
      per_call_crypto_ms_1core: perCallCryptoMs,
      per_call_durable_ms_1writer: perCallDurableMs,
      per_call_canon_ms: perCallCanonMs,
      durable_writer_ceiling_cps: durableCeiling,
      crypto_ceiling_allcores_cps: cryptoCeilingAgg,
    },
  };
  log(`  ed25519 verify: ${verify1.toLocaleString()}/s (1 core) → ${verifyN.toLocaleString()}/s (${CORES} cores)`);
  log(`  ed25519 sign:   ${sign1.toLocaleString()}/s (1 core) → ${signN.toLocaleString()}/s (${CORES} cores)`);
  log(`  durable write:  rename ${rename1.toLocaleString()}/s, append ${append1.toLocaleString()}/s (1 writer)`);
  log(`  ⇒ crypto ceiling ≈ ${cryptoCeilingAgg.toLocaleString()}/s (all cores); `
    + `durable-writer ceiling ≈ ${durableCeiling.toLocaleString()}/s (per counter)`);
  return out;
}
