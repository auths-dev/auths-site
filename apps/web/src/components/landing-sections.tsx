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
          href="https://docs.auths.dev/getting-started"
          className="inline-flex items-center rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          Get started
        </a>
        <a
          href="https://github.com/AID-Bound/auths-base"
          className="inline-flex items-center rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          View on GitHub
        </a>
      </motion.div>
    </section>
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
            href="https://docs.auths.dev/verifier"
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
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="ml-2 font-mono text-xs text-zinc-600">
              verify.ts
            </span>
          </div>
          <pre className="overflow-x-auto px-5 py-4 font-mono text-sm leading-relaxed text-zinc-300">
            <code>{`import { verify } from "@auths/wasm";

const result = await verify(signature, payload);
// { valid: true, signer: "did:auths:Ek9..." }`}</code>
          </pre>
        </motion.div>
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
            href="https://auths.dev"
            className="font-mono text-sm text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Dashboard &rarr;
          </a>
        </motion.div>
      </div>
    </section>
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
    href: 'https://github.com/AID-Bound/auths-base',
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
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {BUILD_LINKS.map((link, i) => (
            <motion.a
              key={link.label}
              href={link.href}
              {...fadeUp(i * 0.08)}
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
              <span className="font-mono text-xs text-zinc-600 transition-colors group-hover:text-emerald-400">
                &rarr;
              </span>
            </motion.a>
          ))}
        </div>
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
        <div className="mt-12 space-y-12">
          {IDENTITY_TYPES.map((type, i) => (
            <motion.div key={type.name} {...fadeUp(i * 0.1)}>
              <h3 className="font-mono text-lg font-semibold text-emerald-400">
                {type.name}
              </h3>
              <p className="mt-2 leading-7 text-zinc-400">
                {type.description}
              </p>
            </motion.div>
          ))}
        </div>
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
                <span className="text-[10px] text-zinc-400">
                  {node.subtitle}
                </span>
              </motion.div>

              {i < CHAIN_NODES.length - 1 && (
                <motion.div
                  variants={chainHLineVariants}
                  className="hidden h-[2px] w-10 shrink-0 origin-left bg-gradient-to-r from-zinc-600 to-zinc-500 md:block"
                />
              )}

              {i < CHAIN_NODES.length - 1 && (
                <motion.div
                  variants={chainVLineVariants}
                  className="my-2 h-6 w-[2px] shrink-0 origin-top bg-gradient-to-b from-zinc-600 to-zinc-500 md:hidden"
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
// Footer
// ---------------------------------------------------------------------------

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-zinc-800/60 px-6 py-12">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <div className="flex gap-6 font-mono text-sm text-zinc-500">
          <a
            href="https://github.com/AID-Bound/auths-base"
            className="transition-colors hover:text-zinc-300"
          >
            GitHub
          </a>
          <a
            href="https://docs.auths.dev"
            className="transition-colors hover:text-zinc-300"
          >
            Docs
          </a>
          <a
            href="https://auths.dev"
            className="transition-colors hover:text-zinc-300"
          >
            Registry
          </a>
        </div>
        <p className="font-mono text-xs text-zinc-600">Apache 2.0</p>
      </div>
    </footer>
  );
}
