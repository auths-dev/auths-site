'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { fetchInviteDetails } from '@/lib/api/registry';
import { RegistryApiError } from '@/lib/api/registry';
import { registryKeys } from '@/lib/queries/registry';
import { CopyCommand } from '@/components/copy-command';

interface JoinClientProps {
  code: string;
}

export function JoinClient({ code }: JoinClientProps) {
  const { data: invite, isLoading, error } = useQuery({
    queryKey: registryKeys.invite(code),
    queryFn: ({ signal }) => fetchInviteDetails(code, signal),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-zinc-800" />
        <div className="h-32 animate-pulse rounded-xl bg-zinc-900" />
      </div>
    );
  }

  if (error) {
    const is404 = error instanceof RegistryApiError && error.status === 404;
    return (
      <div className={`rounded-xl border p-6 text-center ${
        is404
          ? 'border-red-500/30 bg-red-500/10'
          : 'border-yellow-500/30 bg-yellow-500/10'
      }`}>
        <h2 className={`text-lg font-semibold mb-2 ${is404 ? 'text-red-400' : 'text-yellow-400'}`}>
          {is404 ? 'Invalid invite code' : 'Connection error'}
        </h2>
        <p className="text-sm text-zinc-400">
          {is404
            ? 'This invite code does not exist. Ask the organization admin for a new link.'
            : 'Could not reach the server. Please try again.'}
        </p>
      </div>
    );
  }

  if (!invite) return null;

  if (invite.status === 'expired') {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
        <h2 className="text-lg font-semibold text-yellow-400 mb-2">Invite expired</h2>
        <p className="text-sm text-zinc-400">
          This invite expired on {new Date(invite.expires_at).toLocaleDateString()}.
          Ask the organization admin for a new one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          Join {invite.display_name}
        </h1>
        <p className="text-zinc-400">
          You&apos;ve been invited to join as a <span className="text-emerald-400 font-medium">{invite.role}</span>.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 space-y-4">
        <CopyCommand
          command={`auths org join --code ${code}`}
          label="Run this in your terminal:"
        />
        <p className="text-xs text-zinc-500">
          Expires: {new Date(invite.expires_at).toLocaleDateString()}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 text-center">
        <p className="text-sm text-zinc-400 mb-3">
          Don&apos;t have Auths yet?
        </p>
        <Link
          href={`/try?flow=individual&redirect=${encodeURIComponent(`/join/${code}`)}`}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
        >
          Set up your identity first
        </Link>
      </div>
    </div>
  );
}
