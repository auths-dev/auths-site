import Link from 'next/link';
import { InkTerminal, Prompt, Dim, Allow, Deny } from '@auths/ledger-ui';
import { getLiveListings, type Rail } from '@/lib/listings';
import { ListingBadges } from '@/components/badges';

function cents(c: number): string {
  return `$${(c / 100).toFixed(2)}`;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ rail?: string }>;
}) {
  const { rail } = await searchParams;
  const railFilter = rail === 'x402' || rail === 'stripe' ? (rail as Rail) : undefined;
  const listings = await getLiveListings(railFilter);

  return (
    <div>
      <section className="px-6 pt-36 pb-16 sm:pt-44">
        <div className="mx-auto max-w-5xl">
          <p className="rise font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
            Auths Market
          </p>
          <h1 className="rise rise-d1 mt-6 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Sell tool calls. Buy them bounded.
          </h1>
          <p className="rise rise-d2 mt-8 max-w-xl text-lg leading-8 text-ink-soft">
            Paid MCP endpoints with proven prices. Sellers meter per call over
            Stripe or on-chain USDC; buying agents pay under a hard budget;
            growth is credited only when this market witnesses it.
          </p>
          <div className="rise rise-d3 mt-10 flex flex-wrap items-center gap-5">
            <Link
              href="/sell"
              className="rounded-sm bg-seal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-seal-deep"
            >
              Sell an endpoint
            </Link>
            <a
              href="#browse"
              className="font-mono text-sm text-ink-soft underline decoration-rule underline-offset-4 transition-colors hover:text-ink"
            >
              Browse verified endpoints
            </a>
          </div>

          <div className="rise-flat mt-14 max-w-3xl">
            <InkTerminal label="a bounded buyer, metered per call" tag="test-mode">
              <Dim># wrap any listed endpoint with your own budget</Dim>
              <Prompt>
                npx -y @auths-dev/mcp wrap --scope paid.call --budget &apos;$1&apos; --rail x402
                --test-mode -- &lt;listed endpoint&gt;
              </Prompt>
              <Allow>search $0.03 → allowed · spent $0.03 / $1.00</Allow>
              <Deny>search $1.40 → usage-cap-exceeded · refused</Deny>
              <Dim># the refusal happens at YOUR gateway — the seller is never invoked</Dim>
            </InkTerminal>
          </div>
        </div>
      </section>

      <section id="browse" className="scroll-mt-24 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <h2 className="font-display text-3xl font-medium tracking-tight text-ink">
              Verified endpoints
            </h2>
            <div className="flex gap-3 font-mono text-[13px]">
              {[
                { label: 'all', href: '/#browse', active: !railFilter },
                { label: 'x402', href: '/?rail=x402#browse', active: railFilter === 'x402' },
                { label: 'stripe', href: '/?rail=stripe#browse', active: railFilter === 'stripe' },
              ].map((f) => (
                <Link
                  key={f.label}
                  href={f.href}
                  className={f.active ? 'text-ink' : 'text-ink-faint hover:text-ink'}
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="mt-8 rounded-lg border border-rule p-8">
              <p className="text-base leading-7 text-ink-soft">
                No live listings{railFilter ? ` on ${railFilter}` : ''} yet.
                Every listing here has survived the prober — it lists real
                tools at a re-derived price or it doesn&apos;t appear.{' '}
                <Link href="/sell" className="text-seal hover:text-seal-deep">
                  Be the first
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {listings.map((l) => (
                <Link
                  key={l.id}
                  href={`/e/${l.slug}`}
                  className="group rounded-lg border border-rule p-5 transition-colors hover:border-seal/50"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-xl font-medium text-ink transition-colors group-hover:text-seal-deep">
                      {l.name}
                    </span>
                    <span className="shrink-0 font-mono text-sm text-ink">
                      {cents(l.price_cents)}/call
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink-soft">
                    {l.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <ListingBadges listing={l} />
                    <span className="font-mono text-[11px] text-ink-faint">
                      {l.rails.join(' + ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <p className="mt-8 max-w-2xl font-mono text-[12px] leading-5 text-ink-faint">
            Verified means our prober was the listing&apos;s first test-mode
            customer: it listed the tools, made a bounded call, and re-derived
            the price from the seller&apos;s own signed receipts.
          </p>
        </div>
      </section>
    </div>
  );
}
