'use client';

import { motion } from 'motion/react';
import { Fragment, type ComponentType, type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

// ---------------------------------------------------------------------------
// Shared animation
// ---------------------------------------------------------------------------

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: '-40px' } as const,
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
});

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function LandingHero() {
  return (
    <section className="relative z-10 flex min-h-[85vh] flex-col items-center justify-center px-6">
      <motion.h1
        {...fadeUp(0)}
        className="text-center text-5xl font-bold tracking-tight sm:text-6xl lg:text-8xl"
      >
        Identity for the internet
      </motion.h1>

      <motion.p
        {...fadeUp(0.3)}
        className="mt-6 text-center font-mono text-2xl tracking-tight text-emerald-400 sm:text-3xl lg:text-4xl"
      >
        &hellip;all of it
      </motion.p>

      <motion.div
        {...fadeUp(0.5)}
        className="mt-16 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
      >
        <a
          href="https://docs.auths.dev/getting-started/install/"
          className="inline-flex items-center rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          Get started
        </a>
        <a
          href="https://github.com/bordumb/auths"
          className="inline-flex items-center rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          View on GitHub
        </a>
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Edge verification icons
// ---------------------------------------------------------------------------

function CloudIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  );
}

function GlobeIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function ServerIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}

function ZapIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function CpuIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect width="16" height="16" x="4" y="4" rx="2" />
      <rect width="6" height="6" x="9" y="9" rx="1" />
      <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" />
      <path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" />
      <path d="M9 2v2" /><path d="M9 20v2" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Edge verification diagram
// ---------------------------------------------------------------------------

