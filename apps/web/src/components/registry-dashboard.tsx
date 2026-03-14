'use client';

import { NetworkStatsBar } from '@/components/network-stats-bar';
import { EcosystemGrid } from '@/components/ecosystem-grid';
import { LiveNetworkActivity } from '@/components/live-network-activity';

interface RegistryDashboardProps {
  onSearch: (query: string) => void;
}

export function RegistryDashboard(_props: RegistryDashboardProps) {
  return (
    <div className="space-y-10">
      {/* <NetworkStatsBar /> */}
      <EcosystemGrid />
      <LiveNetworkActivity />
    </div>
  );
}
