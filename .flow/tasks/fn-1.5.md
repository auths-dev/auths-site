# fn-1.5 Static MDX content pages (Docs, Blog, Trust)

## Description
## Static MDX Content Pages (Docs, Blog, Trust)

Build the SEO-optimized static content system: a dynamic `[...slug]` route that renders `.mdx` files from `apps/web/content/` as Server Components, styled with `@tailwindcss/typography` customized to match the stark dark design.

### Context

- Depends on: fn-1.2 (layout + global CSS exist)
- All content lives in `apps/web/content/` as `.md` or `.mdx` files
- Uses `next-mdx-remote/rsc` for Server Component rendering (no `serialize()` two-step)
- Typography uses `prose` class with custom CSS variables for dark/mono theme
- Docs need a sidebar; Blog needs an index listing; Trust is a single page

### Steps

1. **Install dependencies**:
   ```bash
   pnpm --filter @auths/web add next-mdx-remote gray-matter @tailwindcss/typography
   ```
   Add `"next-mdx-remote"` to `transpilePackages` in `next.config.ts` (required for Turbopack).

2. **Content directory structure**:
   ```
   apps/web/content/
   ├── docs/
   │   ├── intro.mdx
   │   ├── how-it-works.mdx
   │   └── getting-started.mdx
   ├── blog/
   │   └── announcing-auths.mdx
   └── trust/
       └── index.mdx
   ```
   Each file has frontmatter: `title`, `description`, `date` (blog only).

3. **Create dynamic route** `apps/web/src/app/(content)/[...slug]/page.tsx`:
   - Parse `params.slug` array → resolve to file path in `content/`
   - Read file with `fs.readFile`
   - Extract frontmatter with `gray-matter`
   - Render with `<MDXRemote source={content} components={mdxComponents} />`
   - `generateMetadata` uses frontmatter `title` and `description`
   - 404 if file not found

4. **Content layout** `apps/web/src/app/(content)/layout.tsx`:
   - Two-column on md+: sidebar left, content right
   - Sidebar shows nav links for the current section (docs vs blog vs trust)
   - Breadcrumb at top

5. **Custom MDX components** (`apps/web/src/lib/mdx-components.tsx`):
   ```ts
   export const mdxComponents = {
     h1: (p) => <h1 className="font-mono text-2xl" {...p} />,
     code: (p) => <code className="font-mono text-sm bg-zinc-900 px-1.5 py-0.5 rounded" {...p} />,
     pre: (p) => <pre className="font-mono text-sm bg-zinc-900 overflow-auto p-4 rounded-lg" {...p} />,
   };
   ```

6. **Typography customization** in `globals.css`:
   ```css
   .prose {
     --tw-prose-body: theme(colors.zinc.300);
     --tw-prose-headings: theme(colors.white);
     --tw-prose-links: theme(colors.emerald.400);
     --tw-prose-code: theme(colors.emerald.300);
     --tw-prose-pre-bg: theme(colors.zinc.900);
     --tw-prose-invert-body: theme(colors.zinc.300);
   }
   ```

7. **Blog index** at `apps/web/src/app/blog/page.tsx`:
   - Read all files in `content/blog/`
   - Sort by date descending
   - Render list of titles + descriptions + dates

8. **Stub seed content** — create minimal `.mdx` files:
   - `content/docs/intro.mdx` — "Introduction to Auths"
   - `content/trust/index.mdx` — "Trust & Security model"
   - `content/blog/announcing-auths.mdx` — "Announcing Auths"

### Key Files to Create

- `apps/web/src/app/(content)/[...slug]/page.tsx`
- `apps/web/src/app/(content)/layout.tsx`
- `apps/web/src/app/blog/page.tsx`
- `apps/web/src/lib/mdx-components.tsx`
- `apps/web/content/docs/intro.mdx`
- `apps/web/content/trust/index.mdx`
- `apps/web/content/blog/announcing-auths.mdx`
## Acceptance
## Acceptance Criteria

- [ ] `GET /docs/intro` renders MDX content with correct title from frontmatter
- [ ] `GET /trust` (or `/trust/index`) renders the Trust & Security page
- [ ] `GET /blog` renders a list of blog posts sorted by date
- [ ] `GET /blog/announcing-auths` renders the blog post MDX content
- [ ] `generateMetadata` returns correct `title` and `description` from frontmatter
- [ ] Non-existent slug returns 404 (Next.js notFound())
- [ ] Content is styled with `prose` class: readable fonts, correct dark theme colors
- [ ] Code blocks use monospace font (`font-mono`) with dark background
- [ ] Links in prose content use `#10b981` / emerald accent color
- [ ] Docs sidebar shows navigation links for docs section
- [ ] `pnpm --filter @auths/web build` passes (static pages pre-rendered)
- [ ] Page source (SSR) contains `<title>` and `<meta name="description">` from frontmatter
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
