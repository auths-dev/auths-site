'use client';

import { motion } from 'motion/react';
import type { SVGProps } from 'react';

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

function FingerprintIcon({ size = 18, className, ...props }: IconProps) {
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
      className="rounded-xl border border-red-500/20 bg-red-950/5 p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <AlertIcon size={16} className="text-red-400" />
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-red-400">
          Traditional: Bearer Tokens
        </span>
      </div>

      <div className="space-y-2">
        {TRADITIONAL_TOKENS.map((row) => (
          <motion.div
            key={row.file}
            variants={itemVariants}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2"
          >
            <KeyIcon size={14} className="shrink-0 text-red-400/60" />
            <span className="w-20 shrink-0 font-mono text-xs text-zinc-500">{row.file}</span>
            <ArrowRightIcon size={12} className="shrink-0 text-zinc-700" />
            <span className="font-mono text-xs text-red-300/80">{row.token}</span>
            <ArrowRightIcon size={12} className="shrink-0 text-zinc-700" />
            <span className="font-mono text-xs text-zinc-400">{row.target}</span>
          </motion.div>
        ))}
      </div>

      <motion.div variants={itemVariants} className="mt-4 space-y-1">
        {LEAK_VECTORS.map((v) => (
          <div key={v} className="flex items-center gap-2 pl-1">
            <span className="h-1 w-1 shrink-0 rounded-full bg-red-500/40" />
            <span className="text-xs text-zinc-600">{v}</span>
          </div>
        ))}
      </motion.div>

      <motion.p variants={itemVariants} className="mt-4 text-xs text-red-400/70">
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
      className="rounded-xl border border-emerald-500/30 bg-emerald-950/5 p-6"
    >
      <div className="mb-4 flex items-center gap-2">
        <ShieldIcon size={16} className="text-emerald-400" />
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Auths: Device-Bound Identity
        </span>
      </div>

      <div className="space-y-3">
        {/* Device keychain */}
        <motion.div
          variants={itemVariants}
          className="rounded-lg border border-emerald-800/30 bg-emerald-950/20 px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <FingerprintIcon size={16} className="text-emerald-400" />
            <span className="font-mono text-xs font-medium text-emerald-300">Device Keychain</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Private key (Ed25519) — never leaves this device
          </p>
        </motion.div>

        {/* Arrow down */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="h-4 w-px bg-gradient-to-b from-emerald-500/50 to-emerald-500/20" />
            <span className="text-[10px] text-emerald-500/60">signs</span>
            <div className="h-4 w-px bg-gradient-to-b from-emerald-500/20 to-emerald-500/50" />
          </div>
        </motion.div>

        {/* DID identity */}
        <motion.div
          variants={itemVariants}
          className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 shadow-[0_0_30px_rgba(16,185,129,0.08)]"
        >
          <div className="flex items-center gap-2">
            <ShieldIcon size={16} className="text-emerald-400" />
            <span className="font-mono text-xs font-medium text-emerald-300">
              did:keri:EXTfn3SEW...
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {['npm', 'PyPI', 'Docker', 'GitHub', 'any registry'].map((target) => (
              <span
                key={target}
                className="rounded-full border border-emerald-800/30 bg-emerald-950/40 px-2 py-0.5 text-[10px] text-emerald-400/80"
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
          'Rotatable without losing history (KERI pre-rotation)',
        ].map((v) => (
          <div key={v} className="flex items-center gap-2 pl-1">
            <span className="h-1 w-1 shrink-0 rounded-full bg-emerald-500/40" />
            <span className="text-xs text-zinc-500">{v}</span>
          </div>
        ))}
      </motion.div>

      <motion.p variants={itemVariants} className="mt-4 text-xs text-emerald-400/70">
        1 identity. 1 device-bound key. Zero copyable secrets.
      </motion.p>
    </motion.div>
  );
}

export function ApiKeyComparisonDiagram({ variant }: { variant: 'traditional' | 'auths' | 'both' }) {
  if (variant === 'traditional') return <TraditionalDiagram />;
  if (variant === 'auths') return <AuthsDiagram />;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <TraditionalDiagram />
      <AuthsDiagram />
    </div>
  );
}
