import { NextResponse } from 'next/server';
import { resolveWitness } from '@/lib/transport/witness';
import type { FetchStamp } from '@/lib/transport/stamp';

/**
 * `GET /api/w/[witness]/roster` — proxy the witness's public
 * `/v1/registry/roster` and stamp it with when we fetched it.
 *
 * This is a PROXY, not a verdict: the roster is a list of prefixes the witness
 * claims to hold; the explorer verifies each member's actual KEL client-side
 * before showing anything as valid. The proxy exists only because witnesses may
 * not yet send CORS headers (node epic W0.2) — once they do, the browser can
 * query `/v1/registry/roster` directly (plan X3.3) and this route falls away.
 */
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ witness: string }> },
) {
  const { witness } = await params;
  const override = new URL(req.url).searchParams.get('witness');
  const resolved = resolveWitness(decodeURIComponent(witness), override);
  if (!resolved) {
    return NextResponse.json({ error: 'unknown-witness', witness }, { status: 404 });
  }

  try {
    const res = await fetch(`${resolved.url}/v1/registry/roster`, {
      signal: AbortSignal.timeout(5_000),
      headers: { accept: 'application/json' },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: 'witness-unreachable', status: res.status, witness: resolved.name },
        { status: 502 },
      );
    }
    const roster = await res.json();
    const stamp: FetchStamp = {
      witness: resolved.name,
      url: resolved.url,
      fetchedAt: Date.now(),
      source: 'proxy',
    };
    return NextResponse.json({ roster, stamp });
  } catch {
    return NextResponse.json(
      { error: 'witness-unreachable', witness: resolved.name },
      { status: 502 },
    );
  }
}
