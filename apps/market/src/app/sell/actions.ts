'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/supabase-github';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface SellFormState {
  error: string | null;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}$/;

/**
 * Creates a listing in `pending_verification`. The prober (US-005) is what
 * moves it to `live` — nothing goes into the directory unprobed.
 */
export async function createListing(
  _prev: SellFormState,
  form: FormData,
): Promise<SellFormState> {
  const seller = await auth.requireSeller();

  const slug = String(form.get('slug') ?? '').trim();
  const name = String(form.get('name') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const priceCents = Number.parseInt(String(form.get('price_cents') ?? ''), 10);
  const rails = ['x402', 'stripe'].filter((r) => form.get(`rail_${r}`) === 'on');
  const transport = String(form.get('transport') ?? 'stdio');
  const endpointValue = String(form.get('endpoint_value') ?? '').trim();
  const spendLogUrl = String(form.get('spend_log_url') ?? '').trim();
  const docsUrl = String(form.get('docs_url') ?? '').trim();
  const tools = String(form.get('tools') ?? '')
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((line) => {
      const [toolName, ...rest] = line.split(' — ');
      return { name: toolName.trim(), description: rest.join(' — ').trim() || undefined };
    });

  if (!SLUG_RE.test(slug)) {
    return { error: 'Slug must be lowercase letters, digits, and hyphens (2–63 chars).' };
  }
  if (!name || !description) return { error: 'Name and description are required.' };
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    return { error: 'Price must be a whole number of cents (0 or more).' };
  }
  if (rails.length === 0) return { error: 'Pick at least one payment rail.' };
  if (!endpointValue) {
    return { error: 'The endpoint (stdio command or URL) is required.' };
  }
  if (transport === 'url' && !endpointValue.startsWith('https://')) {
    return { error: 'URL endpoints must be https.' };
  }
  if (!spendLogUrl.startsWith('https://')) {
    return {
      error:
        'A public spend-log URL (https) is required — dashboards render only re-derived numbers, so the log must be fetchable.',
    };
  }
  if (tools.length === 0) {
    return { error: 'List at least one tool (one per line, "name — description").' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('listings').insert({
    seller_id: seller.id,
    slug,
    name,
    description,
    tools,
    price_cents: priceCents,
    rails,
    endpoint:
      transport === 'url'
        ? { transport: 'url', url: endpointValue }
        : { transport: 'stdio', command: endpointValue },
    spend_log_url: spendLogUrl,
    docs_url: docsUrl || null,
    status: 'pending_verification',
  });

  if (error) {
    if (error.code === '23505') return { error: `The slug "${slug}" is taken.` };
    return { error: `Could not create the listing: ${error.message}` };
  }

  redirect('/dashboard?submitted=1');
}
