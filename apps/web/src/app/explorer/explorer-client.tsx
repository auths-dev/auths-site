'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { resolveFromRepo } from '@/lib/resolver';
import { KelTimeline } from '@/components/kel-timeline';

interface ExplorerClientProps {
  initialRepo?: string;
}

export function ExplorerClient({ initialRepo }: ExplorerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState(initialRepo ?? '');

  // Sync input with URL
  useEffect(() => {
    const repo = searchParams.get('repo') ?? '';
    setInput(repo);
  }, [searchParams]);

  const repo = searchParams.get('repo') ?? '';

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['kel', repo],
    queryFn: () => resolveFromRepo(`https://${repo}`),
    enabled: !!repo,
    staleTime: 60_000,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    // Strip leading https:// if user pasted it
    const normalized = input.trim().replace(/^https?:\/\//, '');
    router.push(`/explorer?repo=${encodeURIComponent(normalized)}`);
  }

  return (
    <div className="space-y-8">
      {/* Search input */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="did:keri:EX4z9...a2b or github.com/user/repo"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-2.5 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-2.5 text-sm text-white transition-colors hover:border-zinc-500"
          aria-label="Search"
        >
          🔍
        </button>
      </form>

      {/* Divider */}
      {repo && (
        <div className="border-t border-[var(--border)]" />
      )}

      {/* States */}
      {!repo && (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-600">
          Enter a repository URL or DID to explore its identity chain.
        </div>
      )}

      {repo && isLoading && (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-zinc-900" />
          ))}
        </div>
      )}

      {repo && isError && (
        <div className="rounded-lg border border-red-900 bg-red-950/30 p-4 font-mono text-sm text-red-400">
          <p className="font-semibold">Resolution failed</p>
          <p className="mt-1 text-red-500/70">
            {error instanceof Error ? error.message : String(error)}
          </p>
          <p className="mt-2 text-zinc-600">repo: {repo}</p>
        </div>
      )}

      {repo && !isLoading && !isError && data && (
        <>
          {data.bundle === null ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted-bg)] p-6 text-sm text-zinc-500">
              No Auths identity found for{' '}
              <span className="font-mono text-zinc-400">{repo}</span>.
              <p className="mt-2 text-zinc-600">
                {data.error ?? 'No auths refs detected in this repository.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Identity header */}
              <div className="grid grid-cols-3 gap-4 border-b border-[var(--border)] pb-4 text-xs uppercase tracking-widest text-zinc-600">
                <span>Identity</span>
                <span>Status</span>
                <span>Last Event</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <span
                  className="truncate font-mono text-zinc-300"
                  title={data.bundle.identity_did}
                >
                  {data.bundle.identity_did.length > 24
                    ? `${data.bundle.identity_did.slice(0, 24)}…`
                    : data.bundle.identity_did}
                </span>
                <span className="flex items-center gap-1.5 text-[var(--accent-verified)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-verified)]" />
                  Active
                </span>
                <span className="text-zinc-400">
                  {data.bundle.attestation_chain.length > 0
                    ? new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
                    : '—'}
                </span>
              </div>

              {/* Timeline */}
              <KelTimeline chain={data.bundle.attestation_chain} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
