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

const KeyIcon = svg(
  <>
    <circle cx="7.5" cy="15.5" r="5.5" />
    <path d="m21 2-9.6 9.6" />
    <path d="m15.5 7.5 3 3" />
  </>
);
const LockIcon = svg(
  <>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

export function IamMotionDiagram() {
  const [simulationState, setSimulationState] = useState<'pass' | 'refused'>('pass');
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      id: 'step-1',
      title: '1. Infrastructure Request',
      sub: 'ssh / kubectl / aws',
      icon: KeyIcon,
      detail: 'Developer attempts SSH connection, kubectl command, or AWS CLI call.',
    },
    {
      id: 'step-2',
      title: '2. Auths-Presentation Challenge',
      sub: 'Explicit Nonce & Audience',
      icon: LockIcon,
      detail: 'Relying party issues a cryptographically bound single-use nonce challenge.',
    },
    {
      id: 'step-3',
      title: '3. Touch ID Biometric Prompt',
      sub: 'Secure Enclave Sign',
      icon: FingerprintIcon,
      detail: simulationState === 'pass'
        ? 'Developer authenticates via Touch ID / YubiKey. Presentation signed with hardware key.'
        : 'User canceled biometric prompt or challenge expired!',
    },
    {
      id: 'step-4',
      title: '4. Scoped Session Access',
      sub: 'Issuerless KERI Verify',
      icon: ShieldCheckIcon,
      detail: simulationState === 'pass'
        ? 'Relying party verifies presentation offline against KERI registry & grants access.'
        : 'Access denied. Authentication challenge failed.',
    },
  ];

  return (
    <div className="bg-paper-elevated border border-rule rounded-2xl p-6 md:p-8 shadow-lg my-12">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-rule">
        <div>
          <div className="font-mono text-xs font-bold text-seal uppercase tracking-wider">
            [INTERACTIVE PROTOCOL FLOW]
          </div>
          <h3 className="font-serif text-2xl text-ink">Zero-Trust Developer IAM Flow</h3>
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
              <CheckIcon size={14} /> Biometric Pass (Pass)
            </span>
          </button>
          <button
            onClick={() => {
              setSimulationState('refused');
              setActiveStep(2);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              simulationState === 'refused'
                ? 'bg-red-500/15 text-red-600 border border-red-500/30'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <XIcon size={14} /> Canceled Prompt (Refused)
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative items-stretch">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = activeStep === idx;
          const isFailedStep = simulationState === 'refused' && idx >= 2;

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
                  {idx === 0 && <span className="text-ink-soft">Requested</span>}
                  {idx === 1 && <span className="text-seal">Challenged</span>}
                  {idx === 2 && (
                    <span className={simulationState === 'pass' ? 'text-seal' : 'text-red-600 font-bold'}>
                      {simulationState === 'pass' ? 'Biometric Pass' : 'Canceled'}
                    </span>
                  )}
                  {idx === 3 && (
                    <span className={simulationState === 'pass' ? 'text-seal' : 'text-red-600'}>
                      {simulationState === 'pass' ? 'Session Granted' : 'Denied'}
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
            simulationState === 'refused' && activeStep >= 2
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
