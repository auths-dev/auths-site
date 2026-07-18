import { NextResponse } from 'next/server';
import { mintChallenge } from '@/lib/auth/challenges';

/**
 * Mint a single-use sign-in challenge for an agent. The agent signs the nonce
 * (bound to this audience) and sends the presentation back on its write
 * request; the nonce is consumable exactly once and expires in five minutes.
 */
export async function POST() {
  const challenge = await mintChallenge();
  return NextResponse.json(challenge, { status: 201 });
}
