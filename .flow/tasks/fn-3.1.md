# fn-3.1 Add Public Registry nav link and route scaffold

## Description
## Add Public Registry nav link and route scaffold

### What
Add a "Public Registry" entry to the global navigation and create the `/registry` route shell following the existing `/explorer` pattern. This page will execute live data fetching against `public.auths.dev`.

### How
1. **Modify** `apps/web/src/components/site-nav.tsx`:
   - Add `{ label: 'Public Registry', href: '/registry' }` to the `NAV_LINKS` array (line 6-14)

2. **Create** `apps/web/src/components/registry-skeleton.tsx`:
   - Extract the Suspense fallback into its own isolated component to keep the route file clean
   - Renders a skeleton layout matching the real registry UI dimensions:
     - A disabled/inert search bar skeleton (same height/padding as real input, `animate-pulse` background)
     - 3-4 ghost result card skeletons below (matching real card height/spacing, `animate-pulse`)
   - Uses CSS variables for skeleton colors (`var(--muted-bg)`)
   - Exported as `RegistrySkeleton`

3. **Create** `apps/web/src/app/registry/page.tsx` (Server Component):
   - Export page metadata (`title`, `description`)
   - Accept async `searchParams` prop (Promise pattern — Next.js 16)
   - Render `<RegistryClient>` wrapped in `<Suspense fallback={<RegistrySkeleton />}>`
   - Import `RegistrySkeleton` from `@/components/registry-skeleton`
   - Follow the exact pattern from `apps/web/src/app/explorer/page.tsx`

4. **Create** `apps/web/src/app/registry/registry-client.tsx` (Client Component):
   - `'use client'` directive at line 1
   - Placeholder with search input and empty results area
   - Use `pt-28` for fixed header offset
   - Use `mx-auto max-w-5xl px-6 pb-20` layout pattern (matching explorer)
   - Import `useSearchParams` and `useRouter` from `next/navigation`

### Key references
- Explorer page: `apps/web/src/app/explorer/page.tsx`
- Explorer client: `apps/web/src/app/explorer/explorer-client.tsx`
- Nav links: `apps/web/src/components/site-nav.tsx:6-14`
- CSS variables: `apps/web/src/app/globals.css`
## Add Public Registry nav link and route scaffold

### What
Add a "Public Registry" entry to the global navigation and create the `/registry` route shell following the existing `/explorer` pattern. This page will execute live data fetching against `public.auths.dev`.

### How
1. **Modify** `apps/web/src/components/site-nav.tsx`:
   - Add `{ label: 'Public Registry', href: '/registry' }` to the `NAV_LINKS` array (line 6-14)

2. **Create** `apps/web/src/app/registry/page.tsx` (Server Component):
   - Export page metadata (`title`, `description`)
   - Accept async `searchParams` prop (Promise pattern — Next.js 16)
   - Render `<RegistryClient>` wrapped in `<Suspense>` with a **meaningful skeleton layout** that prevents layout shift during the initial network request to `public.auths.dev`. The fallback must include:
     - A disabled/inert search bar skeleton at the correct dimensions
     - Ghost result rows below (3-4 skeleton cards matching the height/spacing of real result cards)
   - Follow the exact pattern from `apps/web/src/app/explorer/page.tsx`

3. **Create** `apps/web/src/app/registry/registry-client.tsx` (Client Component):
   - `'use client'` directive at line 1
   - Placeholder with search input and empty results area
   - Use `pt-28` for fixed header offset
   - Use `mx-auto max-w-5xl px-6 pb-20` layout pattern (matching explorer)
   - Import `useSearchParams` and `useRouter` from `next/navigation`

### Suspense fallback detail
The `<Suspense>` boundary is required because `useSearchParams()` opts the client component into dynamic rendering. Because the page fetches live data from `public.auths.dev`, the skeleton must be comprehensive enough to cover the network round-trip time:
- A skeleton search bar (same height/padding as the real input, `animate-pulse` background)
- 3-4 ghost result cards below (skeleton rectangles with `animate-pulse`, matching real card dimensions and spacing)
- Use CSS variables for skeleton colors (e.g., `var(--muted-bg)`)

### Key references
- Explorer page: `apps/web/src/app/explorer/page.tsx`
- Explorer client: `apps/web/src/app/explorer/explorer-client.tsx`
- Nav links: `apps/web/src/components/site-nav.tsx:6-14`
- CSS variables: `apps/web/src/app/globals.css`
## Add Public Registry nav link and route scaffold

### What
Add a "Public Registry" entry to the global navigation and create the `/registry` route shell following the existing `/explorer` pattern.

### How
1. **Modify** `apps/web/src/components/site-nav.tsx`:
   - Add `{ label: 'Public Registry', href: '/registry' }` to the `NAV_LINKS` array (line 6-14)

