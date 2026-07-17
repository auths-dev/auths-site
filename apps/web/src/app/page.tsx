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
