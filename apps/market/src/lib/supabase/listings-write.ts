/**
 * Listing writes — the data-helper half of listing creation. Validation lives
 * in `src/lib/listing-input.ts` (pure); this inserts a validated input under
 * whichever client the caller is entitled to (seller session or service role).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ListingInput } from '@/lib/listing-input';

/**
 * Insert a validated listing as `pending_verification` for `sellerId`.
 * The prober is what moves it to `live` — nothing enters the directory unprobed.
 */
export async function insertListing(
  supabase: SupabaseClient,
  sellerId: string,
  input: ListingInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.from('listings').insert({
    seller_id: sellerId,
    slug: input.slug,
    name: input.name,
    description: input.description,
    tools: input.tools,
    price_cents: input.priceCents,
    rails: input.rails,
    endpoint:
      input.transport === 'url'
        ? { transport: 'url', url: input.endpointValue }
        : { transport: 'stdio', command: input.endpointValue },
    attestation_url: input.attestationUrl,
    docs_url: input.docsUrl || null,
    status: 'pending_verification',
  });
  if (error) {
    if (error.code === '23505') return { ok: false, error: `The slug "${input.slug}" is taken.` };
    return { ok: false, error: `Could not create the listing: ${error.message}` };
  }
  return { ok: true };
}
