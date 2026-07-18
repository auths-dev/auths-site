import { NextResponse, type NextRequest } from 'next/server';
import { authenticateAgent } from '@/lib/auth/auths-native';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

/**
 * The agent's own listings — sellers currently list blind, this is their read-back.
 *
 * POST (not GET) because the presentation evidence rides in the body; the same
 * challenge → present → call flow as every agent write, and only the presented
 * agent's rows ever return.
 */
export async function POST(request: NextRequest) {
  let body: { evidence?: unknown };
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

  const { data, error } = await createServiceClient()
    .from('listings')
    .select('slug, name, status, fail_reason, verified_at, live_proven_at, receipts_invalid')
    .eq('seller_id', auth.seller.id)
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json(
      { error: { code: 'listing-query-failed', detail: error.message } },
      { status: 503 },
    );
  }

  return NextResponse.json({
    seller: { subject: auth.seller.subject, authsRoot: auth.seller.authsRoot },
    listings: data ?? [],
  });
}
