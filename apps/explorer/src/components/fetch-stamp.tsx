'use client';

import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { relativeAge } from '@/lib/format';
import type { FetchStamp } from '@/lib/transport/stamp';

/**
 * "fetched 3s ago from auths-network.fly.dev" (plan X3.2). Renders the mirror's age
 * honestly and keeps ticking, so a stale mirror reads as stale. This is about
 * TRANSPORT freshness (when the explorer server last pulled bytes) — it is not a
 * verdict and not the witness-network freshness label, which the verifier
 * computes from receipts.
 */
export function FetchStampLine({ stamp }: { stamp: FetchStamp }) {
  const [now, setNow] = useState(stamp.fetchedAt);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, []);

  const stale = now - stamp.fetchedAt > 120_000;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${
        stale ? 'text-amber-700' : 'text-ink-faint'
      }`}
      title={`${stamp.source} · ${stamp.url}`}
    >
      <History size={11} aria-hidden="true" />
      mirror fetched {relativeAge(stamp.fetchedAt, now)} from {stamp.witness}
      {stale ? ' · stale' : ''}
    </span>
  );
}
