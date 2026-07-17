import type { Metadata } from 'next';

import {
  LedgerHero,
  LedgerAudit,
  LedgerBound,
  LedgerWrap,
  LedgerRevoke,
  LedgerHowItWorks,
  LedgerRotation,
  LedgerCTA,
} from '@/components/landing-ledger';

const HOME_TITLE = 'Auths — Your agent can’t exceed its budget. And you can prove it.';
const HOME_DESC =
  'One command in front of any MCP server bounds an AI agent to a scope, a budget, and an expiry — and leaves a signed receipt anyone can verify offline, without trusting the operator.';

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESC,
  // Override the site-wide supply-chain framing for the homepage share card, so a
  // link to auths.dev leads with the bounded agent — the one thing the page sells.
  openGraph: { title: HOME_TITLE, description: HOME_DESC },
  twitter: { title: HOME_TITLE, description: HOME_DESC },
};

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-paper text-ink selection:bg-seal/20">
      {/* One product above the fold: the bounded agent. Everything below is proof,
          ordered by the next objection a skeptic raises. */}
      <LedgerHero />
      <LedgerAudit /> {/* 01 — Don't trust us. Check. */}
      <LedgerBound /> {/* 02 — It bounds, it doesn't just watch. */}
      <LedgerWrap /> {/* 03 — Works with what you have. */}
      <LedgerRevoke /> {/* 04 — Revoke and it stops. */}
      <LedgerHowItWorks /> {/* 05 — How it works. */}
      <LedgerRotation /> {/* 06 — Why the receipt survives a rotation. */}
      <LedgerCTA />
    </main>
  );
}
