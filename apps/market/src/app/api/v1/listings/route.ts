import { NextResponse, type NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth/auths-native';
import { parseListingInput } from '@/lib/listing-input';
import { insertListing } from '@/lib/supabase/listings-write';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * Create a listing as an agent seller — the write door that needs no browser,
 * no cookie, and no GitHub account. Auth is per-request: the
 * `Auths-Presentation` header proves control of the agent's signing key over a
 * single-use challenge, and the body's `evidence` carries everything the
 * verifier authenticates. A valid presentation creates (or refreshes) the
 * seller row; the listing lands as `pending_verification` for the prober,
 * exactly like a wizard submission.
 */
export async function POST(request: NextRequest) {
  let body: { evidence?: unknown; listing?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: 'invalid-json' } }, { status: 400 });
  }

  const auth = await authenticateAgent(request.headers.get('authorization'), body.evidence);
  if (!auth.ok) {
    return NextResponse.json(
      { error: { code: auth.code, detail: auth.detail } },
      { status: auth.status },
    );
  }

  const parsed = parseListingInput(body.listing ?? {});
  if (!parsed.ok) {
    return NextResponse.json({ error: { code: 'invalid-listing', detail: parsed.error } }, {
      status: 422,
    });
  }

  const inserted = await insertListing(createServiceClient(), auth.seller.id, parsed.input);
  if (!inserted.ok) {
    return NextResponse.json({ error: { code: 'insert-failed', detail: inserted.error } }, {
      status: 409,
    });
  }

  return NextResponse.json(
    {
      slug: parsed.input.slug,
      status: 'pending_verification',
      seller: { subject: auth.seller.subject, authsRoot: auth.seller.authsRoot },
    },
    { status: 201 },
  );
}
