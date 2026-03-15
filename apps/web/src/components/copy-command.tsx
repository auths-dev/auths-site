'use client';

import { useState, useCallback } from 'react';

interface CopyCommandProps {
  command: string;
  label?: string;
}

export function CopyCommand({ command, label }: CopyCommandProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'fallback'>('idle');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('fallback');
      setTimeout(() => setCopyState('idle'), 4000);
    }
  }, [command]);

  return (
    <div>
      {label && <p className="text-sm text-zinc-400 mb-2">{label}</p>}
      <div className="relative">
        <pre className="rounded-lg bg-zinc-950 border border-zinc-800 px-4 py-3 font-mono text-sm text-emerald-400 overflow-x-auto">
          <code>
            {command.split('\n').map((line, i) => (
              <span key={i} className="block">
                <span className="select-none text-zinc-600">$ </span>
                <span>{line}</span>
              </span>
            ))}
          </code>
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900"
        >
          {copyState === 'copied' && <span className="text-emerald-400">Copied!</span>}
          {copyState === 'fallback' && <span className="text-yellow-400">Ctrl+C</span>}
          {copyState === 'idle' && 'Copy'}
        </button>
      </div>
      <div aria-live="polite" className="sr-only">
        {copyState === 'copied' && 'Copied to clipboard'}
        {copyState === 'fallback' && 'Select the text and press Ctrl+C or Cmd+C to copy'}
      </div>
    </div>
  );
}
