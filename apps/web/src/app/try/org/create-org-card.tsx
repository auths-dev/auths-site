'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { createOrg } from '@/lib/api/registry';
import { TaskCard } from './task-card';

interface CreateOrgCardProps {
  orgDid: string | null;
  onComplete: (orgDid: string, orgName: string) => void;
}

export function CreateOrgCard({ orgDid, onComplete }: CreateOrgCardProps) {
  const { auth } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [manualDid, setManualDid] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = orgDid ? 'complete' : 'not-started';

  const handleCreate = useCallback(async () => {
    if (!auth || !orgName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createOrg(orgName.trim(), auth.token);
      onComplete(res.org_did, res.display_name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setSubmitting(false);
    }
  }, [auth, orgName, onComplete]);

  const handleManualDid = useCallback(() => {
    if (!manualDid.trim()) return;
    onComplete(manualDid.trim(), 'Existing org');
  }, [manualDid, onComplete]);

  return (
    <TaskCard
      title="Create Organization"
      description={orgDid ? `Created: ${orgDid.slice(0, 24)}...` : 'Set up a new org with a name and DID'}
      status={status}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="org-name" className="block text-sm text-zinc-400 mb-1">Organization name</label>
          <input
            id="org-name"
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="my-team"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleCreate}
          disabled={submitting || !orgName.trim()}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating...' : 'Create organization'}
        </button>

        <div className="border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={() => setShowManual((s) => !s)}
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            {showManual ? 'Hide' : 'I already have an org'}
          </button>
          {showManual && (
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="manual-org-did" className="block text-sm text-zinc-400 mb-1">Paste your org DID</label>
                <input
                  id="manual-org-did"
                  type="text"
                  value={manualDid}
                  onChange={(e) => setManualDid(e.target.value)}
                  placeholder="did:keri:E..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 font-mono text-sm focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <button
                type="button"
                onClick={handleManualDid}
                disabled={!manualDid.trim()}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 disabled:opacity-50"
              >
                Use existing org
              </button>
            </div>
          )}
        </div>
      </div>
    </TaskCard>
  );
}
