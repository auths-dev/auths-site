'use client';

import { motion } from 'motion/react';
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function SearchIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
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

function ToggleIcon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect width="20" height="12" x="2" y="6" rx="6" />
      <circle cx="16" cy="12" r="2" />
    </svg>
  );
}

function ArrowDownIcon({ size = 14, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

interface LayerProps {
  icon: React.ReactNode;
  label: string;
  title: string;
  items: string[];
  footer: string;
}

function LayerCard({ icon, label, title, items, footer }: LayerProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-lg border border-white/5 bg-white/[0.02] p-5 shadow-[0_0_30px_rgba(232,132,92,0.05)]"
    >
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#e8845c]">
          {label}
        </span>
      </div>

      <p className="mb-3 text-sm font-medium text-stone-200">{title}</p>

      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 pl-1">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#e8845c]/40" />
            <span className="text-xs text-stone-400">{item}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-[#e8845c]/80">{footer}</p>
    </motion.div>
  );
}

function Connector() {
  return (
    <motion.div variants={itemVariants} className="flex justify-center py-1">
      <div className="flex flex-col items-center gap-0.5">
        <div className="h-3 w-px bg-gradient-to-b from-white/15 to-white/5" />
        <ArrowDownIcon size={12} className="text-[#9a948c]" />
      </div>
    </motion.div>
  );
}

export function ThreeLayerDiagram() {
  return (
    <div className="not-prose my-8 overflow-hidden rounded-lg bg-[#15130f] shadow-[0_24px_60px_-12px_rgba(28,24,20,0.45)] ring-1 ring-black/20">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-2.5">
        <span className="font-mono text-[11px] tracking-wider text-[#9a948c]">capability security</span>
        <span className="font-mono text-[11px] text-[#9a948c]">three layers</span>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="space-y-0 p-5 sm:p-6"
      >
        <LayerCard
          icon={<SearchIcon size={16} className="text-[#e8845c]" />}
          label="Layer 1 — Static Audit"
          title="cargo capsec audit"
          items={[
            'Scans every .rs file for std::fs, std::net, std::env, std::process calls',
            'Zero config — point at workspace, get report in 2 seconds',
            'Crates declare classification = "pure" or "resource" in Cargo.toml',
            'CI integration: --fail-on high breaks the build on new I/O',
          ]}
          footer="Finds the problems. Works on any Rust code, no opt-in required."
        />

        <Connector />

        <LayerCard
          icon={<ShieldCheckIcon size={16} className="text-[#e8845c]" />}
          label="Layer 2 — Compile-Time Types"
          title="Has<P> trait bounds on Cap<P> tokens"
          items={[
            'Functions declare I/O permissions in their type signature',
            'Wrong capability type → real rustc compiler error',
            'Cap<P> is zero-sized — erased at compile time, zero runtime cost',
            'Permission lattice formally verified in Lean 4 (13 soundness theorems)',
          ]}
          footer="Prevents the problems. The compiler enforces what the audit finds."
        />

        <Connector />

        <LayerCard
          icon={<ToggleIcon size={16} className="text-[#e8845c]" />}
          label="Layer 3 — Runtime Control"
          title="RuntimeCap, TimedCap, LoggedCap, DualKeyCap"
          items={[
            'RuntimeCap — revocable: grant access for startup, then revoke permanently',
            'TimedCap — expiring: 30-second write window for migrations',
            'LoggedCap — audited: every exercise recorded in append-only log',
            'DualKeyCap — dual-key: two independent approvals required (separation of privilege)',
          ]}
          footer="Controls the problems. Dynamic permissions for cases types can't express."
        />
      </motion.div>
    </div>
  );
}
