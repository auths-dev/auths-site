'use client';

import { motion } from 'motion/react';
import { Fragment, type ComponentType, type SVGProps } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

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
// Tech Stack
// ---------------------------------------------------------------------------

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <Highlight theme={themes.oneDark} code={code} language={language}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre className="overflow-x-auto rounded-lg border border-zinc-800/80 bg-zinc-900/80 p-4 font-mono text-[11px] leading-relaxed">
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

function RustIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" fill="currentColor" className={className} {...props}>
      <path d="M485.347556 186.360889a25.322667 25.322667 0 0 1 50.652444 0 25.322667 25.322667 0 0 1-50.652444 0M183.224889 415.658667a25.322667 25.322667 0 0 1 50.652444 0 25.322667 25.322667 0 0 1-50.652444 0m604.231111 1.180444a25.322667 25.322667 0 0 1 50.652444 0 25.322667 25.322667 0 0 1-50.652444 0m-530.922667 34.702222a23.125333 23.125333 0 0 0 11.740445-30.506666l-11.235556-25.415111h44.188445v199.182222H212.074667a311.800889 311.800889 0 0 1-10.097778-119.025778z m184.846223 4.892445V397.724444h105.230222c5.432889 0 38.378667 6.279111 38.378666 30.912 0 20.458667-25.265778 27.790222-46.044444 27.790223z m-143.665778 316.103111a25.322667 25.322667 0 0 1 50.652444 0 25.322667 25.322667 0 0 1-50.652444 0m375.246222 1.180444a25.322667 25.322667 0 0 1 50.652444 0 25.322667 25.322667 0 0 1-50.652444 0m7.829333-57.429333a23.082667 23.082667 0 0 0-27.420444 17.763556l-12.707556 59.320888a311.800889 311.800889 0 0 1-260.024889-1.244444l-12.707555-59.320889a23.082667 23.082667 0 0 0-27.406222-17.756444l-52.373334 11.242666a311.800889 311.800889 0 0 1-27.079111-31.914666h254.819556c2.887111 0 4.807111-0.526222 4.807111-3.150223V601.088c0-2.624-1.92-3.143111-4.807111-3.143111h-74.524445v-57.137778h80.604445c7.36 0 39.338667 2.104889 49.564444 42.986667 3.2 12.572444 10.24 53.468444 15.047111 66.56 4.792889 14.684444 24.298667 44.017778 45.084445 44.017778h131.562666a311.800889 311.800889 0 0 1-28.871111 33.422222z m141.496889-237.994667a311.800889 311.800889 0 0 1 0.661334 54.129778h-31.992889c-3.2 0-4.487111 2.104889-4.487111 5.240889v14.691556c0 34.581333-19.498667 42.097778-36.586667 44.017777-16.270222 1.834667-34.311111-6.812444-36.536889-16.768-9.6-53.994667-25.6-65.521778-50.858667-85.447111 31.352889-19.911111 63.971556-49.28 63.971556-88.583111 0-42.453333-29.098667-69.184-48.931556-82.289778-27.832889-18.346667-58.638222-22.016-66.951111-22.016H279.722667A311.800889 311.800889 0 0 1 454.165333 202.808889l38.997334 40.910222a23.061333 23.061333 0 0 0 32.64 0.746667l43.640889-41.735111a311.800889 311.800889 0 0 1 213.454222 152.035555l-29.873778 67.463111a23.153778 23.153778 0 0 0 11.747556 30.506667z m74.503111 1.095111l-1.016889-10.432 30.769778-28.700444c6.257778-5.831111 3.911111-17.578667-4.081778-20.558222l-39.338666-14.705778-3.079111-10.154667 24.533333-34.076444c5.006222-6.926222 0.412444-17.991111-8.014222-19.370667l-41.479111-6.748444-4.977778-9.315556 17.422222-38.257778c3.569778-7.786667-3.057778-17.749333-11.633778-17.422222l-42.097777 1.464889-6.648889-8.071111 9.671111-41.002667c1.955556-8.32-6.492444-16.782222-14.819556-14.826666l-40.995555 9.664-8.078223-6.648889 1.472-42.097778c0.327111-8.519111-9.649778-15.182222-17.422222-11.640889l-38.250666 17.436445-9.315556-4.999112-6.755556-41.479111c-1.372444-8.412444-12.444444-13.013333-19.363555-8.021333l-34.104889 24.533333-10.133333-3.072-14.705778-39.338666c-2.986667-8.014222-14.734222-10.325333-20.551111-4.096l-28.700445 30.791111-10.432-1.016889-22.165333-35.811556c-4.48-7.253333-16.483556-7.253333-20.949333 0l-22.165334 35.811556-10.432 1.016889-28.707555-30.791111c-5.824-6.229333-17.564444-3.918222-20.551111 4.096l-14.712889 39.338666-10.140445 3.072-34.097777-24.533333c-6.926222-4.999111-17.991111-0.391111-19.363556 8.021333l-6.762667 41.479111-9.315555 4.999112-38.250667-17.436445c-7.772444-3.555556-17.749333 3.121778-17.422222 11.640889l1.464889 42.097778-8.078222 6.648889-40.995556-9.671111c-8.327111-1.934222-16.782222 6.506667-14.833778 14.833777l9.656889 41.002667-6.634667 8.071111-42.097777-1.464889c-8.483556-0.248889-15.175111 9.635556-11.640889 17.422222l17.443555 38.257778-4.999111 9.315556-41.472 6.748444c-8.426667 1.365333-12.992 12.444444-8.021333 19.370667l24.533333 34.076444-3.079111 10.154667-39.338667 14.705778c-7.985778 2.986667-10.325333 14.72-4.081777 20.558222l30.776889 28.700444-1.016889 10.432-35.804445 22.158223c-7.253333 4.48-7.253333 16.483556 0 20.949333l35.804445 22.165333 1.016889 10.432-30.776889 28.707556c-6.243556 5.816889-3.904 17.550222 4.081777 20.551111l39.338667 14.705778 3.079111 10.154666-24.533333 34.083556c-4.984889 6.940444-0.398222 18.005333 8.028444 19.363556l41.464889 6.741333 4.999111 9.329778-17.443555 38.243555c-3.555556 7.772444 3.157333 17.777778 11.648 17.429334l42.076444-1.472 6.648889 8.078222-9.656889 41.016889c-1.955556 8.305778 6.506667 16.746667 14.833778 14.791111l40.995556-9.649778 8.085333 6.627556-1.472 42.104888c-0.327111 8.526222 9.649778 15.189333 17.422222 11.633778l38.250667-17.422222 9.315555 4.992 6.755556 41.457778c1.372444 8.440889 12.444444 13.006222 19.377778 8.035555l34.076444-24.554666 10.147556 3.093333 14.712889 39.324444c2.986667 7.985778 14.734222 10.339556 20.551111 4.081778l28.707555-30.776889 10.432 1.038223 22.165334 35.804444c4.465778 7.224889 16.469333 7.239111 20.949333 0l22.165333-35.804444 10.432-1.038223 28.700445 30.776889c5.816889 6.257778 17.564444 3.904 20.551111-4.081778l14.705778-39.324444 10.154666-3.093333 34.083556 24.554666c6.926222 4.970667 17.991111 0.391111 19.356444-8.035555l6.769778-41.457778 9.315556-4.999111 38.243555 17.429333c7.772444 3.555556 17.728-3.093333 17.422222-11.633778l-1.464889-42.097777 8.071112-6.634667 40.995555 9.649778c8.327111 1.955556 16.782222-6.485333 14.826667-14.791111l-9.656889-41.016889 6.627555-8.078222 42.097778 1.472c8.490667 0.341333 15.203556-9.656889 11.633778-17.429334l-17.422222-38.243555 4.977778-9.329778 41.479111-6.741333c8.440889-1.351111 13.020444-12.423111 8.014222-19.363556l-24.533333-34.083556 3.079111-10.154666 39.338666-14.705778c8-3.000889 10.339556-14.734222 4.081778-20.551111l-30.769778-28.707556 1.016889-10.432 35.804445-22.165333c7.253333-4.465778 7.260444-16.462222 0.007111-20.949333z" />
    </svg>
  );
}

