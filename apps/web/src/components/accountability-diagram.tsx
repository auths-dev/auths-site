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
const ScaleIcon = svg(
  <>
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
  </>,
);
const ReceiptIcon = svg(
  <>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
    <path d="M12 17.5v-11" />
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
const GlobeIcon = svg(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </>,
);
const CoinIcon = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.8 9.5a3 3 0 0 0-2.8-1.5c-1.7 0-3 .9-3 2.2 0 2.8 6 1.3 6 4.1 0 1.3-1.3 2.2-3 2.2a3 3 0 0 1-2.8-1.5" />
    <path d="M12 6.5v11" />
  </>,
);
const RotateIcon = svg(
  <>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </>,
);
const CheckIcon = svg(<path d="M20 6 9 17l-5-5" />);
const XIcon = svg(<path d="M18 6 6 18M6 6l12 12" />);
const ArrowRight = svg(<path d="M5 12h14m-7-7 7 7-7 7" />);

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

/** A single verdict tile — granted (seal) or refused (deny). */
function Verdict({ text, ok }: { text: string; ok?: boolean }) {
  const accent = ok ? SEAL : DENY;
  return (
    <motion.div
      variants={item}
      className="flex items-center gap-2 rounded-lg border px-3 py-2"
      style={{ borderColor: `${accent}33`, background: `${accent}0d` }}
    >
      {ok ? (
        <CheckIcon size={13} style={{ color: accent }} />
      ) : (
        <XIcon size={13} style={{ color: accent }} />
      )}
      <span className="font-mono text-[11px]" style={{ color: `${accent}dd` }}>
        {text}
      </span>
    </motion.div>
  );
}

/* 1 — the principal signs a scoped mandate (stage-one authorisation) */
function Mandate() {
  return (
    <Frame label="the mandate" tag="signed below the model · scoped · revocable">
      <div className="space-y-3">
        <Node
          icon={<FingerprintIcon size={16} />}
          title="Principal"
          sub="A human (or an org) authorises once — the key lives in the Secure Enclave"
        />
        <Down label="signs the remit" />
        <Node
          icon={<ShieldIcon size={16} />}
          title="Root identity  did:keri:…"
          sub="Anchors the delegation in a tamper-evident key-event log — only this key can widen it"
          glow
        />
        <Down label="grants a bounded mandate to the agent" />
        <Node icon={<CpuIcon size={16} />} title="Agent  did:keri:…" sub="Spends only inside the remit — it cannot grant itself more" />
        <motion.div variants={item} className="flex flex-wrap justify-center gap-2 pt-1">
          <Chip text="scope: paid.call" />
          <Chip text="cap: $ hard limit" />
          <Chip text="counterparty: allow-list (optional)" />
          <Chip text="ttl: expires" />
        </motion.div>
      </div>
    </Frame>
  );
}

/* 2 — the per-call verdict: did the agent stay within the remit? */
function VerdictStep() {
  return (
    <Frame label="per-call verdict" tag="did it exceed the authority it was given?">
      <div className="space-y-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Node icon={<CpuIcon size={16} />} title="A call" sub="tool · args · amount · counterparty" />
          <motion.div variants={item}>
            <ArrowRight size={18} style={{ color: MUTE }} />
          </motion.div>
          <Node icon={<ScaleIcon size={16} />} title="Re-derive vs the mandate" sub="fail-closed, by KEL replay — trusting nobody" />
        </div>
        <Down label="one of exactly these, re-derivable by anyone" />
        <motion.div variants={item} className="grid grid-cols-2 gap-2">
          <Verdict text="authorized" ok />
          <Verdict text="out-of-scope" />
          <Verdict text="out-of-counterparty" />
          <Verdict text="over-budget" />
        </motion.div>
        <motion.p variants={item} className="pt-1 text-xs text-[#9a948c]">
          The question everything downstream needs, made a fact: an{' '}
          <span className="font-mono">authorized</span> call stayed inside the remit; every other
          verdict names exactly how it went beyond it.
        </motion.p>
      </div>
    </Frame>
  );
}

