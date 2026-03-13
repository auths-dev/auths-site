'use client';

import { useRouter } from 'next/navigation';

interface RegistryHeroProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const SUGGESTIONS = [
  { label: 'npm:react', description: 'Package lookup' },
  { label: '@torvalds', description: 'GitHub identity' },
  { label: 'did:keri:EDP1vj...', description: 'DID lookup' },
];

export function RegistryHero({ value, onChange, onSubmit }: RegistryHeroProps) {
  const router = useRouter();

  function handleChipClick(query: string) {
    onChange(query);
    router.replace(`/registry?q=${encodeURIComponent(query)}`);
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-white">
        Verify anything on the network
      </h1>
      <p className="mb-8 text-sm text-muted">
        Search and verify signed artifacts, identities, and cryptographic proofs.
      </p>

      <form onSubmit={onSubmit} className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Verify a package, identity, or artifact hash..."
          className="flex-1 rounded-lg border border-border bg-muted-bg px-4 py-2.5 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          aria-label="Verify packages, identities, and artifacts"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted-bg px-4 py-2.5 text-sm text-white transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
          aria-label="Verify"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-400"
          >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          </svg>
          Verify
        </button>
      </form>

      {!value && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleChipClick(s.label)}
              className="rounded-lg border border-border bg-muted-bg px-3 py-1.5 font-mono text-xs text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
              title={s.description}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
