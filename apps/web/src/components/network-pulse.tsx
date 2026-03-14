'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { fetchActivityFeed } from '@/lib/api/registry';
import type { FeedEntry, ActivityFeedResponse } from '@/lib/api/registry';
import { formatRelativeTime, truncateMiddle } from '@/lib/format';

interface PulseEvent {
  id: string;
  kind: 'artifact' | 'identity';
  label: string;
  detail: string;
  timestamp: string;
  href: string;
}

function packageHref(packageName: string): string {
  const idx = packageName.indexOf(':');
  if (idx > 0) {
    const ecosystem = packageName.slice(0, idx);
    const name = packageName.slice(idx + 1);
    return `/registry/package/${encodeURIComponent(ecosystem)}/${name.split('/').map(encodeURIComponent).join('/')}`;
  }
  return `/registry/package/unknown/${encodeURIComponent(packageName)}`;
}

function feedEntriesToPulseEvents(entries: FeedEntry[]): PulseEvent[] {
  return entries
    .map((entry): PulseEvent | null => {
      if (entry.entry_type === 'attest') {
        const packageName = entry.metadata.package_name as string | undefined;
        if (!packageName) return null;
        return {
          id: `a-${entry.log_sequence}`,
          kind: 'artifact',
          label: packageName,
          detail: `verified by ${truncateMiddle(entry.actor_did, 24)}`,
          timestamp: entry.occurred_at,
          href: packageHref(packageName),
        };
      }
      if (entry.entry_type === 'register') {
        const namespace = entry.metadata.namespace as string | undefined;
        const platform = entry.metadata.platform as string | undefined;
        return {
          id: `i-${entry.log_sequence}`,
          kind: 'identity',
          label: namespace ? `@${namespace}` : truncateMiddle(entry.actor_did, 24),
          detail: platform ? `joined via ${platform}` : 'identity created',
          timestamp: entry.occurred_at,
          href: `/registry/identity/${encodeURIComponent(entry.actor_did)}`,
        };
      }
      return null;
    })
    .filter((e): e is PulseEvent => e !== null)
    .slice(0, 10);
}

function ShieldCheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-emerald-400"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-sky-400"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}

interface NetworkPulseProps {
  initialActivity: ActivityFeedResponse | null;
}

export function NetworkPulse({ initialActivity }: NetworkPulseProps) {
  const [, setTick] = useState(0);

  const { data } = useQuery({
    queryKey: ['network-pulse'],
    queryFn: () => fetchActivityFeed({ limit: 20 }),
    refetchInterval: 15_000,
    initialData: initialActivity ?? undefined,
  });

  // Re-render every 15s to update relative times
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const events = data ? feedEntriesToPulseEvents(data.entries) : [];

  if (events.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Live Network Activity
        </h2>
      </div>

      <div className="space-y-2 overflow-hidden">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: 8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Link
                href={event.href}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted-bg px-4 py-3 transition-colors hover:border-zinc-500"
              >
                {event.kind === 'artifact' ? <ShieldCheckIcon /> : <UserPlusIcon />}
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-sm text-white">{event.label}</span>
                  <span className="ml-2 text-xs text-zinc-500">{event.detail}</span>
                </div>
                <time
                  dateTime={event.timestamp}
                  className="shrink-0 text-xs text-muted"
                  title={new Date(event.timestamp).toISOString()}
                >
                  {formatRelativeTime(event.timestamp)}
                </time>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
