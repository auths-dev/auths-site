'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {children}
      </svg>
    );
  };

const CpuIcon = svg(
  <>
    <rect width="16" height="16" x="4" y="4" rx="2" />
    <rect width="6" height="6" x="9" y="9" rx="1" />
    <path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2" />
  </>
);
const ShieldCheckIcon = svg(
  <>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </>
);
const LockIcon = svg(
  <>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>
);
const ReceiptIcon = svg(
  <>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
    <path d="M12 17.5v-11" />
  </>
);
const ArrowRight = svg(<path d="M5 12h14m-7-7 7 7-7 7" />);
const CheckIcon = svg(<path d="M20 6 9 17l-5-5" />);
const XIcon = svg(<path d="M18 6 6 18M6 6l12 12" />);

const SEAL = '#059669';
const DENY = '#dc2626';

export function AgentGuardMotionDiagram() {
  const [simulationState, setSimulationState] = useState<'pass' | 'refused'>('pass');
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      id: 'step-1',
      title: '1. Agent Tool Call',
      sub: 'tools/call (Est: $0.05)',
      icon: CpuIcon,
      detail: 'Agent requests tool execution with parameters and cost metadata.',
    },
    {
      id: 'step-2',
      title: '2. Auths Capability Gate',
      sub: 'Cap<Scope> · TimedCap',
      icon: ShieldCheckIcon,
      detail: simulationState === 'pass' 
        ? 'Scope authorized (paid.call) & Budget valid ($12.45 / $50.00).' 
        : 'Budget limit breached! ($50.05 / $50.00 allocated).',
    },
    {
      id: 'step-3',
      title: '3. OS Kernel Sandbox',
      sub: 'Landlock LSM / WASI',
      icon: LockIcon,
      detail: simulationState === 'pass' 
        ? 'Process spawned in bounded Linux Landlock / WASI sandbox.' 
        : 'Execution blocked at protocol boundary (No process spawned).',
    },
    {
      id: 'step-4',
      title: '4. Signed DSSE Receipt',
      sub: 'WASM Verifiable Log',
      icon: ReceiptIcon,
      detail: simulationState === 'pass' 
        ? 'Signed DSSE spend attestation generated for audit trail.' 
        : 'Refusal receipt generated & signed with denial reason.',
    },
  ];

  return (
    <div className="bg-paper-elevated border border-rule rounded-2xl p-6 md:p-8 shadow-lg my-12">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-rule">
        <div>
          <div className="font-mono text-xs font-bold text-seal uppercase tracking-wider">
            [INTERACTIVE PROTOCOL FLOW]
          </div>
          <h3 className="font-serif text-2xl text-ink">Agent Guard Execution Gate</h3>
        </div>

        {/* State Toggle Buttons */}
        <div className="flex items-center gap-2 bg-paper p-1.5 rounded-xl border border-rule font-mono text-xs">
          <button
            onClick={() => {
              setSimulationState('pass');
              setActiveStep(0);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              simulationState === 'pass'
                ? 'bg-emerald-500/15 text-seal border border-seal/30'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <CheckIcon size={14} /> Normal Flow (Pass)
            </span>
          </button>
          <button
            onClick={() => {
              setSimulationState('refused');
              setActiveStep(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              simulationState === 'refused'
                ? 'bg-red-500/15 text-red-600 border border-red-500/30'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <XIcon size={14} /> Overspend (Refused)
            </span>
          </button>
        </div>
      </div>

      {/* 4-Step Diagram Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = activeStep === idx;
          const isFailedStep = simulationState === 'refused' && idx >= 1;

          return (
            <div key={s.id} className="relative">
              <motion.div
                onClick={() => setActiveStep(idx)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 ${
                  isActive
                    ? isFailedStep
                      ? 'border-red-500 bg-red-500/5 shadow-md'
                      : 'border-seal bg-seal/5 shadow-md'
                    : 'border-rule bg-paper hover:border-ink-faint'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`p-2.5 rounded-lg border ${
                      isFailedStep
                        ? 'border-red-500/30 text-red-600 bg-red-500/10'
                        : 'border-rule text-ink-soft bg-paper-elevated'
                    }`}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="font-mono text-[10px] text-ink-faint font-bold">0{idx + 1}</span>
                </div>

                <div className="font-serif text-sm font-semibold text-ink mb-1">{s.title}</div>
                <div className="font-mono text-[11px] text-ink-soft mb-2">{s.sub}</div>

                {/* Status Indicator Pill */}
                <div className="mt-2 pt-2 border-t border-rule/60 flex items-center justify-between text-[11px] font-mono">
                  {idx === 0 && <span className="text-ink-soft">Invoked</span>}
                  {idx === 1 && (
                    <span className={simulationState === 'pass' ? 'text-seal' : 'text-red-600 font-bold'}>
                      {simulationState === 'pass' ? 'Verified' : 'Refused'}
                    </span>
                  )}
                  {idx === 2 && (
                    <span className={simulationState === 'pass' ? 'text-seal' : 'text-ink-faint'}>
                      {simulationState === 'pass' ? 'Sandboxed' : 'Skipped'}
                    </span>
                  )}
                  {idx === 3 && (
                    <span className={simulationState === 'pass' ? 'text-seal' : 'text-red-600'}>
                      {simulationState === 'pass' ? 'Signed Receipt' : 'Refusal Receipt'}
                    </span>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Step Detail Explanation Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeStep}-${simulationState}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={`mt-6 p-4 rounded-xl border font-mono text-xs ${
            simulationState === 'refused' && activeStep >= 1
              ? 'border-red-500/30 bg-red-500/10 text-red-900'
              : 'border-seal/30 bg-seal/5 text-seal-deep'
          }`}
        >
          <div className="font-bold mb-1 uppercase tracking-wide">
            {steps[activeStep].title} — Detail
          </div>
          <p className="leading-relaxed">{steps[activeStep].detail}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
