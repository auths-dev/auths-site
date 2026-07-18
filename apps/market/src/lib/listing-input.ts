/**
 * Listing creation — one rulebook, two doors. The sell wizard's server action
 * and the agent write API both call this; neither carries its own validation,
 * so the two paths cannot drift.
 */

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,62}$/;

export interface ListingInput {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  rails: string[];
  transport: 'stdio' | 'url';
  endpointValue: string;
  spendLogUrl: string;
  docsUrl: string;
  tools: { name: string; description?: string }[];
}

export type ParsedListing = { ok: true; input: ListingInput } | { ok: false; error: string };

/** Validate raw listing fields into a well-formed input, or one actionable error. */
export function parseListingInput(raw: {
  slug?: unknown;
  name?: unknown;
  description?: unknown;
  priceCents?: unknown;
  rails?: unknown;
  transport?: unknown;
  endpointValue?: unknown;
  spendLogUrl?: unknown;
  docsUrl?: unknown;
  tools?: unknown;
}): ParsedListing {
  const slug = String(raw.slug ?? '').trim();
  const name = String(raw.name ?? '').trim();
  const description = String(raw.description ?? '').trim();
  const priceCents = Number.parseInt(String(raw.priceCents ?? ''), 10);
  const rails = Array.isArray(raw.rails)
    ? raw.rails.map(String).filter((r) => r === 'x402' || r === 'stripe')
    : [];
  const transport = raw.transport === 'url' ? 'url' : 'stdio';
  const endpointValue = String(raw.endpointValue ?? '').trim();
  const spendLogUrl = String(raw.spendLogUrl ?? '').trim();
  const docsUrl = String(raw.docsUrl ?? '').trim();
  const tools = Array.isArray(raw.tools)
    ? raw.tools
        .map((t) => {
          if (typeof t === 'string') {
            const [toolName, ...rest] = t.split(' — ');
            return { name: toolName.trim(), description: rest.join(' — ').trim() || undefined };
          }
          const obj = t as { name?: unknown; description?: unknown };
          return {
            name: String(obj.name ?? '').trim(),
            description: obj.description ? String(obj.description) : undefined,
          };
        })
        .filter((t) => t.name.length > 0)
    : [];

  if (!SLUG_RE.test(slug)) {
    return { ok: false, error: 'Slug must be lowercase letters, digits, and hyphens (2–63 chars).' };
  }
  if (!name || !description) return { ok: false, error: 'Name and description are required.' };
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    return { ok: false, error: 'Price must be a whole number of cents (0 or more).' };
  }
  if (rails.length === 0) return { ok: false, error: 'Pick at least one payment rail.' };
  if (!endpointValue) {
    return { ok: false, error: 'The endpoint (stdio command or URL) is required.' };
  }
  if (transport === 'url' && !endpointValue.startsWith('https://')) {
    return { ok: false, error: 'URL endpoints must be https.' };
  }
  if (!spendLogUrl.startsWith('https://')) {
    return {
      ok: false,
      error:
        'A public spend-log URL (https) is required — dashboards render only re-derived numbers, so the log must be fetchable.',
    };
  }
  if (tools.length === 0) {
    return { ok: false, error: 'List at least one tool (one per line, "name — description").' };
  }

  return {
    ok: true,
    input: {
      slug,
      name,
      description,
      priceCents,
      rails,
      transport,
      endpointValue,
      spendLogUrl,
      docsUrl,
      tools,
    },
  };
}
