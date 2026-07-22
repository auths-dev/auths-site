import { truncateId } from '@/lib/format';
import { seqToNumber, type KelEvent } from '@/lib/verify/types';

const EVENT_LABEL: Record<KelEvent['t'], string> = {
  icp: 'inception',
  dip: 'delegated inception',
  rot: 'rotation',
  drt: 'delegated rotation',
  ixn: 'interaction',
};

const isEstablishment = (t: KelEvent['t']) => t !== 'ixn';

/**
 * The KEL timeline (plan X2.2) — one row per event, newest key state at the
 * bottom. Every value shown here came out of the array the browser verifier
 * just validated; this component only formats it.
 */
export function KelTimeline({ events }: { events: KelEvent[] }) {
  return (
    <ol className="relative space-y-0">
      {events.map((e, idx) => {
        const seq = seqToNumber(e.s);
        const establishment = isEstablishment(e.t);
        const last = idx === events.length - 1;
        return (
          <li key={e.d} className="relative flex gap-4 pb-6 last:pb-0">
            {/* rail */}
            <div className="flex flex-col items-center">
              <span
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                  establishment ? 'bg-seal' : 'border border-rule bg-paper'
                }`}
                aria-hidden="true"
              />
              {!last ? <span className="w-px flex-1 bg-rule" aria-hidden="true" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-[13px] font-medium text-ink">#{seq}</span>
                <span
                  className={`font-mono text-[11px] uppercase tracking-wider ${
                    establishment ? 'text-seal-deep' : 'text-ink-faint'
                  }`}
                >
                  {EVENT_LABEL[e.t]}
                </span>
                <span className="truncate font-mono text-[11px] text-ink-faint" title={e.d}>
                  {truncateId(e.d)}
                </span>
              </div>
              {establishment && e.k ? (
                <p className="mt-1.5 font-mono text-[11px] text-ink-soft">
                  {e.k.length} signing key{e.k.length === 1 ? '' : 's'}
                  {e.kt ? ` · threshold ${typeof e.kt === 'string' ? e.kt : 'weighted'}` : ''}
                  {e.n && e.n.length ? ` · ${e.n.length} next-key commitment${e.n.length === 1 ? '' : 's'}` : ''}
                </p>
              ) : null}
              {e.t === 'ixn' && Array.isArray(e.a) && e.a.length ? (
                <p className="mt-1.5 font-mono text-[11px] text-ink-soft">
                  anchors {e.a.length} seal{e.a.length === 1 ? '' : 's'}
                </p>
              ) : null}
              {e.di ? (
                <p className="mt-1.5 font-mono text-[11px] text-ink-faint" title={e.di}>
                  delegated by {truncateId(e.di)}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
