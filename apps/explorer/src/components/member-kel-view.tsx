'use client';

import { AlertTriangle, ServerOff, Wrench } from 'lucide-react';
import { useVerifiedKel } from '@/lib/verify/use-verified-kel';
import { VerifiedBadge } from '@/components/verified-badge';
import { FetchStampLine } from '@/components/fetch-stamp';
import { KeyStatePanel } from '@/components/key-state-panel';
import { KelTimeline } from '@/components/kel-timeline';
import { LiveHeadCheck } from '@/components/live-head-check';

function Notice({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof AlertTriangle;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-rule bg-paper-deep/40 p-6">
      <p className="flex items-center gap-2 font-mono text-[13px] font-medium text-ink">
        <Icon size={15} aria-hidden="true" />
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-ink-soft">{children}</p>
    </div>
  );
}

/**
 * The member KEL view — the client island where verification actually happens.
 * It renders ONLY what came back verified; every other status is honest about
 * what it could and couldn't establish.
 */
export function MemberKelView({
  witness,
  prefix,
  witnessUrl,
  directUrl,
}: {
  witness: string;
  prefix: string;
  /** A `?witness=` override URL, forwarded to the server KEL-read route. */
  witnessUrl?: string;
  /** The resolved witness base URL, used for the browser-direct live-tip check. */
  directUrl?: string;
}) {
  const kel = useVerifiedKel(witness, prefix, witnessUrl);

  if (kel.status === 'loading') {
    return (
      <div className="space-y-4">
        <VerifiedBadge state="verifying" />
        <div className="h-40 animate-pulse rounded-sm border border-rule bg-paper-deep/30" />
      </div>
    );
  }

  if (kel.status === 'degraded') {
    return (
      <Notice icon={Wrench} title="This witness’s server KEL read isn’t available yet">
        {kel.reason}. Verification still runs entirely in your browser — this only affects how the
        bytes are fetched. Try browser-direct mode once the witness ships CORS, or use the offline
        command below.
      </Notice>
    );
  }

  if (kel.status === 'unreachable') {
    return (
      <Notice icon={ServerOff} title="Couldn’t fetch this member’s history">
        {kel.reason}. The explorer only moves bytes — an unreachable witness renders as unreachable,
        never as a fabricated result.
      </Notice>
    );
  }

  if (kel.status === 'failed') {
    return (
      <div className="space-y-5">
        <VerifiedBadge state="failed" detail={kel.error} />
        <Notice icon={AlertTriangle} title="The browser verifier rejected these bytes">
          The server returned a KEL, but recomputing it here failed: <span className="font-mono">{kel.error}</span>.
          That is exactly the signal to trust — a mirror that tampered or truncated cannot pass the
          math on your side. The raw events are shown below <em>unverified</em>.
        </Notice>
        {kel.events.length ? (
          <div className="rounded-sm border border-deny/30 p-5">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-wider text-deny">
              unverified — shown for inspection only
            </p>
            <KelTimeline events={kel.events} />
          </div>
        ) : null}
        {kel.stamp ? <FetchStampLine stamp={kel.stamp} /> : null}
      </div>
    );
  }

  // verified
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <VerifiedBadge state="verified" detail={`replayed ${kel.events.length} events`} />
        {kel.stamp ? <FetchStampLine stamp={kel.stamp} /> : null}
      </div>
      {directUrl ? (
        <LiveHeadCheck witnessUrl={directUrl} prefix={prefix} verifiedSeq={kel.keyState.sequence} />
      ) : null}
      <KeyStatePanel keyState={kel.keyState} />
      <div>
        <h3 className="mb-4 font-display text-xl font-medium text-ink">Key event log</h3>
        <KelTimeline events={kel.events} />
      </div>
      <p className="font-mono text-[11px] text-ink-faint">
        served from the {kel.source} registry backend · re-verified in your browser
      </p>
    </div>
  );
}
