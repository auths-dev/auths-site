'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { InstallStep } from './install-step';
import { IdentityStep } from './identity-step';
import { PublishStep } from './publish-step';
import { Completion } from './completion';
import type { ArtifactEntry } from '@/lib/api/registry';

type IndividualStep = 1 | 2 | 3 | 'done';

interface IndividualFlowProps {
  redirectTo?: string;
}

const STEP_LABELS = ['Install', 'Create Identity', 'Publish'];

export function IndividualFlow({ redirectTo }: IndividualFlowProps) {
  const [currentStep, setCurrentStep] = useState<IndividualStep>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [artifact, setArtifact] = useState<ArtifactEntry | null>(null);

  const completeStep = useCallback((step: number) => {
    setCompletedSteps((prev) => new Set(prev).add(step));
  }, []);

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <nav aria-label="Onboarding steps">
        <ol className="flex items-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const isComplete = completedSteps.has(stepNum);
            const isCurrent = currentStep === stepNum;
            return (
              <li key={label} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                      isComplete
                        ? 'bg-emerald-500 text-zinc-950'
                        : isCurrent
                          ? 'bg-zinc-700 text-white'
                          : 'bg-zinc-800 text-zinc-500'
                    }`}
                    aria-hidden="true"
                  >
                    {isComplete ? '\u2713' : stepNum}
                  </span>
                  <span
                    className={`text-sm truncate ${
                      isCurrent ? 'text-zinc-100' : 'text-zinc-500'
                    }`}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {label}
                    <span className="sr-only">
                      {isComplete ? ' (completed)' : isCurrent ? ' (current)' : ''}
                    </span>
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`h-px flex-1 ${
                      isComplete ? 'bg-emerald-500' : 'bg-zinc-800'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={String(currentStep)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 1 && (
            <InstallStep
              onComplete={() => {
                completeStep(1);
                setCurrentStep(2);
              }}
            />
          )}

          {currentStep === 2 && (
            <IdentityStep
              onComplete={() => {
                completeStep(2);
                setCurrentStep(3);
              }}
            />
          )}

          {currentStep === 3 && (
            <PublishStep
              onComplete={(publishedArtifact) => {
                setArtifact(publishedArtifact);
                completeStep(3);
                setCurrentStep('done');
              }}
            />
          )}

          {currentStep === 'done' && (
            <Completion artifact={artifact} redirectTo={redirectTo} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
