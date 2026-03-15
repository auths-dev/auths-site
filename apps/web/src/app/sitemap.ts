import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://auths.dev';

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/registry`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/network`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/community`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/blog/announcing-auths`, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${base}/blog/developer-identity-without-a-ca`, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${base}/blog/why_not_gpg`, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${base}/blog/your-did-is-your-api-key`, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${base}/blog/replacing-api-keys`, changeFrequency: 'yearly', priority: 0.8 },
    { url: `${base}/docs/intro`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/docs/how-it-works`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/docs/getting-started`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/trust`, changeFrequency: 'monthly', priority: 0.6 },
  ];
}
