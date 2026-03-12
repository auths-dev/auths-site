'use client';

import { motion } from 'motion/react';
import { Fragment } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Shared animation (duplicated from landing-sections to avoid coupling)
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
// Icons
// ---------------------------------------------------------------------------

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number };

function GitBranchIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
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

function ShieldIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function KeyIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" />
      <path d="m21 2-9.6 9.6" />
      <circle cx="7.5" cy="15.5" r="5.5" />
    </svg>
  );
}

function CloudIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
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

function ClipboardCheckIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}

function SettingsIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
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

function MonitorIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function CloudHero() {
  return (
    <section className="relative z-10 flex min-h-[85vh] flex-col items-center justify-center px-6">
      <motion.p
        {...fadeUp(0)}
        className="font-mono text-sm text-emerald-400"
      >
        Zero Infrastructure
      </motion.p>

      <motion.h1
        {...fadeUp(0.1)}
        className="mt-4 text-center text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
      >
        Software identity for teams that ship
      </motion.h1>

      <motion.p
        {...fadeUp(0.3)}
        className="mt-6 max-w-2xl text-center text-lg text-zinc-400"
      >
        Enterprise identity, policy enforcement, audit trails. Backed by
        cryptography, stored in Git. No servers, no certificates, no vendor
        lock-in.
      </motion.p>

      <motion.div
        {...fadeUp(0.5)}
        className="mt-16 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
      >
        <Link
          href="/cloud/pricing"
          className="inline-flex items-center rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          See Pricing
        </Link>
        <a
          href="https://docs.auths.dev"
          className="inline-flex items-center rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          Read the Docs
        </a>
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Value Props
// ---------------------------------------------------------------------------

const VALUE_PROPS = [
  {
    icon: GitBranchIcon,
    title: 'Zero infrastructure',
    description: 'Git is the only dependency. No certificate authorities, no key servers, no external services to provision or maintain.',
  },
  {
    icon: GlobeIcon,
    title: 'Forge-agnostic',
    description: 'GitHub, GitLab, Bitbucket, Radicle. Auths works with any Git forge — your identity travels with you.',
  },
  {
    icon: CpuIcon,
    title: 'Offline verification',
    description: '200KB WASM module. Verify signatures in browsers, edge functions, and air-gapped environments. No network calls required.',
  },
] as const;

export function CloudValueProps() {
  return (
    <section className="relative z-10 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {VALUE_PROPS.map((prop) => (
            <motion.div
              key={prop.title}
              variants={staggerItem}
              className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 transition-colors hover:border-emerald-500/30"
            >
              <prop.icon size={24} className="mb-4 text-emerald-400" />
              <h3 className="font-mono text-sm font-semibold text-zinc-100">
                {prop.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {prop.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

const COMPARISON_ROWS = [
  { category: 'Identity', traditional: 'Centralized CA (Fulcio)', auths: 'Self-certifying KERI' },
  { category: 'Key Storage', traditional: 'HSM / Vault', auths: 'Platform keychain' },
  { category: 'Transparency', traditional: 'Rekor log', auths: 'Git ref log' },
  { category: 'Revocation', traditional: 'OCSP / CRL', auths: 'Instant key event log' },
  { category: 'Verification', traditional: 'Online API', auths: 'Offline WASM (200KB)' },
] as const;

const COMPETITOR_CALLOUTS = [
  {
    name: 'vs Sigstore',
    description: 'Sigstore requires Fulcio for certificates and Rekor for transparency. Auths is self-certifying with offline verification.',
  },
  {
    name: 'vs GPG',
    description: 'GPG keys are static, hard to rotate, and lack delegation. Auths uses KERI with pre-rotation and hierarchical delegation.',
  },
  {
    name: 'vs GitHub',
    description: 'GitHub\'s "Verified" badge is platform-locked. Auths identity works across any Git forge and verifies offline.',
  },
  {
    name: 'vs Traditional PKI',
    description: 'Traditional PKI needs certificate authorities and revocation infrastructure. Auths stores everything in Git.',
  },
] as const;

export function CloudComparison() {
  return (
    <section className="relative z-10 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          {...fadeUp(0)}
          className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          What five services can do, zero infrastructure does better
        </motion.h2>

        <motion.div
          className="mt-12 grid gap-4 md:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {/* Traditional side */}
          <motion.div
            variants={staggerItem}
            className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <ServerIcon size={18} className="text-zinc-500" />
              <span className="font-mono text-sm font-semibold text-zinc-400">Traditional</span>
            </div>
            <div className="space-y-3">
              {COMPARISON_ROWS.map((row) => (
                <div key={row.category} className="flex items-baseline justify-between rounded-lg bg-zinc-900/50 px-4 py-2.5">
                  <span className="font-mono text-xs text-zinc-500">{row.category}</span>
                  <span className="text-sm text-zinc-400">{row.traditional}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Auths side */}
          <motion.div
            variants={staggerItem}
            className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-zinc-900 p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
          >
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2">
                <ShieldIcon size={18} className="text-emerald-400" />
                <span className="font-mono text-sm font-semibold text-emerald-400">Auths</span>
              </div>
              <div className="space-y-3">
                {COMPARISON_ROWS.map((row) => (
                  <div key={row.category} className="flex items-baseline justify-between rounded-lg bg-zinc-950/50 px-4 py-2.5">
                    <span className="font-mono text-xs text-zinc-500">{row.category}</span>
                    <span className="text-sm text-emerald-300">{row.auths}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Competitor callouts */}
        <motion.div
          className="mt-8 grid gap-4 sm:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {COMPETITOR_CALLOUTS.map((callout) => (
            <motion.div
              key={callout.name}
              variants={staggerItem}
              className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 transition-colors hover:border-zinc-700"
            >
              <h4 className="font-mono text-sm font-semibold text-zinc-200">
                {callout.name}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {callout.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Enterprise Features
// ---------------------------------------------------------------------------

const ENTERPRISE_FEATURES = [
  {
    title: 'IdP Binding',
    description: 'Okta, Entra ID, Google Workspace, SAML 2.0. Bind corporate identities to cryptographic keys. Auto-revoke on IdP departure.',
  },
  {
    title: 'Organization Policy Engine',
    description: 'Declarative policies at Git ref, file path, and environment level. Enforce signing requirements, key rotation, and approval chains.',
  },
  {
    title: 'Workload Identity for CI/CD',
    description: 'Scoped, time-limited identities for runners. No shared secrets. Every build step is cryptographically attributable.',
  },
  {
    title: 'Audit Trails',
    description: 'Cryptographically recorded, queryable. SOC 2, ISO 27001, FedRAMP evidence generated automatically from the key event log.',
  },
  {
    title: 'Self-Hosted Option',
    description: 'Git is the only dependency. Air-gapped environments work out of the box. No phone-home, no license server.',
  },
] as const;

export function CloudEnterprise() {
  return (
    <section className="relative z-10 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          {...fadeUp(0)}
          className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Built for enterprise
        </motion.h2>

        <motion.dl
          className="mt-12 space-y-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {ENTERPRISE_FEATURES.map((feature) => (
            <motion.div key={feature.title} variants={staggerItem}>
              <dt className="font-mono text-lg font-semibold text-emerald-400">
                {feature.title}
              </dt>
              <dd className="mt-2 leading-7 text-zinc-400">
                {feature.description}
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Architecture Diagram
// ---------------------------------------------------------------------------

interface ArchNode {
  id: string;
  icon: React.ComponentType<IconProps>;
  title: string;
  subtitle: string;
  iconColor: string;
  borderColor?: string;
  glow?: string;
  features?: string[];
}

const ARCH_NODES: ArchNode[] = [
  {
    id: 'developer',
    icon: FingerprintIcon,
    title: 'Developer',
    subtitle: 'KERI Identity',
    iconColor: 'text-zinc-300',
  },
  {
    id: 'cloud',
    icon: CloudIcon,
    title: 'Auths Cloud',
    subtitle: 'Control Plane',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    glow: 'shadow-[0_0_40px_rgba(16,185,129,0.15)]',
    features: ['IdP Bridge', 'Policy Engine', 'Registry'],
  },
  {
    id: 'cicd',
    icon: ZapIcon,
    title: 'CI/CD',
    subtitle: 'Workload Identity',
    iconColor: 'text-amber-400',
  },
  {
    id: 'forge',
    icon: GlobeIcon,
    title: 'Any Forge',
    subtitle: 'GitHub · GitLab · Radicle',
    iconColor: 'text-sky-400',
  },
];

const archNodeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const archHLineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: 0.8, ease: 'easeInOut' as const } },
};

const archVLineVariants = {
  hidden: { scaleY: 0, opacity: 0 },
  visible: { scaleY: 1, opacity: 1, transition: { duration: 0.8, ease: 'easeInOut' as const } },
};

export function CloudArchitectureDiagram() {
  return (
    <section className="relative z-10 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          {...fadeUp(0)}
          className="text-center font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          How it fits together
        </motion.h2>

        <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 sm:p-8">
          <motion.div
            className="flex flex-col items-center md:flex-row md:justify-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ staggerChildren: 0.25 }}
          >
            {ARCH_NODES.map((node, i) => {
              const Icon = node.icon;
              return (
                <Fragment key={node.id}>
                  <motion.div
                    variants={archNodeVariants}
                    className={`relative z-10 flex w-40 shrink-0 flex-col items-center rounded-xl border bg-zinc-900 p-5 ${node.borderColor || 'border-zinc-800'} ${node.glow || ''}`}
                  >
                    <Icon size={24} className={`mb-2 ${node.iconColor}`} />
                    <span className="text-xs font-semibold text-zinc-100">{node.title}</span>
                    <span className="mt-0.5 text-center text-[11px] text-zinc-400">{node.subtitle}</span>
                    {node.features && (
                      <div className="mt-3 flex w-full flex-col gap-1.5">
                        {node.features.map((f) => (
                          <div key={f} className="flex items-center justify-between rounded bg-zinc-950 px-2.5 py-1">
                            <span className="font-mono text-[10px] text-zinc-400">{f}</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {i < ARCH_NODES.length - 1 && (
                    <>
                      {/* Desktop connector */}
                      <motion.div
                        variants={archHLineVariants}
                        className="relative hidden h-[2px] w-12 shrink-0 origin-left bg-zinc-700 md:block"
                        aria-hidden="true"
                      >
                        <motion.div
                          className="absolute h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                          animate={{ x: ['-4px', '44px'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
                        />
                      </motion.div>
                      {/* Mobile connector */}
                      <motion.div
                        variants={archVLineVariants}
                        className="my-2 h-8 w-[2px] shrink-0 origin-top bg-zinc-700 md:hidden"
                        aria-hidden="true"
                      >
                        <motion.div
                          className="absolute h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                          animate={{ y: ['-4px', '28px'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
                        />
                      </motion.div>
                    </>
                  )}
                </Fragment>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Bottom CTA
// ---------------------------------------------------------------------------

export function CloudBottomCTA() {
  return (
    <section className="relative z-10 px-6 py-24 sm:py-32 text-center">
      <motion.h2
        {...fadeUp(0)}
        className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
      >
        Start securing your supply chain
      </motion.h2>
      <motion.div
        {...fadeUp(0.1)}
        className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
      >
        <Link
          href="/cloud/pricing"
          className="inline-flex items-center rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          See Pricing
        </Link>
        <a
          href="mailto:sales@auths.dev"
          className="inline-flex items-center rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          Talk to Sales
        </a>
      </motion.div>
    </section>
  );
}
