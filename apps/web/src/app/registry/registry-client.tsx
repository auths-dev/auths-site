'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface RegistryClientProps {
  initialQuery?: string;
}

export function RegistryClient({ initialQuery }: RegistryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState(initialQuery ?? '');

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setInput(q);
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    router.replace(`/registry?q=${encodeURIComponent(input.trim())}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-20">
      <h1 className="mb-8 text-2xl font-semibold text-white">
        Public Registry
      </h1>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search packages, repos, identities... (e.g., npm:auths-cli, github.com/org/repo, @username)"
          className="flex-1 rounded-lg border border-border bg-muted-bg px-4 py-2.5 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none"
          aria-label="Search packages, repositories, and identities"
        />
        <button
          type="submit"
          className="rounded-lg border border-border bg-muted-bg px-4 py-2.5 text-sm text-white transition-colors hover:border-zinc-500"
          aria-label="Search"
        >
          Search
        </button>
      </form>

      <div className="mt-8">
        {!searchParams.get('q') && (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-600">
            Search for packages, repositories, or identities to explore the Web of Trust.
          </div>
        )}
      </div>
    </div>
  );
}
