'use client';

/**
 * The Ledger — light editorial landing for P1: the bounded agent.
 *
 * One product above the fold. Everything below is proof, ordered by the next
 * objection a skeptic raises. The hero shows a REFUSAL, not a success — a green
 * tick is a screenshot; a denial with a receipt is the product.
 *
 * Design rules:
 * - Paper background, ink text, ONE warm accent (--seal). A single cool-red
 *   (#c0442e) is reserved for one thing only: a denial.
 * - Fraunces (--font-display) for headlines; Geist Sans for body;
 *   mono ONLY inside terminals, code, and small-caps labels.
 * - Terminals are the only dark objects on the page.
 * - Every command on this page is one a visitor can actually run.
 */

import { motion } from 'motion/react';
import { CodeBlock } from '@/components/code-block';
import {
  fadeUp,
  DENY,
  OK,
  SectionMark,
  InkLink,
  InkTerminal,
  Prompt,
  Dim,
  Allow,
  Deny,
} from '@/components/ledger';

// ---------------------------------------------------------------------------
// Hero — one product: the bounded agent. The terminal shows a refusal.
// ---------------------------------------------------------------------------

const heroSession = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.5, delayChildren: 0.7 } },
};
const heroLine = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

function HeroTerminal() {
  return (
    <div className="overflow-hidden rounded-lg bg-[#15130f] shadow-[0_32px_80px_-16px_rgba(28,24,20,0.5)] ring-1 ring-black/20">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-2.5">
        <span className="font-mono text-[11px] tracking-wider text-stone-500">
          agent → my-mcp-server
        </span>
        <span className="font-mono text-[11px] text-stone-600">budget $20 · ttl 30m</span>
      </div>
      <motion.div
        className="space-y-1.5 px-5 py-4 font-mono text-[13px] leading-relaxed text-stone-300"
        variants={heroSession}
        initial="hidden"
        animate="visible"
      >
        <motion.p variants={heroLine} className="text-stone-500">
          # one command in front of any MCP server
        </motion.p>
        <motion.p variants={heroLine}>
          <span className="select-none text-stone-500">$ </span>
          npx @auths/mcp wrap --budget &apos;$20&apos; --ttl 30m -- my-mcp-server
        </motion.p>
        <motion.p variants={heroLine} className="pt-1 text-stone-500">
          # the agent runs. every tool call is checked and gets a receipt.
        </motion.p>
        <motion.p variants={heroLine} style={{ color: OK }}>
          ✓ payments.charge $12.00 → allowed · spent $12.00 / $20.00 · rcpt_1a2b
        </motion.p>
        <motion.p variants={heroLine} style={{ color: DENY }}>
          ✗ payments.charge $940.00 → usage-cap-exceeded · refused · rcpt_8f2a
        </motion.p>
        <motion.p variants={heroLine} className="pt-1 text-stone-500">
          # the receipt is signed — anyone can re-derive the spend, offline
        </motion.p>
        <motion.p variants={heroLine}>
          <span className="select-none text-stone-500">$ </span>
          auths-mcp-gateway verify-spend --log spend.jsonl …
        </motion.p>
        <motion.p variants={heroLine} style={{ color: OK }}>
          ✓ consistent — 2 call(s), $12.00 re-derived from signed costs
        </motion.p>
      </motion.div>
    </div>
  );
}

