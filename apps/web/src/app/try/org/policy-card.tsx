'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { setOrgPolicy } from '@/lib/api/registry';
import { CopyCommand } from '@/components/copy-command';
import { TaskCard } from './task-card';

interface PolicyCardProps {
  orgDid: string | null;
  policySet: boolean;
  onComplete: () => void;
}

export function PolicyCard({ orgDid, policySet, onComplete }: PolicyCardProps) {
  const { auth } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = policySet ? 'complete' : 'not-started';

  const handleSetPolicy = useCallback(async () => {
    if (!auth || !orgDid) return;
    setSubmitting(true);
    setError(null);
    try {
      await setOrgPolicy(orgDid, true, auth.token);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set signing policy');
    } finally {
      setSubmitting(false);
    }
  }, [auth, orgDid, onComplete]);

  const commands = orgDid
    ? `auths git setup\nauths signers sync --org "${orgDid}"\ngit config commit.gpgsign true`
    : 'auths git setup\nauths signers sync --org "<org-did>"\ngit config commit.gpgsign true';

  return (
    <TaskCard
      title="Set Signing Policy"
      description={policySet ? 'All commits must be signed' : 'Require signed commits from org members'}
      status={status}
      disabled={!orgDid}
    >
      <div className="space-y-4">
        <CopyCommand command={commands} label="Run in each repository:" />

        <p className="text-sm text-zinc-400">
          Then enable the org-wide policy:
        </p>

        {error && (
          <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSetPolicy}
          disabled={submitting || !orgDid}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Enabling...' : 'Require all commits to be signed'}
        </button>
      </div>
    </TaskCard>
  );
}
