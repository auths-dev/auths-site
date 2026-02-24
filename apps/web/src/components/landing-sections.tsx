'use client';

import { motion } from 'motion/react';
import { KeyRound, Globe, ShieldCheck, Terminal, Blocks, Cpu, Database, ArrowUpRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: '-60px' } as const,
  transition: { duration: 0.5, delay, ease: 'easeOut' as const },
});

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function LandingHero() {
  return (
    <section className="relative z-10 flex min-h-[80vh] flex-col items-center justify-center px-6 pt-24 pb-16">
      <motion.p
        {...fadeUp(0)}
        className="text-sm font-semibold uppercase tracking-widest text-emerald-400"
      >
        Your Developer Passport
      </motion.p>

      <motion.h1
        {...fadeUp(0.1)}
        className="mt-4 max-w-3xl text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl font-mono"
      >
        Build trust across the web.
      </motion.h1>

      <motion.p
        {...fadeUp(0.2)}
        className="mt-6 max-w-2xl text-center text-lg leading-8 text-zinc-400"
      >
        Verify your identity across GitHub, GitLab, NPM, and AI Agents. Prove
        exactly who you are and what you&apos;ve built, backed by permanent,
        decentralized cryptography.
      </motion.p>

      {/* Quick-start terminal */}
      <motion.div {...fadeUp(0.3)} className="mt-12 w-full max-w-2xl">
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-2xl backdrop-blur-md">
          <div className="flex items-center border-b border-zinc-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-zinc-600" />
              <span className="h-3 w-3 rounded-full bg-zinc-600" />
              <span className="h-3 w-3 rounded-full bg-zinc-600" />
            </div>
            <span className="ml-4 font-mono text-xs text-zinc-600">
              terminal
            </span>
          </div>
          <div className="space-y-2 px-5 py-4 font-mono text-sm text-zinc-300">
            <p>
              <span className="select-none text-emerald-400">~ $ </span>brew install
              auths-base/tap/auths
            </p>
            <p>
              <span className="select-none text-emerald-400">~ $ </span>auths init
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Three Pillars
// ---------------------------------------------------------------------------

const PILLARS = [
  {
    icon: KeyRound,
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-400/10',
    title: 'Sign',
    subtitle: 'Local Identity',
    href: '/docs/getting-started',
    description:
      'Generate a permanent decentralized identity (DID) completely offline. Bind your laptop or CI runners and sign releases without managing raw private keys.',
  },
  {
    icon: ShieldCheck,
    accent: 'text-violet-400',
    accentBg: 'bg-violet-400/10',
    title: 'Verify',
    subtitle: 'Zero-Trust WASM',
    href: '/verify',
    description:
      'Verification happens entirely client-side via WebAssembly. Anyone can audit an artifact\u2019s provenance in their browser or CI pipeline\u2014no network calls required.',
  },
  {
    icon: Globe,
    accent: 'text-blue-400',
    accentBg: 'bg-blue-400/10',
    title: 'Discover',
    subtitle: 'The Web of Trust',
    href: '/registry',
    description:
      'Publish to the Public Registry. Link your GitHub or GitLab so the world knows exactly which DID belongs to you.',
  },
] as const;

export function LandingPillars() {
  return (
    <section className="relative z-10 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <motion.p
            {...fadeUp(0)}
            className="text-sm font-semibold uppercase tracking-widest text-zinc-500"
          >
            How it works
          </motion.p>
          <motion.h2
            {...fadeUp(0.1)}
            className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl font-mono"
          >
            Sign. Verify. Discover.
          </motion.h2>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.a
                key={pillar.title}
                href={pillar.href}
                {...fadeUp(i * 0.15)}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md transition-colors hover:border-white/20"
              >
                <div className={`inline-flex rounded-lg p-2.5 ${pillar.accentBg}`}>
                  <Icon className={`h-6 w-6 ${pillar.accent}`} />
                </div>
                <h3 className="mt-4 text-xl font-bold">{pillar.title}</h3>
                <p className={`mt-1 text-sm font-medium ${pillar.accent}`}>
                  {pillar.subtitle}
                </p>
                <p className="mt-4 leading-7 text-zinc-400">
                  {pillar.description}
                </p>
                <ArrowUpRight className="absolute bottom-6 right-6 h-5 w-5 text-zinc-700 transition-colors group-hover:text-zinc-400" />
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tech Stack Grid
// ---------------------------------------------------------------------------

const TECH_CARDS = [
  {
    icon: Terminal,
    name: 'auths-cli',
    description:
      'Your local control plane and Git-backed ledger. Manages keys, signs artifacts, and syncs with the registry.',
  },
  {
    icon: Blocks,
    name: 'KERI',
    description:
      'The quantum-resilient protocol powering your permanent DID. Key rotation without losing identity continuity.',
  },
  {
    icon: Cpu,
    name: 'auths-verifier',
    description:
      'The portable Rust/WASM verification engine. Runs in browsers, CI pipelines, and edge functions.',
  },
  {
    icon: Database,
    name: 'public.auths.dev',
    description:
      'The optional discovery registry and index. Publishes your identity and links it to platform accounts.',
  },
] as const;

export function LandingTechStack() {
  return (
    <section className="relative z-10 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <motion.p
            {...fadeUp(0)}
            className="text-sm font-semibold uppercase tracking-widest text-zinc-500"
          >
            Architecture
          </motion.p>
          <motion.h2
            {...fadeUp(0.1)}
            className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl font-mono"
          >
            What&apos;s behind the scenes?
          </motion.h2>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
          {TECH_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.name}
                {...fadeUp(i * 0.1)}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-mono text-sm font-semibold text-emerald-400">
                    {card.name}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {card.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
