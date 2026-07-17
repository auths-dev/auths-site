'use client';

/**
 * The Ledger — light editorial landing.
 *
 * Design rules:
 * - Paper background, ink text, ONE accent (--seal) for section marks,
 *   primary actions, and verification ticks.
 * - Fraunces (--font-display) for headlines; Geist Sans for body;
 *   mono ONLY inside terminals, code, and small caps labels.
 * - Terminals and code panes are the only dark objects on the page —
 *   they read like photographs tipped into a document.
 * - One artifact per section. Hairline rules, numbered sections.
 */

import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';
import { Hero as VerifyHero } from '@/components/hero';

// ---------------------------------------------------------------------------
// Shared motion
// ---------------------------------------------------------------------------

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: '-60px' } as const,
  transition: { duration: 0.55, delay, ease: 'easeOut' as const },
});

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function SectionMark({ n, title, id }: { n: string; title: string; id?: string }) {
  return (
    <div id={id} className="scroll-mt-24">
      <motion.div {...fadeUp(0)} className="flex items-baseline gap-4">
        <span className="font-mono text-sm font-semibold tracking-widest text-seal">{n}</span>
        <span className="h-px flex-1 bg-rule" aria-hidden="true" />
      </motion.div>
      <motion.h2
        {...fadeUp(0.05)}
        className="mt-6 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl"
      >
        {title}
      </motion.h2>
    </div>
  );
}

function InkLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 border-b border-seal/40 pb-0.5 font-mono text-sm text-seal transition-colors hover:border-seal hover:text-seal-deep"
    >
      {children}
      <ArrowUpRight size={13} />
    </a>
  );
}

/** Dark terminal — the only dark object on the paper page. */
function InkTerminal({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg bg-[#15130f] shadow-[0_24px_60px_-12px_rgba(28,24,20,0.45)] ring-1 ring-black/20">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-2.5">
        <span className="font-mono text-[11px] tracking-wider text-stone-500">{label}</span>
        <span className="font-mono text-[11px] text-stone-600">auths v0.1.2</span>
      </div>
      <div className="space-y-1.5 px-5 py-4 font-mono text-[13px] leading-relaxed text-stone-300">
        {children}
      </div>
    </div>
  );
}

function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <p>
      <span className="select-none text-stone-500">$ </span>
      {children}
    </p>
  );
}

function Tick({ children }: { children: React.ReactNode }) {
  return <p className="text-[#e8845c]">✓ {children}</p>;
}

