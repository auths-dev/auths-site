import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://auths.dev';

export function constructMetadata({
  title = 'Auths — Secure Software Supply Chain Identity',
  description = 'One cryptographic identity to sign npm, PyPI, Cargo, and Docker artifacts. Replace API keys with device-bound credentials. Open source.',
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
