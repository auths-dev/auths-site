#!/usr/bin/env node
/**
 * The market guardrails, encoded (the docs-site lesson, ported to an app):
 *   1. copy lint      — banned vocabulary and the stray old package name
 *   2. verdict lint   — every verdict-position token must be one the
 *                       gateway source defines, exactly
 *   3. mode order     — test-mode always appears before live-mode in any
 *                       file that mentions both
 *   4. paste lint     — every `npx -y` command names the real package
 *   5. auth fence     — nothing outside src/lib/auth and src/lib/supabase
 *                       imports @supabase/* (belt to the ESLint suspenders)
 *
 * Run: node scripts/check-market.mjs   (from apps/market, or anywhere)
 * Exits non-zero on any failure.
 */

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const SCANNED = ['src', 'mcp']
const EXT = new Set(['.ts', '.tsx', '.mjs'])

/** The exact verdict strings the gateway source defines — nothing else may appear. */
const VERDICTS = new Set([
  'allowed',
  'outside-agent-scope',
  'usage-cap-exceeded',
  'metered-amount-required',
  'usage-counter-rolled-back',
  'agent-expired',
  'revoked',
  'stale',
  'budget-required',
  'proof-unauthentic',
  'consistent',
  'tampered-proof',
  'cost-mismatch',
  'budget-mismatch',
  'dropped-call',
])

const BANNED = [
  { re: /blockchain|decentraliz|self-sovereign/i, why: 'category vocabulary' },
  { re: /\bKERI\b|\bCESR\b|did:keri/, why: 'protocol jargon' },
  { re: /\bseamless|\bleverag|\bempower|\brobust\b/i, why: 'hype vocabulary' },
  { re: /@auths\/mcp/, why: 'stray old package name (now @auths-dev/mcp)' },
]

const TEST_MODE = /test[-_ ]mode/i
const LIVE_MODE = /live[-_ ]mode|go[- ]live|live \(real money\)/i

const FENCE_EXEMPT = [path.join('src', 'lib', 'auth'), path.join('src', 'lib', 'supabase')]

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : EXT.has(path.extname(e.name)) ? [p] : []
  })
}

const files = SCANNED.flatMap((d) => walk(path.join(ROOT, d)))
const failures = []

for (const file of files) {
  const rel = path.relative(ROOT, file)
  const source = fs.readFileSync(file, 'utf8')

  // 1. copy lint
  source.split('\n').forEach((line, i) => {
    for (const { re, why } of BANNED) {
      if (re.test(line)) failures.push(`${rel}:${i + 1}: ${why}: ${line.trim().slice(0, 80)}`)
    }
  })

  // 2. verdict lint — verdict-position tokens (after the arrow the UI renders)
  for (const m of source.matchAll(/→\s+([a-z][a-z-]+[a-z])/g)) {
    const token = m[1]
    if (/-/.test(token) && !VERDICTS.has(token)) {
      failures.push(`${rel}: "${token}" reads as a verdict but the gateway defines no such string`)
    }
  }

  // 3. mode order — test-mode must be introduced before live-mode
  const test = source.search(TEST_MODE)
  const live = source.search(LIVE_MODE)
  if (test !== -1 && live !== -1 && live < test) {
    failures.push(`${rel}: live-mode copy appears before test-mode — test-mode leads, always`)
  }
  if (test === -1 && live !== -1) {
    failures.push(`${rel}: live-mode copy with no test-mode counterpart — test-mode leads, always`)
  }

  // 4. paste lint — commands must be runnable as pasted, with real package names
  //    (mcp-remote is a real bridge package; placeholder= attributes are form
  //    examples, not commands the reader is told to run)
  source.split('\n').forEach((line, i) => {
    if (/placeholder=/.test(line)) return
    for (const m of line.matchAll(/npx -y (\S+)/g)) {
      const pkg = m[1].replace(/["'`,\\].*$/, '')
      if (!pkg.startsWith('@auths-dev/mcp') && pkg !== 'mcp-remote') {
        failures.push(`${rel}:${i + 1}: npx names "${pkg}" — not a package a reader can paste-run`)
      }
    }
  })

  // 5. auth fence
  const inFence = FENCE_EXEMPT.some((d) => rel.startsWith(d + path.sep) || rel === d)
  if (!inFence && /from\s+['"]@supabase\//.test(source)) {
    failures.push(`${rel}: imports @supabase/* outside the fence — go through src/lib/auth or src/lib/supabase`)
  }
}

if (failures.length > 0) {
  for (const f of failures) console.error(`FAIL  ${f}`)
  console.error(`\n${failures.length} failure(s) across ${files.length} files`)
  process.exit(1)
}
console.log(`market check clean — ${files.length} files`)
