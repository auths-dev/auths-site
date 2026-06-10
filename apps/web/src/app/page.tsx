import {
  LedgerHero,
  LedgerMachineAuth,
  LedgerAgents,
  LedgerGovernance,
  LedgerSupplyChain,
  LedgerCompare,
  LedgerCTA,
  LedgerFooter,
} from '@/components/landing-ledger';

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-paper text-ink selection:bg-seal/20">
      <LedgerHero />
      <LedgerMachineAuth />
      <LedgerAgents />
      <LedgerGovernance />
      <LedgerSupplyChain />
      <LedgerCompare />
      <LedgerCTA />
      <LedgerFooter />
    </main>
  );
}
