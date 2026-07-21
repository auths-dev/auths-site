import Link from 'next/link';
import { ArrowUpRight, ShieldCheck, FileSearch } from 'lucide-react';
import { SectionMark, InkLink } from '@auths/ledger-ui';
import { witnessDirectory } from '@auths/witnesses';
import { probeWitness } from '@auths/witnesses';
import { SearchBox } from '@/components/search-box';
import { OfflineParity } from '@/components/offline-parity';

const DOCS = 'https://docs.auths.dev/mcp/witness-network';

/** Live witness health refreshes once a minute. */
export const revalidate = 60;

export default async function HomePage() {
  const witnesses = await Promise.all(witnessDirectory().map(probeWitness));
  const options = witnesses.map((w) => ({ name: w.name, live: w.liveness.state === 'up' }));
  const firstLiveUrl =
    witnesses.find((w) => w.liveness.state === 'up')?.url ?? 'https://network.auths.dev';

  return (
    <div className="min-h-screen">
      {/* Hero + search */}
      <section className="px-6 pt-36 pb-16 sm:pt-44">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
            The network explorer
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl">
            The witness network, verified in your browser.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-ink-soft">
            A lens over every conformant witness. Point it at an identifier and the explorer
            fetches the raw key history, receipts, and anchors — then the verifier recomputes every
            SAID, replays every chain, and checks every receipt quorum{' '}
            <em>in this browser</em> before a single thing renders as valid.
          </p>
          <div className="mt-10 max-w-3xl">
            <SearchBox witnesses={options} />
          </div>
          <p className="mt-4 flex items-center gap-2 font-mono text-[12px] text-ink-faint">
            <ShieldCheck size={13} aria-hidden="true" />
            Nothing you search is trusted to the server — it only moves bytes.
          </p>
        </div>
      </section>

      {/* The directory */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="01" title="Browse the federation." id="directory" />
          <p className="mt-10 max-w-3xl text-lg leading-8 text-ink-soft">
            The explorer runs against any witness that passes the conformance harness — the
            federation, not the node, is the product. Pick one to browse its roster, or paste a
            stranger&rsquo;s witness URL into any member page with{' '}
            <span className="font-mono text-base text-ink">?witness=https://…</span>.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left font-mono text-[13px]">
              <thead>
                <tr className="border-b border-rule text-[11px] uppercase tracking-wider text-ink-faint">
                  <th className="py-2 pr-4 font-medium">witness</th>
                  <th className="py-2 pr-4 font-medium">operator</th>
                  <th className="py-2 pr-4 font-medium">jurisdiction</th>
                  <th className="py-2 pr-4 font-medium">status</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {witnesses.map((w) => {
                  const live = w.liveness.state === 'up';
                  return (
                    <tr key={w.name} className="border-b border-rule/60 text-ink-soft last:border-0">
                      <td className="py-2.5 pr-4 text-ink">{w.name}</td>
                      <td className="py-2.5 pr-4">{w.operator}</td>
                      <td className="py-2.5 pr-4">{w.jurisdiction}</td>
                      <td className="py-2.5 pr-4">
                        {live ? (
                          <span className="inline-flex items-center gap-1.5 text-seal-deep">
                            <span className="h-1.5 w-1.5 rounded-full bg-seal" /> up
                          </span>
                        ) : w.liveness.state === 'unreachable' ? (
                          <span className="text-deny">unreachable</span>
                        ) : (
                          <span className="text-ink-faint">standing up</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {w.url ? (
                          <Link
                            href={`/w/${encodeURIComponent(w.name)}`}
                            className="inline-flex items-center gap-1 border-b border-seal/40 pb-0.5 text-seal transition-colors hover:border-seal hover:text-seal-deep"
                          >
                            browse <ArrowUpRight size={12} />
                          </Link>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap gap-6">
            <InkLink href="https://auths.dev/network">The full directory on auths.dev</InkLink>
            <InkLink href={`${DOCS}/onboard-as-a-seller`}>Run a witness · get listed</InkLink>
          </div>
        </div>
      </section>

      {/* Evidence drop-zone CTA */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="02" title="Or bring your own evidence." id="evidence" />
          <div className="mt-10 grid gap-10 lg:grid-cols-[6fr_5fr]">
            <div className="space-y-6 text-lg leading-8 text-ink-soft">
              <p>
                Have an <span className="font-mono text-base text-ink">activity.json</span>, a
                presentation, or an evidence bundle already? Drop it in — it never leaves your
                machine. The verifier checks it entirely client-side and shows you exactly what it
                proves, the same result <span className="font-mono text-base text-ink">auths verify</span>{' '}
                gives at a terminal.
              </p>
              <Link
                href="/evidence"
                className="inline-flex items-center gap-2 rounded-sm bg-ink px-6 py-3 font-mono text-[13px] font-medium text-paper transition-opacity hover:opacity-90"
              >
                <FileSearch size={15} aria-hidden="true" /> Open the evidence drop-zone
              </Link>
            </div>
            <OfflineParity
              label="the same claim, without this page"
              lines={[
                {
                  comment: 'mirror a witness’s key histories locally',
                  cmd: `git fetch '${firstLiveUrl}' '+refs/auths/kel/*:refs/auths/kel/*'`,
                },
                { comment: 'verify a commit against its pinned root', cmd: 'auths verify <commit>' },
                { comment: 'verify a co-signed anchor', cmd: 'auths anchor verify <seed>' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Trust note */}
      <section className="px-6 py-16 sm:pb-32">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="03" title="Why you can distrust this page." id="trust" />
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <p className="text-lg leading-8 text-ink-soft">
              The explorer&rsquo;s server is transport, never a verdict source. It fetches bytes and
              hands them to your browser; the WASM verifier recomputes SAIDs, replays chains, and
              checks signatures before any green state renders. A compromised explorer can{' '}
              <em>omit</em> — withhold an event, hide a receipt — which the freshness labels and
              receipt quorum surface. It cannot <em>forge</em>: the math runs on your side.
            </p>
            <p className="text-lg leading-8 text-ink-soft">
              This is the same property the node itself has, and it&rsquo;s why the node stays a
              small, dumb signer you check rather than a service you trust. Verdict vocabulary comes
              from the conformance manifest shipped in the SDK — the explorer never invents a
              verdict string. Everything here is a convenience over evidence you can re-check with
              published code.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-6">
            <InkLink href="https://github.com/auths-dev/auths">The verifier &amp; node source</InkLink>
            <InkLink href={`${DOCS}/verify-freshness`}>How verifiers read freshness</InkLink>
          </div>
        </div>
      </section>
    </div>
  );
}
