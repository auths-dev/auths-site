'use client';

import { motion } from 'motion/react';
import { Fragment, type ComponentType, type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

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

function MonitorIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

function PackageIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}

function ShieldCheckIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

interface NodeDef {
  id: string;
  icon: ComponentType<IconProps>;
  title: string;
  subtitle: string;
  glow: string;
  borderColor?: string;
  iconColor: string;
}

export function EcosystemAnimation() {
  const nodeVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  const hLineVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: { scaleX: 1, opacity: 1, transition: { duration: 0.8, ease: "easeInOut" as const } }
  };

  const vLineVariants = {
    hidden: { scaleY: 0, opacity: 0 },
    visible: { scaleY: 1, opacity: 1, transition: { duration: 0.8, ease: "easeInOut" as const } }
  };

  const nodes: NodeDef[] = [
    {
      id: "identity",
      icon: FingerprintIcon,
      title: "Root Identity",
      subtitle: "Permanent DID",
      glow: "shadow-[0_0_30px_rgba(255,255,255,0.1)]",
      iconColor: "text-zinc-300",
    },
    {
      id: "device",
      icon: MonitorIcon,
      title: "Device Key",
      subtitle: "Laptop / CI",
      glow: "shadow-[0_0_30px_rgba(14,165,233,0.15)]",
      iconColor: "text-sky-400",
    },
    {
      id: "artifact",
      icon: PackageIcon,
      title: "Artifact",
      subtitle: "Code / Package",
      glow: "shadow-[0_0_30px_rgba(168,85,247,0.15)]",
      iconColor: "text-purple-400",
    },
    {
      id: "verification",
      icon: ShieldCheckIcon,
      title: "Verification",
      subtitle: "Zero-Trust WASM",
      glow: "shadow-[0_0_30px_rgba(16,185,129,0.2)]",
      borderColor: "border-emerald-500/50",
      iconColor: "text-emerald-400",
    }
  ];

  return (
    <div className="my-12 w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 sm:p-8">
      <motion.div
        className="flex flex-col items-center md:flex-row md:justify-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        transition={{ staggerChildren: 0.3 }}
      >
        {nodes.map((node, i) => {
          const Icon = node.icon;
          return (
            <Fragment key={node.id}>
              <motion.div
                variants={nodeVariants}
                className={`relative z-10 flex h-20 w-36 shrink-0 flex-col items-center justify-center rounded-xl border bg-zinc-900 ${node.borderColor || 'border-zinc-800'} ${node.glow}`}
              >
                <Icon size={22} className={`mb-1.5 ${node.iconColor}`} />
                <span className="text-xs font-semibold text-zinc-100">{node.title}</span>
                <span className="text-[10px] text-zinc-400">{node.subtitle}</span>
              </motion.div>

              {i < nodes.length - 1 && (
                <motion.div
                  variants={hLineVariants}
                  className="hidden h-[2px] w-10 shrink-0 origin-left bg-gradient-to-r from-zinc-600 to-zinc-500 md:block"
                />
              )}

              {i < nodes.length - 1 && (
                <motion.div
                  variants={vLineVariants}
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
