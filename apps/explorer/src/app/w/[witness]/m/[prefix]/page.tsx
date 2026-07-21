import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { InkLink } from '@auths/ledger-ui';
import { resolveWitness } from '@/lib/transport/witness';
import { MemberKelView } from '@/components/member-kel-view';
import { OfflineParity } from '@/components/offline-parity';
import { truncateId } from '@/lib/format';

const DOCS = 'https://docs.auths.dev/witness-network';

interface PageParams {
  params: Promise<{ witness: string; prefix: string }>;
  searchParams: Promise<{ witness?: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { witness, prefix } = await params;
  return {
    title: `${truncateId(decodeURIComponent(prefix))} on ${decodeURIComponent(witness)}`,
    description: `The verified key event log for ${decodeURIComponent(prefix)}, recomputed in your browser from ${decodeURIComponent(witness)}'s registry.`,
  };
}

export default async function MemberPage({ params, searchParams }: PageParams) {
  const { witness, prefix } = await params;
  const { witness: override } = await searchParams;
  const decodedPrefix = decodeURIComponent(prefix);
  const decodedWitness = decodeURIComponent(witness);
  const resolved = resolveWitness(decodedWitness, override ?? null);

  return (
    <div className="min-h-screen px-6 pt-32 pb-24">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] text-ink-faint">
          <Link href="/" className="transition-colors hover:text-ink">
            explorer
          </Link>
          <span aria-hidden="true">/</span>
          {resolved ? (
            <Link
              href={`/w/${encodeURIComponent(resolved.fromDirectory ? resolved.name : decodedWitness)}`}
              className="transition-colors hover:text-ink"
            >
              {resolved.name}
            </Link>
          ) : (
            <span>{decodedWitness}</span>
          )}
          <span aria-hidden="true">/</span>
          <span className="text-ink">member</span>
        </nav>

        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Member key history
        </p>
        <h1
          className="mt-4 break-all font-mono text-2xl font-medium text-ink"
          title={decodedPrefix}
        >
          {decodedPrefix}
        </h1>
        {resolved ? (
          <p className="mt-2 font-mono text-[12px] text-ink-soft">
            as held by{' '}
            <span className="text-ink">{resolved.name}</span>
            {!resolved.fromDirectory ? ' (custom witness)' : ''} ·{' '}
            <span className="text-ink-faint">{resolved.url}</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-deny">
            Unknown witness “{decodedWitness}”. Pass a directory name, or add{' '}
            <span className="font-mono">?witness=https://…</span> to point at any conformant witness.
          </p>
        )}

        {resolved ? (
          <div className="mt-10">
            <MemberKelView
              witness={resolved.fromDirectory ? resolved.name : decodedWitness}
              prefix={decodedPrefix}
              witnessUrl={override ?? undefined}
              directUrl={resolved.url}
            />
          </div>
        ) : null}

        {resolved ? (
          <div className="mt-14 space-y-6">
            <h2 className="font-display text-2xl font-medium text-ink">Verify it yourself</h2>
            <p className="max-w-2xl text-base leading-7 text-ink-soft">
              This page is a convenience. The same key history validates offline with published
              code — no explorer, no trust in this server.
            </p>
            <OfflineParity
              label="the same key history, without this page"
              lines={[
                {
                  comment: 'mirror this witness’s key histories locally',
                  cmd: `git fetch '${resolved.url}' '+refs/auths/kel/*:refs/auths/kel/*'`,
                },
                {
                  comment: 'replay + structurally validate the KEL (SAIDs + chain linkage)',
                  cmd: `auths kel validate --did did:keri:${decodedPrefix}`,
                },
              ]}
            />
            <div className="flex flex-wrap gap-6 pt-2">
              <Link
                href={`/w/${encodeURIComponent(resolved.fromDirectory ? resolved.name : decodedWitness)}`}
                className="inline-flex items-center gap-1 border-b border-seal/40 pb-0.5 font-mono text-sm text-seal transition-colors hover:border-seal hover:text-seal-deep"
              >
                browse this witness’s roster <ArrowUpRight size={13} />
              </Link>
              <InkLink href={`${DOCS}/users/verify-an-anchored-attestation`}>
                How verifiers read freshness
              </InkLink>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
