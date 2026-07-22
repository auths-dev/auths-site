import Link from 'next/link';
import { ArrowUpRight, ShieldCheck, FileSearch } from 'lucide-react';
import { SectionMark, InkLink } from '@auths/ledger-ui';
import { witnessDirectory } from '@auths/witnesses';
import { probeWitness } from '@auths/witnesses';
import { SearchBox } from '@/components/search-box';

const DOCS = 'https://docs.auths.dev/witness-network';

/** The hosted network offerings — everything that *proves* stays open and free; what's sold is operation. */
const CLOUD_TIERS = [
  {
    name: 'Anchoring',
    meter: 'metered by anchors / month',
    detail:
      'Submit your agents’ aggregates to a curated quorum that spans the diversity policy’s floors — distinct operators, jurisdictions, and clouds — and get back finalized, offline-checkable anchors.',
  },
  {
    name: 'Monitoring',
    meter: 'metered by seeds watched',
    detail:
      'A hosted watcher over the histories you care about: duplicity and withholding alerts the moment a fork or a silence appears, dashboards over the same open artifacts anyone can re-check.',
  },
  {
    name: 'Pinning',
    meter: 'metered by GiB-months',
    detail:
      'Ciphertext-only custody of your records keyed by (head, index), with availability proofs — and a signed non-response artifact if we ever fail to serve one. Honesty, contracted.',
  },
];

/** Live witness health refreshes once a minute. */
export const revalidate = 60;

export default async function HomePage() {
  const witnesses = await Promise.all(witnessDirectory().map(probeWitness));
  const options = witnesses.map((w) => ({ name: w.name, live: w.liveness.state === 'up' }));

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
            A window into the witness network. Give it an identifier and the explorer pulls that
            identity&rsquo;s records, then re-checks every one of them <em>in your browser</em>{' '}
            before showing anything as verified — so you never have to take the result on trust.
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
            The explorer works with any witness that meets the open standard — the network is the
            product, not any one node. Pick one below to browse the identities it holds, or open any
            node directly by its address at{' '}
            <span className="font-mono text-base text-ink">/node/&lt;address&gt;</span>.
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
                            href={`/node/${encodeURIComponent(w.name)}`}
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
            <InkLink href={`${DOCS}/operators/run-a-node`}>Run a witness · get listed</InkLink>
          </div>
        </div>
      </section>

      {/* Evidence drop-zone CTA */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="02" title="Or bring your own evidence." id="evidence" />
          <div className="mt-10 max-w-2xl space-y-6 text-lg leading-8 text-ink-soft">
            <p>
              Have an <span className="font-mono text-base text-ink">activity.json</span> or an
              evidence pack already? Drop it in — it never leaves your machine. The verifier checks
              it entirely in your browser and shows you exactly what it proves, the same result{' '}
              <span className="font-mono text-base text-ink">auths verify</span> gives at a terminal.
            </p>
            <Link
              href="/evidence"
              className="inline-flex items-center gap-2 rounded-sm bg-ink px-6 py-3 font-mono text-[13px] font-medium text-paper transition-opacity hover:opacity-90"
            >
              <FileSearch size={15} aria-hidden="true" /> Open the evidence drop-zone
            </Link>
          </div>
        </div>
      </section>

      {/* Trust note */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="03" title="Why you can distrust this page." id="trust" />
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <p className="text-lg leading-8 text-ink-soft">
              The explorer&rsquo;s server only moves data around — it never decides whether anything
              is valid. It fetches the records a witness holds and hands them to your browser, and
              your browser re-checks each one against the relevant cryptographic keys before a
              single thing shows as verified. A dishonest explorer could <em>hide</em> a record from
              you — which the freshness labels are there to surface — but it can&rsquo;t <em>forge</em>{' '}
              one, because the checking happens on your side, not ours.
            </p>
            <p className="text-lg leading-8 text-ink-soft">
              That re-check runs right here in the page — it&rsquo;s a small WebAssembly (WASM) build
              of the very same verifier the command line uses — so trusting this site is optional by
              design. It&rsquo;s the same idea the whole network rests on: a witness is a small,
              plain signer you can check, not a service you&rsquo;re asked to trust. And every label
              you see is drawn from a fixed list that ships with the tools, so the explorer can never
              make one up.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-6">
            <InkLink href="https://github.com/auths-dev/auths">See source on GitHub</InkLink>
            <InkLink href={`${DOCS}/users/verify-an-anchored-attestation`}>
              How verifiers read freshness
            </InkLink>
          </div>
        </div>
      </section>

      {/* The cloud network */}
      <section className="px-6 py-16 sm:pb-32">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="04" title="The cloud network." id="cloud" />
          <p className="mt-10 max-w-3xl text-lg leading-8 text-ink-soft">
            Everything that proves is open and free: the protocol, the verifier, the full witness
            node, the watcher. What we sell is operation — uptime, a curated quorum, storage, and
            alerting. The gate is an account, never a code path.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {CLOUD_TIERS.map((t) => (
              <div key={t.name} className="rounded-sm border border-rule bg-paper-deep/40 p-6">
                <h3 className="font-display text-2xl font-medium text-ink">{t.name}</h3>
                <p className="mt-1 font-mono text-[12px] uppercase tracking-wider text-ink-faint">
                  {t.meter}
                </p>
                <p className="mt-4 text-base leading-7 text-ink-soft">{t.detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl text-base leading-7 text-ink-soft">
            Pricing lands with the launch. And if you&rsquo;d rather not pay us at all: everything
            above this section runs from published code, which is precisely the point — the docs
            walk every role through it.
          </p>
          <div className="mt-6 flex flex-wrap gap-6">
            <InkLink href={DOCS}>The witness network docs</InkLink>
            <InkLink href={`${DOCS}/operators/run-a-node`}>Run it yourself instead</InkLink>
          </div>
        </div>
      </section>
    </div>
  );
}
