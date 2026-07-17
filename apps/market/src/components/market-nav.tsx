'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'Browse', href: '/' },
  { label: 'Sell', href: '/sell' },
  { label: 'Dashboard', href: '/dashboard' },
] as const;

/** The market's chrome — same ledger hand as auths.dev, its own address. */
export function MarketNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-rule bg-paper/90 backdrop-blur-sm">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-baseline gap-2.5 transition-opacity hover:opacity-80">
          <span className="font-display text-lg font-medium tracking-tight text-ink">Auths</span>
          <span className="font-mono text-[12px] uppercase tracking-[0.15em] text-seal">
            market
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-mono text-[13px] transition-colors sm:text-sm ${
                isActive(link.href) ? 'text-ink' : 'text-ink-faint hover:text-ink'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://auths.dev"
            className="font-mono text-[13px] text-ink-faint transition-colors hover:text-ink sm:text-sm"
          >
            auths.dev
          </a>
        </div>
      </nav>
    </header>
  );
}