function Dim({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-stone-500 ${className}`}>{children}</p>;
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

const heroSession = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.45, delayChildren: 0.7 } },
};

const heroLine = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

function HeroTerminal() {
  return (
    <div className="overflow-hidden rounded-lg bg-[#15130f] shadow-[0_32px_80px_-16px_rgba(28,24,20,0.5)] ring-1 ring-black/20">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-2.5">
        <span className="font-mono text-[11px] tracking-wider text-stone-500">service → api.example.com</span>
        <span className="font-mono text-[11px] text-stone-600">no secrets stored</span>
      </div>
      <motion.div
        className="space-y-1.5 px-5 py-4 font-mono text-[13px] leading-relaxed text-stone-300"
        variants={heroSession}
        initial="hidden"
        animate="visible"
      >
        <motion.p variants={heroLine} className="text-stone-500"># mint a single-use challenge</motion.p>
        <motion.p variants={heroLine}>
          <span className="select-none text-stone-500">$ </span>
          curl -s https://api.example.com/v1/auth/challenge
        </motion.p>
        <motion.p variants={heroLine} className="text-stone-500">
          {'{ "nonce": "Vqt3K9…", "notAfter": "03:05:00Z" }'}
        </motion.p>
        <motion.p variants={heroLine} className="pt-1 text-stone-500"># sign it with the device-bound key</motion.p>
        <motion.p variants={heroLine}>
          <span className="select-none text-stone-500">$ </span>
          auths auth challenge --nonce Vqt3K9… --domain api.example.com
        </motion.p>
        <motion.p variants={heroLine} className="text-[#e8845c]">
          ✓ signed — the private key never left the keychain
        </motion.p>
        <motion.p variants={heroLine} className="pt-1 text-stone-500"># the signature is the credential — in scope, it&rsquo;s allowed</motion.p>
        <motion.p variants={heroLine} className="break-all">
          <span className="select-none text-stone-500">$ </span>
          curl -H &quot;Authorization: Auths-Presentation eyJ…&quot; …/v1/deploy
        </motion.p>
        <motion.p variants={heroLine} className="text-[#e8845c]">
          {'{ "deployedBy": "did:keri:EBf2cE…", "caps": ["acme:deploy"] }'}
        </motion.p>
        <motion.p variants={heroLine} className="pt-1 text-stone-500"># the same credential, one step past its scope</motion.p>
        <motion.p variants={heroLine} className="break-all">
          <span className="select-none text-stone-500">$ </span>
          curl -H &quot;Authorization: Auths-Presentation eyJ…&quot; …/v1/<span className="text-[#d9694e]">databases/drop</span>
        </motion.p>
        <motion.p variants={heroLine} className="text-[#d9694e]">
          403 · {'{ "denied": "outside-agent-scope", "cap": "acme:db.drop", "granted": ["acme:deploy"] }'}
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
          Identity for developers, services, and agents
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="mt-6 max-w-3xl font-display text-5xl font-medium leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl"
        >
          Replace static API keys with signed, scoped, revocable identity.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
          className="mt-8 max-w-xl text-lg leading-8 text-ink-soft"
        >
          Long-lived secrets leak, outlive their owners, and never rotate. With Auths,
          services and agents sign each request with a device-bound key &mdash; the secret
          never transmits, so there is nothing to leak.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          className="mt-10 flex flex-wrap items-center gap-5"
        >
          <a
            href="https://docs.auths.dev/"
            className="rounded-sm bg-seal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-seal-deep"
          >
            Get started
          </a>
          <a
            href="https://github.com/auths-dev/auths"
            className="font-mono text-sm text-ink-soft underline decoration-rule underline-offset-4 transition-colors hover:text-ink"
          >
            View on GitHub
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
// 01 — Authenticate without tokens
// ---------------------------------------------------------------------------

export function LedgerMachineAuth() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionMark n="01" title="Authenticate without tokens" id="auth" />

        <div className="mt-10 grid gap-12 lg:grid-cols-[5fr_6fr]">
          <div>
            <motion.p {...fadeUp(0.1)} className="text-lg leading-8 text-ink-soft">
              A static credential lives in env vars and CI logs, rarely rotates, and keeps
              working after its owner leaves. An <span className="font-mono text-[0.93em] text-ink">Auths-Presentation</span> is
              the opposite: single-use, audience-bound, and verified against the caller&apos;s
              key event log.
            </motion.p>
            <motion.ul {...fadeUp(0.2)} className="mt-8 space-y-4 text-base leading-7 text-ink-soft">
              <li className="flex gap-3">
                <span className="font-mono text-sm text-seal">a.</span>
                Your API mints a single-use nonce, bound to its own audience.
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-sm text-seal">b.</span>
                The caller signs it with a device-bound key that never leaves the machine.
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-sm text-seal">c.</span>
                One header carries the proof. Replay gets 401; a missing capability gets 403.
              </li>
            </motion.ul>
            <motion.p {...fadeUp(0.3)} className="mt-8 border-l-2 border-seal/50 pl-4 font-display text-xl italic leading-8 text-ink">
              Sign request &rarr; verify signature. No token to mint, store, rotate, or leak.
            </motion.p>
            <motion.div {...fadeUp(0.4)} className="mt-8 flex flex-col gap-3">
              <InkLink href="/blog/replacing-api-keys">Why your API keys are the problem</InkLink>
            </motion.div>
          </div>

          <motion.div {...fadeUp(0.2)}>
            <div className="overflow-hidden rounded-lg shadow-[0_24px_60px_-12px_rgba(28,24,20,0.45)] ring-1 ring-black/20 [&_pre]:!m-0 [&_pre]:!rounded-none">
              <div className="flex items-center justify-between bg-[#15130f] px-5 py-2.5">
                <span className="font-mono text-[11px] tracking-wider text-stone-500">server.ts</span>
                <span className="font-mono text-[11px] text-stone-600">npm install @auths-dev/express</span>
              </div>
              <CodeBlock
                language="typescript"
                code={`import { verifyPresentation } from '@auths-dev/sdk'
import {
  authsAuth, challengeHandler,
  ChallengeStore, KeriPresentationVerifier,
} from '@auths-dev/express'

const challenges = new ChallengeStore({ maxLive: 10_000 })
const verifier = new KeriPresentationVerifier({
  audience: 'api.example.com',
  challenges, loadInputs,
  pinnedRoots: ['did:keri:Eacme_root…'],
  verifyPresentation,
})

app.use('/v1/auth/challenge',
  challengeHandler({ audience: 'api.example.com', challenges }))

app.post('/v1/deploy',
  authsAuth({ verifier, capabilityFor: () => 'acme:deploy' }),
  (req, res) => res.json({ deployedBy: req.principal.subject }))`}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 02 — Agents you can revoke
// ---------------------------------------------------------------------------

export function LedgerAgents() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionMark n="02" title="Give every agent an identity you can revoke" id="agents" />

        <div className="mt-10 grid gap-12 lg:grid-cols-[5fr_6fr]">
          <div>
            <motion.p {...fadeUp(0.1)} className="text-lg leading-8 text-ink-soft">
              A shared API key can&apos;t tell you which agent did what &mdash; and can&apos;t be
              pulled for one agent without breaking the rest. With Auths, each agent gets its
              own delegated identity: capabilities are fixed when the credential is issued and
              enforced at the gate, and every action is attributable to a DID.
            </motion.p>
            <motion.p {...fadeUp(0.2)} className="mt-6 text-lg leading-8 text-ink-soft">
              When one misbehaves, revocation is one command &mdash; anchored in your key event
              log, honored by every verifier, and the other agents keep working.
            </motion.p>
            <motion.p {...fadeUp(0.3)} className="mt-6 text-sm leading-6 text-ink-faint">
              Shipping agents on MCP? <span className="font-mono text-[0.95em]">auths-mcp-server</span> gives
              your toolchain the same identity model.
            </motion.p>
            <motion.div {...fadeUp(0.4)} className="mt-8">
              <InkLink href="https://docs.auths.dev/guides/identity/profiles/#agent-profile">
                Give your agent an identity
              </InkLink>
            </motion.div>
          </div>

          <motion.div {...fadeUp(0.2)}>
            <InkTerminal label="agent lifecycle">
              <Dim># create an agent identity — scoped capabilities, 1-year TTL</Dim>
              <Prompt>auths init --profile agent --non-interactive</Prompt>
              <Dim className="pt-1"># export identity for deployment</Dim>
              <Prompt>auths id export-bundle --alias main -o agent-bundle.json --max-age-secs 86400</Prompt>
              <Dim className="pt-1"># pull one agent — the rest keep working</Dim>
              <Prompt>auths device remove did:keri:EAgent7…</Prompt>
              <Tick>revocation anchored in your key event log</Tick>
            </InkTerminal>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 03 — Govern and prove
// ---------------------------------------------------------------------------

export function LedgerGovernance() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionMark n="03" title="Prove who did what. Cut access in seconds." id="governance" />

        <div className="mt-10 grid gap-12 lg:grid-cols-[5fr_6fr]">
          <div>
            <motion.p {...fadeUp(0.1)} className="text-lg leading-8 text-ink-soft">
              Org membership &mdash; human or agent &mdash; is a signed delegation, with no IdP
              in the trust path and no CA contract. Revoking a member writes a durable,
              signed off-boarding record: what they lost, and exactly where their authority
              ended. Proof for a regulator, not &ldquo;trust our logs.&rdquo;
            </motion.p>
            <motion.p {...fadeUp(0.2)} className="mt-6 text-lg leading-8 text-ink-soft">
              Audit reports gate CI and export to HTML or JSON. Evidence bundles verify fully
              offline &mdash; nothing breaks when a vendor is down. And key rotation is a
              signed event, so prior signatures stay valid with nothing to re-sign.
            </motion.p>
            <motion.div {...fadeUp(0.3)} className="mt-8">
              <InkLink href="https://docs.auths.dev/guides/identity/key-rotation/">
                Rotation without broken history
              </InkLink>
            </motion.div>
          </div>

          <motion.div {...fadeUp(0.2)}>
            <InkTerminal label="org lifecycle">
              <Prompt>auths org create --name &quot;Acme Corp&quot;</Prompt>
              <Prompt>auths org add-member --org did:keri:EAcme… --member did:keri:EDev4… --role member</Prompt>
              <Dim className="pt-1"># contractor rolls off — one command, provable record</Dim>
              <Prompt>auths org revoke-member --org did:keri:EAcme… --member did:keri:EDev4…</Prompt>
              <Tick>member revoked — anchored in the org KEL</Tick>
              <Dim>{'  revoked at: KEL seq 17 · lost caps: repo:sign, artifact:publish'}</Dim>
              <Dim className="pt-1"># the audit trail, any time, for anyone who asks</Dim>
              <Prompt>auths org offboarding-log --org did:keri:EAcme…</Prompt>
              <Prompt>auths audit --repo . --format html --require-all-signed --exit-code</Prompt>
            </InkTerminal>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 04 — Prove where code comes from
// ---------------------------------------------------------------------------

export function LedgerSupplyChain() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <SectionMark n="04" title="Prove where code comes from" id="supply-chain" />

        <div className="mt-10 max-w-2xl">
          <motion.p {...fadeUp(0.1)} className="text-lg leading-8 text-ink-soft">
            LiteLLM and Axios were both compromised through stolen publish credentials. With
            Auths, a stolen credential can&apos;t produce a valid signature &mdash; the signing
            key lives in your hardware keychain, not in CI. Signing is one command
            (<span className="font-mono text-[0.93em] text-ink">auths artifact sign release.tar.gz</span>),
            verification works fully offline, and one flag logs a public record to
            Sigstore&apos;s Rekor &mdash; where Auths&apos; own releases live.
          </motion.p>
          <motion.p {...fadeUp(0.2)} className="mt-8 font-display text-xl italic leading-8 text-ink">
            Don&apos;t take our word for it &mdash; verify something yourself, right here, offline:
          </motion.p>
        </div>

        <motion.div {...fadeUp(0.3)} className="mt-8">
          <div className="overflow-hidden rounded-lg shadow-[0_24px_60px_-12px_rgba(28,24,20,0.45)]">
            <VerifyHero />
          </div>
        </motion.div>

        <motion.div {...fadeUp(0.4)} className="mt-8 flex flex-wrap gap-x-10 gap-y-3">
          <InkLink href="https://docs.auths.dev/guides/platforms/ci-cd/">
            Two GitHub Actions, zero secrets
          </InkLink>
          <InkLink href="https://docs.auths.dev/guides/git/verifying-commits/">
            Supply-chain verification docs
          </InkLink>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Compare strip
// ---------------------------------------------------------------------------

const COMPARE_ROWS = [
  { feature: 'Verifies offline / air-gapped', auths: 'Yes — WASM, no server', field: 'Sigstore needs a Rekor call' },
  { feature: 'Survives a stolen CI token', auths: 'Yes — key is hardware-bound', field: 'GPG, SSH, Sigstore: no' },
  { feature: 'Identity survives key rotation', auths: 'Yes — KERI pre-rotation', field: 'Sigstore is ephemeral; GPG is manual' },
  { feature: 'Agent delegation + revocation', auths: 'Scoped, one-command revoke', field: 'Not supported elsewhere' },
] as const;

export function LedgerCompare() {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <div id="compare" className="scroll-mt-24">
          <motion.div {...fadeUp(0)} className="flex items-baseline gap-4">
            <span className="font-mono text-sm font-semibold tracking-widest text-seal">&sect;</span>
            <span className="h-px flex-1 bg-rule" aria-hidden="true" />
          </motion.div>
          <motion.h2
            {...fadeUp(0.05)}
            className="mt-6 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl"
          >
            A fair comparison
          </motion.h2>
        </div>
        <motion.p {...fadeUp(0.1)} className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
          Sigstore has the ecosystem. GPG works offline too. Auths is the column where
          offline verification, persistent identity, and revocation all hold at once.
        </motion.p>

        <motion.div {...fadeUp(0.2)} className="mt-10">
          <table className="w-full">
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.feature} className="border-t border-rule last:border-b">
                  <td className="py-4 pr-4 align-top text-base text-ink sm:w-1/3">{row.feature}</td>
                  <td className="py-4 pr-4 align-top font-mono text-sm text-seal-deep sm:w-1/3">{row.auths}</td>
                  <td className="hidden py-4 align-top font-mono text-sm text-ink-faint sm:table-cell sm:w-1/3">{row.field}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div {...fadeUp(0.3)} className="mt-8">
          <InkLink href="/compare">The full comparison — including where the alternatives win</InkLink>
        </motion.div>
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
          Start with one service, one agent, or one repo.
        </motion.h2>
        <motion.p {...fadeUp(0.15)} className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">
          Open source, offline-first, no account required.
        </motion.p>

        <motion.div {...fadeUp(0.25)} className="mt-10 max-w-2xl">
          <InkTerminal label="install">
            <Prompt>brew install auths-dev/auths-cli/auths</Prompt>
            <Dim>{'  # or: curl -fsSL https://get.auths.dev | sh'}</Dim>
            <Prompt>auths init</Prompt>
            <Tick>identity created — git signing configured</Tick>
          </InkTerminal>
        </motion.div>

        <motion.div {...fadeUp(0.35)} className="mt-10 flex flex-wrap items-center gap-5">
          <a
            href="https://docs.auths.dev/getting-started/install/"
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

const LEDGER_FOOTER_LINKS = [
  { label: 'Machine auth', href: '#auth' },
  { label: 'Agents', href: '#agents' },
  { label: 'Governance', href: '#governance' },
  { label: 'Supply chain', href: '#supply-chain' },
  { label: 'Compare', href: '/compare' },
  { label: 'Docs', href: 'https://docs.auths.dev/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Community', href: '/community' },
  { label: 'GitHub', href: 'https://github.com/auths-dev/auths' },
] as const;

export function LedgerFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-rule px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-baseline sm:justify-between">
        <span className="font-display text-xl font-medium text-ink">Auths</span>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {LEDGER_FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-mono text-xs text-ink-faint transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-2 border-t border-rule pt-6 sm:flex-row sm:justify-between">
        <p className="font-mono text-xs text-ink-faint">&copy; {currentYear} Auths · Apache-2.0</p>
        <p className="font-mono text-xs text-ink-faint">No CA. No blockchain. Just Git and cryptography.</p>
      </div>
    </footer>
  );
}
