'use client';

import { motion } from 'motion/react';
import { Fragment, useState, type ComponentType, type SVGProps } from 'react';
import { CodeBlock } from '@/components/code-block';
import { Hero as VerifyHero } from '@/components/hero';
import {
  CLI_INSTALL_BREW,
  CLI_INSTALL_CURL,
  CLI_INSTALL_CARGO,
  CLI_CI_SETUP,
} from '@/lib/cli';
import {
  GitCommitHorizontal,
  Users,
  Bot,
  Package,
  ChevronRight,
  AlertCircle,
  Lock,
  WifiOff,
  ShieldCheck,
  Link2,
  History,
  CircleCheck,
  CircleX,
  CircleDot,
  ArrowUpRight,
  User,
} from 'lucide-react';

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
// Custom SVG Icons (preserved)
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

function MonitorIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
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

function BotSvgIcon({ size = 20, className, ...props }: IconProps) {
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

function PackageSvgIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Edge verification diagram (preserved)
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
// Cloud topology diagram (preserved)
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
        <motion.div
          className="absolute h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] md:hidden"
          animate={{ y: ['-30px', '30px'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
        />
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
        <motion.div
          className="absolute h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)] md:hidden"
          animate={{ y: ['30px', '-30px'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatType: 'reverse' }}
        />
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
// Delegation chain diagram (preserved)
// ---------------------------------------------------------------------------

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
    icon: BotSvgIcon,
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
// Tech stack helpers (preserved)
// ---------------------------------------------------------------------------

function LandingCodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <CodeBlock
      code={code}
      language={language}
      className="overflow-x-auto rounded-lg border border-zinc-800/80 bg-zinc-900/80 p-4 font-mono text-[11px] leading-relaxed"
    />
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
  { name: 'Python',     placeholder: '/images/python_logo.png',     href: 'https://docs.auths.dev/sdk/verifier/python/' },
  { name: 'Go',         placeholder: '/images/go_logo.png',         href: 'https://docs.auths.dev/sdk/verifier/ffi/' },
  { name: 'TypeScript', placeholder: '/images/typescript_logo.png', href: 'https://docs.auths.dev/sdk/verifier/wasm/' },
  { name: 'Swift',      placeholder: '/images/swift_logo.png',      href: 'https://github.com/auths-dev/auths/tree/main/packages/auths-verifier-swift' },
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

// ---------------------------------------------------------------------------
// Shared terminal chrome
// ---------------------------------------------------------------------------

function TerminalBlock({ children, label = 'terminal' }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-2xl">
      <div className="flex items-center border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-zinc-700" />
          <span className="h-3 w-3 rounded-full bg-zinc-700" />
          <span className="h-3 w-3 rounded-full bg-zinc-700" />
        </div>
        <span className="ml-4 font-mono text-xs text-zinc-600">{label}</span>
      </div>
      <div className="space-y-2 px-5 py-4 font-mono text-sm text-zinc-300">
        {children}
      </div>
    </div>
  );
}

// ===========================================================================
// TABBED INSTALL TERMINAL
// ===========================================================================

const INSTALL_TABS = [
  { id: 'brew', label: 'macOS', cmd: CLI_INSTALL_BREW },
  { id: 'curl', label: 'Linux', cmd: CLI_INSTALL_CURL },
  { id: 'cargo', label: 'Cargo', cmd: CLI_INSTALL_CARGO },
] as const;

function HeroInstallTerminal() {
  const [tab, setTab] = useState<string>('brew');
  const activeCmd = INSTALL_TABS.find((t) => t.id === tab)?.cmd ?? CLI_INSTALL_BREW;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-zinc-700" />
          <span className="h-3 w-3 rounded-full bg-zinc-700" />
          <span className="h-3 w-3 rounded-full bg-zinc-700" />
        </div>
        <div className="flex gap-1">
          {INSTALL_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded px-2.5 py-1 font-mono text-xs transition-colors ${
                tab === t.id
                  ? 'bg-zinc-800 text-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2 px-5 py-4 font-mono text-sm text-zinc-300">
        <p>
          <span className="select-none text-emerald-400">~ $ </span>
          {activeCmd}
        </p>
        <p>
          <span className="select-none text-emerald-400">~ $ </span>
          auths init
        </p>
        <p className="text-emerald-400">✓ Identity created: did:keri:E8jsh...</p>
        <p className="text-emerald-400">✓ Git signing configured</p>
        <p className="text-emerald-400">✓ Ready. Every commit is now signed.</p>
      </div>
    </div>
  );
}

// ===========================================================================
// SECTIONS
// ===========================================================================

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function LandingHero() {
  return (
    <section className="relative z-10 flex min-h-[85vh] items-center px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 md:flex-row md:items-center md:gap-16">
        {/* Content */}
        <div className="flex-1">
          <motion.h1
            {...fadeUp(0)}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Sign commits. Verify releases. Authorize agents.
          </motion.h1>

          <motion.p
            {...fadeUp(0.15)}
            className="mt-6 text-lg leading-8 text-zinc-400 sm:text-xl"
          >
            Cryptographic identity that lives in your Git repo. No GPG. No central server. 10 seconds to set up.
          </motion.p>

          <motion.div
            {...fadeUp(0.3)}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6"
          >
            <a
              href="https://docs.auths.dev/getting-started/install/"
              className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              Get started
            </a>
            <a
              href="https://github.com/auths-dev/auths"
              className="inline-flex items-center justify-center rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
            >
              View on GitHub
            </a>
          </motion.div>

          <motion.div
            {...fadeUp(0.4)}
            className="mt-8 flex items-center gap-4 font-mono text-sm text-zinc-500"
          >
            <span>Open source</span>
            <span className="h-1 w-1 rounded-full bg-zinc-700" aria-hidden="true" />
            <span>Works offline</span>
            <span className="h-1 w-1 rounded-full bg-zinc-700" aria-hidden="true" />
            <span>No vendor lock-in</span>
          </motion.div>
        </div>

        {/* Terminal */}
        <motion.div {...fadeUp(0.3)} className="flex-1">
          <HeroInstallTerminal />
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Install — Zero to Signed Commit
// ---------------------------------------------------------------------------

export function LandingInstall() {
  return (
    <section className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          {...fadeUp(0)}
          className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Zero to Signed Commit in 30 Seconds
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="mt-4 text-lg text-zinc-400"
        >
          Install, create your identity, and sign your first commit. Copy-paste and go.
        </motion.p>

        <motion.div {...fadeUp(0.2)} className="mt-10">
          <TerminalBlock>
            <p>
              <span className="select-none text-emerald-400">~ $ </span>
              brew install auths
              <span className="text-zinc-600"> # or: cargo install auths-cli</span>
            </p>
            <p>
              <span className="select-none text-emerald-400">~ $ </span>
              auths init
            </p>
            <p className="text-emerald-400">✓ Identity created: did:keri:E8jsh...</p>
            <p className="text-emerald-400">✓ Git signing configured</p>
            <p className="mt-2">
              <span className="select-none text-emerald-400">~ $ </span>
              git commit -m &quot;first signed commit&quot;
            </p>
            <p className="text-emerald-400">✓ Commit signed with did:keri:E8jsh...</p>
          </TerminalBlock>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sign & Verify — The core CLI workflow
// ---------------------------------------------------------------------------

export function LandingSignAndVerify() {
  return (
    <section className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          {...fadeUp(0)}
          className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Sign Anything. Verify Anywhere.
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="mt-4 text-lg text-zinc-400"
        >
          Commits, release artifacts, SBOM manifests. One tool, one identity.
        </motion.p>

        <motion.div
          {...fadeUp(0.2)}
          className="mt-10 grid items-stretch gap-6 md:grid-cols-2"
        >
          {/* Sign */}
          <div className="flex flex-col">
            <h3 className="mb-3 font-mono text-sm font-semibold text-zinc-400">Sign</h3>
            <div className="flex-1 [&>div]:h-full [&>div]:flex [&>div]:flex-col [&>div>div:last-child]:flex-1">
              <TerminalBlock>
                <p>
                  <span className="select-none text-emerald-400">~ $ </span>
                  auths artifact sign release.tar.gz
                </p>
                <p className="text-emerald-400">✓ Signed: release.tar.gz.auths.json</p>
              </TerminalBlock>
            </div>
          </div>

          {/* Verify */}
          <div className="flex flex-col">
            <h3 className="mb-3 font-mono text-sm font-semibold text-zinc-400">Verify</h3>
            <div className="flex-1 [&>div]:h-full [&>div]:flex [&>div]:flex-col [&>div>div:last-child]:flex-1">
              <TerminalBlock>
                <p>
                  <span className="select-none text-emerald-400">~ $ </span>
                  auths artifact verify release.tar.gz
                </p>
                <p className="text-emerald-400">✓ Valid — signed by did:keri:E8jsh...</p>
              </TerminalBlock>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CI Integration — One Secret, Two Actions
// ---------------------------------------------------------------------------

export function LandingCiIntegration() {
  return (
    <section id="ci" className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          {...fadeUp(0)}
          className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          CI Integration
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="mt-4 text-lg text-zinc-400"
        >
          One secret. Two GitHub Actions. Set up once, every release signed, every commit verified.
        </motion.p>

        {/* Step 1: Setup */}
        <motion.div {...fadeUp(0.2)} className="mt-10">
          <h3 className="mb-3 font-mono text-sm font-semibold text-emerald-400">
            1. Setup (once)
          </h3>
          <TerminalBlock>
            <p>
              <span className="select-none text-emerald-400">~ $ </span>
              {CLI_CI_SETUP}
            </p>
            <p className="text-emerald-400">✓ AUTHS_CI_TOKEN set on auths-dev/my-repo</p>
          </TerminalBlock>
        </motion.div>

        {/* Step 2: Sign releases */}
        <motion.div {...fadeUp(0.3)} className="mt-8">
          <h3 className="mb-3 font-mono text-sm font-semibold text-emerald-400">
            2. Sign releases
          </h3>
          <CodeBlock
            language="yaml"
            code={`- uses: auths-dev/sign@v1
  with:
    token: \${{ secrets.AUTHS_CI_TOKEN }}
    files: 'dist/*.tar.gz'
    verify: true`}
          />
        </motion.div>

        {/* Step 3: Verify commits */}
        <motion.div {...fadeUp(0.4)} className="mt-8">
          <h3 className="mb-3 font-mono text-sm font-semibold text-emerald-400">
            3. Verify commits
          </h3>
          <CodeBlock
            language="yaml"
            code={`- uses: auths-dev/verify@v1`}
          />
        </motion.div>

        <motion.div {...fadeUp(0.5)} className="mt-8">
          <a
            href="https://docs.auths.dev/guides/platforms/ci-cd/"
            className="inline-flex items-center gap-2 font-mono text-sm text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Full CI/CD documentation <ChevronRight size={14} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Authenticate Without Tokens
// ---------------------------------------------------------------------------

const AUTH_STEPS = [
  {
    step: '1',
    title: 'Create identity',
    description: 'Ed25519 keypair generated by the SDK. Private key stays on device — keychain or in-memory.',
  },
  {
    step: '2',
    title: 'Sign the action',
    description: 'signAction() produces a verifiable envelope with DID, payload, and Ed25519 signature.',
  },
  {
    step: '3',
    title: 'Send the envelope',
    description: 'Attach it to the request. No redirect, no token exchange, no session cookie.',
  },
  {
    step: '4',
    title: 'Server verifies',
    description: 'verifyActionEnvelope() — one function call. No token introspection, no IdP round-trip.',
  },
] as const;

export function LandingAuth() {
  return (
    <section id="auth" className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          {...fadeUp(0)}
          className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Authenticate Without Tokens
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="mt-4 text-lg text-zinc-400"
        >
          Your identity is your credential. Sign requests with your key — no OAuth, no sessions, no IdP.
        </motion.p>

        <motion.div
          {...fadeUp(0.2)}
          className="mt-10 grid gap-10 md:grid-cols-2"
        >
          {/* Left: 4-step flow */}
          <div className="space-y-6">
            {AUTH_STEPS.map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 font-mono text-xs font-bold text-emerald-400">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-mono text-sm font-semibold text-zinc-200">{item.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: code block */}
          <div>
            <CodeBlock
              language="typescript"
              code={`import { EphemeralIdentity,
  verifyActionEnvelope } from '@auths-dev/sdk'

// Client: sign the request
const id = new EphemeralIdentity()
const envelope = id.signAction(
  'api_call',
  JSON.stringify({ endpoint: '/resource' })
)

// Server: verify — one function, no token lookup
const { valid } = verifyActionEnvelope(
  envelope, id.publicKeyHex
)
// valid === true`}
            />
          </div>
        </motion.div>

        {/* Contrast callout */}
        <motion.div
          {...fadeUp(0.3)}
          className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="font-mono text-xs font-semibold text-zinc-500">OAuth</p>
              <p className="mt-2 font-mono text-sm text-zinc-400">
                redirect &rarr; authorize &rarr; token &rarr; refresh &rarr; revoke &rarr; rotate
              </p>
            </div>
            <div>
              <p className="font-mono text-xs font-semibold text-emerald-400">Auths</p>
              <p className="mt-2 font-mono text-sm text-zinc-200">
                sign request &rarr; verify signature. Done.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Start Building (kept for reference, no longer on homepage)
// ---------------------------------------------------------------------------

const PATH_CARDS = [
  {
    icon: GitCommitHorizontal,
    title: 'Sign My Commits',
    description: 'Enable signing on your laptop in 2 minutes',
    href: 'https://docs.auths.dev/getting-started/signing-commits/',
  },
  {
    icon: Users,
    title: 'Manage Team Identities',
    description: 'Get your team verifiable credentials in 3 minutes',
    href: 'https://docs.auths.dev/getting-started/install/',
  },
  {
    icon: Bot,
    title: 'Build Agents',
    description: 'Give agents cryptographic identity in 4 minutes',
    href: 'https://docs.auths.dev/guides/identity/profiles/#agent-profile',
  },
  {
    icon: Package,
    title: 'Prove Provenance',
    description: 'Add supply chain verification in 5 minutes',
    href: 'https://docs.auths.dev/guides/git/verifying-commits/#github-actions',
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
          Get Started in 5 Minutes
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="mt-4 text-lg text-zinc-400"
        >
          Choose your path. We&apos;ll walk you through it.
        </motion.p>

        <motion.div
          className="mt-10 grid gap-4 sm:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {PATH_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.a
                key={card.title}
                href={card.href}
                variants={staggerItem}
                className="group flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 transition-colors hover:border-zinc-600"
              >
                <Icon size={28} className="mt-0.5 shrink-0 text-emerald-400" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-zinc-200">
                      {card.title}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-zinc-600 opacity-0 transition-all group-hover:translate-x-1 group-hover:text-emerald-400 group-hover:opacity-100"
                    />
                  </div>
                  <span className="mt-1 block text-sm text-zinc-500">
                    {card.description}
                  </span>
                </div>
              </motion.a>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Problem Statement
// ---------------------------------------------------------------------------

const PAIN_POINTS = [
  {
    icon: AlertCircle,
    iconColor: 'text-rose-500',
    title: 'GPG expired 3 months ago',
    description: 'Nobody noticed. Your "verified" commits aren\'t.',
  },
  {
    icon: Lock,
    iconColor: 'text-amber-500',
    title: 'CI bot pushes as you',
    description: 'Same signature, no audit trail, no way to revoke.',
  },
  {
    icon: WifiOff,
    iconColor: 'text-rose-500',
    title: 'New laptop, start over',
    description: 'Generate new keys. Upload to GitHub. Reconfigure Git. Again.',
  },
] as const;

export function LandingProblemStatement() {
  return (
    <section className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          {...fadeUp(0)}
          className="text-center font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          The Problems You Already Know
        </motion.h2>

        <motion.div
          className="mt-12 grid gap-6 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {PAIN_POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={point.title}
                variants={staggerItem}
                className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-8 text-center"
              >
                <Icon size={32} className={`mx-auto ${point.iconColor}`} />
                <h3 className="mt-4 font-mono text-base font-semibold text-zinc-100">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  {point.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Agent Identity
// ---------------------------------------------------------------------------

const AGENT_CHAIN_NODES = [
  { id: 'developer', icon: FingerprintIcon, label: 'Developer', color: 'text-zinc-300' },
  { id: 'agent', icon: BotSvgIcon, label: 'Agent', color: 'text-emerald-400' },
  { id: 'artifact', icon: PackageSvgIcon, label: 'Artifact', color: 'text-sky-400' },
];

export function LandingAgentIdentity() {
  return (
    <section id="agents" className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl text-center">
        <motion.h2
          {...fadeUp(0)}
          className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Agents With Real Identity
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="mt-4 text-lg text-zinc-400"
        >
          Delegate real cryptographic identity to your agents. Revoke any time.
        </motion.p>

        {/* Simplified chain visual */}
        <motion.div
          {...fadeUp(0.2)}
          className="mx-auto mt-10 flex flex-col items-center gap-2 md:flex-row md:justify-center md:gap-0"
        >
          {AGENT_CHAIN_NODES.map((node, i) => {
            const Icon = node.icon;
            return (
              <Fragment key={node.id}>
                <div className="flex flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-4 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
                  <Icon size={24} className={node.color} />
                  <span className="font-mono text-xs font-semibold text-zinc-200">{node.label}</span>
                </div>
                {i < AGENT_CHAIN_NODES.length - 1 && (
                  <>
                    <div className="hidden h-[2px] w-8 bg-gradient-to-r from-zinc-600 to-zinc-500 md:block" aria-hidden="true" />
                    <div className="h-6 w-[2px] bg-gradient-to-b from-zinc-600 to-zinc-500 md:hidden" aria-hidden="true" />
                  </>
                )}
              </Fragment>
            );
          })}
        </motion.div>

        {/* Code terminal */}
        <motion.div {...fadeUp(0.3)} className="mx-auto mt-10 max-w-lg text-left">
          <TerminalBlock>
            <p className="text-zinc-500"># Create an agent identity</p>
            <p>
              <span className="select-none text-emerald-400">~ $ </span>
              auths init --profile agent --non-interactive
            </p>
            <p className="mt-2 text-zinc-500"># Export identity for deployment</p>
            <p>
              <span className="select-none text-emerald-400">~ $ </span>
              auths id export-bundle --output agent-bundle.json
            </p>
            <p className="mt-2 text-zinc-500"># Rotate keys to revoke old access</p>
            <p>
              <span className="select-none text-emerald-400">~ $ </span>
              auths id rotate
            </p>
          </TerminalBlock>
        </motion.div>

        <motion.div {...fadeUp(0.4)} className="mt-8">
          <a
            href="https://docs.auths.dev/guides/identity/profiles/#agent-profile"
            className="inline-flex items-center rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
          >
            Give Your Agent an Identity
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Supply Chain
// ---------------------------------------------------------------------------

const SUPPLY_CHAIN_FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Cryptographically Signed',
    description: 'Every artifact verified with signatures you control — no central authority.',
  },
  {
    icon: Link2,
    title: 'Unbroken Chain',
    description: 'Complete provenance from source to deployment, stored in Git.',
  },
  {
    icon: History,
    title: 'Audit Forever',
    description: 'Immutable records accessible offline. No vendor lock-in.',
  },
] as const;

export function LandingSupplyChain() {
  return (
    <section id="supply-chain" className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          {...fadeUp(0)}
          className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Prove Where Code Comes From
        </motion.h2>
        <motion.p
          {...fadeUp(0.1)}
          className="mt-4 text-lg text-zinc-400"
        >
          LiteLLM and Axios were both compromised through stolen publish credentials.
          With Auths, stolen credentials can&apos;t produce valid signatures — the
          signing key lives in your hardware keychain, not in CI.
        </motion.p>

        <motion.div
          className="mt-10 grid gap-6 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {SUPPLY_CHAIN_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={staggerItem}
                className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 transition-colors hover:border-zinc-600"
              >
                <Icon size={24} className="text-emerald-400" />
                <h3 className="mt-3 font-mono text-sm font-semibold text-zinc-100">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Reuse EdgeVerificationDiagram */}
        <EdgeVerificationDiagram />

        {/* Interactive WASM verifier — GitHub, npm, Docker, or manual file drop */}
        <motion.div {...fadeUp(0.5)} className="mt-10">
          <VerifyHero />
        </motion.div>

        <motion.div {...fadeUp(0.6)} className="mt-8">
          <a
            href="https://docs.auths.dev/guides/git/verifying-commits/"
            className="inline-flex items-center gap-2 font-mono text-sm text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Explore Supply Chain Verification <ChevronRight size={14} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Competitive Table
// ---------------------------------------------------------------------------

type StatusType = 'yes' | 'no' | 'partial' | 'text';

interface ComparisonRow {
  feature: string;
  auths: { status: StatusType; text: string };
  gpg: { status: StatusType; text: string };
  ssh: { status: StatusType; text: string };
  sigstore: { status: StatusType; text: string };
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    feature: 'Setup time',
    auths: { status: 'text', text: '10 seconds' },
    gpg: { status: 'text', text: '15+ minutes' },
    ssh: { status: 'text', text: '5 minutes' },
    sigstore: { status: 'text', text: '2 minutes' },
  },
  {
    feature: 'Key rotation',
    auths: { status: 'text', text: 'Pre-rotation built in' },
    gpg: { status: 'text', text: 'Manual ceremony' },
    ssh: { status: 'text', text: 'Manual replacement' },
    sigstore: { status: 'text', text: 'Ephemeral keys' },
  },
  {
    feature: 'Works offline',
    auths: { status: 'yes', text: 'Yes' },
    gpg: { status: 'yes', text: 'Yes' },
    ssh: { status: 'yes', text: 'Yes' },
    sigstore: { status: 'no', text: 'Requires internet' },
  },
  {
    feature: 'Multi-device',
    auths: { status: 'text', text: 'QR code pairing' },
    gpg: { status: 'text', text: 'Export/import keys' },
    ssh: { status: 'text', text: 'Copy key files' },
    sigstore: { status: 'text', text: 'Via OIDC provider' },
  },
  {
    feature: 'Agent delegation',
    auths: { status: 'text', text: 'Scoped + revocable' },
    gpg: { status: 'no', text: 'Not supported' },
    ssh: { status: 'no', text: 'Not supported' },
    sigstore: { status: 'no', text: 'Not supported' },
  },
  {
    feature: 'Revocation',
    auths: { status: 'text', text: 'Signed event in Git' },
    gpg: { status: 'text', text: 'Keyserver dependent' },
    ssh: { status: 'text', text: 'Delete from GitHub' },
    sigstore: { status: 'text', text: 'Certificate expiry' },
  },
  {
    feature: 'GitHub "Verified" badge',
    auths: { status: 'partial', text: 'Not yet' },
    gpg: { status: 'yes', text: 'Yes' },
    ssh: { status: 'yes', text: 'Yes' },
    sigstore: { status: 'partial', text: 'Not yet' },
  },
];

function StatusBadge({ status, text }: { status: StatusType; text: string }) {
  if (status === 'text') {
    return <span className="text-sm text-zinc-300">{text}</span>;
  }
  const styles = {
    yes: 'bg-emerald-500/10 text-emerald-400',
    no: 'bg-rose-500/10 text-rose-400',
    partial: 'bg-amber-500/10 text-amber-400',
  };
  const icons = {
    yes: CircleCheck,
    no: CircleX,
    partial: CircleDot,
  };
  const Icon = icons[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      <Icon size={12} />
      {text}
    </span>
  );
}

export function LandingCompetitiveTable() {
  return (
    <section id="compare" className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          {...fadeUp(0)}
          className="text-center font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          How Auths Compares
        </motion.h2>

        <motion.div {...fadeUp(0.2)} className="mt-12 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="px-4 py-4 text-left font-mono text-sm font-semibold text-zinc-400">Feature</th>
                <th className="px-4 py-4 text-left font-mono text-sm font-semibold text-emerald-400">Auths</th>
                <th className="px-4 py-4 text-left font-mono text-sm font-semibold text-zinc-400">GPG Keys</th>
                <th className="px-4 py-4 text-left font-mono text-sm font-semibold text-zinc-400">SSH Keys</th>
                <th className="px-4 py-4 text-left font-mono text-sm font-semibold text-zinc-400">Sigstore</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_DATA.map((row) => (
                <tr key={row.feature} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-900/30">
                  <td className="px-4 py-4 font-mono text-sm text-zinc-300">{row.feature}</td>
                  <td className="px-4 py-4"><StatusBadge {...row.auths} /></td>
                  <td className="px-4 py-4"><StatusBadge {...row.gpg} /></td>
                  <td className="px-4 py-4"><StatusBadge {...row.ssh} /></td>
                  <td className="px-4 py-4"><StatusBadge {...row.sigstore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Multidevice
// ---------------------------------------------------------------------------

export function LandingMultidevice() {
  return (
    <section id="multidevice" className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        {/* Subsection A: Your Keys, Your Control */}
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <motion.h2
              {...fadeUp(0)}
              className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Your Keys, Your Control
            </motion.h2>
            <motion.p
              {...fadeUp(0.1)}
              className="mt-4 text-lg text-zinc-400"
            >
              Each device has its own key. Revoke one, the rest keep working.
            </motion.p>
          </div>
          <motion.div {...fadeUp(0.2)}>
            <TerminalBlock>
              <p>
                <span className="select-none text-emerald-400">~ $ </span>
                auths device list
              </p>
              <p className="mt-2 text-zinc-500">{'DEVICE        STATUS    ADDED'}</p>
              <p>{'MacBook Pro   active    2026-01-15'}</p>
              <p>{'iPhone 14     active    2026-02-03'}</p>
              <p className="text-zinc-500">{'Old Laptop    revoked   2026-03-01'}</p>
            </TerminalBlock>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="my-16 h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

        {/* Subsection B: Seamless Onboarding */}
        <div className="grid items-center gap-10 md:grid-cols-2">
          <motion.div {...fadeUp(0.2)} className="order-2 md:order-1">
            <TerminalBlock>
              <p>
                <span className="select-none text-emerald-400">~ $ </span>
                auths pair
              </p>
              <p>Pairing code: ABC-123</p>
              <p className="mt-2 text-zinc-500">Scan QR or enter code on new device:</p>
              <p>
                <span className="select-none text-emerald-400">~ $ </span>
                auths pair --join ABC-123
              </p>
              <p className="text-emerald-400">✓ Device linked to did:keri:E8jsh...</p>
            </TerminalBlock>
          </motion.div>
          <div className="order-1 md:order-2">
            <motion.h2
              {...fadeUp(0)}
              className="font-mono text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Seamless Onboarding
            </motion.h2>
            <motion.p
              {...fadeUp(0.1)}
              className="mt-4 text-lg text-zinc-400"
            >
              New device? One scan. Your identity carries over.
            </motion.p>
            <motion.div {...fadeUp(0.3)} className="mt-6">
              <a
                href="https://docs.auths.dev/getting-started/install/"
                className="inline-flex items-center gap-2 font-mono text-sm text-emerald-400 transition-colors hover:text-emerald-300"
              >
                See Device Identity in Action <ChevronRight size={14} />
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Architecture (tabbed, absorbs TechStack)
// ---------------------------------------------------------------------------

const ARCH_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'git-native', label: 'Git-Native' },
  { id: 'offline', label: 'Offline' },
  { id: 'agent-id', label: 'Agent Identity' },
  { id: 'tech-stack', label: 'Tech Stack' },
] as const;

function TechStackContent() {
  return (
    <motion.div
      className="grid gap-6 md:grid-cols-1"
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
            <div className="md:w-5/12">
              {tech.code ? (
                <LandingCodeBlock code={tech.code} language={tech.language} />
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
  );
}

export function LandingArchitecture() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  return (
    <section id="architecture" className="relative z-10 px-6 py-32 sm:py-40">
      <div className="mx-auto max-w-3xl">
        <motion.h2
          {...fadeUp(0)}
          className="text-center font-mono text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Architecture Deep Dive
        </motion.h2>

        {/* Tabs */}
        <motion.div {...fadeUp(0.1)} className="mt-10">
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1 md:grid-cols-5">
            {ARCH_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-2 font-mono text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-zinc-800 text-emerald-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab content */}
        <motion.div {...fadeUp(0.2)} className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 md:p-10">
          {activeTab === 'overview' && (
            <div>
              <p className="text-lg leading-8 text-zinc-400">
                Auths provides a complete identity infrastructure built on cryptographic
                primitives stored in Git. Every identity action is signed, auditable, and
                verifiable offline using WASM verifiers embedded in your applications.
              </p>
              <DelegationChainDiagram />
            </div>
          )}

          {activeTab === 'git-native' && (
            <div>
              <h3 className="font-mono text-xl font-semibold text-zinc-100">Git-Native Storage</h3>
              <p className="mt-4 text-lg leading-8 text-zinc-400">
                All identity events — keys, delegations, revocations — are stored as signed
                Git commits. No central database means no single point of failure. Your
                identity history is immutable and portable.
              </p>
            </div>
          )}

          {activeTab === 'offline' && (
            <div>
              <h3 className="font-mono text-xl font-semibold text-zinc-100">Offline Verification</h3>
              <p className="mt-4 text-lg leading-8 text-zinc-400">
                WASM-based verifiers run locally in your application without requiring
                network roundtrips. Identity proofs are cryptographically valid anywhere,
                whether you&apos;re online or offline.
              </p>
              <div className="mt-8">
                <a
                  href="https://docs.auths.dev/sdk/python/overview/"
                  className="font-mono text-sm text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  SDK Documentation &rarr;
                </a>
              </div>
            </div>
          )}

          {activeTab === 'agent-id' && (
            <div>
              <h3 className="font-mono text-xl font-semibold text-zinc-100">Agent Identity</h3>
              <p className="mt-4 text-lg leading-8 text-zinc-400">
                Agents receive real cryptographic keys instead of bearer tokens. Developers
                can delegate fine-grained capabilities to agents, with full audit trails
                and the ability to revoke access through signed events.
              </p>
            </div>
          )}

          {activeTab === 'tech-stack' && (
            <TechStackContent />
          )}
        </motion.div>

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
        Ready to Control Your Identity?
      </motion.h2>
      <motion.p
        {...fadeUp(0.1)}
        className="mx-auto mt-6 max-w-xl text-lg text-zinc-400"
      >
        Join developers building the next generation of decentralized identity. Start for free, no credit card required.
      </motion.p>
      <motion.div
        {...fadeUp(0.2)}
        className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
      >
        <a
          href="https://docs.auths.dev/getting-started/install/"
          className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          Start Building <ArrowUpRight size={14} />
        </a>
        <a
          href="https://docs.auths.dev"
          className="inline-flex items-center rounded-md border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          View Documentation
        </a>
      </motion.div>

      <motion.div
        {...fadeUp(0.3)}
        className="mx-auto mt-10 flex items-center justify-center gap-4 border-t border-zinc-800 pt-8 font-mono text-sm text-zinc-500"
      >
        <span>Open Source</span>
        <span className="h-1 w-1 rounded-full bg-zinc-700" aria-hidden="true" />
        <span>No Vendor Lock-In</span>
        <span className="h-1 w-1 rounded-full bg-zinc-700" aria-hidden="true" />
        <span>Community Driven</span>
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

const FOOTER_LINKS = {
  product: [
    { label: 'Features', href: '#supply-chain' },
    { label: 'Documentation', href: 'https://docs.auths.dev/getting-started/install/' },
    { label: 'GitHub', href: 'https://github.com/auths-dev/auths' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
  ],
  legal: [
    { label: 'Apache 2.0 License', href: 'https://github.com/auths-dev/auths/blob/main/LICENSE' },
  ],
};

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-zinc-800/60 px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-12 md:grid-cols-4 md:gap-8">
        {/* Brand */}
        <div>
          <span className="font-mono text-lg font-bold text-zinc-100">Auths</span>
          <p className="mt-3 text-sm text-zinc-500">
            Decentralized identity infrastructure for developers. Open source, no vendor lock-in.
          </p>
          <div className="mt-4 flex gap-4">
            <a href="https://github.com/auths-dev/auths" className="text-zinc-500 transition-colors hover:text-zinc-300" aria-label="GitHub">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
          </div>
        </div>

        {/* Product */}
        <div>
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wide text-zinc-400">Product</h3>
          <ul className="mt-4 space-y-3">
            {FOOTER_LINKS.product.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wide text-zinc-400">Company</h3>
          <ul className="mt-4 space-y-3">
            {FOOTER_LINKS.company.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wide text-zinc-400">Legal</h3>
          <ul className="mt-4 space-y-3">
            {FOOTER_LINKS.legal.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mx-auto mt-12 max-w-3xl border-t border-zinc-800/60 pt-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="font-mono text-xs text-zinc-600">
            &copy; {currentYear} Auths. All rights reserved.
          </p>
          <p className="font-mono text-xs text-zinc-600">
            Built with <span className="text-cyan-400">cryptography</span> and <span className="text-emerald-400">Git</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
