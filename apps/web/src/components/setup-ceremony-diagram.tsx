'use client';

import { motion } from 'motion/react';
import { Fragment, type ComponentType, type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function KeyIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}

function SearchIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function SettingsIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function TerminalIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  );
}

function UploadIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

function GlobeIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function DownloadIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function ShieldCheckIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const nodeVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const hLineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { scaleX: 1, opacity: 1, transition: { duration: 0.6, ease: 'easeInOut' as const } },
};

const vLineVariants = {
  hidden: { scaleY: 0, opacity: 0 },
  visible: { scaleY: 1, opacity: 1, transition: { duration: 0.6, ease: 'easeInOut' as const } },
};

// ---------------------------------------------------------------------------
// Step & variant definitions
// ---------------------------------------------------------------------------

interface StepDef {
  icon: ComponentType<IconProps>;
  title: string;
  detail: string;
}

interface VariantConfig {
  rows: StepDef[][];
  accent: string;
  border: string;
  glow: string;
  line: string;
  badge: string;
  badgeBg: string;
  label: string;
}

const VARIANTS: Record<string, VariantConfig> = {
  gpg: {
    rows: [
      [
        { icon: KeyIcon, title: 'Generate Key', detail: 'Interactive prompt' },
        { icon: SearchIcon, title: 'Find Key ID', detail: 'list-secret-keys' },
        { icon: SettingsIcon, title: 'Signing Key', detail: 'git config' },
        { icon: SettingsIcon, title: 'Enable Sign', detail: 'gpgsign true' },
      ],
      [
        { icon: TerminalIcon, title: 'Export Key', detail: '--armor --export' },
        { icon: UploadIcon, title: 'Upload Key', detail: 'GitHub / GitLab' },
        { icon: GlobeIcon, title: 'Keyserver', detail: 'Optional' },
      ],
    ],
    accent: 'text-amber-400',
    border: 'border-amber-500/30',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.08)]',
    line: 'from-amber-600/50 to-amber-500/30',
    badge: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/20',
    label: '7 steps',
  },
  sigstore: {
    rows: [
      [
        { icon: DownloadIcon, title: 'Install', detail: 'brew install gitsign' },
        { icon: SettingsIcon, title: 'Set Program', detail: 'gpg.x509.program' },
        { icon: SettingsIcon, title: 'Set Format', detail: 'gpg.format x509' },
        { icon: SettingsIcon, title: 'Enable Sign', detail: 'gpgsign true' },
      ],
    ],
    accent: 'text-sky-400',
    border: 'border-sky-500/30',
    glow: 'shadow-[0_0_20px_rgba(14,165,233,0.08)]',
    line: 'from-sky-600/50 to-sky-500/30',
    badge: 'text-sky-400',
    badgeBg: 'bg-sky-500/10 border-sky-500/20',
    label: '4 steps',
  },
  auths: {
    rows: [
      [
        { icon: ShieldCheckIcon, title: 'auths init', detail: 'Keys + config + keychain' },
      ],
    ],
    accent: 'text-emerald-400',
    border: 'border-emerald-500/40',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
    line: 'from-emerald-600/50 to-emerald-500/30',
    badge: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
    label: '1 command',
  },
};

// ---------------------------------------------------------------------------
// Row renderer — horizontal chain with connecting lines
// ---------------------------------------------------------------------------

function StepRow({
  steps,
  config,
  isOnlyStep,
}: {
  steps: StepDef[];
  config: VariantConfig;
  isOnlyStep: boolean;
}) {
  return (
    <div className="flex flex-col items-center md:flex-row md:justify-center">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <Fragment key={i}>
            <motion.div
              variants={nodeVariants}
              className={`relative z-10 flex shrink-0 flex-col items-center justify-center rounded-xl border bg-zinc-900 ${config.border} ${config.glow} ${
                isOnlyStep ? 'h-24 w-44' : 'h-[72px] w-[108px]'
              }`}
            >
              <Icon size={isOnlyStep ? 22 : 18} className={`mb-1 ${config.accent}`} />
              <span className={`font-mono font-semibold text-zinc-100 ${isOnlyStep ? 'text-xs' : 'text-[11px]'}`}>
                {step.title}
              </span>
              <span className={`text-zinc-400 ${isOnlyStep ? 'text-[11px]' : 'text-[10px]'}`}>
                {step.detail}
              </span>
            </motion.div>

            {/* Horizontal connector (desktop) */}
            {i < steps.length - 1 && (
              <motion.div
                variants={hLineVariants}
                className={`hidden h-[2px] w-6 shrink-0 origin-left bg-gradient-to-r md:block ${config.line}`}
                aria-hidden="true"
              />
            )}

            {/* Vertical connector (mobile) */}
            {i < steps.length - 1 && (
              <motion.div
                variants={vLineVariants}
                className={`my-1.5 h-5 w-[2px] shrink-0 origin-top bg-gradient-to-b md:hidden ${config.line}`}
                aria-hidden="true"
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SetupCeremonyDiagram({ variant }: { variant: string }) {
  const config = VARIANTS[variant];
  if (!config) return null;

  const isOnlyStep = config.rows.length === 1 && config.rows[0].length === 1;

  return (
    <div className="my-8 w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 sm:p-6">
      {/* Badge */}
      <div className="mb-4 flex justify-center">
        <span className={`rounded-full border px-3 py-1 font-mono text-xs font-medium ${config.badge} ${config.badgeBg}`}>
          {config.label}
        </span>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        transition={{ staggerChildren: 0.15 }}
      >
        {config.rows.map((row, rowIdx) => (
          <Fragment key={rowIdx}>
            <StepRow steps={row} config={config} isOnlyStep={isOnlyStep} />

            {/* Vertical connector between rows (desktop) */}
            {rowIdx < config.rows.length - 1 && (
              <div className="flex justify-center">
                <motion.div
                  variants={vLineVariants}
                  className={`my-2 h-6 w-[2px] origin-top bg-gradient-to-b ${config.line}`}
                  aria-hidden="true"
                />
              </div>
            )}
          </Fragment>
        ))}
      </motion.div>
    </div>
  );
}
