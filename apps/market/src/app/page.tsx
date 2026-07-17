import { InkTerminal, Prompt, Dim, Allow, Deny } from '@auths/ledger-ui';

/**
 * Placeholder home proving the scaffold renders the ledger end to end.
 * The real directory home (US-010) replaces this.
 */
export default function HomePage() {
  return (
    <section className="px-6 pt-36 pb-24 sm:pt-44">
      <div className="mx-auto max-w-5xl">
        <p className="rise font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Auths Market
        </p>
        <h1 className="rise rise-d1 mt-6 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Sell tool calls. Buy them bounded.
        </h1>
        <p className="rise rise-d2 mt-8 max-w-xl text-lg leading-8 text-ink-soft">
          Paid MCP endpoints with proven prices. Sellers meter per call; buying agents pay under
          a hard budget; every cent re-derives from signed receipts.
        </p>

        <div className="rise-flat mt-14 max-w-3xl">
          <InkTerminal label="a bounded buyer, metered per call" tag="test-mode">
            <Dim># wrap the listed endpoint with your own budget</Dim>
            <Prompt>
              npx -y @auths-dev/mcp wrap --scope paid.call --budget &apos;$1&apos; --rail x402
              --test-mode -- npx -y @example/paid-tool
            </Prompt>
            <Allow>tool.call $0.03 → allowed · spent $0.03 / $1.00</Allow>
            <Deny>tool.call $1.40 → usage-cap-exceeded · refused</Deny>
          </InkTerminal>
        </div>
      </div>
    </section>
  );
}
