import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, ServerOff } from 'lucide-react';
import { InkLink } from '@auths/ledger-ui';
import { resolveWitness } from '@/lib/transport/witness';
import { SearchBox } from '@/components/search-box';
import { OfflineParity } from '@/components/offline-parity';
import { truncateId } from '@/lib/format';

const DOCS = 'https://docs.auths.dev/witness-network';

interface RosterEntry {
  prefix: string;
  sequence: number;
  said: string;
}

interface PageParams {
  params: Promise<{ witness: string }>;
  searchParams: Promise<{ witness?: string }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { witness } = await params;
  return {
    title: `${decodeURIComponent(witness)} — roster`,
    description: `Members held by ${decodeURIComponent(witness)}, each with a KEL you can re-verify in your browser.`,
  };
}

async function fetchRoster(url: string): Promise<RosterEntry[] | null> {
  try {
    const res = await fetch(`${url}/v1/registry/roster`, {
      signal: AbortSignal.timeout(5_000),
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (!Array.isArray(body)) return null;
    return body.filter(
      (e): e is RosterEntry => e && typeof e.prefix === 'string' && typeof e.sequence === 'number',
    );
  } catch {
    return null;
  }
}

export default async function WitnessPage({ params, searchParams }: PageParams) {
  const { witness } = await params;
  const { witness: override } = await searchParams;
  const decodedWitness = decodeURIComponent(witness);
  const resolved = resolveWitness(decodedWitness, override ?? null);

  if (!resolved) {
    return (
      <div className="min-h-screen px-6 pt-32 pb-24">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-3xl font-medium text-ink">Unknown witness</h1>
          <p className="mt-4 text-ink-soft">
            “{decodedWitness}” isn’t in the directory. Point at any conformant witness with{' '}
            <span className="font-mono">?witness=https://…</span>, or{' '}
            <Link href="/" className="text-seal hover:text-seal-deep">
              browse the federation
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  const roster = await fetchRoster(resolved.url);
  const segment = resolved.fromDirectory ? resolved.name : decodedWitness;

  return (
    <div className="min-h-screen px-6 pt-32 pb-24">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-8 flex items-center gap-2 font-mono text-[12px] text-ink-faint">
          <Link href="/" className="transition-colors hover:text-ink">
            explorer
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">{resolved.name}</span>
        </nav>

        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Witness roster
        </p>
        <h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-ink">
          {resolved.name}
        </h1>
        <p className="mt-2 font-mono text-[12px] text-ink-faint">{resolved.url}</p>

        <div className="mt-8 max-w-2xl">
          <SearchBox witnesses={[{ name: segment, live: true }]} />
        </div>

        <div className="mt-12">
          {roster === null ? (
            <div className="rounded-sm border border-rule bg-paper-deep/40 p-6">
              <p className="flex items-center gap-2 font-mono text-[13px] font-medium text-ink">
                <ServerOff size={15} aria-hidden="true" />
                Roster unavailable
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                This witness didn’t answer <span className="font-mono">/v1/registry/roster</span>.
                It may be standing up, or not serving the registry role. You can still resolve a
                specific member by prefix above.
              </p>
            </div>
          ) : roster.length === 0 ? (
            <p className="text-ink-soft">
              This witness holds no members yet — an empty but honest roster.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left font-mono text-[13px]">
                <thead>
                  <tr className="border-b border-rule text-[11px] uppercase tracking-wider text-ink-faint">
                    <th className="py-2 pr-4 font-medium">member prefix</th>
                    <th className="py-2 pr-4 font-medium">tip seq</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {roster.map((m) => (
                    <tr
                      key={m.prefix}
                      className="border-b border-rule/60 text-ink-soft last:border-0"
                    >
                      <td className="py-2.5 pr-4 text-ink" title={m.prefix}>
                        {truncateId(m.prefix, 16, 8)}
                      </td>
                      <td className="py-2.5 pr-4">#{m.sequence}</td>
                      <td className="py-2.5">
                        <Link
                          href={`/w/${encodeURIComponent(segment)}/m/${encodeURIComponent(m.prefix)}${
                            override ? `?witness=${encodeURIComponent(override)}` : ''
                          }`}
                          className="inline-flex items-center gap-1 border-b border-seal/40 pb-0.5 text-seal transition-colors hover:border-seal hover:text-seal-deep"
                        >
                          verify <ArrowUpRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-14 space-y-6">
          <OfflineParity
            label="the same roster, without this page"
            lines={[
              {
                comment: 'the witness roster (prefix + tip per member)',
                cmd: `curl -s '${resolved.url}/v1/registry/roster' | jq`,
              },
              {
                comment: 'mirror every member key history locally',
                cmd: `git fetch '${resolved.url}' '+refs/auths/kel/*:refs/auths/kel/*'`,
              },
            ]}
          />
          <div className="flex flex-wrap gap-6">
            <InkLink href={`${DOCS}/users/onboard-as-a-seller`}>Add your identity to a witness</InkLink>
            <InkLink href="/">The witness directory</InkLink>
          </div>
        </div>
      </div>
    </div>
  );
}
