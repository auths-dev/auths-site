/**
 * Single-use challenge nonces for agent sign-in — the Supabase port of the
 * relying-party ChallengeStore contract: bounded TTL, remove-on-read, one
 * consumption ever. A nonce that was never minted, already consumed, or
 * expired all look identical to the caller: not consumable.
 */

import { createServiceClient } from '@/lib/supabase/service';
import { loadVerifier } from './agent-verifier';

export const CHALLENGE_AUDIENCE = 'market.auths.dev';
const CHALLENGE_TTL_SECONDS = 300;

export interface Challenge {
  nonce: string;
  audience: string;
  expiresAt: string;
}

/**
 * Mint a fresh challenge and store it with a 5-minute TTL. The nonce shape is
 * the SDK's (the auths-rp contract), never invented here — and without the
 * addon there is no agent sign-in to challenge, so minting fails closed.
 */
export async function mintChallenge(): Promise<Challenge> {
  const sdk = loadVerifier();
  if (!sdk) throw new Error('agent sign-in unavailable: SDK addon not loaded');
  const nonce = sdk.mintChallengeNonce();
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000).toISOString();
  const supabase = createServiceClient();

  await supabase.from('auth_challenges').delete().lt('expires_at', new Date().toISOString());
  const { error } = await supabase
    .from('auth_challenges')
    .insert({ nonce, audience: CHALLENGE_AUDIENCE, expires_at: expiresAt });
  if (error) throw new Error(`challenge mint failed: ${error.message}`);

  return { nonce, audience: CHALLENGE_AUDIENCE, expiresAt };
}

/**
 * Consume a nonce exactly once. Delete-returning is the atomicity: two racing
 * requests presenting the same nonce cannot both see a row come back.
 */
export async function consumeChallenge(nonce: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('auth_challenges')
    .delete()
    .eq('nonce', nonce)
    .gt('expires_at', new Date().toISOString())
    .select('nonce');
  if (error) throw new Error(`challenge consume failed: ${error.message}`);
  return (data ?? []).length === 1;
}
