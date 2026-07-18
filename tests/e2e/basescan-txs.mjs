#!/usr/bin/env node
/**
 * Print the base-sepolia on-chain settlement transactions from a gateway's
 * spend log(s), as Basescan explorer links. A LIVE x402 settle records the
 * on-chain tx hash in each spend-log record's `receipt.charge_ref` (the x402
 * `settlement.transaction`, `0x…`); this reads those back so a real run's
 * settlements are viewable on https://sepolia.basescan.org.
 *
 * Usage:
 *   node tests/e2e/basescan-txs.mjs <live-dir-or-spend-log-dir> [more dirs...]
 *
 * A live dir is the gateway's AUTHS_MCP_LIVE_DIR; its logs live under
 * <live-dir>/registry/spend-log/<delegation>/*.jsonl. A path pointing directly
 * at a spend-log directory (or a single .jsonl) also works.
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const EXPLORER = 'https://sepolia.basescan.org/tx/';

function jsonlFiles(root) {
  const out = [];
  const walk = (p) => {
    if (!existsSync(p)) return;
    const s = statSync(p);
    if (s.isDirectory()) {
      for (const e of readdirSync(p)) walk(join(p, e));
    } else if (p.endsWith('.jsonl')) {
      out.push(p);
    }
  };
  // Accept a live dir, a registry dir, or a spend-log dir directly.
  for (const candidate of [join(root, 'registry', 'spend-log'), join(root, 'spend-log'), root]) {
    if (existsSync(candidate)) { walk(candidate); break; }
  }
  return out;
}

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error('usage: node tests/e2e/basescan-txs.mjs <live-dir> [more...]');
  process.exit(1);
}

const rows = [];
for (const root of roots) {
  for (const file of jsonlFiles(root)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      let rec;
      try { rec = JSON.parse(line); } catch { continue; }
      const r = rec.receipt ?? {};
      const ref = r.charge_ref;
      const rail = r.rail;
      if (rail === 'x402' && typeof ref === 'string' && ref.startsWith('0x') && ref.length >= 66) {
        rows.push({
          tx: ref,
          cents: r.cumulative_cents,
          agent: (r.device ?? '').slice(0, 24),
          at: r.at,
        });
      }
    }
  }
}

if (rows.length === 0) {
  console.log('No on-chain x402 settlement tx hashes found (was the run LIVE — funded wallet + X402_FACILITATOR_URL?).');
  process.exit(0);
}

console.log(`\n${rows.length} on-chain base-sepolia settlement(s) — verify on Basescan:\n`);
for (const r of rows) {
  console.log(`  ${EXPLORER}${r.tx}`);
  console.log(`    agent ${r.agent}… · cumulative ${r.cents}¢ · ${r.at}`);
}
console.log('');
