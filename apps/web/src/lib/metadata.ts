import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://auths.dev';

/** The one thing the site sells — every share card defaults to it. */
export const SITE_TITLE = 'Auths — Your agent can’t exceed its budget. And you can prove it.';
export const SITE_DESC =
  'One command in front of any MCP server bounds an AI agent to a scope, a budget, and an expiry — and leaves a signed receipt anyone can verify offline, without trusting the operator.';

export function constructMetadata({
  title = SITE_TITLE,
  description = SITE_DESC,
  image = `${BASE_URL}/api/og`,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    metadataBase: new URL(BASE_URL),
    alternates: { canonical: './' },
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image }],
      siteName: 'Auths',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}
