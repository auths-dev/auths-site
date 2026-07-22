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

const RulerIcon = svg(
  <>
    <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
    <path d="m14.5 12.5 2-2" />
    <path d="m11.5 9.5 2-2" />
    <path d="m8.5 6.5 2-2" />
    <path d="m17.5 15.5 2-2" />
  </>,
);
const ScaleIcon = svg(
  <>
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </>,
);
const TicketIcon = svg(
  <>
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M13 5v2" />
    <path d="M13 11v2" />
    <path d="M13 17v2" />
  </>,
);
const UsersIcon = svg(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>,
);
const ScrollIcon = svg(
  <>
    <path d="M19 17V5a2 2 0 0 0-2-2H4" />
    <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
  </>,
);
const LinkIcon = svg(
  <>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </>,
);
const GlobeIcon = svg(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </>,
);
const CheckIcon = svg(<path d="M20 6 9 17l-5-5" />);
const XIcon = svg(<path d="M18 6 6 18M6 6l12 12" />);

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const SEAL = '#e8845c';
const DENY = '#c0442e';
const MUTE = '#9a948c';

function Frame({ label, tag, children }: { label: string; tag?: string; children: ReactNode }) {
  return (
    <div className="not-prose my-8 overflow-hidden rounded-lg bg-[#15130f] shadow-[0_24px_60px_-12px_rgba(28,24,20,0.45)] ring-1 ring-black/20">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-2.5">
        <span className="font-mono text-[11px] tracking-wider text-[#9a948c]">{label}</span>
        {tag ? <span className="font-mono text-[11px] text-[#9a948c]">{tag}</span> : null}
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="p-6"
      >
        {children}
      </motion.div>
    </div>
  );
}

function Node({
  icon,
  title,
  sub,
  accent = SEAL,
  glow = false,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  accent?: string;
  glow?: boolean;
}) {
  return (
    <motion.div
      variants={item}
      className="rounded-lg border px-4 py-3"
      style={{
        borderColor: `${accent}33`,
        background: `${accent}0d`,
        boxShadow: glow ? `0 0 30px ${accent}14` : undefined,
      }}
    >
      <div className="flex items-center gap-2" style={{ color: accent }}>
        {icon}
        <span className="font-mono text-xs font-medium">{title}</span>
      </div>
      {sub ? <p className="mt-1 text-xs text-[#9a948c]">{sub}</p> : null}
    </motion.div>
  );
}

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

/** A titled half-tile used for the two-party grids. */
function Half({ title, sub, icon, tone = SEAL }: { title: string; sub?: string; icon: ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border px-3 py-2.5 text-center" style={{ borderColor: `${tone}22`, background: `${tone}08` }}>
      <span className="mx-auto block w-fit" style={{ color: tone }}>
        {icon}
      </span>
      <div className="mt-1 font-mono text-[11px]" style={{ color: tone }}>
        {title}
      </div>
      {sub ? <div className="mt-0.5 text-[10px] text-[#9a948c]">{sub}</div> : null}
    </div>
  );
}

/* 1 — the historical honesty machines */
function History() {
  return (
    <Frame label="honesty machines, 700 years" tag="physical · procedural">
      <div className="space-y-3">
        <Node
          icon={<RulerIcon size={16} />}
          title="Tally stick · medieval England"
          sub="A notched stick split down the middle — each party keeps a half. They reconcile only if neither was altered: the notches and the grain of the wood have to line up."
        />
        <motion.div variants={item} className="grid grid-cols-2 gap-2">
          <Half title="buyer's half" icon={<RulerIcon size={15} />} />
          <Half title="seller's half" icon={<RulerIcon size={15} />} />
        </motion.div>
        <motion.div variants={item} className="flex items-center justify-center gap-2">
          <CheckIcon size={13} style={{ color: SEAL }} />
          <span className="text-[10px]" style={{ color: `${SEAL}cc` }}>
            notches + grain must match
          </span>
        </motion.div>
        <Down label="centuries later" />
        <Node
          icon={<ScaleIcon size={16} />}
          title="Double-entry · Renaissance Italy"
          sub="Every transaction written twice; the books only balance if both sides are honest. Fraud doesn't hide — it shows up as an imbalance."
          glow
        />
        <motion.div variants={item} className="flex flex-wrap justify-center gap-2 pt-1">
          <Chip text="forgery-resistant" />
          <Chip text="needs an auditor" />
          <Chip text="within one ledger" />
        </motion.div>
      </div>
    </Frame>
  );
}

/* 2 — Taiwan's invoice lottery */
function Lottery() {
  return (
    <Frame label="Taiwan, 1951" tag="the receipt becomes a prize">
      <div className="space-y-3">
        <Node
          icon={<UsersIcon size={16} />}
          title="A cash sale, off the books"
          sub="The seller's incentive is to not write it down — and the buyer happily agrees for a lower price. Both win; the state loses."
          accent={DENY}
        />
        <Down label="the receipt becomes a lottery ticket" />
        <Node
          icon={<TicketIcon size={16} />}
          title="Receipt = lottery ticket"
          sub="Every official receipt is a number in a periodic cash draw. Nobody knows which number wins — so every receipt has to be real."
          glow
        />
        <Down label="so the buyer defects" />
        <motion.div variants={item} className="grid grid-cols-2 gap-2">
          <Half title="seller" sub="would rather hide it" icon={<XIcon size={15} />} tone={DENY} />
          <Half title="buyer" sub="wants the ticket" icon={<CheckIcon size={15} />} tone={SEAL} />
        </motion.div>
        <motion.p variants={item} className="pt-1 text-xs text-[#9a948c]">
          The lottery enlists the counterparty against the fraud — the sale goes on the books.
        </motion.p>
      </div>
    </Frame>
  );
}

/* 3 — the cryptographic version */
function Auths() {
  return (
    <Frame label="the cryptographic version" tag="trust no one">
      <div className="space-y-3">
        <motion.div variants={item} className="grid grid-cols-2 gap-2">
          <Half title="buyer's ledger" sub="meters the call" icon={<ScrollIcon size={15} />} />
          <Half title="seller's ledger" sub="meters the call" icon={<ScrollIcon size={15} />} />
        </motion.div>
        <Down label="reconcile to one thing" />
        <Node
          icon={<LinkIcon size={16} />}
          title="One signed hash chain"
          sub="The two books can't disagree without the discrepancy being provable, and altering the chain is mathematically detectable — cross-party double-entry, enforced by math."
          glow
        />
        <Down label="re-derivable offline by" />
        <Node
          icon={<GlobeIcon size={16} />}
          title="Anyone — trusting no one"
          sub="No master copy, no authority running a draw. You don't take a vendor's word for a number; you re-run the check yourself."
        />
        <motion.div variants={item} className="flex flex-wrap justify-center gap-2 pt-1">
          <Chip text="tally stick: forgery-resistant" accent={MUTE} />
          <Chip text="lottery: unattractive" accent={MUTE} />
          <Chip text="Auths: futile" />
          <Chip text="trust required: none" />
        </motion.div>
      </div>
    </Frame>
  );
}

const STEPS = { history: History, lottery: Lottery, auths: Auths } as const;

export function HonestyMachinesDiagram({ step }: { step: keyof typeof STEPS }) {
  const Step = STEPS[step];
  return <Step />;
}
