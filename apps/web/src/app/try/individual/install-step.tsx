'use client';

import { CopyCommand } from '@/components/copy-command';

interface InstallStepProps {
  onComplete: () => void;
}

export function InstallStep({ onComplete }: InstallStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">1. Install the CLI</h3>
        <p className="text-sm text-zinc-400 mb-4">
          Install the Auths CLI to manage your cryptographic identity.
        </p>
      </div>

      <CopyCommand command="curl -fsSL https://get.auths.dev | sh" />

      <p className="text-xs text-zinc-500">
        Also available via Homebrew: <code className="text-zinc-400">brew install auths-dev/tap/auths</code>
      </p>

      <button
        type="button"
        onClick={onComplete}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
      >
        I&apos;ve installed it
      </button>
    </div>
  );
}
