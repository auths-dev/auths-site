import { truncateId } from '@/lib/format';
import type { KeyState } from '@/lib/verify/types';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-rule/60 py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-40 shrink-0 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
        {label}
      </dt>
      <dd className="min-w-0 font-mono text-[12px] text-ink">{children}</dd>
    </div>
  );
}

function thresholdText(t: KeyState['threshold']): string {
  return typeof t === 'string' ? t : 'weighted';
}

/**
 * The current key state (plan X2.2) — the verifier's output of replaying the
 * KEL. Rendered only inside a `verified` result, so every value here is
 * browser-computed, never asserted by the server.
 */
export function KeyStatePanel({ keyState }: { keyState: KeyState }) {
  const ks = keyState;
  return (
    <dl className="rounded-sm border border-rule bg-paper-deep/30 px-5 py-2">
      <Row label="sequence">
        #{ks.sequence}
        <span className="ml-2 text-ink-faint">tip {truncateId(ks.last_event_said)}</span>
      </Row>
      <Row label="current keys">
        <ul className="space-y-1">
          {ks.current_keys.map((k) => (
            <li key={k} title={k} className="truncate">
              {k}
            </li>
          ))}
        </ul>
        <span className="mt-1 block text-ink-faint">
          threshold {thresholdText(ks.threshold)} of {ks.current_keys.length}
        </span>
      </Row>
      <Row label="next commitment">
        {ks.is_abandoned || ks.next_commitment.length === 0 ? (
          <span className="text-deny">abandoned — no forward rotation possible</span>
        ) : (
          <span className="text-ink-soft">
            {ks.next_commitment.length} pre-rotated digest
            {ks.next_commitment.length === 1 ? '' : 's'} · threshold {thresholdText(ks.next_threshold)}
          </span>
        )}
      </Row>
      {ks.delegator ? (
        <Row label="delegator">
          <span title={ks.delegator}>{truncateId(ks.delegator)}</span>
        </Row>
      ) : null}
      <Row label="transferable">{ks.is_non_transferable ? 'no (ephemeral)' : 'yes'}</Row>
      {ks.backers.length ? (
        <Row label="witness backers">
          {ks.backers.length} · threshold {thresholdText(ks.backer_threshold)}
        </Row>
      ) : null}
      {ks.config_traits.length ? (
        <Row label="config">{ks.config_traits.join(', ')}</Row>
      ) : null}
    </dl>
  );
}
