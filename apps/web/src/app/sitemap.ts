import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://auths.dev';

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/network`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/verify`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/trust`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/blog/replacing-api-keys`, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${base}/blog/how-we-audit-our-code`, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${base}/blog/announcing-auths`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/blog/your-did-is-your-api-key`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/blog/developer-identity-without-a-ca`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/blog/why_not_gpg`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/blog/two-supply-chain-attacks`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/blog/sigstore-without-oidc`, changeFrequency: 'yearly', priority: 0.4 },
  ];
}
