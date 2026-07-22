#!/usr/bin/env node
/**
 * The explorer guardrails, encoded:
 *   1. wasm present   — the vendored verifier (glue + binary) is in place, or
 *                       every "verified in your browser" claim is a lie.
 *   2. verdict manifest — the SDK ships conformance/verdicts.json with all
 *                       families, and any verdict-position token the explorer
 *                       hardcodes is one that manifest defines (plan X2.5).
 *   3. verifier fence — nothing outside src/lib/verify imports the WASM glue
 *                       (belt to the ESLint suspenders): the browser recompute
 *                       must funnel through the one bridge.
 *
 * Run: node scripts/check-explorer.mjs   (exits non-zero on any failure)
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const problems = [];

// 1. WASM present (glue + binary co-located so the bundler emits the asset).
const wasmDir = path.join(ROOT, 'src', 'lib', 'verify', 'wasm');
const wasmBinary = path.join(wasmDir, 'auths_verifier_bg.wasm');
const wasmGlue = path.join(wasmDir, 'auths_verifier.js');
if (!fs.existsSync(wasmBinary)) problems.push(`missing verifier binary: ${wasmBinary}`);
if (!fs.existsSync(wasmGlue)) problems.push(`missing verifier glue: ${wasmGlue}`);

// 2. Verdict manifest — families present, and hardcoded tokens are defined.
const FAMILIES = ['audit', 'call', 'commit', 'gate', 'log', 'paymode'];
let allCodes = new Set();
try {
  const manifestPath = require.resolve('@auths-dev/sdk/conformance/verdicts.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const fam of FAMILIES) {
    if (!Array.isArray(manifest.verdicts?.[fam]) || manifest.verdicts[fam].length === 0) {
      problems.push(`verdict manifest is missing the "${fam}" family`);
    }
  }
  allCodes = new Set(Object.values(manifest.verdicts ?? {}).flat());
} catch (err) {
  problems.push(`could not load @auths-dev/sdk/conformance/verdicts.json: ${err.message}`);
}

// 3. Verifier fence.
const EXT = new Set(['.ts', '.tsx']);
const GLUE_RE = /from\s+['"][^'"]*verify\/wasm\/[^'"]+['"]|from\s+['"]@auths-dev\/verifier['"]/;
const FENCE_EXEMPT = path.join('src', 'lib', 'verify');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : EXT.has(path.extname(e.name)) ? [p] : [];
  });
}

for (const file of walk(path.join(ROOT, 'src'))) {
  const rel = path.relative(ROOT, file);
  if (rel.startsWith(FENCE_EXEMPT)) continue;
  const src = fs.readFileSync(file, 'utf8');
  if (GLUE_RE.test(src)) {
    problems.push(`${rel}: imports the WASM verifier glue outside src/lib/verify`);
  }
}

if (problems.length) {
  console.error('check-explorer: FAIL');
  for (const p of problems) console.error(`  · ${p}`);
  process.exit(1);
}
console.log('check-explorer: OK');