function WasmIcon({ size = 20, className }: IconProps) {
  return (
    <img src="/images/web_assembly_logo.png" width={size} height={size} alt="WebAssembly" className={className} />
  );
}

function GitIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

function FfiIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

const FFI_LANGUAGES = [
  { name: 'Python',     placeholder: '/images/python_logo.png',     href: 'https://docs.auths.dev/sdks/python/quickstart/' },
  { name: 'Go',         placeholder: '/images/go_logo.png',         href: 'https://docs.auths.dev/sdks/go/quickstart/' },
  { name: 'TypeScript', placeholder: '/images/typescript_logo.png', href: 'https://docs.auths.dev/sdks/javascript/quickstart/' },
  { name: 'Swift',      placeholder: '/images/swift_logo.png',      href: 'https://docs.auths.dev/sdks/swift/mobile-identity/' },
];

type TechItem =
  | {
      name: string;
      icon: ComponentType<IconProps>;
      description: string;
      highlight: string;
      borderHover: string;
      bgGlow: string;
      code: string;
      language: string;
      languages?: undefined;
    }
  | {
      name: string;
      icon: ComponentType<IconProps>;
      description: string;
      highlight: string;
      borderHover: string;
      bgGlow: string;
      code?: undefined;
      language?: undefined;
      languages: typeof FFI_LANGUAGES;
    };

