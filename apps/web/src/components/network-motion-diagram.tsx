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

const GlobeIcon = svg(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </>
);
const UsersIcon = svg(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>
);
const ShieldCheckIcon = svg(
  <>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </>
);
const CheckIcon = svg(<path d="M20 6 9 17l-5-5" />);
const XIcon = svg(<path d="M18 6 6 18M6 6l12 12" />);

export function NetworkMotionDiagram() {
  const [simulationState, setSimulationState] = useState<'pass' | 'refused'>('pass');
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      id: 'step-1',
      title: '1. KEL State Checkpoint',
      sub: 'Key Event Log (Seq: #14)',
      icon: GlobeIcon,
      detail: 'Identity owner posts Key Event Log (KEL) sequence checkpoint.',
    },
    {
      id: 'step-2',
      title: '2. Witness Quorum Gossip',
      sub: 'Multi-Region Co-Signers',
      icon: UsersIcon,
      detail: simulationState === 'pass'
        ? 'Witness nodes verify sequence continuum & append co-signatures (Quorum 3/3).'
        : 'Fork or split-brain detected! Witness quorum rejected conflicting event.',
    },
    {
      id: 'step-3',
      title: '3. Merkle Inclusion Proof',
      sub: 'Transparency Log Tree',
      icon: ShieldCheckIcon,
      detail: simulationState === 'pass'
        ? 'Checkpoint anchored into append-only Merkle tree with cryptographic inclusion proof.'
        : 'Inclusion proof generation halted due to quorum rejection.',
    },
    {
      id: 'step-4',
      title: '4. WASM Explorer Audit',
      sub: 'Browser Verdict: Validated',
      icon: ShieldCheckIcon,
      detail: simulationState === 'pass'
        ? 'Browser WASM engine fetches Merkle proof & confirms state validity 100% offline.'
        : 'Browser verifier flags invalid checkpoint signature.',
    },
  ];

  return (
    <div className="bg-paper-elevated border border-rule rounded-2xl p-6 md:p-8 shadow-lg my-12">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-rule">
        <div>
          <div className="font-mono text-xs font-bold text-seal uppercase tracking-wider">
            [INTERACTIVE PROTOCOL FLOW]
          </div>
          <h3 className="font-serif text-2xl text-ink">Decentralized Witness Network Flow</h3>
        </div>

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
              <CheckIcon size={14} /> Quorum Co-sign (Pass)
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
              <XIcon size={14} /> Fork Detected (Refused)
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative items-stretch">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = activeStep === idx;
          const isFailedStep = simulationState === 'refused' && idx >= 1;

          return (
            <div key={s.id} className="relative h-full">
              <motion.div
                onClick={() => setActiveStep(idx)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`cursor-pointer p-4 rounded-xl border transition-all duration-300 h-full flex flex-col justify-between ${
                  isActive
                    ? isFailedStep
                      ? 'border-red-500 bg-red-500/5 shadow-md'
                      : 'border-seal bg-seal/5 shadow-md'
                    : 'border-rule bg-paper hover:border-ink-faint'
                }`}
              >
                <div>
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

                  <div className="font-serif text-sm font-semibold text-ink mb-1 leading-snug">{s.title}</div>
                  <div className="font-mono text-[11px] text-ink-soft mb-2">{s.sub}</div>
                </div>

                <div className="mt-4 pt-2 border-t border-rule/60 flex items-center justify-between text-[11px] font-mono">
                  {idx === 0 && <span className="text-ink-soft">Checkpointed</span>}
                  {idx === 1 && (
                    <span className={simulationState === 'pass' ? 'text-seal' : 'text-red-600 font-bold'}>
                      {simulationState === 'pass' ? 'Quorum 3/3' : 'Fork Blocked'}
                    </span>
                  )}
                  {idx === 2 && (
                    <span className={simulationState === 'pass' ? 'text-seal' : 'text-ink-faint'}>
                      {simulationState === 'pass' ? 'Merkle Anchored' : 'Skipped'}
                    </span>
                  )}
                  {idx === 3 && (
                    <span className={simulationState === 'pass' ? 'text-seal' : 'text-red-600'}>
                      {simulationState === 'pass' ? 'WASM Verified' : 'Invalid'}
                    </span>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

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
