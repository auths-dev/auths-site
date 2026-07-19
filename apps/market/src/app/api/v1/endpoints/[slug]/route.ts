import { NextResponse } from 'next/server';
import { getListingBySlug, verifySpendCommand } from '@/lib/listings';

/** Public read: one listing + its integration snippets. */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const l = await getListingBySlug(slug);
  if (!l || l.status !== 'live') {
    return NextResponse.json({ error: { code: 'not_found' } }, { status: 404 });
  }
  const rail = l.rails[0] ?? 'x402';
  const downstream =
    l.endpoint.transport === 'stdio' ? l.endpoint.command : `npx -y mcp-remote ${l.endpoint.url}`;
  return NextResponse.json(
    {
      slug: l.slug,
      name: l.name,
      description: l.description,
      price_cents: l.price_cents,
      rails: l.rails,
      tools: l.tools,
      docs_url: l.docs_url,
      attestation_url: l.attestation_url,
      verified_at: l.verified_at,
      live_proven_at: l.live_proven_at,
      integration: {
        test_mode: `npx -y @auths-dev/mcp wrap --scope paid.call --budget '$1' --ttl 30m --rail ${rail} --test-mode -- ${downstream}`,
        live: `npx -y @auths-dev/mcp wrap --scope paid.call --budget '$1' --ttl 30m --rail ${rail} -- ${downstream}`,
        // One runnable metered call, priced from the listing itself:
        // amount_atomic is USDC 6-decimals (price_cents × 10_000).
        example_call: {
          method: 'tools/call',
          params: {
            name: l.tools[0]?.name ?? 'paid_call',
            arguments: {
              amount_atomic: Math.max(1, l.price_cents) * 10_000,
              network: rail === 'x402' ? 'base-sepolia' : undefined,
            },
          },
        },
      },
      verify_spend: verifySpendCommand(l),
    },
    { headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