const TECH_STACK: TechItem[] = [
  {
    name: 'Rust Core',
    icon: RustIcon,
    description: 'Memory-safe cryptography. Zero-cost abstractions. The entire identity engine is built in Rust for absolute security and predictable performance.',
    highlight: 'text-orange-400',
    borderHover: 'hover:border-orange-500/50',
    bgGlow: 'group-hover:bg-orange-500/5',
    code: `#[derive(Debug, Clone)]\npub struct Identity {\n    pub did: String,\n    pub keys: Vec<Key>,\n}`,
    language: 'rust',
  },
  {
    name: 'WebAssembly',
    icon: WasmIcon,
    description: 'The Rust core compiles down to a lightweight WASM module. Run cryptographic verification natively in the browser or on edge workers.',
    highlight: 'text-purple-400',
    borderHover: 'hover:border-purple-500/50',
    bgGlow: 'group-hover:bg-purple-500/5',
    code: `import { verify } from "@auths/wasm";\n\nawait verify(payload, sig);`,
    language: 'javascript',
  },
  {
    name: 'FFI Bindings',
    icon: FfiIcon,
    description: 'The Rust core exposes a clean C-ABI via FFI, enabling native bindings for any language. Use Auths identity primitives directly in Python, Go, TypeScript, and Swift — no HTTP overhead, no WASM runtime required.',
    highlight: 'text-cyan-400',
    borderHover: 'hover:border-cyan-500/50',
    bgGlow: 'group-hover:bg-cyan-500/5',
    languages: FFI_LANGUAGES,
  },
];

export function LandingTechStack() {
  return (
    <section className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <motion.div {...fadeUp(0)}>
          <h2 className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            The foundation
          </h2>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Engineered for absolute security and maximum portability. We chose a stack that guarantees memory safety without compromising on edge deployment.
          </p>
        </motion.div>

        <motion.div
          className="mt-12 grid gap-6 md:grid-cols-1"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {TECH_STACK.map((tech) => (
            <motion.div
              key={tech.name}
              variants={staggerItem}
              className={`group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 transition-colors duration-300 ${tech.borderHover} ${tech.bgGlow}`}
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">

                {/* Text Content */}
                <div className="md:w-1/2">
                  <div className="flex items-center gap-3">
                    <tech.icon size={24} className={tech.highlight} />
                    <h3 className="font-mono text-xl font-semibold text-zinc-100">
                      {tech.name}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                    {tech.description}
                  </p>
                </div>

                {/* Code Snippet or Logo Grid */}
                <div className="md:w-5/12">
                  {tech.code ? (
                    <CodeBlock code={tech.code} language={tech.language} />
                  ) : tech.languages ? (
                    <div className="grid grid-cols-2 gap-3">
                      {tech.languages.map((lang) => (
                        <a
                          key={lang.name}
                          href={lang.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition-colors duration-200 hover:border-zinc-600 hover:bg-zinc-800/50"
                        >
                          <img src={lang.placeholder} alt={lang.name} className="h-10 w-10 object-contain" />
                          <span className="font-mono text-[11px] text-zinc-500 group-hover:text-zinc-400">{lang.name}</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>

              </div>
            </motion.div>
          ))}
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
