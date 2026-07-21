import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/metadata';
import { assertKnownVerdicts } from '@/lib/verdicts';
import {
  SectionMark,
  InkTerminal,
  InkLink,
  Prompt,
  Dim,
  Allow,
  Deny,
  DENY,
} from '@auths/ledger-ui';

const TITLE = 'Security model — what you have to trust, and what you don’t';
const DESC =
  'Exactly what a relying party checks when it verifies an agent’s receipts, what verification never depends on, and where the honest limits are.';

export const metadata: Metadata = constructMetadata({ title: TITLE, description: DESC });

const CHECKS = [
  {
    name: 'Authenticity',
    verdict: 'proof-unauthentic',
    detail:
      'Every receipt is signed. The signature must verify against the agent’s delegated key — resolved from its key history as it stood at signing time, so a later rotation can’t orphan an old receipt.',
  },
  {
    name: 'Scope',
    verdict: 'outside-agent-scope',
    detail:
      'An agent’s scope is fixed at issue time and can only ever narrow what its root delegated. A call for a capability the grant never gave is refused.',
  },
  {
    name: 'Budget',
    verdict: 'usage-cap-exceeded',
    detail:
      'The spend is not an operator claim — it re-derives from the signed cost on each receipt. A call that would cross the cap is refused before the downstream tool runs.',
  },
  {
    name: 'Expiry',
    verdict: 'agent-expired',
    detail: 'The delegation carries a TTL. Past it, nothing the agent signs passes.',
  },
  {
    name: 'Revocation',
    verdict: 'revoked',
    detail:
      'A revocation is a signed event in the root’s key history. Once recorded, every verifier refuses the agent’s calls — no distribution to wait on.',
  },
];

assertKnownVerdicts(
  'trust page CHECKS',
  CHECKS.map((c) => c.verdict),
);

export default function TrustPage() {
  return (
    <div className="min-h-screen">
      <section className="px-6 pt-36 pb-20 sm:pt-44">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
            Security model
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl">
            What you have to trust. And what you don&rsquo;t.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-ink-soft">
            The claim behind Auths is that a stranger can check your agent&rsquo;s receipts without
            trusting you. That only means something if we are precise about what a verifier checks,
            what it never sees, and where the limits are.
          </p>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="01" title="What a verifier checks." id="checks" />
          <div className="mt-10 grid gap-12 lg:grid-cols-[6fr_5fr]">
            <ol className="space-y-8">
              {CHECKS.map((c) => (
                <li key={c.verdict}>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h3 className="font-display text-xl font-medium text-ink">{c.name}</h3>
                    <span className="font-mono text-sm" style={{ color: DENY }}>
                      {c.verdict}
                    </span>
                  </div>
                  <p className="mt-2 text-base leading-7 text-ink-soft">{c.detail}</p>
                </li>
              ))}
            </ol>

            <div>
              <InkTerminal
                label="a relying party who never ran the agent"
                tag="offline"
                copy="auths-mcp-gateway verify-spend --log spend.jsonl --registry ./registry --agent <agent> --root <root>"
              >
                <Dim># re-derive the spend from the signed receipts alone</Dim>
                <Prompt>auths-mcp-gateway verify-spend --log spend.jsonl \</Prompt>
                <Prompt className="pl-4">
                  --registry ./registry --agent &lt;agent&gt; --root &lt;root&gt;
                </Prompt>
                <Allow>consistent — 2 call(s), $12.00 re-derived from signed costs</Allow>
                <Dim className="pt-2"># flip one byte of a signed proof and re-run</Dim>
                <Prompt>auths-mcp-gateway verify-spend --log tampered.jsonl …</Prompt>
                <Deny>tampered-proof — 51017ad1… failed verification (exit 1)</Deny>
              </InkTerminal>
              <p className="mt-6 font-mono text-xs leading-5 text-ink-faint">
                Every check fails closed: on any verdict but{' '}
                <span className="text-ink">allowed</span>, the downstream tool is never invoked.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="02" title="What verification never depends on." id="independence" />
          <div className="mt-10 max-w-3xl space-y-6 text-lg leading-8 text-ink-soft">
            <p>
              Verification runs where the verifier runs — a laptop, a CI job, an auditor&rsquo;s
              machine. There is no account to create, no server to call, and nothing that phones
              home. The receipts and the key history they verify against are files you can copy,
              archive, and check years later.
            </p>
            <p>
              A key carries its own rotation history, so the receipt verifies against the key that
              was valid <span className="text-ink">at signing time</span> — there is no trust-root
              snapshot to refresh and no window where a rotated key silently invalidates old
              evidence.
            </p>
            <p className="border-l-2 border-seal/50 pl-4 font-display text-xl italic leading-8 text-ink">
              If auths.dev disappears tomorrow, every receipt still verifies.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="03" title="The honest limits." id="limits" />
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            {[
              {
                h: 'Authorized is not the same as wise',
                b: 'The gate proves a call was within its bounds — it does not judge whether the call was a good idea. A bounded agent can still spend its whole budget badly. Bounds cap the blast radius; they don’t supply judgment.',
              },
              {
                h: 'The root key is the root',
                b: 'Whoever holds your root key can delegate new agents. Keep it in hardware, and if it is compromised, rotate it — the rotation is itself a signed, verifiable event in the key history.',
              },
              {
                h: 'Concurrent devices can fork a history',
                b: 'Two devices rotating the same identity at the same moment can produce divergent histories. Verifiers surface the divergence instead of silently picking a side; you resolve it by removing the offending device.',
              },
              {
                h: 'No independent audit yet',
                b: 'The cryptography rests on standard curves (P-256 by default, Ed25519 supported) and every verification path is open source — but the implementation has not yet had an independent cryptographic audit. When it has, the report will be linked here.',
              },
            ].map((c) => (
              <div key={c.h}>
                <h3 className="font-display text-xl font-medium text-ink">{c.h}</h3>
                <p className="mt-3 text-base leading-7 text-ink-soft">{c.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:pb-32">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="04" title="Check our work." id="disclosure" />
          <div className="mt-10 max-w-3xl space-y-6 text-lg leading-8 text-ink-soft">
            <p>
              The gateway, the verifier, and the CLI are open source — the audit path is code you
              can read, not a policy you take on faith.
            </p>
            <p>
              Found a security issue? Email{' '}
              <a
                href="mailto:security@auths.dev"
                className="border-b border-seal/40 pb-0.5 font-mono text-base text-seal transition-colors hover:border-seal hover:text-seal-deep"
              >
                security@auths.dev
              </a>{' '}
              with a detailed description. We follow coordinated disclosure.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-6">
            <InkLink href="https://github.com/auths-dev/auths">Read the source</InkLink>
            <InkLink href="/blog/how-we-audit-our-code">How we audit our code</InkLink>
          </div>
        </div>
      </section>
    </div>
  );
}
