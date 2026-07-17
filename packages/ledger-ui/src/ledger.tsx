'use client';

/**
 * The Ledger — shared primitives for the paper-and-ink editorial system.
 *
 * Every marketing surface on auths.dev uses these. The rules:
 * - Paper background, ink text, ONE warm accent (--seal). A single cool-red
 *   (#c0442e) is reserved for one thing only: a denial.
 * - Fraunces (--font-display) for headlines; Geist Sans for body;
 *   mono ONLY inside terminals, code, and small-caps labels.
 * - Terminals are the only dark objects on the page.
 * - Every command shown is one a visitor can actually run.
 */

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { CopyButton } from './copy-button';

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: '-60px' } as const,
  transition: { duration: 0.55, delay, ease: 'easeOut' as const },
});

export const DENY = '#c0442e'; // the only red on the page — a refusal (on paper)
export const DENY_DARK = '#e2664a'; // the same refusal, brightened to hold AA contrast on #15130f
export const OK = '#e8845c'; // warm accent — an allow / a tick

/**
 * The section beat, uniform on every page: the number ticks in, the rule
 * draws left to right, the headline rises.
 */
export function SectionMark({ n, title, id }: { n: string; title: string; id?: string }) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="flex items-baseline gap-4">
        <motion.span
          {...fadeUp(0)}
          className="font-mono text-sm font-semibold tracking-widest text-seal"
        >
          {n}
        </motion.span>
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="h-px flex-1 origin-left bg-rule"
          aria-hidden="true"
        />
      </div>
      <motion.h2
        {...fadeUp(0.05)}
        className="mt-6 font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl"
      >
        {title}
      </motion.h2>
    </div>
  );
}

export function InkLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 border-b border-seal/40 pb-0.5 font-mono text-sm text-seal transition-colors hover:border-seal hover:text-seal-deep"
    >
      {children}
      <ArrowUpRight size={13} />
    </a>
  );
}

/**
 * Dark terminal — the only dark object on the paper page. Pass `copy` to
 * offer the pane's primary command for one-click lifting.
 */
export function InkTerminal({
  label,
  tag,
  copy,
  children,
}: {
  label: string;
  tag?: string;
  copy?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg bg-[#15130f] shadow-[0_24px_60px_-12px_rgba(28,24,20,0.45)] ring-1 ring-black/20">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-2.5">
        <span className="font-mono text-[11px] tracking-wider text-[#9a948c]">{label}</span>
        <span className="flex items-center gap-3">
          {tag ? <span className="font-mono text-[11px] text-[#9a948c]">{tag}</span> : null}
          {copy ? <CopyButton text={copy} /> : null}
        </span>
      </div>
      <div className="space-y-1.5 px-5 py-4 font-mono text-[13px] leading-relaxed text-stone-300">
        {children}
      </div>
    </div>
  );
}

export function Prompt({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`break-all ${className}`}>
      <span className="select-none text-[#9a948c]">$ </span>
      {children}
    </p>
  );
}

export function Dim({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={`text-[#9a948c] ${className}`}>{children}</p>;
}

export function Allow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: OK }}>
      <span className="select-none">✓ </span>
      {children}
    </p>
  );
}

export function Deny({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: DENY_DARK }}>
      <span className="select-none">✗ </span>
      {children}
    </p>
  );
}

export interface FooterLink {
  label: string;
  href: string;
}

const LEDGER_FOOTER_LINKS: readonly FooterLink[] = [
  { label: 'Check it', href: '/#audit' },
  { label: 'What it bounds', href: '/#bound' },
  { label: 'Wrap a server', href: '/#wrap' },
  { label: 'Revoke', href: '/#revoke' },
  { label: 'How it works', href: '/#how' },
  { label: 'Verify a release', href: '/verify' },
  { label: 'Blog', href: '/blog' },
  { label: 'Security', href: '/trust' },
  { label: 'Docs', href: 'https://docs.auths.dev/' },
  { label: 'GitHub', href: 'https://github.com/auths-dev/auths' },
];

/** One shared footer, applied on every page by the root layout. */
export function LedgerFooter({ links = LEDGER_FOOTER_LINKS }: { links?: readonly FooterLink[] } = {}) {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-rule px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:items-baseline sm:justify-between">
        <span className="font-display text-xl font-medium text-ink">Auths</span>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) =>
            link.href.startsWith('http') ? (
              <a
                key={link.label}
                href={link.href}
                className="font-mono text-xs text-ink-faint transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="font-mono text-xs text-ink-faint transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>
      </div>
      <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-2 border-t border-rule pt-6 sm:flex-row sm:justify-between">
        <p className="font-mono text-xs text-ink-faint">&copy; {currentYear} Auths · Apache-2.0</p>
        <p className="font-mono text-xs text-ink-faint">
          The bounded agent. And a receipt anyone can check.
        </p>
      </div>
    </footer>
  );
}