/* 3 — the evidence bundle: re-derivable offline by anyone */
function Evidence() {
  return (
    <Frame label="the evidence bundle" tag="re-derive it yourself · trust no one">
      <div className="space-y-3">
        <Node
          icon={<ReceiptIcon size={16} />}
          title="EvidenceBundle"
          sub="The mandate, the calls, the settlement, and the verdict — signed, and anchored 'as of head H'"
          glow
        />
        <Down label="hand it to anyone — they check it, offline" />
        <motion.div variants={item} className="grid grid-cols-3 gap-2">
          {[
            { t: 'the buyer', s: 'confirms what it paid for' },
            { t: 'the vendor', s: 'confirms it was authorised' },
            { t: 'an auditor', s: 'confirms it, trusting no vendor' },
          ].map((v) => (
            <div
              key={v.t}
              className="rounded-lg border px-3 py-2.5 text-center"
              style={{ borderColor: `${SEAL}22`, background: `${SEAL}08` }}
            >
              <UsersIcon size={15} className="mx-auto" style={{ color: SEAL }} />
              <div className="mt-1 font-mono text-[11px]" style={{ color: SEAL }}>
                {v.t}
              </div>
              <div className="mt-0.5 text-[10px] text-[#9a948c]">{v.s}</div>
            </div>
          ))}
        </motion.div>
        <motion.div variants={item} className="flex flex-wrap justify-center gap-2 pt-1">
          <Chip text="offline — no network" />
          <Chip text="no vendor to trust" />
          <Chip text="Rust · Python · JS · WASM" />
          <Chip text="any AI · any rail" />
        </motion.div>
      </div>
    </Frame>
  );
}

/* 4 — reversal: Auths computes the repayment; the rail moves the money */
function Reversal() {
  return (
    <Frame label="reversal" tag="Auths computes · the rail moves the money">
      <div className="space-y-3">
        <Node
          icon={<XIcon size={16} />}
          title="Verdict: exceeded the remit"
          sub="out-of-counterparty / over-budget / unauthorized — the trigger, not either party's say-so"
          accent={DENY}
        />
        <Down label="resolve parties + amount from the signed evidence" />
        <Node
          icon={<ScaleIcon size={16} />}
          title="ReversalDetermination"
          sub="who owes whom, how much — the principal is repaid, not the ephemeral agent"
          glow
        />
        <Down label="a signed instruction the rail executes" />
        <motion.div variants={item} className="grid grid-cols-3 gap-2">
          {['stripe.refund', 'x402.refund', 'escrow.release'].map((r) => (
            <div
              key={r}
              className="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5"
              style={{ borderColor: `${SEAL}22`, background: `${SEAL}08` }}
            >
              <CoinIcon size={13} style={{ color: SEAL }} />
              <span className="font-mono text-[10px]" style={{ color: SEAL }}>
                {r}
              </span>
            </div>
          ))}
        </motion.div>
        <motion.div variants={item} className="flex items-center gap-2 pt-1">
          <RotateIcon size={13} style={{ color: MUTE }} />
          <span className="text-xs text-[#9a948c]">
            Auths is the reversal <span style={{ color: `${SEAL}cc` }}>authority</span>, never the rail —
            it decides the repayment; it never holds or moves the money.
          </span>
        </motion.div>
      </div>
    </Frame>
  );
}

/* 5 — vendor-agnostic: one verifiable substrate under every AI and every rail */
function Agnostic() {
  return (
    <Frame label="agnostic by construction" tag="no vendor lock-in">
      <div className="space-y-3">
        <motion.div variants={item} className="grid grid-cols-3 gap-2">
          {[
            { label: 'AI Vendor', values: 'GPT · Claude · Llama · yours', icon: <CpuIcon size={15} className="mx-auto" style={{ color: SEAL }} /> },
            { label: 'Payment Vendor', values: 'x402 · Stripe · any rail', icon: <CoinIcon size={15} className="mx-auto" style={{ color: SEAL }} /> },
            { label: 'Party', values: 'buyer · vendor · court', icon: <UsersIcon size={15} className="mx-auto" style={{ color: SEAL }} /> },
          ].map((b) => (
            <div
              key={b.label}
              className="rounded-lg border px-3 py-2.5 text-center"
              style={{ borderColor: `${SEAL}22`, background: `${SEAL}08` }}
            >
              {b.icon}
              <div className="mt-1 font-mono text-[11px]" style={{ color: SEAL }}>
                {b.label}
              </div>
              <div className="mt-0.5 text-[10px] text-[#9a948c]">{b.values}</div>
            </div>
          ))}
        </motion.div>
        <Down label="all resolve to one thing" />
        <Node
          icon={<GlobeIcon size={16} />}
          title="One re-derivable proof"
          sub="Signed below the model, settled over any rail, verified offline by anyone — nobody's registry to trust"
          glow
        />
      </div>
    </Frame>
  );
}

const STEPS = {
  mandate: Mandate,
  verdict: VerdictStep,
  evidence: Evidence,
  reversal: Reversal,
  agnostic: Agnostic,
} as const;

export function AccountabilityDiagram({ step }: { step: keyof typeof STEPS }) {
  const Step = STEPS[step];
  return <Step />;
}
