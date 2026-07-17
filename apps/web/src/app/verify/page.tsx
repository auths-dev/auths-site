import type { Metadata } from 'next';
import { constructMetadata } from '@/lib/metadata';
import { CodeBlock } from '@auths/ledger-ui';
import { CopyButton } from '@auths/ledger-ui';
import {
  SectionMark,
  InkTerminal,
  InkLink,
  Prompt,
  Dim,
  Allow,
  Deny,
} from '@auths/ledger-ui';

const TITLE = 'Verify — proof your work passed, that anyone can re-check';
const DESC =
  'A GitHub Action that refuses unsigned commits, and a spend auditor that re-derives what an agent did — both re-runnable by a third party, offline, from the receipts alone.';

export const metadata: Metadata = constructMetadata({ title: TITLE, description: DESC });

const WORKFLOW_YAML = `# .github/workflows/verify.yml
name: Verify Commits
on: [pull_request]
permissions:
  contents: read              # least privilege — no id-token, no write
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: auths-dev/verify@v1
        with:
          auths-version: "0.1.3"   # pin the CLI — the action never resolves \`latest\`
          fail-on-unsigned: true`;

export default function VerifyPage() {
  return (
    <div className="min-h-screen">
      <section className="px-6 pt-36 pb-20 sm:pt-44">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
            The neutral referee
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Proof your work passed. That anyone can re-check.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-ink-soft">
            A green check that lives on the operator&rsquo;s server is a screenshot. These checks
            re-run anywhere: every commit verifies against the signer&rsquo;s own key history, and
            every agent receipt re-derives without asking us.
          </p>

          <div className="mt-14 max-w-3xl">
            <div className="overflow-hidden rounded-lg shadow-[0_32px_80px_-16px_rgba(28,24,20,0.5)] ring-1 ring-black/20 [&_pre]:!m-0 [&_pre]:!rounded-none [&_pre]:!shadow-none [&_pre]:!ring-0">
              <div className="flex items-center justify-between bg-[#15130f] px-5 py-2.5">
                <span className="font-mono text-[11px] tracking-wider text-[#9a948c]">
                  .github/workflows/verify.yml
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-[#9a948c]">
                    the whole integration
                  </span>
                  <CopyButton text={WORKFLOW_YAML} />
                </span>
              </div>
              <CodeBlock language="yaml" code={WORKFLOW_YAML} />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="01" title="The check that refuses." id="refuse" />
          <div className="mt-10 grid gap-12 lg:grid-cols-[5fr_6fr]">
            <div>
              <p className="text-lg leading-8 text-ink-soft">
                The action reads each commit&rsquo;s signer from its trailers and verifies the
                signature against that signer&rsquo;s key history. An unsigned commit, an unknown
                signer, or a corrupted signature fails the check — classified, with the fix spelled
                out in the job summary.
              </p>
              <p className="mt-8 text-base leading-7 text-ink-soft">
                The action itself refuses shortcuts: the CLI version is pinned, its checksum is
                verified before it runs, and <span className="font-mono text-[0.93em] text-ink">latest</span>{' '}
                is never resolved. A verifier whose own supply chain is soft would prove nothing.
              </p>
              <div className="mt-8 flex flex-wrap gap-6">
                <InkLink href="https://github.com/auths-dev/verify">auths-dev/verify</InkLink>
                <InkLink href="https://github.com/auths-dev/sign">auths-dev/sign</InkLink>
              </div>
            </div>

            <InkTerminal label="the same check, on your machine" tag="offline" copy="auths verify HEAD">
              <Dim># any commit, any clone — no CI required</Dim>
              <Prompt>auths verify HEAD</Prompt>
              <Allow>Commit 51017ad… verified: signed by &lt;root&gt;</Allow>
              <Dim className="pt-2"># an unsigned commit does not pass quietly</Dim>
              <Prompt>auths verify 3f9c2e1</Prompt>
              <Deny>Verification failed for 3f9c2e1…: no Auths signature (exit 1)</Deny>
            </InkTerminal>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:pb-32">
        <div className="mx-auto max-w-5xl">
          <SectionMark n="02" title="The same referee for agents." id="agents" />
          <div className="mt-10 grid gap-12 lg:grid-cols-[5fr_6fr]">
            <div>
              <p className="text-lg leading-8 text-ink-soft">
                Commits are one kind of receipt. A bounded agent leaves another: every gated tool
                call, signed and logged. The auditor re-derives the spend from those signatures
                alone — a party who never ran the agent can confirm what it did.
              </p>
              <p className="mt-8 border-l-2 border-seal/50 pl-4 font-display text-xl italic leading-8 text-ink">
                Tamper with one byte of a signed proof and the audit says so.
              </p>
              <div className="mt-8">
                <InkLink href="/#audit">The bounded agent, in full</InkLink>
              </div>
            </div>

            <InkTerminal
              label="an auditor who does not operate the agent"
              tag="offline"
              copy="auths-mcp-gateway verify-spend --log spend.jsonl --registry ./registry --agent <agent> --root <root>"
            >
              <Prompt>auths-mcp-gateway verify-spend --log spend.jsonl \</Prompt>
              <Prompt className="pl-4">
                --registry ./registry --agent &lt;agent&gt; --root &lt;root&gt;
              </Prompt>
              <Allow>consistent — 2 call(s), $12.00 re-derived from signed costs</Allow>
              <Dim className="pt-2"># the forged variant, caught</Dim>
              <Prompt>auths-mcp-gateway verify-spend --log tampered.jsonl …</Prompt>
              <Deny>tampered-proof — 51017ad1… failed verification (exit 1)</Deny>
            </InkTerminal>
          </div>
        </div>
      </section>
    </div>
  );
}
