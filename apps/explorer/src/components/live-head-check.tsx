'use client';

import { useEffect, useState } from 'react';
import { Radio, AlertTriangle } from 'lucide-react';
import { fetchHeadDirect } from '@/lib/transport/browser-direct';

type Result =
  | { kind: 'idle' }
  | { kind: 'match'; seq: number }
  | { kind: 'behind'; witnessSeq: number; verifiedSeq: number }
  | { kind: 'ahead'; witnessSeq: number; verifiedSeq: number };

/**
 * A live tip check in browser-direct mode (plan X3.3): after the KEL verifies,
 * ask the witness for its CURRENT head straight from the browser and compare.
 * This is the freshness/withholding signal — a mirror that served an old tip
 * shows up as "behind". Renders nothing until CORS makes the direct read
 * possible, so it lights up automatically once witnesses deploy W0.2.
 */
export function LiveHeadCheck({
  witnessUrl,
  prefix,
  verifiedSeq,
}: {
  witnessUrl: string;
  prefix: string;
  verifiedSeq: number;
}) {
  const [result, setResult] = useState<Result>({ kind: 'idle' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const head = await fetchHeadDirect(witnessUrl, prefix);
      if (cancelled || !head.ok || head.latestSeq === null) return;
      const w = head.latestSeq;
      if (w === verifiedSeq) setResult({ kind: 'match', seq: w });
      else if (w > verifiedSeq) setResult({ kind: 'behind', witnessSeq: w, verifiedSeq });
      else setResult({ kind: 'ahead', witnessSeq: w, verifiedSeq });
    })();
    return () => {
      cancelled = true;
    };
  }, [witnessUrl, prefix, verifiedSeq]);

  if (result.kind === 'idle') return null; // browser-direct not possible (or not yet back) — stay silent

  if (result.kind === 'match') {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-seal-deep">
        <Radio size={11} aria-hidden="true" />
        tip #{result.seq} matches the witness’s current head (checked browser-direct)
      </span>
    );
  }
  if (result.kind === 'behind') {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-amber-700">
        <AlertTriangle size={11} aria-hidden="true" />
        the witness now reports #{result.witnessSeq} &gt; your verified #{result.verifiedSeq} — the
        mirror is behind; re-resolve for the latest
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-faint">
      <Radio size={11} aria-hidden="true" />
      the witness reports #{result.witnessSeq}; your mirror verified #{result.verifiedSeq}
    </span>
  );
}
