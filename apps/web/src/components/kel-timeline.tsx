'use client';

import { motion, AnimatePresence } from 'motion/react';

interface KelTimelineProps {
  chain: object[];
}

function getEventType(event: Record<string, unknown>, index: number): string {
  if (index === 0) return 'Inception';
  if (typeof event['type'] === 'string') return event['type'];
  if (typeof event['event_type'] === 'string') return event['event_type'];
  return 'Interaction';
}

function getEventTimestamp(event: Record<string, unknown>): string | null {
  const ts = event['timestamp'] ?? event['created_at'] ?? event['issued_at'];
  if (typeof ts === 'string') {
    try {
      return new Date(ts).toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
    } catch {
      return ts;
    }
  }
  return null;
}

function getEventSummary(event: Record<string, unknown>): string | null {
  if (typeof event['device_public_key'] === 'string') {
    return `Device Key: ${String(event['device_public_key']).slice(0, 16)}…`;
  }
  if (typeof event['subject'] === 'string') {
    return `Subject: ${String(event['subject']).slice(0, 32)}…`;
  }
  if (typeof event['issuer'] === 'string') {
    return `Issuer: ${String(event['issuer']).slice(0, 32)}…`;
  }
  return null;
}

export function KelTimeline({ chain }: KelTimelineProps) {
  if (chain.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        No events found in the attestation chain.
      </p>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-500">
        Cryptographic Timeline
      </h2>
      <ol className="relative space-y-0">
        <AnimatePresence>
          {chain.map((rawEvent, index) => {
            const event = rawEvent as Record<string, unknown>;
            const isFirst = index === 0;
            const isLast = index === chain.length - 1;
            const eventType = getEventType(event, index);
            const timestamp = getEventTimestamp(event);
            const summary = getEventSummary(event);

            return (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.25, ease: 'easeOut' }}
                className="relative flex gap-5 pb-6"
              >
                {/* Vertical line */}
                {!isLast && (
                  <div className="absolute left-[9px] top-5 bottom-0 w-px bg-[var(--border)]" />
                )}

                {/* Node */}
                <div className="relative mt-0.5 flex-shrink-0">
                  {isFirst ? (
                    <div className="h-5 w-5 rounded-full border-2 border-[var(--accent-verified)] bg-[var(--accent-verified-dim)] flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-verified)]" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-zinc-700 bg-[var(--background)]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <span
                      className={`text-sm font-medium ${
                        isFirst ? 'text-white' : 'text-zinc-300'
                      }`}
                    >
                      {eventType}
                    </span>
                    <span className="flex-shrink-0 text-xs text-zinc-600">
                      Seq: {index}
                    </span>
                  </div>
                  {timestamp && (
                    <p className="mt-0.5 font-mono text-xs text-zinc-500">
                      {timestamp}
                    </p>
                  )}
                  {summary && (
                    <p className="mt-1 font-mono text-xs text-zinc-600 truncate">
                      {summary}
                    </p>
                  )}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </div>
  );
}
