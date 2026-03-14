'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Avatar from 'boring-avatars';
import { fetchNamespaceInfo } from '@/lib/api/registry';
import { registryKeys } from '@/lib/queries/registry';
import { truncateMiddle, formatRelativeTime } from '@/lib/format';
import { CopyButton } from '@/components/copy-button';

interface AuthorizedPublishersProps {
  ecosystem: string;
  packageName: string;
}

export function AuthorizedPublishers({ ecosystem, packageName }: AuthorizedPublishersProps) {
  const { data, isLoading } = useQuery({
    queryKey: registryKeys.namespace(ecosystem, packageName),
    queryFn: ({ signal }) => fetchNamespaceInfo(ecosystem, packageName, signal),
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
        <h2 className="mb-4 font-mono text-sm font-semibold text-zinc-200">
          Authorized Publishers
        </h2>
        <div className="animate-pulse space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-zinc-800" />
          ))}
        </div>
      </section>
    );
  }

  if (!data) return null;

  const { owner_did, delegates } = data;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
      <div className="mb-4 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
          <path d="M15.5 7.5l-7 7" />
          <path d="M21 2l-2 2m-6.5 6.5 2 2L21 6" />
          <path d="M3 22l2-2m6.5-6.5-2-2L3 18" />
        </svg>
        <h2 className="font-mono text-sm font-semibold text-zinc-200">
          Authorized Publishers
        </h2>
      </div>

      <div className="space-y-2">
        {/* Owner */}
        <div className="flex items-center gap-3 rounded-lg border border-zinc-800/50 px-3 py-2">
          <div className="shrink-0 overflow-hidden rounded-full">
            <Avatar size={24} name={owner_did} variant="beam" />
          </div>
          <Link
            href={`/registry/identity/${encodeURIComponent(owner_did)}`}
            className="font-mono text-xs text-zinc-300 transition-colors hover:text-emerald-400 hover:underline"
          >
            {truncateMiddle(owner_did, 32)}
          </Link>
          <CopyButton text={owner_did} />
          <span className="ml-auto rounded-full border border-emerald-800/30 bg-emerald-950/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            Owner
          </span>
        </div>

        {/* Delegates */}
        {delegates.map((d) => (
          <div
            key={d.delegate_did}
            className="flex items-center gap-3 rounded-lg border border-zinc-800/50 px-3 py-2"
          >
            <div className="shrink-0 overflow-hidden rounded-full">
              <Avatar size={24} name={d.delegate_did} variant="beam" />
            </div>
            <Link
              href={`/registry/identity/${encodeURIComponent(d.delegate_did)}`}
              className="font-mono text-xs text-zinc-300 transition-colors hover:text-emerald-400 hover:underline"
            >
              {truncateMiddle(d.delegate_did, 32)}
            </Link>
            <CopyButton text={d.delegate_did} />
            <span className="ml-auto text-[10px] text-zinc-600">
              {formatRelativeTime(d.granted_at)}
            </span>
          </div>
        ))}

        {delegates.length === 0 && (
          <p className="py-2 text-center font-mono text-xs text-zinc-600">
            Only the namespace owner can publish to this package
          </p>
        )}
      </div>
    </section>
  );
}
