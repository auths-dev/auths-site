'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { fetchActivityFeed } from '@/lib/api/registry';
import type { FeedEntry, ActivityFeedParams } from '@/lib/api/registry';
import { formatRelativeTime, truncateMiddle } from '@/lib/format';
import { ACTIVITY_EVENT_CONFIG } from '@/lib/activity-events';
import { useActivityWebSocket } from '@/hooks/use-activity-websocket';
import { registryKeys } from '@/lib/queries/registry';
import { entryDetail } from '@/lib/entry-detail';

/** Returns the link href for the actor DID. */
function actorHref(entry: FeedEntry): string {
  if (
    entry.entry_type === 'org_create' ||
    entry.entry_type === 'org_add_member' ||
    entry.entry_type === 'org_revoke_member'
  ) {
    return `/registry/org/${encodeURIComponent(entry.actor_did)}`;
  }
  return `/registry/identity/${encodeURIComponent(entry.actor_did)}`;
}

const INITIAL_LOG_CAP = 10;

export function LiveNetworkActivity() {
  const [showAll, setShowAll] = useState(false);
  const [cursor, setCursor] = useState<number | undefined>();
  const [, setTick] = useState(0);

  const params: ActivityFeedParams | undefined = cursor
    ? { before: cursor }
    : undefined;

  const { data } = useQuery({
    queryKey: registryKeys.activityFeed(params),
    queryFn: () => fetchActivityFeed(params),
    refetchInterval: 30_000,
  });

  // WebSocket for real-time updates
  const { connectionStatus } = useActivityWebSocket();

  // Tick for relative time updates
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const allEntries = data?.entries ?? [];
  const entries = showAll ? allEntries : allEntries.slice(0, INITIAL_LOG_CAP);
  const hasMore = allEntries.length > INITIAL_LOG_CAP;
  const logSize = data?.log_size;
  const hasCheckpoint = data?.checkpoint_hash != null;
  const nextCursor = data?.next_cursor;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                hasCheckpoint ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                hasCheckpoint ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <h2 className="font-mono text-sm font-semibold text-zinc-200">
            Network Activity
          </h2>
        </div>

        {logSize != null && (
          <span className="rounded-full border border-zinc-700 bg-zinc-900/60 px-2.5 py-0.5 font-mono text-xs text-zinc-400">
            {logSize.toLocaleString()} entries
          </span>
        )}
      </div>

      {connectionStatus === 'reconnecting' && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          <span className="font-mono text-xs text-amber-400">
            Live updates paused — reconnecting...
          </span>
        </div>
      )}

      {allEntries.length === 0 ? (
        <p className="py-8 text-center font-mono text-sm text-zinc-500">
          No records found
        </p>
      ) : (
        <>
          <div
            className={`relative ${showAll ? 'max-h-[420px] overflow-y-auto' : ''}`}
          >
            {showAll && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b from-zinc-950/50 to-transparent" />
            )}
            <div className="space-y-0.5">
              <AnimatePresence initial={false}>
                {entries.map((entry, i) => {
                  const config = ACTIVITY_EVENT_CONFIG[entry.entry_type];
                  const { didLink, packageLink, text } = entryDetail(entry);
                  const hasDetail = didLink || packageLink || text;

                  return (
                    <motion.div
                      key={`${entry.log_sequence}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{
                        duration: 0.25,
                        delay: i * 0.03,
                        ease: 'easeOut',
                      }}
                      className="flex items-center gap-2 rounded px-2 py-1 font-mono text-xs hover:bg-zinc-900/60"
                    >
                      <time
                        dateTime={entry.occurred_at}
                        className="w-14 shrink-0 text-zinc-600"
                        title={new Date(entry.occurred_at).toISOString()}
                      >
                        {formatRelativeTime(entry.occurred_at)}
                      </time>

                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dotClass}`}
                      />

                      <span className="w-20 shrink-0 text-zinc-500">
                        [{config.label}]
                      </span>

                      <Link
                        href={actorHref(entry)}
                        className="cursor-pointer text-zinc-300 transition-colors hover:text-emerald-400 hover:underline"
                      >
                        {truncateMiddle(entry.actor_did, 24)}
                      </Link>

                      {didLink && (
                        <Link
                          href={didLink.href}
                          className="cursor-pointer text-zinc-500 transition-colors hover:text-emerald-400 hover:underline"
                        >
                          {didLink.label}
                        </Link>
                      )}
                      {packageLink && (
                        <Link
                          href={packageLink.href}
                          className="cursor-pointer text-zinc-500 transition-colors hover:text-emerald-400 hover:underline"
                        >
                          {packageLink.label}
                        </Link>
                      )}
                      {text && !didLink && !packageLink && (
                        <span className="text-zinc-500">{text}</span>
                      )}
                      {!hasDetail && (
                        <span className="truncate text-zinc-600" title={entry.summary}>
                          {entry.summary}
                        </span>
                      )}

                      <span className="ml-auto flex shrink-0 items-center gap-1.5">
                        {entry.merkle_included && (
                          <span
                            className="text-emerald-500"
                            title="Merkle included"
                          >
                            &#10003;
                          </span>
                        )}
                        {entry.is_genesis_phase && (
                          <span className="rounded bg-zinc-800 px-1 py-0.5 text-[10px] text-zinc-500">
                            genesis
                          </span>
                        )}
                        <span className="text-zinc-700">
                          #{entry.log_sequence}
                        </span>
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            {showAll && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-4 bg-gradient-to-t from-zinc-950/50 to-transparent" />
            )}
          </div>

          <div className="mt-4 flex justify-center gap-3">
            {hasMore && !showAll && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="rounded-lg border border-border bg-muted-bg px-6 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
              >
                View All ({allEntries.length})
              </button>
            )}
            {showAll && nextCursor != null && (
              <button
                type="button"
                onClick={() => setCursor(nextCursor)}
                className="rounded-lg border border-border bg-muted-bg px-6 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Load More
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
