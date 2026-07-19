import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/metadata';
import { SectionMark, InkTerminal, InkLink, Prompt, Dim, Allow } from '@auths/ledger-ui';
import { WitnessNetworkDiagram } from '@/components/witness-network-diagram';
import { witnessDirectory } from '@/lib/network/witnesses';
import { probeWitness, type ProbedWitness } from '@/lib/network/live';

const TITLE = 'The witness network — freshness you can hold someone to';
const DESC =
  'Independent witnesses co-sign every history’s growth, so rolling back or forking a spend history stops being deniable. Verification stays offline and free.';

/** The witness-network docs section — every CTA on this page lands somewhere actionable. */
const DOCS = 'https://docs.auths.dev/mcp/witness-network';

export const metadata: Metadata = constructMetadata({ title: TITLE, description: DESC });

/** Live reads (witness health) refresh once a minute. */
export const revalidate = 60;

function LivenessMark({ witness }: { witness: ProbedWitness }) {
  const { liveness } = witness;
  if (liveness.state === 'up') {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-seal-deep">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-seal" /> up ·{' '}
        {liveness.roles.join(' + ')}
      </span>
    );
  }
  if (liveness.state === 'unreachable') {
    return <span className="font-mono text-[12px] text-deny">unreachable</span>;
  }
  return <span className="font-mono text-[12px] text-ink-faint">standing up</span>;
}

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

