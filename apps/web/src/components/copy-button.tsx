'use client';

import { useState, useCallback } from 'react';

/** One-click lift for a command — lives in the chrome bar of dark artifacts. */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — leave the text selectable.
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy command"
      className={`rounded-sm px-1.5 py-0.5 font-mono text-[11px] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-stone-400 ${
        copied ? 'text-[#e8845c]' : 'text-stone-500 hover:text-stone-300'
      }`}
    >
      {copied ? 'copied' : 'copy'}
    </button>
  );
}
