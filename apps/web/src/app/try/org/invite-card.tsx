'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { createInvite } from '@/lib/api/registry';
import type { InviteResponse } from '@/lib/api/registry';
import { CopyCommand } from '@/components/copy-command';
import { TaskCard } from './task-card';

interface InviteCardProps {
  orgDid: string | null;
}

export function InviteCard({ orgDid }: InviteCardProps) {
  const { auth } = useAuth();
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [expiresIn, setExpiresIn] = useState('7d');
  const [invites, setInvites] = useState<InviteResponse[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = invites.length > 0 ? 'complete' : 'not-started';

  const handleInvite = useCallback(async () => {
    if (!auth || !orgDid) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createInvite(orgDid, role, expiresIn, auth.token);
      setInvites((prev) => [res, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite');
    } finally {
      setSubmitting(false);
    }
  }, [auth, orgDid, role, expiresIn]);

  return (
    <TaskCard
      title="Invite Members"
      description={
        invites.length > 0
          ? `${invites.length} invite${invites.length > 1 ? 's' : ''} created`
          : 'Generate shareable invite links for your team'
      }
      status={status}
      disabled={!orgDid}
    >
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="invite-role" className="block text-sm text-zinc-400 mb-1">Role</label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="invite-expiry" className="block text-sm text-zinc-400 mb-1">Expires in</label>
            <select
              id="invite-expiry"
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="24h">24 hours</option>
              <option value="7d">7 days</option>
              <option value="30d">30 days</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleInvite}
          disabled={submitting || !orgDid}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creating invite...' : 'Create invite link'}
        </button>

        {invites.length > 0 && (
          <div className="space-y-3 pt-2">
            {invites.map((invite) => (
              <div key={invite.short_code} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-2">
                <CopyCommand command={`auths org join --code ${invite.short_code}`} />
                <p className="text-xs text-zinc-500">
                  Link: {invite.invite_url} &middot; Expires: {new Date(invite.expires_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </TaskCard>
  );
}
