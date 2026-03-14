'use client';

import { useState, useCallback } from 'react';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text for manual copy
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
      aria-label="Copy to clipboard"
    >
      {copied ? <span className="text-green-400">Copied!</span> : 'Copy'}
    </button>
  );
}