export default async function NetworkPage() {
  const witnesses = await Promise.all(witnessDirectory().map(probeWitness));

  return (
    <div className="min-h-screen">
      <section className="px-6 pt-36 pb-20 sm:pt-44">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
            The witness network
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl">
            A history that can&rsquo;t quietly rewind.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-ink-soft">
            Receipts verify offline, forever. The one thing offline verification can&rsquo;t prove
            is that you&rsquo;re looking at the <em>latest</em> history. The witness network closes
            that gap: independent operators co-sign every history&rsquo;s growth, so hiding or
            rewriting the recent past stops being deniable — and starts being evidence.
          </p>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="01" title="The witness directory." id="directory" />
          <p className="mt-10 max-w-3xl text-lg leading-8 text-ink-soft">
            A quorum is only as honest as its operators are independent. The directory lists
            conformant witnesses with the facts a declared set is chosen by — operator,
            jurisdiction, infrastructure — and their live status. Listing has exactly one
            requirement: pass the published{' '}
            <a
              href={`${DOCS}/conformance`}
              className="border-b border-seal/40 pb-0.5 text-seal transition-colors hover:border-seal hover:text-seal-deep"
            >
              conformance harness
            </a>
            .
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[38rem] text-left font-mono text-[13px]">
              <thead>
                <tr className="border-b border-rule text-[11px] uppercase tracking-wider text-ink-faint">
                  <th className="py-2 pr-4 font-medium">witness</th>
                  <th className="py-2 pr-4 font-medium">operator</th>
                  <th className="py-2 pr-4 font-medium">jurisdiction</th>
                  <th className="py-2 pr-4 font-medium">infrastructure</th>
                  <th className="py-2 font-medium">status</th>
                </tr>
              </thead>
              <tbody>
                {witnesses.map((w) => (
                  <tr key={w.name} className="border-b border-rule/60 text-ink-soft last:border-0">
                    <td className="py-2.5 pr-4 text-ink">{w.name}</td>
                    <td className="py-2.5 pr-4">{w.operator}</td>
                    <td className="py-2.5 pr-4">{w.jurisdiction}</td>
                    <td className="py-2.5 pr-4">{w.infraClass}</td>
                    <td className="py-2.5">
                      <LivenessMark witness={w} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 max-w-3xl text-base leading-7 text-ink-soft">
            The network is young, and that is the honest state of it. Independence is what makes
            the honesty ceiling real — which is why the most valuable witness in this directory is
            the one <em>we don&rsquo;t</em> run.
          </p>
          <div className="mt-6 flex flex-wrap gap-6">
            <InkLink href={`${DOCS}/conformance`}>Get listed — conformance &amp; the directory</InkLink>
            <InkLink href={`${DOCS}/choose-witnesses`}>Choosing a witness set</InkLink>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="02" title="Run a witness." id="run" />
          <div className="mt-10 grid gap-12 lg:grid-cols-[6fr_5fr]">
            <div>
              <InkTerminal
                label="one operator artifact, three roles"
                tag="docker"
                copy={'WITNESS_SEED=$(openssl rand -hex 32) docker compose up -d'}
              >
                <Dim># the node: spend anchors + receipt witnessing + cosigning</Dim>
                <Prompt>git clone https://github.com/auths-dev/auths</Prompt>
                <Prompt>cd auths/deploy/witness</Prompt>
                <Prompt>WITNESS_SEED=$(openssl rand -hex 32) docker compose up -d</Prompt>
                <Allow>witness-node: listening on 0.0.0.0:3333</Allow>
                <Dim className="pt-2"># prove conformance — the directory&rsquo;s only entry bar</Dim>
                <Prompt>cargo xtask witness-conformance --url http://127.0.0.1:3333</Prompt>
                <Allow>live endpoint passed 4/4 transport checks</Allow>
              </InkTerminal>
            </div>
            <div className="space-y-6 text-base leading-7 text-ink-soft">
              <p>
                The witness is one container with a persistent volume: a hardened HTTP surface, a
                durable anchor store, an append-only log, and one Ed25519 identity. The same
                compose file, Helm chart, and Terraform we run ourselves ship in the open repo —
                the infrastructure <em>is</em> the product, not a diagram of it.
              </p>
              <div>
                <h3 className="font-display text-xl font-medium text-ink">
                  Then hand the key to your principal
                </h3>
                <p className="mt-3">
                  On first boot the node mints its member key and prints it. Whoever&rsquo;s
                  history you witness adds that key to their declared set — name, curve, public
                  key, operator facts — and anchors the set in their own key history. From then
                  on, your cosignature counts toward their t-of-N, and nothing about it requires
                  trusting us: the node, the verifier, and the conformance harness are all
                  published code.
                </p>
              </div>
              <div className="flex flex-wrap gap-6">
                <InkLink href={`${DOCS}/run-a-witness`}>The full guide: run a witness</InkLink>
                <InkLink href="https://github.com/auths-dev/auths">Source on GitHub</InkLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="03" title="What witnesses actually solve." id="how" />
          <div className="mt-10 grid gap-12 lg:grid-cols-[5fr_6fr]">
            <div className="space-y-6 text-lg leading-8 text-ink-soft">
              <p>
                A dishonest counterparty doesn&rsquo;t need to forge anything — forgery is already
                futile. The cheap attacks are <span className="text-ink">withholding</span>{' '}
                (pretend the recent records don&rsquo;t exist) and{' '}
                <span className="text-ink">equivocation</span> (show two consistent histories to
                two different verifiers). Both are freshness problems, and no amount of offline
                math on a stale copy can catch them.
              </p>
              <p>
                So the network witnesses exactly one claim, over and over:{' '}
                <em>this history only grows</em>. An agent periodically anchors its aggregate —
                head, count, cumulative — with a set of witnesses it declared in advance. Each
                witness accepts only monotone growth. Present the same index with a different head
                to any of them and what you get back is not a cosignature but a{' '}
                <span className="text-ink">duplicity proof</span>: a self-contained, signed
                contradiction any stranger can verify.
              </p>
              <p>
                Verification itself never changes hands: it stays offline, free, and dependency-less.
                A finalized anchor simply adds one labeled fact beside the verdicts —{' '}
                <span className="font-mono text-base text-ink">fresh · stale · unanchored</span> —
                and witnesses never see a per-call row, only the aggregate.
              </p>
              <div className="flex flex-wrap gap-6 pt-2">
                <InkLink href={`${DOCS}/anchor-your-attestation`}>Anchor your attestation</InkLink>
                <InkLink href={`${DOCS}/verify-freshness`}>How verifiers read freshness</InkLink>
              </div>
            </div>
            <div>
              <WitnessNetworkDiagram />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:pb-32">
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
            <InkLink href={`${DOCS}/run-a-witness`}>Run it yourself instead</InkLink>
          </div>
        </div>
      </section>
    </div>
  );
}
