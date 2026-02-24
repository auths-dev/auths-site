/**
 * Reusable terminal block with macOS window chrome and copy-to-clipboard.
 *
 * Shows a code snippet styled as a terminal window with traffic-light dots,
 * a copy button with clipboard API + DOMException fallback, and an
 * `aria-live` region for screen-reader announcements.
 *
 * @param commands - Newline-separated CLI commands to display.
 *
 * @example
 * <TerminalBlock commands="auths id create\nauths id register" />
 */

'use client';

import { useState, useCallback } from 'react';

export function TerminalBlock({ commands }: { commands: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'fallback'>('idle');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(commands);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch (err) {
      if (err instanceof DOMException || !navigator.clipboard) {
        setCopyState('fallback');
        const codeEl = document.querySelector('[data-clipboard-text]');
        if (codeEl) {
          const range = document.createRange();
          range.selectNodeContents(codeEl);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
        setTimeout(() => setCopyState('idle'), 4000);
      }
    }
  }, [commands]);

  const lines = commands.split('\n');

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800">
      {/* macOS window chrome */}
      <div className="flex items-center justify-between bg-zinc-900 px-4 py-2.5">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          aria-label="Copy command to clipboard"
        >
          {copyState === 'copied' && (
            <span className="text-green-400">Copied!</span>
          )}
          {copyState === 'fallback' && (
            <span className="text-yellow-400">Press Ctrl+C</span>
          )}
          {copyState === 'idle' && 'Copy'}
        </button>
      </div>

      {/* Terminal body */}
      <pre
        className="bg-zinc-950 px-4 py-4 font-mono text-sm leading-relaxed"
        data-clipboard-text={commands}
      >
        <code>
          {lines.map((line, i) => (
            <span key={i} className="block">
              <span className="select-none text-zinc-600">$ </span>
              <span className="text-green-400">{line}</span>
            </span>
          ))}
        </code>
      </pre>

      {/* Accessibility: announce copy result */}
      <div aria-live="polite" className="sr-only">
        {copyState === 'copied' && 'Copied to clipboard'}
        {copyState === 'fallback' && 'Select the text and press Ctrl+C or Cmd+C to copy'}
      </div>
    </div>
  );
}
