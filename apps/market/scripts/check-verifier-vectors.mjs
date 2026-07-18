#!/usr/bin/env node
/**
 * Conformance check: the SDK addon the market runs must agree with the golden
 * vectors that same package ships. Catches contract drift between the verifier
 * we load and the requests/verdicts we were built against — from the installed
 * package, so the pinned version is the one asserted.
 *
 * Run: node scripts/check-verifier-vectors.mjs   (AUTHS_SDK_PATH or @auths-dev/sdk)
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const specifier = process.env.AUTHS_SDK_PATH ?? '@auths-dev/sdk';

let sdk;
let pkgDir;
try {
  sdk = require(specifier);
  pkgDir = join(require.resolve(`${specifier}/package.json`), '..');
} catch {
  console.log('verifier vectors: SDK addon not installed — skipping (agent auth is 503 without it)');
  process.exit(0);
}

const vector = (name) => readFileSync(join(pkgDir, 'conformance', name), 'utf8');
const statuses = JSON.parse(vector('statuses.json'));

let failures = 0;
function check(label, cond, detail) {
  if (!cond) {
    failures += 1;
    console.error(`✗ ${label}${detail ? ` — ${JSON.stringify(detail)}` : ''}`);
  } else {
    console.log(`✓ ${label}`);
  }
}

const valid = vector('presentation_valid.json');
check('packaged valid vector verifies as Valid',
  sdk.verifyPresentation(valid).status === 'Valid',
  sdk.verifyPresentation(valid));

const tampered = JSON.parse(valid);
tampered.subjectKelAttachmentsB64[0] = Buffer.alloc(64).toString('base64');
check('tampered attachment refuses as KelUnauthenticated',
  sdk.verifyPresentation(JSON.stringify(tampered)).status === 'KelUnauthenticated',
  sdk.verifyPresentation(JSON.stringify(tampered)));

check('KelUnauthenticated is in the canonical status list',
  statuses.presentationStatuses.includes('KelUnauthenticated'),
  statuses.presentationStatuses);

const revoked = vector('credential_revoked.json');
check('packaged revoked vector refuses as CredentialRevoked',
  sdk.verifyCredential(revoked).status === 'CredentialRevoked',
  sdk.verifyCredential(revoked));

if (failures > 0) {
  console.error(`\n${failures} conformance failure(s) — the addon and its vectors disagree`);
  process.exit(1);
}
console.log('verifier vectors conform');
