import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertOctagon, ServerOff } from 'lucide-react';
import { InkLink } from '@auths/ledger-ui';
import { resolveWitness } from '@/lib/transport/witness';
import { OfflineParity } from '@/components/offline-parity';
import { VerdictChip } from '@/components/verdict-chip';
import { truncateId } from '@/lib/format';

const DOCS = 'https://docs.auths.dev/mcp/witness-network';

interface PageParams {
  params: Promise<{ witness: string; seed: string }>;
  searchParams: Promise<{ witness?: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { witness, seed } = await params;
  return {
    title: `anchor ${truncateId(decodeURIComponent(seed))} — ${decodeURIComponent(witness)}`,
    description: `The latest co-signed anchor for seed ${decodeURIComponent(seed)}, and any duplicity evidence, as recorded by ${decodeURIComponent(witness)}.`,
  };
}

async function fetchJson(url: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000), next: { revalidate: 30 } });
    if (!res.ok) return null;
    const body = await res.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Pull a display value from an anchor object without assuming its full shape. */
function field(anchor: Record<string, unknown>, key: string): string | null {
  const v = anchor[key];
  if (v === undefined || v === null) return null;
  if (typeof v === 'object') return Array.isArray(v) ? `${v.length}` : JSON.stringify(v);
  return String(v);
}

export default async function AnchorsPage({ params, searchParams }: PageParams) {
  const { witness, seed } = await params;
  const { witness: override } = await searchParams;
  const decodedSeed = decodeURIComponent(seed);
  const decodedWitness = decodeURIComponent(witness);
  const resolved = resolveWitness(decodedWitness, override ?? null);

  if (!resolved) {
    return (
      <div className="min-h-screen px-6 pt-32 pb-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-3xl font-medium text-ink">Unknown witness</h1>
          <p className="mt-4 text-ink-soft">
            “{decodedWitness}” isn’t in the directory. Add{' '}
            <span className="font-mono">?witness=https://…</span> to point at any conformant witness.
          </p>
        </div>
      </div>
    );
  }

  const [anchorBody, dupBody] = await Promise.all([
    fetchJson(`${resolved.url}/v1/anchor/${encodeURIComponent(decodedSeed)}`),
    fetchJson(`${resolved.url}/v1/duplicity/${encodeURIComponent(decodedSeed)}`),
  ]);

  const anchor =
    anchorBody && typeof anchorBody.anchor === 'object'
      ? (anchorBody.anchor as Record<string, unknown>)
      : null;
  const duplicity = dupBody?.duplicity ?? null;
  const reachable = anchorBody !== null || dupBody !== null;

  const KNOWN = ['index', 'head', 'count', 'cumulative_cents', 'tier', 'threshold', 'witnesses'];

  return (
    <div className="min-h-screen px-6 pt-32 pb-24">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] text-ink-faint">
          <Link href="/" className="transition-colors hover:text-ink">
            explorer
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/w/${encodeURIComponent(resolved.fromDirectory ? resolved.name : decodedWitness)}`}
            className="transition-colors hover:text-ink"
          >
            {resolved.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">anchor</span>
        </nav>

        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Co-signed anchor
        </p>
        <h1 className="mt-4 break-all font-mono text-2xl font-medium text-ink" title={decodedSeed}>
          {decodedSeed}
        </h1>
        <p className="mt-2 font-mono text-[12px] text-ink-faint">
          as recorded by {resolved.name} · {resolved.url}
        </p>

        {/* Duplicity is the headline: a signed contradiction is the whole point. */}
        {duplicity ? (
          <div className="mt-10 rounded-sm border border-deny/40 bg-deny/5 p-6">
            <p className="flex items-center gap-2 font-mono text-[13px] font-semibold text-deny">
              <AlertOctagon size={16} aria-hidden="true" />
              Duplicity proof recorded for this seed
            </p>
            <p className="mt-2 text-sm leading-6 text-ink-soft">
              This witness holds a self-contained, signed contradiction — two conflicting histories
              presented at the same index. Anyone can verify it offline; the explorer only surfaces
              it.
            </p>
            <pre className="mt-4 max-h-[24rem] overflow-auto rounded-sm bg-[#15130f] p-4 font-mono text-[11px] leading-relaxed text-stone-300">
              {JSON.stringify(duplicity, null, 2)}
            </pre>
          </div>
        ) : null}

        <div className="mt-10">
          {!reachable ? (
            <div className="rounded-sm border border-rule bg-paper-deep/40 p-6">
              <p className="flex items-center gap-2 font-mono text-[13px] font-medium text-ink">
                <ServerOff size={15} aria-hidden="true" />
                Anchor surface unreachable
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                This witness didn’t answer its anchor endpoints. It may be standing up or not serving
                the anchor role.
              </p>
            </div>
          ) : anchor ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl font-medium text-ink">Latest anchor</h2>
                {!duplicity ? <VerdictChip tone="ok" label="no duplicity recorded" /> : null}
              </div>
              <dl className="rounded-sm border border-rule bg-paper-deep/30 px-5 py-2">
                {KNOWN.map((k) => {
                  const val = field(anchor, k);
                  return val === null ? null : (
                    <div
                      key={k}
                      className="flex flex-col gap-1 border-b border-rule/60 py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:gap-4"
                    >
                      <dt className="w-40 shrink-0 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                        {k.replace(/_/g, ' ')}
                      </dt>
                      <dd className="min-w-0 break-all font-mono text-[12px] text-ink">{val}</dd>
                    </div>
                  );
                })}
              </dl>
              <details className="rounded-sm border border-rule bg-paper-deep/20 p-4">
                <summary className="cursor-pointer font-mono text-[12px] text-ink-soft">
                  full anchor JSON (as reported — cross-check offline below)
                </summary>
                <pre className="mt-3 max-h-[24rem] overflow-auto font-mono text-[11px] leading-relaxed text-ink-soft">
                  {JSON.stringify(anchor, null, 2)}
                </pre>
              </details>
              <p className="font-mono text-[11px] text-ink-faint">
                Cosignature quorum shown as reported by the witness. Recompute it against the
                KEL-anchored witness set offline — the command is below.
              </p>
            </div>
          ) : (
            <p className="text-ink-soft">No anchor recorded for this seed yet.</p>
          )}
        </div>

        <div className="mt-14 space-y-6">
          <OfflineParity
            label="the same anchor, without this page"
            lines={[
              {
                comment: 'the witness’s latest co-signed anchor for this seed',
                cmd: `curl -s '${resolved.url}/v1/anchor/${decodedSeed}' | jq`,
              },
              {
                comment: 'any recorded duplicity proof for this seed',
                cmd: `curl -s '${resolved.url}/v1/duplicity/${decodedSeed}' | jq`,
              },
            ]}
          />
          <div className="flex flex-wrap gap-6">
            <InkLink href={`${DOCS}/anchor-your-attestation`}>Anchor your attestation</InkLink>
            <InkLink href={`${DOCS}/verify-freshness`}>How verifiers read freshness</InkLink>
          </div>
        </div>
      </div>
    </div>
  );
}
