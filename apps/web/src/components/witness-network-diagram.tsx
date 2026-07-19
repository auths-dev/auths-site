'use client';

import { motion } from 'motion/react';
import type { SVGProps, ReactNode } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const svg = (children: ReactNode) =>
  function Icon({ size = 18, className, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {children}
      </svg>
    );
  };

const ScrollIcon = svg(
  <>
    <path d="M19 17V5a2 2 0 0 0-2-2H4" />
    <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
  </>,
);
const StampIcon = svg(
  <>
    <path d="M5 22h14" />
    <path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z" />
    <path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13" />
  </>,
);
const EyeIcon = svg(
  <>
    <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
const ShieldIcon = svg(
  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
);

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const SEAL = '#e8845c';
const MUTE = '#9a948c';

function Down({ label }: { label: string }) {
  return (
    <motion.div variants={item} className="flex justify-center">
      <div className="flex flex-col items-center gap-1 py-0.5">
        <div className="h-4 w-px" style={{ background: `linear-gradient(${SEAL}80, ${SEAL}22)` }} />
        <span className="text-[10px]" style={{ color: `${SEAL}99` }}>
          {label}
        </span>
        <div className="h-4 w-px" style={{ background: `linear-gradient(${SEAL}22, ${SEAL}80)` }} />
      </div>
    </motion.div>
  );
}

function Node({
  icon,
  title,
  sub,
  glow = false,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  glow?: boolean;
}) {
  return (
    <motion.div
      variants={item}
      className="rounded-lg border px-4 py-3"
      style={{
        borderColor: `${SEAL}33`,
        background: `${SEAL}0d`,
        boxShadow: glow ? `0 0 30px ${SEAL}14` : undefined,
      }}
    >
      <div className="flex items-center gap-2" style={{ color: SEAL }}>
        {icon}
        <span className="font-mono text-xs font-medium">{title}</span>
      </div>
      {sub ? <p className="mt-1 text-xs text-[#9a948c]">{sub}</p> : null}
    </motion.div>
  );
}

function Witness({ name, where }: { name: string; where: string }) {
  return (
    <div
      className="rounded-lg border px-3 py-2.5 text-center"
      style={{ borderColor: `${SEAL}22`, background: `${SEAL}08` }}
    >
      <span className="mx-auto block w-fit" style={{ color: SEAL }}>
        <StampIcon size={15} />
      </span>
      <div className="mt-1 font-mono text-[11px]" style={{ color: SEAL }}>
        {name}
      </div>
      <div className="mt-0.5 text-[10px] text-[#9a948c]">{where}</div>
      <div className="mt-1 text-[10px]" style={{ color: `${SEAL}cc` }}>
        checks growth · cosigns · logs
      </div>
    </div>
  );
}

function Chip({ text, accent = SEAL }: { text: string; accent?: string }) {
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[10px]"
      style={{ borderColor: `${accent}33`, background: `${accent}0d`, color: `${accent}cc` }}
    >
      {text}
    </span>
  );
}

/** The anchor loop: one aggregate, a t-of-N quorum, and everyone who reads it. */
export function WitnessNetworkDiagram() {
  return (
    <div className="not-prose overflow-hidden rounded-lg bg-[#15130f] shadow-[0_24px_60px_-12px_rgba(28,24,20,0.45)] ring-1 ring-black/20">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-2.5">
        <span className="font-mono text-[11px] tracking-wider text-[#9a948c]">
          the anchor loop
        </span>
        <span className="font-mono text-[11px] text-[#9a948c]">no per-call data leaves home</span>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="p-6"
      >
        <div className="space-y-3">
          <Node
            icon={<ScrollIcon size={16} />}
            title="The agent's private spend chain"
            sub="Every settled call appends to a signed hash chain. What leaves: one aggregate — head, count, cumulative — committing to all of it, revealing none of it."
          />
          <Down label="one signed anchor ⟨seed, head, k, cum, τ⟩" />
          <motion.div variants={item} className="grid grid-cols-3 gap-2">
            <Witness name="witness A" where="operator 1 · US" />
            <Witness name="witness B" where="operator 2 · EU" />
            <Witness name="witness C" where="operator 3 · APAC" />
          </motion.div>
          <motion.div variants={item} className="flex items-center justify-center">
            <span className="text-[10px]" style={{ color: `${SEAL}cc` }}>
              each accepts only monotone growth — same index, different head ⇒ a publishable
              duplicity proof
            </span>
          </motion.div>
          <Down label="t-of-N cosignatures + log inclusion proofs" />
          <Node
            icon={<ShieldIcon size={16} />}
            title="Finalized anchor"
            sub="Rolling history back now requires contradicting a quorum's signatures in append-only logs — a rollback is no longer a deletion, it is evidence."
            glow
          />
          <Down label="read by anyone" />
          <motion.div variants={item} className="grid grid-cols-2 gap-2">
            <div
              className="rounded-lg border px-3 py-2.5 text-center"
              style={{ borderColor: `${SEAL}22`, background: `${SEAL}08` }}
            >
              <span className="mx-auto block w-fit" style={{ color: SEAL }}>
                <EyeIcon size={15} />
              </span>
              <div className="mt-1 font-mono text-[11px]" style={{ color: SEAL }}>
                watchers
              </div>
              <div className="mt-0.5 text-[10px] text-[#9a948c]">
                scan for forks and silence — the market is one
              </div>
            </div>
            <div
              className="rounded-lg border px-3 py-2.5 text-center"
              style={{ borderColor: `${SEAL}22`, background: `${SEAL}08` }}
            >
              <span className="mx-auto block w-fit" style={{ color: SEAL }}>
                <ShieldIcon size={15} />
              </span>
              <div className="mt-1 font-mono text-[11px]" style={{ color: SEAL }}>
                verifiers
              </div>
              <div className="mt-0.5 text-[10px] text-[#9a948c]">
                offline, free — now with fresh · stale · unanchored
              </div>
            </div>
          </motion.div>
          <motion.div variants={item} className="flex flex-wrap justify-center gap-2 pt-1">
            <Chip text="verification stays offline" />
            <Chip text="rollback ⇒ signed contradiction" />
            <Chip text="two histories ⇒ duplicity proof" />
            <Chip text="witnesses see no per-call rows" accent={MUTE} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
