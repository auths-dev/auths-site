'use client';

import { motion } from 'motion/react';
import { useState, type ComponentType, type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function UserIcon({ size = 14, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function GitIcon({ size = 14, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

function KeyIcon({ size = 14, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}

function TerminalIcon({ size = 14, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  );
}

function ShieldIcon({ size = 14, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function GlobeIcon({ size = 14, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function DatabaseIcon({ size = 14, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14a9 3 0 0 0 18 0V5" />
      <path d="M3 12a9 3 0 0 0 18 0" />
    </svg>
  );
}

function LockIcon({ size = 14, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const stepVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

interface Actor {
  name: string;
  icon: ComponentType<IconProps>;
}

interface Step {
  from: number;
  to: number;
  label: string;
}

interface FlowConfig {
  actors: Actor[];
  steps: Step[];
  result: string;
  accent: string;
  border: string;
  dot: string;
  line: string;
  badgeBg: string;
  resultBg: string;
}

// ---------------------------------------------------------------------------
// Variant definitions
// ---------------------------------------------------------------------------

const VARIANTS: Record<string, FlowConfig> = {
  'gpg-sign': {
    actors: [
      { name: 'Developer', icon: UserIcon },
      { name: 'Git', icon: GitIcon },
      { name: 'GPG Agent', icon: KeyIcon },
    ],
    steps: [
      { from: 0, to: 1, label: 'git commit -S -m "fix"' },
      { from: 1, to: 2, label: 'sign payload' },
      { from: 2, to: 2, label: 'decrypt private key (passphrase prompt or cached)' },
      { from: 2, to: 1, label: 'return signature' },
      { from: 1, to: 0, label: 'commit stored (signature in header)' },
    ],
    result: 'commit stored',
    accent: 'text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
    line: 'bg-amber-500/20',
    badgeBg: 'bg-amber-500/10 border-amber-500/20',
    resultBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  'gpg-verify': {
    actors: [
      { name: 'Verifier', icon: UserIcon },
      { name: 'Git', icon: GitIcon },
      { name: 'GPG Keyring', icon: KeyIcon },
    ],
    steps: [
      { from: 0, to: 1, label: 'git verify-commit <SHA>' },
      { from: 1, to: 2, label: 'lookup public key' },
      { from: 2, to: 2, label: 'key found? verify signature, check trust level' },
      { from: 1, to: 0, label: 'GOOD / WARNING / BAD / "no public key"' },
    ],
    result: 'GOOD / WARNING / BAD',
    accent: 'text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
    line: 'bg-amber-500/20',
    badgeBg: 'bg-amber-500/10 border-amber-500/20',
    resultBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  'sigstore-sign': {
    actors: [
      { name: 'Developer', icon: UserIcon },
      { name: 'Gitsign', icon: TerminalIcon },
      { name: 'Fulcio', icon: ShieldIcon },
      { name: 'OIDC', icon: GlobeIcon },
      { name: 'Rekor', icon: DatabaseIcon },
    ],
    steps: [
      { from: 0, to: 1, label: 'git commit' },
      { from: 1, to: 1, label: 'generate ephemeral keypair' },
      { from: 1, to: 2, label: 'request certificate' },
      { from: 2, to: 3, label: 'verify OIDC token (browser opens)' },
      { from: 3, to: 2, label: 'token valid' },
      { from: 2, to: 1, label: 'short-lived certificate' },
      { from: 1, to: 1, label: 'sign commit with ephemeral key' },
      { from: 1, to: 4, label: 'record in transparency log' },
      { from: 1, to: 1, label: 'discard key' },
      { from: 1, to: 0, label: 'commit stored' },
    ],
    result: 'commit stored',
    accent: 'text-sky-400',
    border: 'border-sky-500/20',
    dot: 'bg-sky-400',
    line: 'bg-sky-500/20',
    badgeBg: 'bg-sky-500/10 border-sky-500/20',
    resultBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  'sigstore-verify': {
    actors: [
      { name: 'Verifier', icon: UserIcon },
      { name: 'Git', icon: GitIcon },
      { name: 'Rekor', icon: DatabaseIcon },
      { name: 'Fulcio Root', icon: ShieldIcon },
    ],
    steps: [
      { from: 0, to: 1, label: 'git verify-commit <SHA>' },
      { from: 1, to: 2, label: 'lookup entry in Rekor' },
      { from: 2, to: 1, label: 'entry + certificate' },
      { from: 1, to: 3, label: 'verify cert chain to root' },
      { from: 3, to: 1, label: 'valid' },
      { from: 1, to: 1, label: 'verify signature with cert key' },
      { from: 1, to: 0, label: 'GOOD' },
    ],
    result: 'GOOD',
    accent: 'text-sky-400',
    border: 'border-sky-500/20',
    dot: 'bg-sky-400',
    line: 'bg-sky-500/20',
    badgeBg: 'bg-sky-500/10 border-sky-500/20',
    resultBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  },
  'auths-sign': {
    actors: [
      { name: 'Developer', icon: UserIcon },
      { name: 'Git', icon: GitIcon },
      { name: 'OS Keychain', icon: LockIcon },
    ],
    steps: [
      { from: 0, to: 1, label: 'git commit -m "fix"' },
      { from: 1, to: 2, label: 'sign payload' },
      { from: 2, to: 2, label: 'unlock key (biometric or cached session)' },
      { from: 2, to: 1, label: 'signature' },
      { from: 1, to: 0, label: 'commit stored' },
    ],
    result: 'commit stored',
    accent: 'text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
    line: 'bg-emerald-500/20',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
    resultBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  'auths-verify': {
    actors: [
      { name: 'Verifier', icon: UserIcon },
      { name: 'Git', icon: GitIcon },
      { name: 'Auths Verifier', icon: ShieldIcon },
    ],
    steps: [
      { from: 0, to: 1, label: 'auths verify <SHA>' },
      { from: 1, to: 2, label: 'read KEL from refs/did/keri/' },
      { from: 2, to: 2, label: 'replay log: inception \u2192 rotations \u2192 pre-rotation \u2192 current key' },
      { from: 2, to: 2, label: 'verify commit signature against derived key' },
      { from: 2, to: 0, label: 'GOOD (+ full key history chain)' },
    ],
    result: 'GOOD',
    accent: 'text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
    line: 'bg-emerald-500/20',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
    resultBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SequenceFlowDiagram({ variant }: { variant: string }) {
  const config = VARIANTS[variant];
  const [hoveredActor, setHoveredActor] = useState<number | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  if (!config) return null;

  const anyHover = hoveredActor !== null || hoveredStep !== null;

  // Is this actor badge highlighted?
  const actorLit = (idx: number): boolean => {
    if (hoveredActor !== null) return idx === hoveredActor;
    if (hoveredStep !== null) {
      const s = config.steps[hoveredStep];
      return s.from === idx || s.to === idx;
    }
    return false;
  };

  // Is this step row highlighted?
  const stepLit = (idx: number): boolean => {
    if (hoveredActor !== null) {
      const s = config.steps[idx];
      return s.from === hoveredActor || s.to === hoveredActor;
    }
    if (hoveredStep !== null) return idx === hoveredStep;
    return false;
  };

  return (
    <div className="my-8 w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 sm:p-6">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        transition={{ staggerChildren: 0.08 }}
      >
        {/* Actor badges */}
        <motion.div
          variants={badgeVariants}
          className="mb-5 flex flex-wrap items-center justify-center gap-2"
        >
          {config.actors.map((actor, i) => {
            const Icon = actor.icon;
            const lit = actorLit(i);
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredActor(i)}
                onMouseLeave={() => setHoveredActor(null)}
                className={`flex cursor-default items-center gap-1.5 rounded-lg border bg-zinc-900 px-2.5 py-1.5 transition-opacity duration-200 ${config.border} ${
                  anyHover ? (lit ? 'opacity-100' : 'opacity-30') : 'opacity-100'
                }`}
              >
                <Icon size={13} className={config.accent} />
                <span className="font-mono text-[11px] font-medium text-zinc-300">
                  {actor.name}
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* Divider */}
        <div className={`mb-4 h-px w-full ${config.line}`} />

        {/* Step timeline */}
        <div className="relative">
          {/* Vertical timeline line — centered on the 7px dots (center = 3.5px) */}
          <div
            className={`absolute left-[3px] top-0 bottom-0 w-px ${config.line}`}
            aria-hidden="true"
          />

          {config.steps.map((step, i) => {
            const isSelf = step.from === step.to;
            const from = config.actors[step.from];
            const to = config.actors[step.to];
            const isLast = i === config.steps.length - 1;
            const lit = stepLit(i);

            return (
              <motion.div
                key={i}
                variants={stepVariants}
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
                className={`flex cursor-default items-center gap-3 transition-opacity duration-200 ${isLast ? '' : 'pb-2.5'} ${
                  anyHover ? (lit ? 'opacity-100' : 'opacity-30') : 'opacity-100'
                }`}
              >
                {/* Timeline dot */}
                <div
                  className={`h-[7px] w-[7px] shrink-0 rounded-full ${config.dot}`}
                />

                {/* Step content */}
                <div className="min-w-0">
                  <span className="font-mono text-[11px] text-zinc-500">
                    {isSelf ? from.name : `${from.name} \u2192 ${to.name}`}
                  </span>
                  <span className="ml-2 font-mono text-[11px] text-zinc-300">
                    {step.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
