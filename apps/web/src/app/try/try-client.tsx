'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider } from '@/lib/auth/auth-context';
import { IndividualFlow } from './individual/individual-flow';
import { OrgFlow } from './org/org-flow';

type Flow = 'individual' | 'org';

interface TryClientProps {
  initialFlow?: Flow;
  redirectTo?: string;
}

export function TryClient({ initialFlow, redirectTo }: TryClientProps) {
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(initialFlow ?? null);

  return (
    <AuthProvider>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Onboarding</h1>
          <p className="text-zinc-400">
            Get started with Auths. Choose your path.
          </p>
        </div>

        {/* Flow selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="group" aria-label="Onboarding type">
          <button
            type="button"
            onClick={() => setSelectedFlow('individual')}
            aria-pressed={selectedFlow === 'individual'}
            className={`rounded-xl border p-6 text-left transition-all ${
              selectedFlow === 'individual'
                ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
            }`}
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Individuals</h2>
            <p className="text-sm text-zinc-400">
              Create your cryptographic identity, sign and publish your first artifact.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFlow('org')}
            aria-pressed={selectedFlow === 'org'}
            className={`rounded-xl border p-6 text-left transition-all ${
              selectedFlow === 'org'
                ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
            }`}
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">Organizations</h2>
            <p className="text-sm text-zinc-400">
              Set up your team, invite members, and enforce signed commits.
            </p>
          </button>
        </div>

        {/* Selected flow content */}
        <AnimatePresence mode="wait">
          {selectedFlow && (
            <motion.div
              key={selectedFlow}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="border-t border-zinc-800 pt-10">
                {selectedFlow === 'individual' && (
                  <IndividualFlow redirectTo={redirectTo} />
                )}
                {selectedFlow === 'org' && <OrgFlow />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthProvider>
  );
}