export function LedgerHero() {
  return (
    <section className="px-6 pt-36 pb-24 sm:pt-44 sm:pb-32">
      <div className="mx-auto max-w-5xl">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint"
        >
          The bounded agent
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="mt-6 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl"
        >
          Your agent can&rsquo;t exceed its budget. And you can prove it.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
          className="mt-8 max-w-xl text-lg leading-8 text-ink-soft"
        >
          One command in front of any MCP server. Every tool call is checked against a scope, a
          budget, and an expiry &mdash; and leaves a receipt anyone can verify. Without trusting you,
          your platform, or your cloud.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          className="mt-10 flex flex-wrap items-center gap-5"
        >
          <a
            href="#wrap"
            className="rounded-sm bg-seal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-seal-deep"
          >
            Bound an agent in 5 minutes
          </a>
          <a
            href="#audit"
            className="font-mono text-sm text-ink-soft underline decoration-rule underline-offset-4 transition-colors hover:text-ink"
          >
            See a stranger verify it
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
          className="mt-16 max-w-3xl"
        >
          <HeroTerminal />
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 01 — Don't trust us. Check.  (verify-spend — the whole company)
// ---------------------------------------------------------------------------

export function LedgerAudit() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionMark n="01" title="Don't trust us. Check." id="audit" />

        <div className="mt-10 grid gap-12 lg:grid-cols-[5fr_6fr]">
          <div>
            <motion.p {...fadeUp(0.1)} className="text-lg leading-8 text-ink-soft">
              A log is a claim the operator makes about themselves. A receipt is a claim you can
              check <span className="italic">against</span> them. Each tool call is signed by the
              agent&apos;s delegated key; the spend re-derives from those signatures, so a party who
              never ran the agent can confirm what it did &mdash; offline, with no account and no
              server to trust.
            </motion.p>
            <motion.p
              {...fadeUp(0.2)}
              className="mt-8 border-l-2 border-seal/50 pl-4 font-display text-xl italic leading-8 text-ink"
            >
              Tamper with one byte of a signed proof and the audit says so.
            </motion.p>
            <motion.div {...fadeUp(0.35)} className="mt-8">
              <InkLink href="https://github.com/auths-dev/auths">How the audit works</InkLink>
            </motion.div>
          </div>

          <motion.div {...fadeUp(0.2)}>
            <InkTerminal label="an auditor who does not operate the agent" tag="offline">
              <Dim># re-derive the spend from the signed receipts alone</Dim>
              <Prompt>
                auths-mcp-gateway verify-spend --log spend.jsonl \
              </Prompt>
              <Prompt className="pl-4">
                --registry ./registry --agent &lt;agent&gt; --root &lt;root&gt;
              </Prompt>
              <Allow>consistent — 2 call(s), $12.00 re-derived from signed costs</Allow>
              <Dim className="pt-2"># now flip one byte of a signed proof and re-run</Dim>
              <Prompt>auths-mcp-gateway verify-spend --log tampered.jsonl …</Prompt>
              <Deny>tampered-proof — 51017ad1… failed verification (exit 1)</Deny>
            </InkTerminal>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 02 — It bounds, it doesn't just watch.
// ---------------------------------------------------------------------------

const VERDICTS = [
  { rule: 'scope ⊆ parent', deny: 'outside-agent-scope', note: 'a call for a capability the grant never gave' },
  { rule: 'budget', deny: 'usage-cap-exceeded', note: 'the reservation refuses before the rail is charged' },
  { rule: 'expiry', deny: 'agent-expired', note: 'the delegation has a TTL; past it, nothing signs' },
  { rule: 'revocation', deny: 'revoked', note: 'the root recorded a revocation; every verifier honors it' },
  { rule: 'authenticity', deny: 'proof-unauthentic', note: 'the signature does not verify against the agent’s key' },
];

export function LedgerBound() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionMark n="02" title="It bounds. It doesn't just watch." id="bound" />

        <motion.p {...fadeUp(0.1)} className="mt-10 max-w-2xl text-lg leading-8 text-ink-soft">
          AWS, Entra, and Okta can tell you <span className="italic">who</span> the agent is. None of
          them can stop it. The gate checks five things on every call and fails closed &mdash; the
          downstream tool is never invoked on a deny.
        </motion.p>

        <motion.div {...fadeUp(0.2)} className="mt-12 overflow-hidden rounded-lg ring-1 ring-rule">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-rule bg-ink/[0.02]">
                <th className="px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  Bound
                </th>
                <th className="px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-ink-faint">
                  Refusal
                </th>
                <th className="hidden px-5 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-ink-faint sm:table-cell">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {VERDICTS.map((v) => (
                <tr key={v.deny} className="border-b border-rule last:border-0">
                  <td className="px-5 py-3.5 font-mono text-ink">{v.rule}</td>
                  <td className="px-5 py-3.5 font-mono" style={{ color: DENY }}>
                    {v.deny}
                  </td>
                  <td className="hidden px-5 py-3.5 text-ink-soft sm:table-cell">{v.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
        <motion.p {...fadeUp(0.3)} className="mt-6 font-mono text-xs text-ink-faint">
          Scope is <span className="text-ink">⊆ parent</span>: an agent can only ever narrow what it
          was delegated, never widen it.
        </motion.p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 03 — Works with what you have.
// ---------------------------------------------------------------------------

export function LedgerWrap() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionMark n="03" title="Works with what you have." id="wrap" />

        <div className="mt-10 grid gap-12 lg:grid-cols-[5fr_6fr]">
          <div>
            <motion.p {...fadeUp(0.1)} className="text-lg leading-8 text-ink-soft">
              No migration, no SDK, no rewrite. Prepend one command to any MCP server line in your
              client config. The agent keeps working &mdash; now bounded.
            </motion.p>
            <motion.p {...fadeUp(0.25)} className="mt-8 text-base leading-7 text-ink-soft">
              The gateway speaks MCP up to your agent and down to the wrapped server, proxying{' '}
              <span className="font-mono text-[0.93em] text-ink">tools/list</span> and{' '}
              <span className="font-mono text-[0.93em] text-ink">tools/call</span> and gating each
              one.
            </motion.p>
            <motion.div {...fadeUp(0.4)} className="mt-8">
              <InkLink href="https://github.com/auths-dev/auths">Read the quickstart</InkLink>
            </motion.div>
          </div>

          <motion.div {...fadeUp(0.2)}>
            <div className="overflow-hidden rounded-lg shadow-[0_24px_60px_-12px_rgba(28,24,20,0.45)] ring-1 ring-black/20 [&_pre]:!m-0 [&_pre]:!rounded-none">
              <div className="flex items-center justify-between bg-[#15130f] px-5 py-2.5">
                <span className="font-mono text-[11px] tracking-wider text-stone-500">
                  ~/.config/mcp.json
                </span>
                <span className="font-mono text-[11px] text-stone-600">before → after</span>
              </div>
              <CodeBlock
                language="json"
                code={`{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "@auths/mcp", "wrap",
        "--scope", "fs.read",
        "--budget", "$5",
        "--ttl", "30m",
        "--",
        "npx", "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/project"
      ]
    }
  }
}`}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 04 — Revoke and it stops.
// ---------------------------------------------------------------------------

export function LedgerRevoke() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionMark n="04" title="Revoke, and it stops." id="revoke" />

        <div className="mt-10 grid gap-12 lg:grid-cols-[5fr_6fr]">
          <div>
            <motion.p {...fadeUp(0.1)} className="text-lg leading-8 text-ink-soft">
              A shared key can&apos;t be pulled for one agent without breaking the rest. An Auths
              agent is a delegated identity of your root &mdash; revoke it once and every verifier
              refuses it on the next call. The other agents never notice.
            </motion.p>
            <motion.p
              {...fadeUp(0.25)}
              className="mt-8 border-l-2 border-seal/50 pl-4 font-display text-xl italic leading-8 text-ink"
            >
              One command. No key rotation across the fleet. No distribution to wait on.
            </motion.p>
          </div>

          <motion.div {...fadeUp(0.2)}>
            <InkTerminal label="revoke one agent">
              <Dim># the deploy bot is compromised — cut it</Dim>
              <Prompt>auths id agent revoke --label deploy-bot</Prompt>
              <Allow>revocation recorded at seq 7 — every verifier honors it</Allow>
              <Dim className="pt-2"># its very next call, at the gate</Dim>
              <Prompt>payments.charge $4.00</Prompt>
              <Deny>revoked — refused (the downstream tool was never called)</Deny>
              <Dim className="pt-2"># every other agent keeps working</Dim>
              <Allow>report-bot · fs.read → allowed</Allow>
            </InkTerminal>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 05 — How it works.
// ---------------------------------------------------------------------------

export function LedgerHowItWorks() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionMark n="05" title="How it works." id="how" />

        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {[
            {
              h: 'A device-bound key',
              b: 'The signing key is generated in the machine’s secure element and never transmits. There is no secret to leak, store, or rotate across your fleet.',
            },
            {
              h: 'A delegation, not a token',
              b: 'Each agent is a delegated identifier of your root identity, with its scope and budget fixed at issue time and anchored in a key event log — not a bearer token anyone who holds it can replay.',
            },
            {
              h: 'A signed receipt',
              b: 'Every gated call is canonicalized, signed, and recorded. The verdict and the running spend are re-derivable by anyone with the receipts — the operator’s word is never required.',
            },
          ].map((c, i) => (
            <motion.div key={c.h} {...fadeUp(0.1 + i * 0.1)}>
              <h3 className="font-display text-xl font-medium text-ink">{c.h}</h3>
              <p className="mt-3 text-base leading-7 text-ink-soft">{c.b}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 06 — Why the receipt survives a key rotation.
// ---------------------------------------------------------------------------

export function LedgerRotation() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionMark n="06" title="Why the receipt survives a key rotation." id="rotation" />

        <motion.div {...fadeUp(0.1)} className="mt-10 max-w-3xl space-y-6 text-lg leading-8 text-ink-soft">
          <p>
            Other tools can verify offline too. The difference is narrower than &ldquo;offline vs
            online,&rdquo; and worth stating precisely: their offline check runs against a{' '}
            <span className="text-ink">trust-root snapshot</span> you refreshed at some point &mdash;
            so a key that rotated or was revoked since is one you cannot see.
          </p>
          <p>
            An Auths key carries its own rotation history: the receipt verifies against the key that
            was valid <span className="text-ink">at signing time</span>, with no trust root to
            refresh. That matters most for long-lived agent and device keys &mdash; which is exactly
            what Auths issues.
          </p>
        </motion.div>
        <motion.p {...fadeUp(0.25)} className="mt-8 font-mono text-xs text-ink-faint">
          Verified against the key that signed it. Nothing to refresh, nothing to phone home.
        </motion.p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CTA + footer
// ---------------------------------------------------------------------------

export function LedgerCTA() {
  return (
    <section className="px-6 py-28 sm:py-36">
      <div className="mx-auto max-w-5xl">
        <motion.div {...fadeUp(0)} className="h-px w-full bg-rule" aria-hidden="true" />
        <motion.h2
          {...fadeUp(0.05)}
          className="mt-16 max-w-2xl font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl"
        >
          Bound your first agent.
        </motion.h2>
        <motion.p {...fadeUp(0.15)} className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">
          Open source, offline-first, no account required.
        </motion.p>

        <motion.div {...fadeUp(0.25)} className="mt-10 max-w-2xl">
          <InkTerminal label="quickstart">
            <Dim># wrap any MCP server — the agent keeps working, now bounded</Dim>
            <Prompt>npx @auths/mcp wrap --budget &apos;$5&apos; --ttl 30m -- my-mcp-server</Prompt>
            <Dim className="pt-1"># then, as anyone: re-derive the spend from the receipts</Dim>
            <Prompt>auths-mcp-gateway verify-spend --log spend.jsonl …</Prompt>
            <Allow>consistent — re-derived from signed costs, offline</Allow>
          </InkTerminal>
        </motion.div>

        <motion.div {...fadeUp(0.35)} className="mt-10 flex flex-wrap items-center gap-5">
          <a
            href="https://docs.auths.dev/"
            className="rounded-sm bg-seal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-seal-deep"
          >
            Read the docs
          </a>
          <a
            href="https://github.com/auths-dev/auths"
            className="font-mono text-sm text-ink-soft underline decoration-rule underline-offset-4 transition-colors hover:text-ink"
          >
            github.com/auths-dev/auths
          </a>
        </motion.div>
      </div>
    </section>
  );
}

