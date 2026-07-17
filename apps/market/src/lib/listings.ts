/**
 * Listing data access. Reads go through the anon client (RLS shows only
 * live listings to the public and everything to the owning seller);
 * mutations run in server actions under the seller's session.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type Rail = 'x402' | 'stripe';
export type ListingStatus = 'pending_verification' | 'live' | 'failed';

export interface Listing {
  id: string;
  seller_id: string;
  slug: string;
  name: string;
  description: string;
  tools: { name: string; description?: string }[];
  price_cents: number;
  rails: Rail[];
  endpoint: { transport: 'stdio' | 'url'; command?: string; url?: string };
  spend_log_url: string | null;
  docs_url: string | null;
  status: ListingStatus;
  verification_stale: boolean;
  receipts_invalid: boolean;
  fail_reason: string | null;
  verified_at: string | null;
  live_proven_at: string | null;
  created_at: string;
}

export interface ReceiptSummary {
  listing_id: string;
  day: string;
  calls: number;
  refused: number;
  cents_settled: number;
  rail_split: Record<string, number>;
  log_hash: string;
  derived_at: string;
}

export async function getLiveListings(rail?: Rail): Promise<Listing[]> {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from('listings')
    .select('*')
    .eq('status', 'live')
    .order('verified_at', { ascending: false });
  if (rail) q = q.contains('rails', [rail]);
  const { data, error } = await q;
  if (error) throw new Error(`listings query failed: ${error.message}`);
  return (data ?? []) as Listing[];
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('listings').select('*').eq('slug', slug).maybeSingle();
  return (data as Listing | null) ?? null;
}

export async function getSellerListings(sellerId: string): Promise<Listing[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`seller listings query failed: ${error.message}`);
  return (data ?? []) as Listing[];
}

export async function getReceiptSummaries(
  listingId: string,
  days = 30,
): Promise<ReceiptSummary[]> {
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from('receipt_summaries')
    .select('*')
    .eq('listing_id', listingId)
    .gte('day', since)
    .order('day');
  return (data ?? []) as ReceiptSummary[];
}

/** The exact command a stranger runs to re-derive a listing's spend. */
export function verifySpendCommand(listing: Listing): string {
  return `npx -y @auths-dev/mcp verify-spend --log <spend.jsonl from ${listing.spend_log_url ?? 'the seller'}> --registry <registry> --agent <agent> --root <root>`;
}
