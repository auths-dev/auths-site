import { NextResponse } from 'next/server';
import { resolveWitness } from '@/lib/transport/witness';
import { loadSdk, sdkCanReadKel } from '@/lib/transport/sdk';
import { mirrorWitness } from '@/lib/transport/registry';
import type { FetchStamp } from '@/lib/transport/stamp';
import type { KelReadResult } from '@/lib/verify/types';

/**
 * `GET /api/node/[witness]/kel/[prefix]` — mirror the witness's registry and read
 * one member's KEL (events + per-event HEX CESR attachments) out of it as JSON.
 *
 * This is TRANSPORT: it returns raw bytes and a freshness stamp. It does NOT
 * verify — the browser recomputes every SAID and signature via `validateKelJson`
 * before anything renders as valid. A compromised explorer can withhold here
 * (which the browser detects as a broken/short KEL); it cannot forge.
 *
 * Needs `@auths-dev/sdk` ≥ 0.1.16 (the `readKelJson` export). On an older SDK it
 * returns 501 with an honest reason rather than faking a result.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ witness: string; prefix: string }> },
) {
  const { witness, prefix } = await params;
  const override = new URL(req.url).searchParams.get('witness');
  const resolved = resolveWitness(decodeURIComponent(witness), override);
  if (!resolved) {
    return NextResponse.json({ error: 'unknown-witness', witness }, { status: 404 });
  }

  const mod = loadSdk();
  if (!sdkCanReadKel(mod)) {
    return NextResponse.json(
      {
        error: 'sdk-cannot-read-kel',
        reason:
          'the explorer server needs @auths-dev/sdk ≥ 0.1.16 (readKelJson) to serve the git-object KEL path',
      },
      { status: 501 },
    );
  }

  let mirror: { dir: string; fetchedAt: number };
  try {
    mirror = mirrorWitness(mod, resolved.url);
  } catch (err) {
    return NextResponse.json(
      { error: 'witness-unreachable', witness: resolved.name, detail: String(err) },
      { status: 502 },
    );
  }

  let read: KelReadResult;
  try {
    read = JSON.parse(mod.readKelJson(mirror.dir, decodeURIComponent(prefix))) as KelReadResult;
  } catch (err) {
    // readKelJson throws when the prefix isn't held by this witness.
    return NextResponse.json(
      { error: 'member-not-found', prefix, witness: resolved.name, detail: String(err) },
      { status: 404 },
    );
  }

  const stamp: FetchStamp = {
    witness: resolved.name,
    url: resolved.url,
    fetchedAt: mirror.fetchedAt,
    source: 'git-mirror',
  };
  return NextResponse.json({ ...read, stamp });
}