2. **Create** `apps/web/src/app/registry/page.tsx` (Server Component):
   - Export page metadata (`title`, `description`)
   - Accept async `searchParams` prop (Promise pattern — Next.js 16)
   - Render `<RegistryClient>` wrapped in `<Suspense>` with a **meaningful skeleton fallback** — not a generic spinner or blank screen. The fallback should render a skeleton of the search bar (an inert input placeholder at the correct width/height) and a faded content area below it, preventing layout shift on initial page load.
   - Follow the exact pattern from `apps/web/src/app/explorer/page.tsx`

3. **Create** `apps/web/src/app/registry/registry-client.tsx` (Client Component):
   - `'use client'` directive at line 1
   - Placeholder with search input and empty results area
   - Use `pt-28` for fixed header offset
   - Use `mx-auto max-w-5xl px-6 pb-20` layout pattern (matching explorer)
   - Import `useSearchParams` and `useRouter` from `next/navigation`

### Suspense fallback detail
The `<Suspense>` boundary is required because `useSearchParams()` opts the client component into dynamic rendering. The fallback must match the layout of the actual search UI to prevent Cumulative Layout Shift (CLS). Render:
- A skeleton search bar (same height/padding as the real input, with a pulsing `animate-pulse` background)
- A muted content area placeholder below (e.g., a few skeleton lines for where results would appear)

### Key references
- Explorer page: `apps/web/src/app/explorer/page.tsx`
- Explorer client: `apps/web/src/app/explorer/explorer-client.tsx`
- Nav links: `apps/web/src/components/site-nav.tsx:6-14`
- CSS variables: `apps/web/src/app/globals.css`
## Add Public Registry nav link and route scaffold

### What
Add a "Public Registry" entry to the global navigation and create the `/registry` route shell following the existing `/explorer` pattern.

### How
1. **Modify** `apps/web/src/components/site-nav.tsx`:
   - Add `{ label: 'Public Registry', href: '/registry' }` to the `NAV_LINKS` array (line 6-14)

2. **Create** `apps/web/src/app/registry/page.tsx` (Server Component):
   - Export page metadata (`title`, `description`)
   - Accept async `searchParams` prop (Promise pattern — Next.js 16)
   - Render `<RegistryClient>` wrapped in `<Suspense>` with a loading fallback
   - Follow the exact pattern from `apps/web/src/app/explorer/page.tsx`

3. **Create** `apps/web/src/app/registry/registry-client.tsx` (Client Component):
   - `'use client'` directive at line 1
   - Placeholder with search input and empty results area
   - Use `pt-28` for fixed header offset
   - Use `mx-auto max-w-5xl px-6 pb-20` layout pattern (matching explorer)
   - Import `useSearchParams` and `useRouter` from `next/navigation`

### Key references
- Explorer page: `apps/web/src/app/explorer/page.tsx`
- Explorer client: `apps/web/src/app/explorer/explorer-client.tsx`
- Nav links: `apps/web/src/components/site-nav.tsx:6-14`
- CSS variables: `apps/web/src/app/globals.css`
## Acceptance
- [ ] `NAV_LINKS` array contains "Public Registry" entry with `href: '/registry'`
- [ ] Navigating to `/registry` renders the page without errors
- [ ] Page has `<title>` metadata set
- [ ] Client component uses `'use client'` directive
- [ ] `RegistrySkeleton` is extracted into `components/registry-skeleton.tsx` (NOT inline JSX in page.tsx)
- [ ] `<Suspense>` in page.tsx uses `<RegistrySkeleton />` as fallback
- [ ] Skeleton renders a disabled search bar matching real input dimensions
- [ ] Skeleton includes 3-4 ghost result card placeholders
- [ ] Skeleton uses `animate-pulse` and CSS variables for colors
- [ ] No layout shift (CLS) when real content replaces skeleton
- [ ] Layout uses `pt-28` offset and follows existing page layout pattern
- [ ] `pnpm build` succeeds (no TypeScript errors)
## Done summary
- Added "Public Registry" entry to NAV_LINKS in site-nav.tsx
- Created RegistrySkeleton component in components/registry-skeleton.tsx (extracted, not inline)
- Created /registry server page with Suspense boundary using RegistrySkeleton fallback
- Created registry-client.tsx client component with search input, URL state sync, and empty state
- Skeleton includes disabled search bar and 4 ghost result cards with staggered animate-pulse
- Why: establishes the route scaffold for the Public Registry feature
- Verification: `pnpm build` succeeds, /registry route listed as dynamic (ƒ)
## Evidence
- Commits: 97167f0d4b0f705a1c50bbb0b0f18f468d91f863
- Tests: pnpm build
- PRs: