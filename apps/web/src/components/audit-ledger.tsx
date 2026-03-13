'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { fetchAuditFeed } from '@/lib/api/registry';
import type { AuditEntry, AuditEventType } from '@/lib/api/registry';
import { formatRelativeTime, truncateMiddle } from '@/lib/format';

const EVENT_CONFIG: Record<
  AuditEventType,
  { label: string; dotClass: string }
> = {
  device_bound: { label: 'DEVICE', dotClass: 'bg-sky-400' },
  device_revoked: { label: 'REVOKE', dotClass: 'bg-red-400' },
  namespace_claimed: { label: 'NAMESPACE', dotClass: 'bg-violet-400' },
  org_member_added: { label: 'ORG', dotClass: 'bg-teal-400' },
};

function formatTarget(entry: AuditEntry): string {
  if (entry.package_name) return entry.package_name;
  if (entry.target) return truncateMiddle(entry.target, 24);
  return '';
}

function entryKey(entry: AuditEntry, index: number): string {
  return `${entry.event_type}-${entry.actor_did}-${entry.occurred_at}-${index}`;
}

export function AuditLedger() {
  const [, setTick] = useState(0);

  const { data } = useQuery({
    queryKey: ['audit-feed'],
    queryFn: () => fetchAuditFeed(),
    refetchInterval: 10_000,
  });

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const entries = data?.entries ?? [];
  const logSize = data?.log_size;
  const hasCheckpoint = data?.checkpoint_hash != null;

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
            Public Audit Log
          </h2>
        </div>

        {logSize != null && (
          <span className="rounded-full border border-zinc-700 bg-zinc-900/60 px-2.5 py-0.5 font-mono text-xs text-zinc-400">
            {logSize.toLocaleString()} entries
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="py-8 text-center font-mono text-xs text-zinc-600">
          Waiting for log entries...
        </p>
      ) : (
        <div className="relative max-h-[420px] overflow-y-auto">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b from-zinc-950/50 to-transparent" />
          <div className="space-y-0.5">
            <AnimatePresence initial={false}>
              {entries.map((entry, i) => {
                const config = EVENT_CONFIG[entry.event_type];
                const target = formatTarget(entry);

                return (
                  <motion.div
                    key={entryKey(entry, i)}
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

                    <span className="text-zinc-300">
                      {truncateMiddle(entry.actor_did, 24)}
                    </span>

                    {target && (
                      <span className="text-zinc-500">{target}</span>
                    )}

                    {entry.log_sequence != null && (
                      <span className="ml-auto shrink-0 text-zinc-700">
                        #{entry.log_sequence}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-4 bg-gradient-to-t from-zinc-950/50 to-transparent" />
        </div>
      )}
    </section>
  );
}
