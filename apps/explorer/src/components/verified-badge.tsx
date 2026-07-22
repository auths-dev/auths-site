import { ShieldCheck, Loader2, ShieldAlert } from 'lucide-react';

export type VerifyState = 'verifying' | 'verified' | 'failed';

/**
 * The "verified in your browser" affordance (plan X1.4). It makes the trust
 * story legible: the server sent bytes, and the WASM verifier in THIS browser
 * recomputed them. On failure it names what failed rather than hiding it.
 */
export function VerifiedBadge({
  state,
  detail,
}: {
  state: VerifyState;
  detail?: string;
}) {
  if (state === 'verifying') {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-[12px] text-ink-faint">
        <Loader2 size={13} className="animate-spin" aria-hidden="true" />
        verifying in your browser…
      </span>
    );
  }
  if (state === 'failed') {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-[12px] text-deny">
        <ShieldAlert size={13} aria-hidden="true" />
        verification failed{detail ? ` — ${detail}` : ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[12px] text-seal-deep">
      <ShieldCheck size={13} aria-hidden="true" />
      verified in your browser{detail ? ` · ${detail}` : ''}
    </span>
  );
}
