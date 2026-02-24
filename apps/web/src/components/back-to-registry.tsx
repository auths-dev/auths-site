'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/**
 * Smart back button that preserves search context.
 *
 * If `?from_query=` is present, navigates to `/registry?q={from_query}`.
 * Otherwise, navigates to `/registry` (clean dashboard).
 */
export function BackToRegistry() {
  const searchParams = useSearchParams();
  const fromQuery = searchParams.get('from_query');

  const href = fromQuery
    ? `/registry?q=${encodeURIComponent(fromQuery)}`
    : '/registry';

  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-white"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      Back to Registry
    </Link>
  );
}
