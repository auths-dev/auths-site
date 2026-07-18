/**
 * Agent sign-in: per-request authentication for the write API.
 *
 * The wire is the relying-party contract from the Auths stack:
 * `Authorization: Auths-Presentation <base64url(JSON)>` carries the signed
 * envelope; the request body carries the evidence bundle (credential + every
 * key-history slice with per-event signature attachments) emitted by
 * `auths credential present --with-evidence`. Verification is one call into
 * the SDK verifier, which authenticates every supplied key history before
 * replaying it — a forged history is refused, never bound.
 *
 * No sessions, no cookies, no bearer tokens: every write proves control of
 * the agent's signing key against a single-use server nonce.
 */

import { CHALLENGE_AUDIENCE, consumeChallenge } from './challenges';
import { loadVerifier } from './agent-verifier';
import { createServiceClient } from '@/lib/supabase/service';

const SCHEME = 'Auths-Presentation ';

export type AgentAuthResult =
  | { ok: true; seller: { id: string; subject: string; authsRoot: string | null; caps: string[] } }
  | { ok: false; status: 401 | 403 | 503; code: string; detail?: string };

interface WireToken {
  credential_said: string;
  audience: string;
  binding: { challenge?: { nonce: string }; ttl?: unknown };
  signature_b64: string;
}

function b64urlToStd(value: string): string {
  return Buffer.from(value, 'base64url').toString('base64');
}

function parseToken(header: string | null): WireToken | null {
  if (!header?.startsWith(SCHEME)) return null;
  try {
    const json = Buffer.from(header.slice(SCHEME.length).trim(), 'base64url').toString('utf8');
    const wire = JSON.parse(json) as WireToken;
    if (
      typeof wire.credential_said !== 'string' ||
      typeof wire.audience !== 'string' ||
      typeof wire.signature_b64 !== 'string' ||
      typeof wire.binding !== 'object'
    ) {
      return null;
    }
    return wire;
  } catch {
    return null;
  }
}

/**
 * Authenticate an agent write request from its presentation header + evidence.
 *
 * Fail-closed order: scheme, then binding mode, then audience, then the
 * one-shot nonce, then cryptographic verification, then the grant check.
 * Every rejection is a typed status, and
 * a consumed nonce stays consumed even when verification then fails — a
 * failed attempt burns its challenge.
 */
export async function authenticateAgent(
  authorization: string | null,
  evidence: unknown,
): Promise<AgentAuthResult> {
  const verifier = loadVerifier();
  if (!verifier) {
    return { ok: false, status: 503, code: 'agent-auth-unavailable' };
  }

  const wire = parseToken(authorization);
  if (!wire) return { ok: false, status: 401, code: 'bad-authorization-header' };
  if (!wire.binding.challenge?.nonce) {
    return { ok: false, status: 401, code: 'challenge-binding-required' };
  }
  if (wire.audience !== CHALLENGE_AUDIENCE) {
    return { ok: false, status: 401, code: 'wrong-audience' };
  }
  if (typeof evidence !== 'object' || evidence === null) {
    return { ok: false, status: 401, code: 'evidence-required' };
  }

  const nonce = wire.binding.challenge.nonce;
  const consumed = await consumeChallenge(nonce);
  if (!consumed) return { ok: false, status: 401, code: 'challenge-unknown-or-consumed' };

  const e = evidence as Record<string, unknown>;
  const nonceStd = b64urlToStd(nonce);
  const request = {
    schemaVersion: 1,
    envelope: {
      credentialSaid: wire.credential_said,
      audience: wire.audience,
      binding: { mode: 'challenge', nonceB64: nonceStd },
      signatureB64: b64urlToStd(wire.signature_b64),
    },
    credential: e.credential,
    issuerKel: e.issuerKel ?? [],
    issuerKelAttachmentsB64: e.issuerKelAttachmentsB64 ?? [],
    subjectKel: e.subjectKel ?? [],
    subjectKelAttachmentsB64: e.subjectKelAttachmentsB64 ?? [],
    delegatorKel: e.delegatorKel ?? [],
    delegatorKelAttachmentsB64: e.delegatorKelAttachmentsB64 ?? [],
    tel: e.tel ?? [],
    receipts: [],
    witnessPolicy: 'warn',
    audience: CHALLENGE_AUDIENCE,
    expectedChallengeB64: nonceStd,
    now: new Date().toISOString(),
  };

  let report;
  try {
    report = verifier.verifyPresentation(JSON.stringify(request));
  } catch (err) {
    return {
      ok: false,
      status: 401,
      code: 'verification-error',
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  if (report.status !== 'Valid' || !report.subject) {
    return {
      ok: false,
      status: 401,
      code: `presentation-${report.status.replace(/[A-Z]/g, (c, i) => (i ? '-' : '') + c.toLowerCase())}`,
      detail: report.message ?? report.field,
    };
  }

  const caps = report.caps ?? [];
  if (caps.length === 0) {
    return { ok: false, status: 403, code: 'no-capabilities-granted' };
  }

  // The proven root comes from the verdict itself (the verifier validated the
  // delegation seal before naming it) — never parsed out of the evidence. An
  // older addon without the field falls back to the conservative pre-field
  // behavior: root subjects credit themselves, delegated subjects defer.
  const delegated = Array.isArray(e.delegatorKel) && e.delegatorKel.length > 0;
  const authsRoot = report.subjectRoot ?? (delegated ? null : report.subject);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('sellers')
    .upsert(
      {
        auth_provider: 'auths',
        auth_subject: report.subject,
        auths_root: authsRoot,
        github_login: null,
      },
      { onConflict: 'auth_provider,auth_subject' },
    )
    .select('id')
    .single();
  if (error || !data) {
    return { ok: false, status: 503, code: 'seller-upsert-failed', detail: error?.message };
  }

  return { ok: true, seller: { id: data.id, subject: report.subject, authsRoot, caps } };
}
