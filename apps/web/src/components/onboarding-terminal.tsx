/**
 * Tabbed terminal UI showing the exact `auths` CLI commands for onboarding.
 *
 * Three tabs: Install, Create Identity, and Publish. Mirrors the terminal
 * design from the Overview hero — rounded-xl container with traffic-light
 * dots, inline tab bar, and `~ $` prompt prefix.
 *
 * @example
 * <OnboardingTerminal />
 */

'use client';

import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Tab data
// ---------------------------------------------------------------------------

interface TabConfig {
  id: string;
  label: string;
  commands: string;
}

const TABS: TabConfig[] = [
  {
    id: 'install',
    label: 'Install',
    commands: 'curl -fsSL https://get.auths.dev | sh',
  },
  {
    id: 'create',
    label: 'Create Identity',
    commands: [
      'auths id create',
      'auths id attest github --username <your-handle>',
      'auths id register --registry https://public.auths.dev',
    ].join('\n'),
  },
  {
    id: 'publish',
    label: 'Publish',
    commands: [
      'auths artifact sign ./my-package-1.0.0.tar.gz',
      'auths artifact publish --registry https://public.auths.dev',
    ].join('\n'),
  },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function OnboardingTerminal() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'fallback'>('idle');

  const current = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const lines = current.commands.split('\n');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(current.commands);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('fallback');
      setTimeout(() => setCopyState('idle'), 4000);
    }
  }, [current.commands]);

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
        Get Started
      </h2>

      <div className="overflow-hidden rounded-xl border border-border bg-muted-bg">
        {/* Header: dots + tabs */}
        <div className="flex items-center border-b border-border">
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
          </div>

          <div className="ml-2 flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setCopyState('idle');
                }}
                className={`rounded-md px-2.5 py-1.5 font-mono text-xs transition-colors ${
                  tab.id === activeTab
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
                aria-selected={tab.id === activeTab}
                role="tab"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="ml-auto mr-4 rounded px-2 py-1 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
            aria-label="Copy command to clipboard"
          >
            {copyState === 'copied' && (
              <span className="text-emerald-400">Copied!</span>
            )}
            {copyState === 'fallback' && (
              <span className="text-yellow-400">Press Ctrl+C</span>
            )}
            {copyState === 'idle' && 'Copy'}
          </button>
        </div>

        {/* Command body */}
        <div className="px-5 py-4">
          <pre className="font-mono text-sm leading-relaxed" data-clipboard-text={current.commands}>
            <code>
              {lines.map((line, i) => (
                <span key={`${current.id}-${i}`} className="block">
                  <span className="select-none text-muted">~ $ </span>
                  <span className="text-white">{line}</span>
                </span>
              ))}
            </code>
          </pre>
        </div>

        <div aria-live="polite" className="sr-only">
          {copyState === 'copied' && 'Copied to clipboard'}
          {copyState === 'fallback' && 'Select the text and press Ctrl+C or Cmd+C to copy'}
        </div>
      </div>
    </section>
  );
}
