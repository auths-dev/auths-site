# SEO for auths.dev

## Google Search Console setup

### 1. Add property

Go to [Google Search Console](https://search.google.com/search-console) → Add Property → select **URL prefix** → enter `https://auths.dev`.

### 2. Verify ownership via DNS (CNAME)

Google will give you a CNAME record to add. Since we're on Vercel:

1. Go to Vercel dashboard → auths-site project → Settings → Domains
2. You can't add arbitrary CNAME records through Vercel's domain UI — use your DNS provider directly (wherever `auths.dev` is registered: Cloudflare, Namecheap, Google Domains, etc.)
3. Add the CNAME record Google provides, e.g.:
   ```
   Type:  CNAME
   Name:  <google-verification-string>
   Value: <google-verification-target>.dv.googlehosted.com
   ```
4. Wait 5-10 minutes for DNS propagation
5. Click "Verify" in Search Console

### 3. Submit sitemap

After verification, go to Sitemaps → enter `https://auths.dev/sitemap.xml` → Submit.

**We don't have a sitemap yet.** See "Missing: Sitemap" below.

---

## Current state

### What we have

| Feature | Status | Location |
|---------|--------|----------|
| Page titles | Per-page via `constructMetadata()` | `src/lib/metadata.ts` |
| Meta descriptions | Per-page | Each `page.tsx` |
| Open Graph tags | `og:title`, `og:description`, `og:image` | `constructMetadata()` |
| Twitter cards | `summary_large_image` | `constructMetadata()` |
| JSON-LD structured data | Identity + Package pages only | `src/components/json-ld.tsx` |
| OG image generation | Dynamic via `/api/og` route | `src/app/api/og/` |
| Canonical URLs | Not set | — |
| Sitemap | Missing | — |
| robots.txt | Missing | — |

### What we're missing

#### Sitemap (`sitemap.xml`)

Next.js App Router supports a `sitemap.ts` file. Create `src/app/sitemap.ts`:

```typescript
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
```

After deploying, verify at `https://auths.dev/sitemap.xml`.

#### robots.txt

Create `src/app/robots.ts`:

```typescript
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://auths.dev/sitemap.xml',
  };
}
```

#### Canonical URLs

Add to `constructMetadata()` in `src/lib/metadata.ts`:

```typescript
metadataBase: new URL('https://auths.dev'),
alternates: { canonical: './' },
```

This tells Google the authoritative URL for each page, preventing duplicate content issues from query params (`?q=...`), trailing slashes, etc.

---

## Page-by-page metadata audit

### Homepage (`/`)

**Current:** Uses default `constructMetadata()` — "Auths — Cryptographic Trust, Decentralized".

**Improve:** The title is brand-focused but not search-friendly. Nobody searches for "cryptographic trust decentralized." Target keywords people actually search:

```
Title: "Auths — Secure Software Supply Chain Identity"
Description: "One cryptographic identity to sign npm, PyPI, Cargo, and Docker artifacts. Replace API keys with device-bound credentials. Open source."
```

### Registry (`/registry`)

**Current:** "Registry | Auths" — "Verify software artifacts..."

**Improve:**

```
Title: "Package Registry — Verify Software Provenance | Auths"
Description: "Search and verify cryptographic signatures for npm, PyPI, Cargo, and Docker packages. Public transparency log with real-time network activity."
```

### Blog posts

**Current:** Each post has a good title and description. These are fine.

**Improve:** Add `article` structured data (JSON-LD) to blog pages:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "datePublished": "...",
  "author": { "@type": "Organization", "name": "Auths" },
  "publisher": { "@type": "Organization", "name": "Auths", "url": "https://auths.dev" }
}
```

### Identity pages (`/registry/identity/[did]`)

**Current:** Has `ProfilePageJsonLd` structured data. Good.

**Improve:** These pages are dynamic and DID-based — Google may not discover them without internal links or a dynamic sitemap. The search and browse features help here.

### Package pages (`/registry/package/[ecosystem]/[...name]`)

**Current:** Has `SoftwareAppJsonLd` structured data. Good.

**Improve:** Same discovery issue as identity pages. The namespace browse and catalog ingestion create internal links that help.

---

## Target keywords

Based on what developers actually search for:

| Keyword | Monthly volume | Current ranking | Target page |
|---------|---------------|-----------------|-------------|
| software supply chain security | ~2,400 | Not ranking | Homepage, blog |
| sign npm packages | ~200 | Not ranking | Blog, docs |
| code signing open source | ~500 | Not ranking | Blog |
| sigstore alternative | ~100 | Not ranking | Blog (identity without CA) |
| api key security | ~1,300 | Not ranking | Blog (replacing API keys) |
| software provenance | ~400 | Not ranking | Registry page |
| sign cargo crate | ~50 | Not ranking | Docs |
| did:keri | ~50 | Should be #1 | Homepage, docs |

## Quick wins

1. **Add `sitemap.ts` and `robots.ts`** — 10 minutes, lets Google discover all pages
2. **Submit sitemap to Search Console** — 2 minutes after sitemap is live
3. **Add canonical URLs** — 5 minutes, prevents duplicate content
4. **Improve homepage title/description** — 5 minutes, targets real search queries
5. **Add `Article` JSON-LD to blog posts** — 30 minutes, improves rich snippet appearance
6. **Internal linking** — blog posts should link to `/registry`, registry should link to blog posts. Every internal link helps Google understand site structure.

## Monitoring

After setup, check Search Console weekly:

- **Coverage** — are pages being indexed? Any errors?
- **Performance** — impressions, clicks, average position for target keywords
- **Core Web Vitals** — Next.js + Vercel usually scores well, but check

Google typically takes 2-4 weeks to index a new site after sitemap submission. Blog posts with external links (Hacker News, Reddit, Twitter) get indexed faster.
