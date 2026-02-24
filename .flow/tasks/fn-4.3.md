# fn-4.3 Identity page: route scaffold + Identity Header (Zone A)

## Description
## Identity page: route scaffold + Identity Header (Zone A)

### What
Create the `/registry/identity/[did]` route and build the Identity Header zone.

### Route Structure
```
src/app/registry/identity/[did]/
  page.tsx           — Server Component: metadata, params, prefetch, Suspense
  identity-client.tsx — Client Component: shell rendering all four zones
  identity-skeleton.tsx — Skeleton for Suspense fallback
```

### page.tsx (Server Component)
- `generateMetadata`: Dynamic title from DID (use github_username from platform claims if available, else truncated DID)
- `params: Promise<{ did: string }>` — await and decodeURIComponent
- Prefetch identity data via `getQueryClient().prefetchQuery()` + `dehydrate` + `HydrationBoundary`
- Wrap `IdentityClient` in `<Suspense fallback={<IdentitySkeleton />}>`

### identity-client.tsx (Client Component)
- Use `useIdentityProfile(did)` hook from fn-4.2
- Render loading, error, and result states
- Result branches: `active` → render all four zones, `unclaimed` → render unclaimed CTA
- Container: `mx-auto max-w-5xl px-6 pt-28 pb-20`

### Zone A: Identity Header
- **Avatar**: If github_username exists → `<img src="https://github.com/{username}.png?s=128" />`. If not → `<Avatar>` from `boring-avatars` with `variant="beam"` using DID as name.
- **DID Display**: Full DID in `font-mono text-sm text-verified`, truncated visually for mobile via `truncateMiddle`. Full text in a `title` attribute.
- **Copy Button**: Reuse clipboard pattern. Copies full DID.
- **QR Code**: `<QRCodeSVG>` from `qrcode.react` rendering the DID string. **SSR safety**: If build errors occur with qrcode.react SSR, use `next/dynamic` with `{ ssr: false }`: `const QRCodeSVG = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeSVG), { ssr: false })`. Test during build smoke test.
- **Trust Tier Badge**: Visual badge showing tier name. Color-code by tier:
  - Seedling: `text-zinc-500`
  - Verified: `text-blue-400`
  - Trusted: `text-verified` (emerald)
  - Sovereign: `text-amber-400`
- **Unclaimed State**: If identity status is `unclaimed`, show the entire header ghosted (`opacity-40`) with a prominent CTA banner: "This identity is unregistered. Are you the owner? Run `auths id register` to claim your reputation." This turns a 404 into a conversion funnel.

### Animation
- Section entry: `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}`

### Files to Create
- `src/app/registry/identity/[did]/page.tsx`
- `src/app/registry/identity/[did]/identity-client.tsx`
- `src/app/registry/identity/[did]/identity-skeleton.tsx`

### Dependencies
- fn-4.1 (shared utilities, icon system, boring-avatars, qrcode.react installed)
- fn-4.2 (useIdentityProfile hook, computeTrustTier)
## Identity page: route scaffold + Identity Header (Zone A)

### What
Create the `/registry/identity/[did]` route and build the Identity Header zone — the first and most impactful section of the Developer Passport.

### Route Structure
```
src/app/registry/identity/[did]/
  page.tsx           — Server Component: metadata, params, prefetch, Suspense
  identity-client.tsx — Client Component: shell rendering all four zones
  identity-skeleton.tsx — Skeleton for Suspense fallback
```

### page.tsx (Server Component)
- `generateMetadata`: Dynamic title from DID (use github_username from platform claims if available, else truncated DID)
- `params: Promise<{ did: string }>` — await and decodeURIComponent
- Prefetch identity data via `getQueryClient().prefetchQuery()` + `dehydrate` + `HydrationBoundary`
- Wrap `IdentityClient` in `<Suspense fallback={<IdentitySkeleton />}>`

### identity-client.tsx (Client Component)
- Use `useIdentityProfile(did)` hook from fn-4.2
- Render loading, error, and result states
- Result branches: `active` → render all four zones, `unclaimed` → render unclaimed CTA
- Container: `mx-auto max-w-5xl px-6 pt-28 pb-20` (match existing)

### Zone A: Identity Header
- **Avatar**: If github_username exists → `<img src="https://github.com/{username}.png?s=128" />` with `next/image` or raw img. If not → `<Avatar>` from `boring-avatars` with `variant="beam"` using DID as name.
- **DID Display**: Full DID in `font-mono text-sm text-verified`, truncated visually for mobile via `truncateMiddle`. Full text in a `title` attribute.
- **Copy Button**: Reuse clipboard pattern from existing components. Copies full DID.
- **QR Code**: `<QRCodeSVG>` from `qrcode.react` rendering the DID string. Show in a small card or modal toggle.
- **Trust Tier Badge**: Visual badge showing tier name + icon. Use `computeTrustTier()` from fn-4.2. Color-code by tier:
  - Seedling: `text-zinc-500` (neutral)
  - Verified: `text-blue-400`
  - Trusted: `text-verified` (emerald)
  - Sovereign: `text-amber-400` (gold)
- **Unclaimed State**: If identity status is `unclaimed`, show the entire header ghosted (opacity-40) with a prominent CTA banner: "This identity is unregistered. Are you the owner?" + CLI commands.

### Animation
- Section entry: `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}` (match existing pattern)

### Files to Create
- `src/app/registry/identity/[did]/page.tsx`
- `src/app/registry/identity/[did]/identity-client.tsx`
- `src/app/registry/identity/[did]/identity-skeleton.tsx`

### Dependencies
- fn-4.1 (shared utilities, icon system, boring-avatars, qrcode.react installed)
- fn-4.2 (useIdentityProfile hook, computeTrustTier)
## Acceptance
- [ ] `/registry/identity/did:keri:test` renders without errors
- [ ] generateMetadata produces title and description
- [ ] HydrationBoundary wraps client component for SSR data
- [ ] Avatar renders boring-avatars identicon when no GitHub username
- [ ] DID displayed with copy button that works
- [ ] QR code renders SVG of the DID (dynamic import if SSR issues)
- [ ] Trust tier badge shows correct tier based on identity data
- [ ] Unclaimed identity shows ghosted header (opacity-40) + CTA
- [ ] Skeleton renders during loading
- [ ] Error state renders on API failure
- [ ] Build passes
## Done summary
Created identity route with page.tsx, identity-client.tsx, identity-skeleton.tsx. Zone A renders avatar (GitHub or boring-avatars), DID with copy button, QR code, trust tier badge, stats. Unclaimed state shows ghosted header + CTA.
## Evidence
- Commits:
- Tests: next build
- PRs: