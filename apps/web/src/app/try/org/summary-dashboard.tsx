'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/auth-context';
import { fetchOrgStatus } from '@/lib/api/registry';
import { registryKeys } from '@/lib/queries/registry';

interface SummaryDashboardProps {
  orgDid: string;
  orgName: string;
}

export function SummaryDashboard({ orgDid, orgName }: SummaryDashboardProps) {
  const { auth } = useAuth();

  const { data: status } = useQuery({
    queryKey: registryKeys.orgStatus(orgDid),
    queryFn: ({ signal }) => fetchOrgStatus(orgDid, auth?.token ?? '', signal),
    enabled: !!auth?.token,
    refetchInterval: 10_000,
  });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-4">&#10003;</div>
        <h3 className="text-xl font-semibold text-zinc-100 mb-2">
          {orgName} is set up
        </h3>
        <p className="text-sm text-zinc-400">
          Your organization is live on the Auths network.
        </p>
      </div>

      {status && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-zinc-100">{status.member_count}</p>
            <p className="text-xs text-zinc-500 mt-1">Members</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-zinc-100">{status.pending_invites}</p>
            <p className="text-xs text-zinc-500 mt-1">Pending invites</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className={`text-2xl font-bold ${status.signing_policy_enabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {status.signing_policy_enabled ? 'On' : 'Off'}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Signing policy</p>
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <Link
          href={`/registry/org/${encodeURIComponent(orgDid)}`}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
        >
          View on registry
        </Link>
        <Link
          href="/registry"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
        >
          Explore the registry
        </Link>
      </div>
    </div>
  );
}
