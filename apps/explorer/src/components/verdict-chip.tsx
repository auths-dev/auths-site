import { Check, X, AlertTriangle, Circle } from 'lucide-react';

export type VerdictTone = 'ok' | 'deny' | 'warn' | 'neutral';

const TONE: Record<
  VerdictTone,
  { cls: string; Icon: typeof Check }
> = {
  ok: { cls: 'border-seal/40 bg-seal/10 text-seal-deep', Icon: Check },
  deny: { cls: 'border-deny/40 bg-deny/10 text-deny', Icon: X },
  warn: { cls: 'border-amber-500/40 bg-amber-500/10 text-amber-700', Icon: AlertTriangle },
  neutral: { cls: 'border-rule bg-paper-deep/40 text-ink-faint', Icon: Circle },
};

/**
 * A verdict chip — the same paper-and-ink vocabulary as auths.dev. `deny` is the
 * only red on the page. A chip never asserts on its own: it renders a value the
 * browser verifier already computed. Any `commit`-family code shown here is
 * asserted against the conformance manifest at build time (scripts/check-explorer.mjs).
 */
export function VerdictChip({
  tone,
  label,
  title,
}: {
  tone: VerdictTone;
  label: string;
  title?: string;
}) {
  const { cls, Icon } = TONE[tone];
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium ${cls}`}
    >
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  );
}
