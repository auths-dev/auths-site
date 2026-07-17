'use client';

import { useState, type ReactNode } from 'react';

/** Two-pane rail switcher (x402 / Stripe), test-mode content first inside each. */
export function RailTabs({ x402, stripe }: { x402: ReactNode; stripe: ReactNode }) {
  const [rail, setRail] = useState<'x402' | 'stripe'>('x402');

  return (
    <div>
      <div role="tablist" aria-label="Payment rail" className="flex gap-1 border-b border-rule">
        {(['x402', 'stripe'] as const).map((r) => (
          <button
            key={r}
            role="tab"
            type="button"
            aria-selected={rail === r}
            onClick={() => setRail(r)}
            className={`-mb-px rounded-t-sm border-b-2 px-3 py-1.5 font-mono text-[13px] transition-colors ${
              rail === r ? 'border-seal text-ink' : 'border-transparent text-ink-faint hover:text-ink'
            }`}
          >
            {r === 'x402' ? 'x402 / USDC' : 'Stripe'}
          </button>
        ))}
      </div>
      <div role="tabpanel" hidden={rail !== 'x402'}>
        {x402}
      </div>
      <div role="tabpanel" hidden={rail !== 'stripe'}>
        {stripe}
      </div>
    </div>
  );
}
