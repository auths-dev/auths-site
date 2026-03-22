'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type CardStatus = 'not-started' | 'in-progress' | 'complete';

interface TaskCardProps {
  title: string;
  description: string;
  status: CardStatus;
  disabled?: boolean;
  children: React.ReactNode;
}

const STATUS_CONFIG: Record<CardStatus, { label: string; dotClass: string }> = {
  'not-started': { label: 'Not started', dotClass: 'bg-zinc-600' },
  'in-progress': { label: 'In progress', dotClass: 'bg-yellow-400' },
  complete: { label: 'Complete', dotClass: 'bg-emerald-500' },
};

export function TaskCard({ title, description, status, disabled, children }: TaskCardProps) {
  const [expanded, setExpanded] = useState(status !== 'complete');
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={`rounded-xl border p-6 transition-colors ${
        status === 'complete'
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : disabled
            ? 'border-zinc-800 bg-zinc-950/30 opacity-60'
            : 'border-zinc-800 bg-zinc-950/50'
      }`}
    >
      <button
        type="button"
        onClick={() => !disabled && setExpanded((e) => !e)}
        disabled={disabled}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
            <span className="text-xs text-zinc-500">{config.label}</span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
          <p className="text-sm text-zinc-400 mt-1">{description}</p>
        </div>
        {!disabled && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-zinc-500 transition-transform shrink-0 ml-4 ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pt-4 mt-4 border-t border-zinc-800">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
