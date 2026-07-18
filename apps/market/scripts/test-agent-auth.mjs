#!/usr/bin/env node
/**
 * The agent-native selling loop, end to end, no humans:
 *   mint identity → self-issue capability credential → fetch challenge →
 *   present (header + evidence) → create listing → verify fail-closed paths.
 *
 * Drives a REAL agent (the auths CLI from a local checkout) against a running
 * market dev server. Empirical by design: every step prints what it proved.
 *
 * Env:
 *   AUTHS_CLI    — path to the auths binary            (default: ../auths/target/debug/auths)
 *   MARKET_URL   — the running market server           (default: http://localhost:3002)
 *
 * Run: node scripts/test-agent-auth.mjs
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CLI = process.env.AUTHS_CLI ?? resolve(import.meta.dirname, '../../../../auths/target/debug/auths');
const MARKET = process.env.MARKET_URL ?? 'http://localhost:3002';
const AUDIENCE = 'market.auths.dev';

const home = mkdtempSync(join(tmpdir(), 'agent-e2e-'));
const repo = join(home, 'workdir');
mkdirSync(repo);

const env = {
  ...process.env,
  HOME: home,
  AUTHS_HOME: join(home, '.auths'),
  AUTHS_KEYCHAIN_BACKEND: 'file',
  AUTHS_KEYCHAIN_FILE: join(home, 'keys.enc'),
  AUTHS_PASSPHRASE: 'Test-Passphrase-1!',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: join(home, '.gitconfig'),
};

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { env, cwd: repo, encoding: 'utf8', ...opts });
}

function auths(...args) {
  return sh(CLI, args);
}

function authsJson(...args) {
  const out = sh(CLI, ['--json', ...args]);
  const parsed = JSON.parse(out);
  if (parsed.status && parsed.status !== 'success') {
    throw new Error(`auths ${args.join(' ')} failed: ${out}`);
  }
  return parsed.data ?? parsed;
}

async function api(path, options = {}) {
  const res = await fetch(`${MARKET}${path}`, options);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

let passed = 0;
function check(label, cond, detail) {
  if (!cond) {
    console.error(`✗ ${label}${detail ? ` — ${JSON.stringify(detail)}` : ''}`);
    process.exit(1);
  }
  passed += 1;
  console.log(`✓ ${label}`);
}

// ── 1. an agent mints its own identity (headless, file keychain) ────────────────
sh('git', ['init', '-q', '.']);
sh('git', ['config', 'user.name', 'agent-e2e']);
sh('git', ['config', 'user.email', 'agent@e2e.local']);
auths('init', '--non-interactive', '--profile', 'developer');
const idInfo = authsJson('id', 'show');
const did = idInfo.did ?? idInfo.identity_did ?? idInfo.controller_did;
check('agent minted an identity', typeof did === 'string' && did.length > 10, idInfo);

// ── 2. self-issued capability credential (root issues to itself) ────────────────
const issued = authsJson('credential', 'issue', '--issuer', 'main', '--to', did, '--cap', 'sign');
const said = issued.credential_said;
check('capability credential issued', typeof said === 'string' && said.length > 10, issued);

// ── 3. challenge from the market ────────────────────────────────────────────────
const challenge = await api('/api/v1/challenge', { method: 'POST' });
check('challenge minted', challenge.status === 201 && challenge.body.nonce, challenge);

// ── 4. present: one command → header + verifiable evidence ─────────────────────
const presented = authsJson(
  'credential', 'present',
  '--subject', 'main',
  '--said', said,
  '--audience', AUDIENCE,
  '--nonce', challenge.body.nonce,
  '--with-evidence',
);
check('presentation emitted with evidence',
  presented.authorization?.startsWith('Auths-Presentation ') && presented.evidence?.subjectKelAttachmentsB64?.length > 0,
  Object.keys(presented));

const listing = {
  slug: `agent-echo-${Date.now().toString(36)}`,
  name: 'Agent echo (e2e)',
  description: 'Listed by an autonomous agent in the e2e loop; never shown publicly (stays pending).',
  priceCents: 3,
  rails: ['x402'],
  transport: 'stdio',
  endpointValue: 'npx -y @auths-dev/mcp wrap --scope paid.call --budget "$1" --ttl 30m --rail x402 --test-mode -- npx -y some-echo-server',
  spendLogUrl: 'https://example.com/spend.jsonl',
  docsUrl: '',
  tools: ['echo — returns the input, metered'],
};

// ── 5. the authenticated write ──────────────────────────────────────────────────
const created = await api('/api/v1/listings', {
  method: 'POST',
  headers: { authorization: presented.authorization, 'content-type': 'application/json' },
  body: JSON.stringify({ evidence: presented.evidence, listing }),
});
check('agent created a listing (201, pending_verification)',
  created.status === 201 && created.body.status === 'pending_verification',
  created);
check('seller row carries the proven root',
  created.body.seller?.authsRoot === created.body.seller?.subject && !!created.body.seller?.subject,
  created.body);

// ── 6. replayed nonce burns ─────────────────────────────────────────────────────
const replay = await api('/api/v1/listings', {
  method: 'POST',
  headers: { authorization: presented.authorization, 'content-type': 'application/json' },
  body: JSON.stringify({ evidence: presented.evidence, listing: { ...listing, slug: listing.slug + '-b' } }),
});
check('replayed nonce is refused (401)',
  replay.status === 401 && replay.body.error?.code === 'challenge-unknown-or-consumed',
  replay);

// ── 7. forged KEL attachment fails closed ───────────────────────────────────────
const c2 = await api('/api/v1/challenge', { method: 'POST' });
const p2 = authsJson('credential', 'present', '--subject', 'main', '--said', said,
  '--audience', AUDIENCE, '--nonce', c2.body.nonce, '--with-evidence');
const forgedEvidence = structuredClone(p2.evidence);
forgedEvidence.subjectKelAttachmentsB64[0] = Buffer.from(new Uint8Array(64)).toString('base64');
const forged = await api('/api/v1/listings', {
  method: 'POST',
  headers: { authorization: p2.authorization, 'content-type': 'application/json' },
  body: JSON.stringify({ evidence: forgedEvidence, listing: { ...listing, slug: listing.slug + '-c' } }),
});
check('forged KEL attachment is refused (401 kel-unauthenticated)',
  forged.status === 401 && forged.body.error?.code === 'presentation-kel-unauthenticated',
  forged);

// ── 8. forged presentation signature fails closed ───────────────────────────────
const c3 = await api('/api/v1/challenge', { method: 'POST' });
const p3 = authsJson('credential', 'present', '--subject', 'main', '--said', said,
  '--audience', AUDIENCE, '--nonce', c3.body.nonce, '--with-evidence');
const token = JSON.parse(Buffer.from(p3.authorization.slice('Auths-Presentation '.length), 'base64url').toString('utf8'));
token.signature_b64 = Buffer.from(new Uint8Array(64)).toString('base64url');
const forgedHeader = 'Auths-Presentation ' + Buffer.from(JSON.stringify(token)).toString('base64url');
const badSig = await api('/api/v1/listings', {
  method: 'POST',
  headers: { authorization: forgedHeader, 'content-type': 'application/json' },
  body: JSON.stringify({ evidence: p3.evidence, listing: { ...listing, slug: listing.slug + '-d' } }),
});
check('forged presentation signature is refused (401)',
  badSig.status === 401 && badSig.body.error?.code?.startsWith('presentation-'),
  badSig);

// ── 9. a DELEGATED identity sells, and the market credits its proven root ──────
// The device identity `auths init` authorized is a real delegated AID (its KEL
// opens with a delegation the root anchored, key alias `main-device`). Its
// presentation carries the delegator KEL, and the verdict's subjectRoot — not
// anything parsed from evidence — names the root.
const deviceList = authsJson('device', 'list');
const agent = {
  agentDid: deviceList.devices?.[0]?.id,
  keyAlias: 'main-device',
};
check('delegated device identity anchored under the root',
  agent.agentDid?.startsWith('did:keri:') && agent.agentDid !== did && deviceList.devices?.[0]?.anchored === true,
  deviceList);

const issuedD = authsJson('credential', 'issue', '--issuer', 'main', '--to', agent.agentDid, '--cap', 'sign');
const c4 = await api('/api/v1/challenge', { method: 'POST' });
const p4 = authsJson('credential', 'present',
  '--subject', agent.keyAlias,
  '--said', issuedD.credential_said,
  '--audience', AUDIENCE,
  '--nonce', c4.body.nonce,
  '--with-evidence');
check('delegated presentation carries the delegator KEL',
  p4.evidence?.delegatorKel?.length > 0 && p4.evidence?.delegatorKelAttachmentsB64?.length > 0,
  Object.keys(p4.evidence ?? {}));

const createdD = await api('/api/v1/listings', {
  method: 'POST',
  headers: { authorization: p4.authorization, 'content-type': 'application/json' },
  body: JSON.stringify({
    evidence: p4.evidence,
    listing: { ...listing, slug: listing.slug + '-delegated' },
  }),
});
check('delegated agent created a listing (201)',
  createdD.status === 201 && createdD.body.status === 'pending_verification',
  createdD);
check('seller subject is the agent, root credit goes to the PROVEN delegator',
  createdD.body.seller?.subject === agent.agentDid && createdD.body.seller?.authsRoot === did,
  { seller: createdD.body.seller, expectedRoot: did });

console.log(`\nagent-native loop proven — ${passed} checks green (root ${did.slice(0, 24)}…, delegated ${String(agent.agentDid).slice(0, 24)}…)`);
rmSync(home, { recursive: true, force: true });
