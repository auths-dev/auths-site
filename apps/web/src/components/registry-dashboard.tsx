'use client';

import { NetworkPulse } from '@/components/network-pulse';
import { EcosystemGrid } from '@/components/ecosystem-grid';
import { AuditLedger } from '@/components/audit-ledger';
import type { RecentActivity } from '@/lib/api/registry';

interface RegistryDashboardProps {
  activity: RecentActivity | null;
  onSearch: (query: string) => void;
}

export function RegistryDashboard({ activity }: RegistryDashboardProps) {
  return (
    <div className="space-y-10">
      <NetworkPulse initialActivity={activity} />
      <EcosystemGrid />
      <AuditLedger />
    </div>
  );
}
