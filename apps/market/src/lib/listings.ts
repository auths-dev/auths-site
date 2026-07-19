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
  attestation_url: string | null;
  dormant?: boolean;
  docs_url: string | null;
  status: ListingStatus;
  verification_stale: boolean;
  receipts_invalid: boolean;
  fail_reason: string | null;
  verified_at: string | null;
  live_proven_at: string | null;
  created_at: string;
}

export interface ActivitySnapshot {
  listing_id: string;
  head: string;
  cumulative_cents: number;
  count: number;
  as_of: string;
  observed_at: string;
  anchor_tier: string;
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

export async function getActivitySnapshots(
  listingId: string,
  days = 30,
): Promise<ActivitySnapshot[]> {
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const { data } = await supabase
    .from('attestation_checkpoints')
    .select('*')
    .eq('listing_id', listingId)
    .gte('observed_at', since)
    .order('observed_at');
  return (data ?? []) as ActivitySnapshot[];
}

/**
 * The exact steps a stranger runs to re-check a listing's published activity
 * attestation (the raw per-call log is never published — it stays private and
 * is disclosed only point-to-point inside an EvidenceBundle).
 */
export function verifySpendCommand(listing: Listing): string {
  return [
    `curl -s ${listing.attestation_url ?? '<attestation url>'} > activity.json`,
    `# verify the signed aggregate against the seller's public identity registry:`,
    `node -e "const s=require('@auths-dev/sdk');console.log(s.verifyActivityAttestation(require('fs').readFileSync('activity.json','utf8'),'<fetched registry dir>'))"`,
  ].join('\n');
}
