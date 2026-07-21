'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { looksLikePrefix, looksLikeCommitSha, toBarePrefix } from '@/lib/format';

export interface WitnessOption {
  name: string;
  live: boolean;
}

/**
 * The landing search — the search.sigstore.dev analog. Accepts a `did:keri:…`
 * or a bare prefix and routes to that member's verified KEL on the chosen
 * witness. A commit SHA is recognized but explained: commit verification needs
 * the artifact's attestation bundle, which the badge/`auths verify` path
 * carries — not a witness lookup.
 */
export function SearchBox({ witnesses }: { witnesses: WitnessOption[] }) {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [witness, setWitness] = useState(witnesses[0]?.name ?? '');
  const [note, setNote] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = term.trim();
    if (!t) return;
    if (looksLikePrefix(t)) {
      const prefix = toBarePrefix(t);
      router.push(`/w/${encodeURIComponent(witness)}/m/${encodeURIComponent(prefix)}`);
      return;
    }
    if (looksLikeCommitSha(t)) {
      setNote(
        'That looks like a commit SHA. Commit verification runs from the artifact’s attestation bundle (the badge / `auths verify` path), not a witness lookup — paste a KEL prefix or drop an evidence bundle instead.',
      );
      return;
    }
    setNote('Enter a did:keri:… identifier or a bare KEL prefix.');
  };

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              setNote(null);
            }}
            placeholder="did:keri:… or a bare KEL prefix"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Search by identifier"
            className="w-full rounded-sm border border-rule bg-paper py-3.5 pl-11 pr-4 font-mono text-[13px] text-ink placeholder:text-ink-faint focus:border-seal focus:outline-none focus:ring-1 focus:ring-seal/40"
          />
        </div>
        <label className="sr-only" htmlFor="witness-picker">
          Witness
        </label>
        <select
          id="witness-picker"
          value={witness}
          onChange={(e) => setWitness(e.target.value)}
          className="rounded-sm border border-rule bg-paper px-4 py-3.5 font-mono text-[13px] text-ink focus:border-seal focus:outline-none focus:ring-1 focus:ring-seal/40"
        >
          {witnesses.map((w) => (
            <option key={w.name} value={w.name}>
              {w.name}
              {w.live ? '' : ' (standing up)'}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-sm bg-ink px-6 py-3.5 font-mono text-[13px] font-medium text-paper transition-opacity hover:opacity-90"
        >
          Resolve
        </button>
      </div>
      {note ? <p className="mt-3 text-sm leading-6 text-ink-soft">{note}</p> : null}
    </form>
  );
}
