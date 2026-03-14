'use client';

import Link from 'next/link';
import Avatar from 'boring-avatars';
import { motion } from 'motion/react';
import { truncateMiddle } from '@/lib/format';
import type { IdentitySearchResult } from '@/lib/api/registry';

interface IdentitySearchResultsProps {
  results: IdentitySearchResult[];
}

export function IdentitySearchResults({ results }: IdentitySearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-sm text-zinc-600">
        <p>No identities found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">{results.length} identit{results.length === 1 ? 'y' : 'ies'} found</p>
      {results.map((result, i) => (
        <motion.div
          key={result.did}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: i * 0.04 }}
        >
          <Link
            href={`/registry/identity/${encodeURIComponent(result.did)}`}
            className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 transition-colors hover:border-emerald-500/40"
          >
            <div className="shrink-0 overflow-hidden rounded-full">
              <Avatar size={32} name={result.did} variant="beam" />
            </div>
            <div className="min-w-0 flex-1">
              {result.namespace && (
                <p className="text-sm font-medium text-white">@{result.namespace}</p>
              )}
              <p className="truncate font-mono text-xs text-emerald-400">
                {truncateMiddle(result.did, 40)}
              </p>
            </div>
            {result.platform && (
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-500">
                {result.platform}
              </span>
            )}
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
