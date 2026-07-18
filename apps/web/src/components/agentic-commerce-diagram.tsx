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

const FingerprintIcon = svg(
  <>
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
    <path d="M2 12a10 10 0 0 1 18-6" />
    <path d="M2 16h.01" />
    <path d="M21.8 16c.2-2 .131-5.354 0-6" />
    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
    <path d="M8.65 22c.21-.66.45-1.32.57-2" />
    <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
  </>,
);
const ShieldIcon = svg(
  <>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </>,
);
const CpuIcon = svg(
  <>
    <rect width="16" height="16" x="4" y="4" rx="2" />
    <rect width="6" height="6" x="9" y="9" rx="1" />
    <path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2" />
  </>,
);
const StoreIcon = svg(
  <>
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M2 7h20" />
    <path d="M12 22V12" />
  </>,
);
const CoinIcon = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.8 9.5a3 3 0 0 0-2.8-1.5c-1.7 0-3 .9-3 2.2 0 2.8 6 1.3 6 4.1 0 1.3-1.3 2.2-3 2.2a3 3 0 0 1-2.8-1.5" />
    <path d="M12 6.5v11" />
  </>,
);
const ArrowRight = svg(<path d="M5 12h14m-7-7 7 7-7 7" />);
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

/* 1 — the human sets the ceiling and delegates */
function Delegate() {
  return (
    <Frame label="delegation" tag="one fingerprint · bounded · revocable">
      <div className="space-y-3">
        <Node
          icon={<FingerprintIcon size={16} />}
          title="Human"
          sub="Approves once with Touch ID — the key never leaves the Secure Enclave"
        />
        <Down label="signs the delegation" />
        <Node
          icon={<ShieldIcon size={16} />}
          title="Root identity  did:keri:…"
          sub="Anchors the delegation in a tamper-evident key-event log"
          glow
        />
        <Down label="grants a bounded grant" />
        <motion.div variants={item} className="grid grid-cols-3 gap-2">
          {['agent A', 'agent B', 'agent …'].map((a) => (
            <div
              key={a}
              className="rounded-lg border px-3 py-2.5 text-center"
              style={{ borderColor: `${SEAL}22`, background: `${SEAL}08` }}
            >
              <CpuIcon size={16} className="mx-auto" style={{ color: SEAL }} />
              <div className="mt-1 font-mono text-[11px]" style={{ color: SEAL }}>
                {a}
              </div>
            </div>
          ))}
        </motion.div>
        <motion.div variants={item} className="flex flex-wrap justify-center gap-2 pt-1">
          <Chip text="scope: paid.call" />
          <Chip text="budget: $ hard cap" />
          <Chip text="ttl: expires" />
        </motion.div>
      </div>
    </Frame>
  );
}

/* 2 — agent A builds a tool and lists it */
function Build() {
  return (
    <Frame label="agent A — build & list" tag="no human in the loop">
      <div className="space-y-3">
        <Node
          icon={<CpuIcon size={16} />}
          title="Agent A"
          sub="Wraps an MCP tool behind the bounded-agent gateway"
        />
        <Down label="signs & lists" />
        <motion.div
          variants={item}
          className="rounded-lg border px-4 py-3"
          style={{ borderColor: `${SEAL}33`, background: `${SEAL}0d` }}
        >
          <div className="flex items-center gap-2" style={{ color: SEAL }}>
            <StoreIcon size={16} />
            <span className="font-mono text-xs font-medium">Market listing</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Chip text="tool: paid_call" />
            <Chip text="price: $0.01 / call" />
            <Chip text="rail: x402 / USDC" />
            <Chip text="proven-live ✓" />
          </div>
          <p className="mt-2 text-xs text-[#9a948c]">
            The market’s prober is the listing’s first test-mode customer — it re-derives the
            price from the seller’s own signed receipts before anyone can buy.
          </p>
        </motion.div>
      </div>
    </Frame>
  );
}

/* 3 — agent B discovers and pays */
function Buy() {
  return (
    <Frame label="agent B — discover & pay" tag="real on-chain settle">
      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Node icon={<CpuIcon size={16} />} title="Agent B" sub="Finds the listing, wraps it under its own budget" />
          <motion.div variants={item}>
            <ArrowRight size={18} style={{ color: MUTE }} />
          </motion.div>
          <Node icon={<StoreIcon size={16} />} title="Listed tool" sub="paid_call · x402 / USDC" />
        </div>
        <Down label="meters the call · signs a receipt · settles" />
        <motion.div
          variants={item}
          className="rounded-lg border px-4 py-3"
          style={{ borderColor: `${SEAL}44`, background: `${SEAL}12`, boxShadow: `0 0 30px ${SEAL}14` }}
        >
          <div className="flex items-center gap-2" style={{ color: SEAL }}>
            <CoinIcon size={16} />
            <span className="font-mono text-xs font-medium">USDC settled on base-sepolia</span>
            <CheckIcon size={14} className="ml-auto" />
          </div>
          <p className="mt-1 text-xs text-[#9a948c]">
            A real transfer with a real transaction hash. The gateway never touches the money —
            it settles peer-to-peer and writes a signed, offline-verifiable receipt.
          </p>
        </motion.div>
        <motion.div variants={item} className="flex items-center gap-2 pt-1">
          <XIcon size={13} style={{ color: DENY }} />
          <span className="text-xs" style={{ color: `${DENY}cc` }}>
            A $1.40 call over the budget → <span className="font-mono">usage-cap-exceeded</span>, refused
            before the rail is ever touched.
          </span>
        </motion.div>
      </div>
    </Frame>
  );
}

/* 4 — one budget, many agents, in parallel */
function Fanout() {
  return (
    <Frame label="one budget · many agents" tag="shared cap, enforced">
      <div className="space-y-3">
        <Node
          icon={<CoinIcon size={16} />}
          title="One treasury cap  $0.03"
          sub="A single ceiling across N agents — coordinated outside every gateway process"
          glow
        />
        <Down label="splits across the fleet" />
        <motion.div variants={item} className="grid grid-cols-3 gap-2">
          {['agent 1', 'agent 2', 'agent 3'].map((a) => (
            <div
              key={a}
              className="rounded-lg border px-3 py-2.5 text-center"
              style={{ borderColor: `${SEAL}33`, background: `${SEAL}0d` }}
            >
              <CpuIcon size={15} className="mx-auto" style={{ color: SEAL }} />
              <div className="mt-1 font-mono text-[11px]" style={{ color: SEAL }}>
                {a}
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-1" style={{ color: SEAL }}>
                <CoinIcon size={12} />
                <span className="text-[10px]">settled ✓</span>
              </div>
            </div>
          ))}
        </motion.div>
        <motion.div variants={item} className="flex items-center gap-2 pt-1">
          <XIcon size={13} style={{ color: DENY }} />
          <span className="text-xs" style={{ color: `${DENY}cc` }}>
            The moment the shared cap is exhausted, the next call from{' '}
            <span className="font-mono">any</span> agent is refused — the budget is the fleet’s,
            not each agent’s.
          </span>
        </motion.div>
      </div>
    </Frame>
  );
}

const STEPS = { delegate: Delegate, build: Build, buy: Buy, fanout: Fanout } as const;

export function AgenticCommerceDiagram({ step }: { step: keyof typeof STEPS }) {
  const Step = STEPS[step];
  return <Step />;
}
