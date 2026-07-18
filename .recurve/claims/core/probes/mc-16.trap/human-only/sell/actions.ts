'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/supabase-github';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { parseListingInput } from '@/lib/listing-input';
import { insertListing } from '@/lib/supabase/listings-write';

export interface SellFormState {
  error: string | null;
}

/**
 * Creates a listing in `pending_verification`. The prober (US-005) is what
 * moves it to `live` — nothing goes into the directory unprobed. Validation
 * and the insert live in the shared listing rulebook (`lib/listing-input`,
 * `lib/supabase/listings-write`), the same code path the agent write API uses.
 */
export async function createListing(
  _prev: SellFormState,
  form: FormData,
): Promise<SellFormState> {
  const seller = await auth.requireSeller();

  const parsed = parseListingInput({
    slug: form.get('slug'),
    name: form.get('name'),
    description: form.get('description'),
    priceCents: form.get('price_cents'),
    rails: ['x402', 'stripe'].filter((r) => form.get(`rail_${r}`) === 'on'),
    transport: form.get('transport') ?? 'stdio',
    endpointValue: form.get('endpoint_value'),
    spendLogUrl: form.get('spend_log_url'),
    docsUrl: form.get('docs_url'),
    tools: String(form.get('tools') ?? '')
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean),
  });
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createSupabaseServerClient();
  const inserted = await insertListing(supabase, seller.id, parsed.input);
  if (!inserted.ok) return { error: inserted.error };

  redirect('/dashboard?submitted=1');
}
