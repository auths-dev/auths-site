'use client';

import { motion } from 'motion/react';
import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function KeyIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function AlertIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ArrowRightIcon({ size = 14, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function BiometricIcon({ size = 18, className, ...props }: IconProps) {
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

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

interface TokenRow {
  file: string;
  token: string;
  target: string;
}

const TRADITIONAL_TOKENS: TokenRow[] = [
  { file: '~/.npmrc', token: 'npm_a3f8Kx9...', target: 'npm registry' },
  { file: '~/.pypirc', token: 'pypi_9x2Lm...', target: 'PyPI' },
  { file: '~/.docker', token: 'dckr_pat_k7...', target: 'Docker Hub' },
  { file: 'CI secrets', token: 'ghp_mN4Qw8...', target: 'GitHub API' },
];

const LEAK_VECTORS = [
  '.env files committed to Git',
  'CI secret variables with no rotation',
  'Slack messages and shared vaults',
  'Docker build layers pushed public',
];

function TraditionalDiagram() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className="p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <AlertIcon size={16} className="text-[#c0442e]" />
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#c0442e]">
          Traditional: Bearer Tokens
        </span>
      </div>

      <div className="space-y-2">
        {TRADITIONAL_TOKENS.map((row) => (
          <motion.div
            key={row.file}
            variants={itemVariants}
            className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2"
          >
            <KeyIcon size={14} className="shrink-0 text-[#c0442e]/60" />
            <span className="w-20 shrink-0 font-mono text-xs text-stone-500">{row.file}</span>
            <ArrowRightIcon size={12} className="shrink-0 text-stone-600" />
            <span className="font-mono text-xs text-[#c0442e]/80">{row.token}</span>
            <ArrowRightIcon size={12} className="shrink-0 text-stone-600" />
            <span className="font-mono text-xs text-stone-400">{row.target}</span>
          </motion.div>
        ))}
      </div>

      <motion.div variants={itemVariants} className="mt-4 space-y-1">
        {LEAK_VECTORS.map((v) => (
          <div key={v} className="flex items-center gap-2 pl-1">
            <span className="h-1 w-1 shrink-0 rounded-full bg-[#c0442e]/40" />
            <span className="text-xs text-stone-500">{v}</span>
          </div>
        ))}
      </motion.div>

      <motion.p variants={itemVariants} className="mt-4 text-xs text-[#c0442e]/80">
        4 credentials. 4 rotation policies. 4 attack surfaces. Zero connection between them.
      </motion.p>
    </motion.div>
  );
}

function AuthsDiagram() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className="p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <ShieldIcon size={16} className="text-[#e8845c]" />
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#e8845c]">
          Auths: Device-Bound Identity
        </span>
      </div>

      <div className="space-y-3">
        {/* Device keychain */}
        <motion.div
          variants={itemVariants}
          className="rounded-lg border border-[#e8845c]/20 bg-[#e8845c]/5 px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <BiometricIcon size={16} className="text-[#e8845c]" />
            <span className="font-mono text-xs font-medium text-[#e8845c]">Device Keychain</span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Private key (Ed25519) — never leaves this device
          </p>
        </motion.div>

        {/* Arrow down */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="h-4 w-px bg-gradient-to-b from-[#e8845c]/50 to-[#e8845c]/20" />
            <span className="text-[10px] text-[#e8845c]/60">signs</span>
            <div className="h-4 w-px bg-gradient-to-b from-[#e8845c]/20 to-[#e8845c]/50" />
          </div>
        </motion.div>

        {/* DID identity */}
        <motion.div
          variants={itemVariants}
          className="rounded-lg border border-[#e8845c]/40 bg-[#e8845c]/10 px-4 py-3 shadow-[0_0_30px_rgba(232,132,92,0.08)]"
        >
          <div className="flex items-center gap-2">
            <ShieldIcon size={16} className="text-[#e8845c]" />
            <span className="font-mono text-xs font-medium text-[#e8845c]">
              id: &lt;root&gt; · yours
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {['npm', 'PyPI', 'Docker', 'GitHub', 'any registry'].map((target) => (
              <span
                key={target}
                className="rounded-full border border-[#e8845c]/20 bg-[#e8845c]/10 px-2 py-0.5 text-[10px] text-[#e8845c]/80"
              >
                {target}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="mt-4 space-y-1">
        {[
          'Verifiable by anyone (public identifier)',
          'Revocable instantly (one operation, global effect)',
          'Rotatable without losing history (pre-rotation built in)',
        ].map((v) => (
          <div key={v} className="flex items-center gap-2 pl-1">
            <span className="h-1 w-1 shrink-0 rounded-full bg-[#e8845c]/40" />
            <span className="text-xs text-stone-500">{v}</span>
          </div>
        ))}
      </motion.div>

      <motion.p variants={itemVariants} className="mt-4 text-xs text-[#e8845c]/80">
        1 identity. 1 device-bound key. Zero copyable secrets.
      </motion.p>
    </motion.div>
  );
}

function ArtifactFrame({ label, tag, children }: { label: string; tag?: string; children: ReactNode }) {
  return (
    <div className="not-prose my-8 overflow-hidden rounded-lg bg-[#15130f] shadow-[0_24px_60px_-12px_rgba(28,24,20,0.45)] ring-1 ring-black/20">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-2.5">
        <span className="font-mono text-[11px] tracking-wider text-stone-500">{label}</span>
        {tag ? <span className="font-mono text-[11px] text-stone-600">{tag}</span> : null}
      </div>
      {children}
    </div>
  );
}

export function ApiKeyComparisonDiagram({ variant }: { variant: 'traditional' | 'auths' | 'both' }) {
  if (variant === 'traditional') {
    return (
      <ArtifactFrame label="credentials" tag="bearer tokens">
        <TraditionalDiagram />
      </ArtifactFrame>
    );
  }

  if (variant === 'auths') {
    return (
      <ArtifactFrame label="credentials" tag="device-bound identity">
        <AuthsDiagram />
      </ArtifactFrame>
    );
  }

  return (
    <ArtifactFrame label="credentials" tag="bearer tokens vs device-bound">
      <div className="grid grid-cols-1 divide-y divide-white/5 md:grid-cols-2 md:divide-x md:divide-y-0">
        <TraditionalDiagram />
        <AuthsDiagram />
      </div>
    </ArtifactFrame>
  );
}