function EdgeVerificationDiagram() {
  return (
    <div className="mt-12 grid gap-6 md:grid-cols-2">
      {/* Legacy Auth Panel */}
      <motion.div
        {...fadeUp(0.3)}
        className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="font-mono text-sm font-semibold text-zinc-400">Legacy Auth</span>
          <span className="rounded bg-rose-500/10 px-2 py-1 font-mono text-[10px] text-rose-400">I/O Bound</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center space-y-4">
          <div className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <span className="font-mono text-xs text-zinc-300">Edge Worker</span>
            <MonitorIcon size={16} className="text-zinc-500" />
          </div>

          <div className="flex flex-col items-center py-2 text-rose-400/80">
            <span className="font-mono text-[10px] mb-1">Blocking HTTP Request</span>
            <div className="flex h-8 flex-col items-center justify-center gap-1" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500/50 animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500/50 animate-pulse [animation-delay:75ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500/50 animate-pulse [animation-delay:150ms]" />
            </div>
            <span className="font-mono text-[10px] mt-1 text-zinc-500">~150ms latency</span>
          </div>

          <div className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <span className="font-mono text-xs text-zinc-300">Central IdP</span>
            <CloudIcon size={16} className="text-zinc-500" />
          </div>
        </div>
      </motion.div>

      {/* Auths WASM Panel */}
      <motion.div
        {...fadeUp(0.4)}
        className="relative flex flex-col overflow-hidden rounded-xl border border-emerald-500/30 bg-zinc-900 p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
      >
        <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />

        <div className="relative z-10 mb-6 flex items-center justify-between">
          <span className="font-mono text-sm font-semibold text-emerald-400">Auths Verification</span>
          <span className="rounded bg-emerald-500/10 px-2 py-1 font-mono text-[10px] text-emerald-400">CPU Bound</span>
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center space-y-4">
          <div className="flex w-full flex-col gap-2 rounded-lg border border-emerald-500/30 bg-zinc-950 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-zinc-100">Edge Worker</span>
              <MonitorIcon size={16} className="text-emerald-500" />
            </div>

            <div className="ml-4 mt-2 flex items-center justify-between rounded border border-zinc-800 bg-zinc-900 px-3 py-2">
              <span className="font-mono text-[10px] text-zinc-300">Auths WASM Module</span>
              <CpuIcon size={14} className="text-emerald-400" />
            </div>
          </div>

          <div className="flex items-center gap-2 py-2 text-emerald-400">
            <ZapIcon size={14} className="fill-emerald-400/20" />
            <span className="font-mono text-xs font-medium">Local Ed25519 Math</span>
          </div>

          <div className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3 opacity-50">
            <span className="font-mono text-xs text-zinc-500 line-through">Network Calls</span>
            <span className="font-mono text-xs font-bold text-emerald-500">0</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// On the edge
// ---------------------------------------------------------------------------

export function LandingOnTheEdge() {
  return (
    <section className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          {...fadeUp(0)}
          className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          On the edge
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="mt-6 text-lg leading-8 text-zinc-400"
        >
          Verification runs where your code runs. The Auths verifier compiles to
          WebAssembly and executes in browsers, edge functions, and embedded
          runtimes. No network calls. No trust delegation. Proof at the point of
          use.
        </motion.p>
        <motion.div {...fadeUp(0.2)} className="mt-8">
          <a
            href="https://docs.auths.dev/sdks/overview"
            className="font-mono text-sm text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Documentation &rarr;
          </a>
        </motion.div>

        <motion.div
          {...fadeUp(0.25)}
          className="mt-10 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60"
        >
          <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" aria-hidden="true" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" aria-hidden="true" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" aria-hidden="true" />
            <span className="ml-2 font-mono text-xs text-zinc-600">
              verify.ts
            </span>
          </div>
          <pre className="overflow-x-auto px-5 py-4 font-mono text-sm leading-relaxed">
            <code>
              <span className="text-pink-400">import</span>
              <span className="text-zinc-300">{' { '}</span>
              <span className="text-emerald-300">verify</span>
              <span className="text-zinc-300">{' } '}</span>
              <span className="text-pink-400">from</span>
              <span className="text-amber-300">{' "@auths/wasm"'}</span>
              <span className="text-zinc-500">;</span>
              {'\n\n'}
              <span className="text-purple-400">const</span>
              <span className="text-zinc-300"> result </span>
              <span className="text-pink-400">=</span>
              <span className="text-purple-400"> await</span>
              <span className="text-blue-400"> verify</span>
              <span className="text-zinc-300">(signature, payload)</span>
              <span className="text-zinc-500">;</span>
              {'\n'}
              <span className="text-zinc-600">{'// { valid: true, signer: "did:auths:Ek9..." }'}</span>
            </code>
          </pre>
        </motion.div>

        <EdgeVerificationDiagram />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// In the cloud
// ---------------------------------------------------------------------------

export function LandingInTheCloud() {
  return (
    <section className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          {...fadeUp(0)}
          className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          In the cloud
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="mt-6 text-lg leading-8 text-zinc-400"
        >
          The Auths registry is the public anchor for identities. Register,
          discover, and verify — backed by a hosted API with OIDC bridging,
          organization management, and usage-based billing. Or run your own.
        </motion.p>
        <motion.div {...fadeUp(0.2)} className="mt-8">
          <a
            href="https://auths.dev/registry"
            className="font-mono text-sm text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Dashboard &rarr;
          </a>
        </motion.div>

        <CloudTopologyDiagram />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Cloud topology diagram
// ---------------------------------------------------------------------------

function CloudTopologyDiagram() {
  return (
    <div className="mt-12 flex flex-col items-center justify-center gap-4 md:flex-row md:gap-0">

      {/* Legacy Apps */}
      <motion.div
        {...fadeUp(0.2)}
        className="flex w-full max-w-[220px] flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      >
        <GlobeIcon size={24} className="mb-3 text-sky-400" />
        <span className="font-mono text-sm font-semibold text-zinc-200">Legacy Apps</span>
        <span className="mt-1 text-center text-xs text-zinc-500">Standard web apps &amp; SaaS</span>
      </motion.div>

      {/* OIDC Bridge connector */}
      <motion.div
        {...fadeUp(0.3)}
        className="relative flex h-16 w-[2px] shrink-0 items-center justify-center bg-zinc-800 md:h-[2px] md:w-24"
      >
        {/* Mobile: animate Y */}
        <motion.div
          className="absolute h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] md:hidden"
          animate={{ y: ['-30px', '30px'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
        />
        {/* Desktop: animate X */}
        <motion.div
          className="absolute hidden h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] md:block"
          animate={{ x: ['-44px', '44px'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
        />
        <div className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-400 md:-top-8 md:left-1/2 md:-translate-x-1/2 md:translate-y-0">
          OIDC Bridge
        </div>
      </motion.div>

      {/* Auths Cloud */}
      <motion.div
        {...fadeUp(0.4)}
        className="relative z-10 flex w-full max-w-[260px] flex-col items-center rounded-xl border border-emerald-500/30 bg-zinc-900 p-6 shadow-[0_0_40px_rgba(16,185,129,0.15)]"
      >
        <CloudIcon size={28} className="mb-3 text-emerald-400" />
        <span className="font-mono text-base font-bold text-emerald-400">Auths Cloud</span>
        <div className="mt-4 flex w-full flex-col gap-2">
          {['Public Anchor', 'Hosted API', 'Org Management'].map((label) => (
            <div key={label} className="flex items-center justify-between rounded bg-zinc-950 px-3 py-1.5">
              <span className="font-mono text-[10px] text-zinc-400">{label}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* KEL Sync connector */}
      <motion.div
        {...fadeUp(0.5)}
        className="relative flex h-16 w-[2px] shrink-0 items-center justify-center bg-zinc-800 md:h-[2px] md:w-24"
      >
        {/* Mobile: animate Y (upward toward cloud) */}
        <motion.div
          className="absolute h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)] md:hidden"
          animate={{ y: ['30px', '-30px'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
        />
        {/* Desktop: animate X (leftward toward cloud) */}
        <motion.div
          className="absolute hidden h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)] md:block"
          animate={{ x: ['44px', '-44px'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-zinc-400 md:-top-8 md:left-1/2 md:right-auto md:-translate-x-1/2 md:translate-y-0">
          Sync KELs
        </div>
      </motion.div>

      {/* Self-Hosted */}
      <motion.div
        {...fadeUp(0.6)}
        className="flex w-full max-w-[220px] flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
      >
        <ServerIcon size={24} className="mb-3 text-purple-400" />
        <span className="font-mono text-sm font-semibold text-zinc-200">Self-Hosted</span>
        <span className="mt-1 text-center text-xs text-zinc-500">Run your own node</span>
      </motion.div>

    </div>
  );
}

// ---------------------------------------------------------------------------
// Start building
// ---------------------------------------------------------------------------

const BUILD_LINKS = [
  {
    label: 'SDK',
    detail: 'auths-sdk on crates.io',
    href: 'https://crates.io/crates/auths-sdk',
  },
  {
    label: 'CLI',
    detail: 'cargo install auths-cli',
    href: 'https://crates.io/crates/auths-cli',
  },
  {
    label: 'Source',
    detail: 'GitHub repository',
    href: 'https://github.com/bordumb/auths',
  },
  {
    label: 'Docs',
    detail: 'docs.auths.dev',
    href: 'https://docs.auths.dev',
  },
] as const;

export function LandingStartBuilding() {
  return (
    <section className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          {...fadeUp(0)}
          className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Start building
        </motion.h2>
        <motion.ul
          className="mt-10 grid gap-4 sm:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {BUILD_LINKS.map((link) => (
            <motion.li key={link.label} variants={staggerItem}>
              <a
                href={link.href}
                className="group flex items-baseline justify-between rounded-lg border border-zinc-800 px-5 py-4 transition-colors hover:border-zinc-600"
              >
                <div>
                  <span className="font-mono text-sm font-semibold text-zinc-200">
                    {link.label}
                  </span>
                  <span className="ml-3 text-sm text-zinc-500">
                    {link.detail}
                  </span>
                </div>
                <span className="font-mono text-xs text-zinc-600 transition-colors group-hover:text-emerald-400" aria-hidden="true">
                  &rarr;
                </span>
              </a>
            </motion.li>
          ))}
        </motion.ul>

        <motion.div {...fadeUp(0.4)} className="mt-8 w-full">
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-2xl">
            <div className="flex items-center border-b border-zinc-800 px-4 py-3">
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="h-3 w-3 rounded-full bg-zinc-700" />
                <span className="h-3 w-3 rounded-full bg-zinc-700" />
                <span className="h-3 w-3 rounded-full bg-zinc-700" />
              </div>
              <span className="ml-4 font-mono text-xs text-zinc-600">terminal</span>
            </div>
            <div className="space-y-2 px-5 py-4 font-mono text-sm text-zinc-300">
              <p>
                <span className="select-none text-emerald-400">~ $ </span>
                cargo install auths-cli
              </p>
              <p>
                <span className="select-none text-emerald-400">~ $ </span>
                auths init
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// What Auths identifies
// ---------------------------------------------------------------------------

const IDENTITY_TYPES = [
  {
    name: 'Humans',
    description:
      'Cryptographic identity rooted in keys you control. Linked across devices. Recoverable through pre-rotation. No passwords, no central provider.',
  },
  {
    name: 'Devices',
    description:
      'Hardware-bound attestations tie identity to physical machines. Laptops, phones, servers — each with its own key, delegated from the human.',
  },
  {
    name: 'Organizations',
    description:
      'Hierarchical identity with delegation chains. Provision identities for teams, revoke on departure, audit everything.',
  },
  {
    name: 'AI Agents',
    description:
      'Agents get real identity — not API keys. Scoped capabilities, attributable actions, revocable access. Every action is cryptographically signed and traceable.',
  },
] as const;

export function LandingIdentityTypes() {
  return (
    <section className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          {...fadeUp(0)}
          className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Identity for
        </motion.h2>
        <motion.dl
          className="mt-12 space-y-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {IDENTITY_TYPES.map((type) => (
            <motion.div key={type.name} variants={staggerItem}>
              <dt className="font-mono text-lg font-semibold text-emerald-400">
                {type.name}
              </dt>
              <dd className="mt-2 leading-7 text-zinc-400">
                {type.description}
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Delegation chain diagram (animated)
// ---------------------------------------------------------------------------

function FingerprintIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
      <path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
    </svg>
  );
}

function BuildingIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}

function MonitorIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

function BotIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

interface ChainNode {
  id: string;
  icon: ComponentType<IconProps>;
  title: string;
  subtitle: string;
  glow: string;
  borderColor?: string;
  iconColor: string;
}

const CHAIN_NODES: ChainNode[] = [
  {
    id: 'human',
    icon: FingerprintIcon,
    title: 'Human',
    subtitle: 'KERI Identity',
    glow: 'shadow-[0_0_30px_rgba(255,255,255,0.1)]',
    iconColor: 'text-zinc-300',
  },
  {
    id: 'organization',
    icon: BuildingIcon,
    title: 'Organization',
    subtitle: 'Delegation Chain',
    glow: 'shadow-[0_0_30px_rgba(14,165,233,0.15)]',
    iconColor: 'text-sky-400',
  },
  {
    id: 'device',
    icon: MonitorIcon,
    title: 'Device',
    subtitle: 'Attestation + Key',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.15)]',
    iconColor: 'text-purple-400',
  },
  {
    id: 'agent',
    icon: BotIcon,
    title: 'Agent',
    subtitle: 'Scoped Capability',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]',
    borderColor: 'border-emerald-500/50',
    iconColor: 'text-emerald-400',
  },
];

const chainNodeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const chainHLineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: 0.8, ease: 'easeInOut' as const } },
};

const chainVLineVariants = {
  hidden: { scaleY: 0, opacity: 0 },
  visible: { scaleY: 1, opacity: 1, transition: { duration: 0.8, ease: 'easeInOut' as const } },
};

function DelegationChainDiagram() {
  return (
    <div className="mt-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 sm:p-8">
      <motion.div
        className="flex flex-col items-center md:flex-row md:justify-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        transition={{ staggerChildren: 0.3 }}
      >
        {CHAIN_NODES.map((node, i) => {
          const Icon = node.icon;
          return (
            <Fragment key={node.id}>
              <motion.div
                variants={chainNodeVariants}
                className={`relative z-10 flex h-20 w-36 shrink-0 flex-col items-center justify-center rounded-xl border bg-zinc-900 ${node.borderColor || 'border-zinc-800'} ${node.glow}`}
              >
                <Icon size={22} className={`mb-1.5 ${node.iconColor}`} />
                <span className="text-xs font-semibold text-zinc-100">
                  {node.title}
                </span>
                <span className="text-[11px] text-zinc-300">
                  {node.subtitle}
                </span>
              </motion.div>

              {i < CHAIN_NODES.length - 1 && (
                <motion.div
                  variants={chainHLineVariants}
                  className="hidden h-[2px] w-10 shrink-0 origin-left bg-gradient-to-r from-zinc-600 to-zinc-500 md:block"
                  aria-hidden="true"
                />
              )}

              {i < CHAIN_NODES.length - 1 && (
                <motion.div
                  variants={chainVLineVariants}
                  className="my-2 h-6 w-[2px] shrink-0 origin-top bg-gradient-to-b from-zinc-600 to-zinc-500 md:hidden"
                  aria-hidden="true"
                />
              )}
            </Fragment>
          );
        })}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Architecture
// ---------------------------------------------------------------------------

export function LandingArchitecture() {
  return (
    <section className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          {...fadeUp(0)}
          className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Built on KERI
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="mt-6 text-lg leading-8 text-zinc-400"
        >
          Key Event Receipt Infrastructure. An IETF Internet-Draft for
          decentralized identity that requires no blockchain, no central
          authority, and no trust assumptions. Identities are self-certifying.
          Verification is autonomous. The protocol is the trust.
        </motion.p>

        <DelegationChainDiagram />

        <motion.div {...fadeUp(0.25)} className="mt-8">
          <a
            href="https://weboftrust.github.io/ietf-keri/draft-ssmith-keri.html"
            className="font-mono text-sm text-emerald-400 transition-colors hover:text-emerald-300"
          >
            KERI specification &rarr;
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Bottom CTA
// ---------------------------------------------------------------------------

export function LandingBottomCTA() {
  return (
    <section className="relative z-10 px-6 py-24 sm:py-32 text-center">
      <motion.h2
        {...fadeUp(0)}
        className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
      >
        Ready to build?
      </motion.h2>
      <motion.div {...fadeUp(0.1)} className="mt-8 flex justify-center">
        <a
          href="https://docs.auths.dev/getting-started/install/"
          className="inline-flex items-center rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          Read the documentation
        </a>
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-zinc-800/60 px-6 py-12">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <nav className="flex gap-6 font-mono text-sm text-zinc-500" aria-label="Footer">
          <a
            href="https://github.com/bordumb/auths"
            className="transition-colors hover:text-zinc-300"
          >
            GitHub
          </a>
          <a
            href="https://docs.auths.dev/getting-started/install/"
            className="transition-colors hover:text-zinc-300"
          >
            Docs
          </a>
          <a
            href="https://auths.dev/registry"
            className="transition-colors hover:text-zinc-300"
          >
            Registry
          </a>
        </nav>
        <p className="font-mono text-xs text-zinc-600">Apache 2.0</p>
      </div>
    </footer>
  );
}
