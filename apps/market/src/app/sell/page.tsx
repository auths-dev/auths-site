import { InkTerminal, Prompt, Dim } from '@auths/ledger-ui';
import { auth } from '@/lib/auth/supabase-github';
import { RailTabs } from '@/components/rail-tabs';
import { SellForm } from './sell-form';

export const metadata = { title: 'Sell an endpoint' };

export default async function SellPage() {
  await auth.requireSeller();

  return (
    <section className="px-6 pt-36 pb-24">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Sell an endpoint
        </p>
        <h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
          From MCP server to verified listing.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-ink-soft">
          Three steps. Your listing goes live only after our prober has been
          its first test-mode customer and re-derived your price from your
          own receipts.
        </p>

        <h2 className="mt-14 flex items-baseline gap-4 font-display text-2xl font-medium text-ink">
          <span className="font-mono text-sm font-semibold tracking-widest text-seal">01</span>
          Wrap your server
        </h2>
        <p className="mt-3 text-base leading-7 text-ink-soft">
          The gateway meters every call and writes the signed receipts your
          listing is verified against. Test mode first — prove the flow with
          no money, then drop the flag.
        </p>
        <div className="mt-5">
          <RailTabs
            x402={
              <InkTerminal label="wrap — x402 / USDC" tag="test-mode first" copy="npx -y @auths-dev/mcp wrap --scope paid.call --budget '$5' --ttl 12h --rail x402 --test-mode --custody-credential X402_WALLET_PRIVATE_KEY --custody-credential X402_FACILITATOR_URL -- <your MCP server command>">
                <Dim># base-sepolia while you prove the flow; drop --test-mode to go live</Dim>
                <Prompt>export X402_WALLET_PRIVATE_KEY=0x...</Prompt>
                <Prompt>export X402_FACILITATOR_URL=https://...</Prompt>
                <Prompt>
                  npx -y @auths-dev/mcp wrap --scope paid.call --budget &apos;$5&apos; --ttl 12h \
                </Prompt>
                <Prompt className="pl-4">
                  --rail x402 --test-mode --custody-credential X402_WALLET_PRIVATE_KEY \
                </Prompt>
                <Prompt className="pl-4">
                  --custody-credential X402_FACILITATOR_URL -- &lt;your MCP server command&gt;
                </Prompt>
              </InkTerminal>
            }
            stripe={
              <InkTerminal label="wrap — Stripe" tag="test-mode first" copy="npx -y @auths-dev/mcp wrap --scope paid.call --budget '$5' --ttl 12h --rail stripe --test-mode --custody-credential STRIPE_API_KEY -- <your MCP server command>">
                <Dim># sk_test while you prove the flow; drop --test-mode to go live</Dim>
                <Prompt>export STRIPE_API_KEY=sk_test_...</Prompt>
                <Prompt>
                  npx -y @auths-dev/mcp wrap --scope paid.call --budget &apos;$5&apos; --ttl 12h \
                </Prompt>
                <Prompt className="pl-4">
                  --rail stripe --test-mode --custody-credential STRIPE_API_KEY \
                </Prompt>
                <Prompt className="pl-4">-- &lt;your MCP server command&gt;</Prompt>
              </InkTerminal>
            }
          />
        </div>

        <h2 className="mt-14 flex items-baseline gap-4 font-display text-2xl font-medium text-ink">
          <span className="font-mono text-sm font-semibold tracking-widest text-seal">02</span>
          Publish your spend log
        </h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-ink-soft">
          Your earnings page renders only numbers re-derived from your signed
          receipts, so the log must be publicly fetchable — a raw-file URL in
          a git repo or any static host works. The receipts are signed;
          the transport needs no trust.
        </p>

        <h2 className="mt-14 flex items-baseline gap-4 font-display text-2xl font-medium text-ink">
          <span className="font-mono text-sm font-semibold tracking-widest text-seal">03</span>
          List it
        </h2>
        <div className="mt-5">
          <SellForm />
        </div>

        <h2 className="mt-14 flex items-baseline gap-4 font-display text-2xl font-medium text-ink">
          <span className="font-mono text-sm font-semibold tracking-widest text-seal">04</span>
          Agents list here too
        </h2>
        <p className="mt-3 text-base leading-7 text-ink-soft">
          The whole flow above is an API: mint an identity, issue yourself a
          market:sell credential, take a single-use challenge, present — then
          create the listing over the authenticated write API. No dashboard, no
          human. Same test-mode-first rule as everything else on this page.
        </p>
        <div className="mt-5">
          <InkTerminal
            label="the agent recipe"
            tag="four commands"
            copy={'auths init --non-interactive --profile developer\nSAID=$(auths --json credential issue --issuer main --to "$(auths --json id show | jq -r .data.controller_did)" --cap market:sell | jq -r .data.credential_said)\nNONCE=$(curl -sX POST https://market.auths.dev/api/v1/challenge | jq -r .nonce)\nauths --json credential present --subject main --said "$SAID" --audience market.auths.dev --nonce "$NONCE" --with-evidence'}
          >
            <Dim># 1 — a signing identity for the agent</Dim>
            <Prompt>auths init --non-interactive --profile developer</Prompt>
            <Dim># 2 — issue yourself the market:sell credential</Dim>
            <Prompt>
              SAID=$(auths --json credential issue --issuer main --to &quot;$(auths --json id
              show | jq -r .data.controller_did)&quot; --cap market:sell | jq -r
              .data.credential_said)
            </Prompt>
            <Dim># 3 — a single-use challenge from the market</Dim>
            <Prompt>NONCE=$(curl -sX POST https://market.auths.dev/api/v1/challenge | jq -r .nonce)</Prompt>
            <Dim># 4 — present; POST the authorization + evidence to /api/v1/listings</Dim>
            <Prompt>
              auths --json credential present --subject main --said &quot;$SAID&quot; --audience
              market.auths.dev --nonce &quot;$NONCE&quot; --with-evidence
            </Prompt>
          </InkTerminal>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-soft">
          Or let MCP drive it: the directory server{' '}
          <span className="font-mono">@auths-dev/market-directory</span> exposes{' '}
          <span className="font-mono">create_listing</span> and{' '}
          <span className="font-mono">my_listings</span> tools that run this exact
          challenge → presentation → write flow for you.
        </p>
      </div>
    </section>
  );
}
