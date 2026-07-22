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

const GitCommitIcon = svg(
  <>
    <circle cx="12" cy="12" r="4" />
    <line x1="1.05" y1="12" x2="8" y2="12" />
    <line x1="16" y1="12" x2="22.95" y2="12" />
  </>
);
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

export function SupplyChainMotionDiagram() {
  const [simulationState, setSimulationState] = useState<'pass' | 'refused'>('pass');
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      id: 'step-1',
      title: '1. Git Commit Created',
      sub: 'git commit -m "release"',
      icon: GitCommitIcon,
      detail: 'Developer creates git commit locally. Auths hook intercepts commit payload.',
    },
    {
      id: 'step-2',
      title: '2. Secure Enclave P-256',
      sub: 'Biometric Key Sign',
      icon: FingerprintIcon,
      detail: simulationState === 'pass'
        ? 'Hardware key signs commit trailer with P-256 in-band multicodec key.'
        : 'Key revoked! Revocation check in controller KEL failed.',
    },
    {
      id: 'step-3',
      title: '3. CI/CD SLSA L3 Gate',
      sub: 'GitHub Actions / Runner',
      icon: ShieldCheckIcon,
      detail: simulationState === 'pass'
        ? 'CI runner verifies commit signature & attaches SLSA Level 3 provenance statement.'
        : 'CI build rejected! Unsigned or untrusted commit detected.',
    },
    {
      id: 'step-4',
      title: '4. Verifiable Bundle',
      sub: 'Zero-CA Offline Verify',
      icon: ShieldCheckIcon,
      detail: simulationState === 'pass'
        ? 'Release artifact bundled with DSSE attestation. Verifiable offline via auths verify.'
        : 'Release blocked. Refusal log written to compliance output.',
    },
  ];

  return (
    <div className="bg-paper-elevated border border-rule rounded-2xl p-6 md:p-8 shadow-lg my-12">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-rule">
        <div>
          <div className="font-mono text-xs font-bold text-seal uppercase tracking-wider">
            [INTERACTIVE PROTOCOL FLOW]
          </div>
          <h3 className="font-serif text-2xl text-ink">Supply Chain Shield Verification Flow</h3>
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
              <CheckIcon size={14} /> Verified Release (Pass)
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
              <XIcon size={14} /> Revoked Key (Refused)
            </span>
          </button>
        </div>
      </div>

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

                <div className="mt-2 pt-2 border-t border-rule/60 flex items-center justify-between text-[11px] font-mono">
                  {idx === 0 && <span className="text-ink-soft">Committed</span>}
                  {idx === 1 && (
                    <span className={simulationState === 'pass' ? 'text-seal' : 'text-red-600 font-bold'}>
                      {simulationState === 'pass' ? 'Signed P-256' : 'Revoked Key'}
                    </span>
                  )}
                  {idx === 2 && (
                    <span className={simulationState === 'pass' ? 'text-seal' : 'text-ink-faint'}>
                      {simulationState === 'pass' ? 'SLSA L3 Pass' : 'CI Rejected'}
                    </span>
                  )}
                  {idx === 3 && (
                    <span className={simulationState === 'pass' ? 'text-seal' : 'text-red-600'}>
                      {simulationState === 'pass' ? 'Verified Bundle' : 'Blocked'}
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
