'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { ChallengeAuth } from '@/components/challenge-auth';
import { CreateOrgCard } from './create-org-card';
import { InviteCard } from './invite-card';
import { PolicyCard } from './policy-card';
import { SummaryDashboard } from './summary-dashboard';

export function OrgFlow() {
  const { isAuthenticated } = useAuth();
  const [orgDid, setOrgDid] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [policySet, setPolicySet] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const handleOrgCreated = useCallback((did: string, name: string) => {
    setOrgDid(did);
    setOrgName(name);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            Authenticate to get started
          </h3>
          <p className="text-sm text-zinc-400 mb-4">
            You need an Auths identity to create an organization. Don&apos;t have one?{' '}
            <a href="/try?flow=individual" className="text-emerald-400 hover:text-emerald-300">
              Set up your individual identity first.
            </a>
          </p>
        </div>
        <ChallengeAuth />
      </div>
    );
  }

  if (showDashboard && orgDid && orgName) {
    return <SummaryDashboard orgDid={orgDid} orgName={orgName} />;
  }

  return (
    <div className="space-y-4">
      <CreateOrgCard orgDid={orgDid} onComplete={handleOrgCreated} />
      <InviteCard orgDid={orgDid} />
      <PolicyCard orgDid={orgDid} policySet={policySet} onComplete={() => setPolicySet(true)} />

      {orgDid && (
        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowDashboard(true)}
            className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
          >
            View dashboard
          </button>
        </div>
      )}
    </div>
  );
}
