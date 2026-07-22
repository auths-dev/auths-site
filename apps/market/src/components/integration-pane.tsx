'use client';

import { useState } from 'react';
import { CodeBlock } from '@auths/ledger-ui';
import type { Listing } from '@/lib/listings';
import { downstreamToken, endpointCommand, isSelfFetching } from '@/lib/integration';

function cliSnippet(listing: Listing, testMode: boolean): string {
  const rail = listing.rails[0] ?? 'x402';
  return [
    `npx -y @auths-dev/mcp wrap --scope paid.call --budget '$1' --ttl 30m \\`,
    `  --rail ${rail}${testMode ? ' --test-mode' : ''} \\`,
    `  -- ${endpointCommand(listing)}`,
  ].join('\n');
}

function configSnippet(listing: Listing, testMode: boolean): string {
  const rail = listing.rails[0] ?? 'x402';
  const downstream = downstreamToken(listing).split(' ');
  const args = [
    '@auths-dev/mcp', 'wrap',
    '--scope', 'paid.call',
    '--budget', '$1',
    '--ttl', '30m',
    '--rail', rail,
    ...(testMode ? ['--test-mode'] : []),
    '--',
    ...downstream,
  ];
  // One argument per line, indented to sit inside the config object — long
  // wrap invocations stay readable and diffable in a real mcp.json.
  const argsJson = JSON.stringify(['-y', ...args], null, 2).replace(/\n/g, '\n  ');
  const block = `"${listing.slug}": {\n  "command": "npx",\n  "args": ${argsJson}\n}`;
  // A downstream the buyer must install first is never presented as if it runs
  // on paste — the config carries the raw command, prefixed with an install note.
  return isSelfFetching(listing)
    ? block
    : `// install ${listing.name} first (see the listing's docs link); the command below wraps the installed server\n${block}`;
}

/**
 * One-copy buyer integration: pick config-file or CLI form; test-mode is
 * the default tab — real money is a deliberate switch, here as everywhere.
 */
export function IntegrationPane({ listing }: { listing: Listing }) {
  const [form, setForm] = useState<'config' | 'cli'>('config');
  const [mode, setMode] = useState<'test' | 'live'>('test');

  const code =
    form === 'config' ? configSnippet(listing, mode === 'test') : cliSnippet(listing, mode === 'test');

  return (
    <div>
      <div className="flex items-center justify-between border-b border-rule">
        <div role="tablist" aria-label="Integration form" className="flex gap-1">
          {(['config', 'cli'] as const).map((f) => (
            <button
              key={f}
              role="tab"
              type="button"
              aria-selected={form === f}
              onClick={() => setForm(f)}
              className={`-mb-px rounded-t-sm border-b-2 px-3 py-1.5 font-mono text-[13px] transition-colors ${
                form === f ? 'border-seal text-ink' : 'border-transparent text-ink-faint hover:text-ink'
              }`}
            >
              {f === 'config' ? 'mcp.json' : 'CLI'}
            </button>
          ))}
        </div>
        <div role="tablist" aria-label="Payment mode" className="flex gap-1">
          {(['test', 'live'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`-mb-px rounded-t-sm border-b-2 px-3 py-1.5 font-mono text-[12px] transition-colors ${
                mode === m ? 'border-seal text-ink' : 'border-transparent text-ink-faint hover:text-ink'
              }`}
            >
              {m === 'test' ? 'test-mode (start here)' : 'live (real money)'}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-0 [&_pre]:!rounded-t-none">
        <CodeBlock language={form === 'config' ? 'json' : 'bash'} code={code} />
      </div>
      <p className="mt-2 font-mono text-[12px] leading-5 text-ink-faint">
        The budget is yours: the gateway refuses any call that would cross it
        — usage-cap-exceeded — before this endpoint is ever invoked.
      </p>
      {mode === 'test' ? (
        <p className="mt-2 font-mono text-[12px] leading-5 text-ink-faint">
          Test-mode uses sandbox rails — Stripe test + x402 base-sepolia. Without a
          funded wallet and facilitator it settles a <em>recorded fixture</em>, not an
          on-chain transaction: any tx hash you see is illustrative. To settle for real
          on base-sepolia, add <code>--custody-credential</code> + a facilitator URL
          (see the docs link on this listing).
        </p>
      ) : null}
    </div>
  );
}
