/**
 * Agent sign-in: per-request authentication for the write API.
 *
 * The market re-implements NO wire: the SDK's relying-party surface parses
 * the `Auths-Presentation` header, binds audience and nonce, verifies the
 * evidence (every supplied key history is signature-authenticated before it
 * replays), and maps verdicts to denials — all in Rust. What lives here is
 * exactly what only the market can own: the single-use challenge store, the
 * grant policy, and the seller record.
 *
 * No sessions, no cookies, no bearer tokens: every write proves control of
 * the agent's signing key against a single-use server nonce, and a failed
 * attempt burns its challenge.
 */

import { CHALLENGE_AUDIENCE, consumeChallenge } from './challenges';
import { loadVerifier } from './agent-verifier';
import { createServiceClient } from '@/lib/supabase/service';

/** The capability a seller credential must grant (colon-namespaced — the
 *  capability grammar has no dots). Any valid credential without it is a real
 *  identity with the wrong grant: 403, not 401. */
export const SELL_CAPABILITY = 'market:sell';

export type AgentAuthResult =
  | { ok: true; seller: { id: string; subject: string; authsRoot: string | null; caps: string[] } }
  | { ok: false; status: 401 | 403 | 503; code: string; detail?: string };

/**
 * Authenticate an agent write request from its presentation header + evidence.
 *
 * Storage-then-crypto, fail closed: peek the header (parse-only) to learn the
 * nonce, consume it exactly once, then hand everything to the SDK's
 * relying-party check. A consumed nonce stays consumed even when verification
 * then fails. The one policy decision — which grant admits selling — happens
 * here, on the verified report's caps, never on raw input.
 */
export async function authenticateAgent(
  authorization: string | null,
  evidence: unknown,
): Promise<AgentAuthResult> {
  const sdk = loadVerifier();
  if (!sdk) {
    return { ok: false, status: 503, code: 'agent-auth-unavailable' };
  }
  if (!authorization) {
    return { ok: false, status: 401, code: 'bad-authorization-header' };
  }
  if (typeof evidence !== 'object' || evidence === null) {
    return { ok: false, status: 401, code: 'evidence-required' };
  }

  let peek;
  try {
    peek = sdk.presentationNonce(authorization);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    const code = reason.includes('challenge-binding-required')
      ? 'challenge-binding-required'
      : 'bad-authorization-header';
    return { ok: false, status: 401, code };
  }
  if (peek.audience !== CHALLENGE_AUDIENCE) {
    return { ok: false, status: 401, code: 'wrong-audience' };
  }

  const consumed = await consumeChallenge(peek.nonce);
  if (!consumed) return { ok: false, status: 401, code: 'challenge-unknown-or-consumed' };

  const report = await sdk.authenticatePresentation(
    authorization,
    JSON.stringify(evidence),
    CHALLENGE_AUDIENCE,
    peek.nonce,
  );
  if (!report.authorized || !report.subject) {
    return { ok: false, status: 401, code: report.code, detail: report.detail };
  }

  const caps = report.caps ?? [];
  if (!caps.includes(SELL_CAPABILITY)) {
    return { ok: false, status: 403, code: 'missing-sell-capability' };
  }

  const authsRoot = report.subjectRoot ?? null;

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
