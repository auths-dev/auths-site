'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'motion/react';
import { fetchNamespaceList } from '@/lib/api/registry';
import { registryKeys } from '@/lib/queries/registry';
import { truncateMiddle, formatRelativeTime } from '@/lib/format';
import { EcosystemIcon } from '@/components/icons/brand-icon';
import { BackToRegistry } from '@/components/back-to-registry';

interface BrowseClientProps {
  ecosystem: string;
}

export function BrowseClient({ ecosystem }: BrowseClientProps) {
  const [filter, setFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: registryKeys.namespaceBrowse(ecosystem),
    queryFn: () => fetchNamespaceList(ecosystem),
    staleTime: 120_000,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!filter) return data.namespaces;
    const q = filter.toLowerCase();
    return data.namespaces.filter(
      (ns) =>
        ns.package_name.toLowerCase().includes(q) ||
        ns.owner_did.toLowerCase().includes(q),
    );
  }, [data, filter]);

  return (
    <>
      <BackToRegistry />

      <div className="mb-6 flex items-center gap-3">
        <EcosystemIcon ecosystem={ecosystem} size={32} className="text-zinc-300" />
        <h1 className="text-2xl font-bold text-white">
          Browse {ecosystem.charAt(0).toUpperCase() + ecosystem.slice(1)} Packages
        </h1>
      </div>

      {/* Search filter */}
      <div className="mb-6">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={`Filter ${ecosystem} packages...`}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-2.5 font-mono text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-emerald-500/40"
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
              <div className="h-4 w-40 rounded bg-zinc-800" />
              <div className="ml-auto h-3 w-24 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {data && filtered.length === 0 && (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-sm text-zinc-600">
          {filter ? (
            <p>No packages matching &ldquo;{filter}&rdquo;</p>
          ) : (
            <>
              <p>No packages claimed in {ecosystem} yet</p>
              <p className="text-xs text-zinc-700">Be the first to sign a {ecosystem} package with Auths</p>
            </>
          )}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          <p className="mb-4 text-xs text-zinc-500">
            {filtered.length} package{filtered.length !== 1 ? 's' : ''}
            {filter ? ' matching' : ' claimed'}
          </p>

          {filtered.map((ns, i) => (
            <motion.div
              key={`${ns.ecosystem}:${ns.package_name}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i, 20) * 0.03 }}
            >
              <Link
                href={`/registry/package/${encodeURIComponent(ns.ecosystem)}/${encodeURIComponent(ns.package_name)}`}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 font-mono text-sm transition-colors hover:border-emerald-500/40"
              >
                <span className="text-white">{ns.ecosystem}:{ns.package_name}</span>
                <span className="ml-auto text-xs text-zinc-600">
                  {truncateMiddle(ns.owner_did, 20)}
                </span>
                <span className="text-xs text-zinc-700">
                  {formatRelativeTime(ns.claimed_at)}
                </span>
              </Link>
            </motion.div>
          ))}

          {data && data.has_more && !filter && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  // Load more would re-fetch with cursor — for now just show what we have
                }}
                className="rounded-lg border border-border bg-muted-bg px-6 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
