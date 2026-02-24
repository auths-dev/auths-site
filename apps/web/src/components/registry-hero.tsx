/**
 * Primary headline and omni-search input for the Public Registry page.
 *
 * Renders the page title and a controlled search form. The parent component
 * owns the input state and URL synchronisation — this component is purely
 * presentational.
 *
 * @example
 * <RegistryHero
 *   value={input}
 *   onChange={setInput}
 *   onSubmit={handleSubmit}
 * />
 */

interface RegistryHeroProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function RegistryHero({ value, onChange, onSubmit }: RegistryHeroProps) {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-white">Public Registry</h1>
      <p className="mb-8 text-sm text-muted">
        Discover and verify signed artifacts, repositories, and cryptographic identities.
      </p>

      <form onSubmit={onSubmit} className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
    </div>
  );
}
