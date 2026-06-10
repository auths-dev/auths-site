/**
 * Dark footer used by the dark-themed pages (e.g. /network).
 * The landing page itself moved to the light editorial design in
 * landing-ledger.tsx.
 */

const FOOTER_LINKS = {
  product: [
    { label: 'Machine Auth', href: '/#auth' },
    { label: 'Agent Identity', href: '/#agents' },
    { label: 'Governance', href: '/#governance' },
    { label: 'Supply Chain', href: '/#supply-chain' },
    { label: 'Compare', href: '/compare' },
    { label: 'Documentation', href: 'https://docs.auths.dev/getting-started/install/' },
    { label: 'GitHub', href: 'https://github.com/auths-dev/auths' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
  ],
  legal: [
    { label: 'Apache 2.0 License', href: 'https://github.com/auths-dev/auths/blob/main/LICENSE' },
  ],
};

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-zinc-800/60 px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-12 md:grid-cols-4 md:gap-8">
        {/* Brand */}
        <div>
          <span className="font-mono text-lg font-bold text-zinc-100">Auths</span>
          <p className="mt-3 text-sm text-zinc-500">
            Decentralized identity infrastructure for developers. Open source, no vendor lock-in.
          </p>
          <div className="mt-4 flex gap-4">
            <a href="https://github.com/auths-dev/auths" className="text-zinc-500 transition-colors hover:text-zinc-300" aria-label="GitHub">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
          </div>
        </div>

        {/* Product */}
        <div>
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wide text-zinc-400">Product</h3>
          <ul className="mt-4 space-y-3">
            {FOOTER_LINKS.product.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wide text-zinc-400">Company</h3>
          <ul className="mt-4 space-y-3">
            {FOOTER_LINKS.company.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wide text-zinc-400">Legal</h3>
          <ul className="mt-4 space-y-3">
            {FOOTER_LINKS.legal.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mx-auto mt-12 max-w-3xl border-t border-zinc-800/60 pt-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="font-mono text-xs text-zinc-600">
            &copy; {currentYear} Auths. All rights reserved.
          </p>
          <p className="font-mono text-xs text-zinc-600">
            Built with <span className="text-cyan-400">cryptography</span> and <span className="text-emerald-400">Git</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
