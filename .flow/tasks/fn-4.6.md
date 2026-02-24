# fn-4.6 Package page: route scaffold + Package Header (Zone A)

## Description
## Package page: route scaffold + Package Header (Zone A)

### What
Create the `/registry/package/[ecosystem]/[...name]` route and build the Package Header zone.

### Route Structure
```
src/app/registry/package/[ecosystem]/[...name]/
  page.tsx            — Server Component: metadata, params, prefetch, Suspense
  package-client.tsx  — Client Component: shell rendering all four zones
  package-skeleton.tsx — Skeleton for Suspense fallback
```

### page.tsx (Server Component)
- `generateMetadata`: Dynamic title like "npm:react | Auths Registry"
- `params: Promise<{ ecosystem: string; name: string[] }>` — catch-all `[...name]` for scoped packages
- Reconstruct package name: `name.map(decodeURIComponent).join('/')`
- Prefetch package data via `getQueryClient().prefetchQuery()` + `dehydrate` + `HydrationBoundary`
- Wrap `PackageClient` in `<Suspense fallback={<PackageSkeleton />}>`

### package-client.tsx (Client Component)
- Use `usePackageDetail(ecosystem, name)` hook from fn-4.2
- Render loading, error, not-found, and result states
- Container: `mx-auto max-w-5xl px-6 pt-28 pb-20`

### Zone A: Package Header

**Layout**: Full-width section at top

**Ecosystem Logo + Name**:
- Ecosystem icon from `@/components/icons/ecosystem-icon` (large, 32px)
- Package name: `text-2xl font-bold text-white font-mono`
- Format: `{ecosystem}:{name}` (e.g., "npm:react")

**Verification Badge**:
- If package has signers: Large "Cryptographically Verified" badge with `bg-verified/10 text-verified border-verified/30`
- Glowing effect: `shadow-[0_0_20px_rgba(16,185,129,0.15)]`
- If no signers: "Unverified" badge in muted styling

**Terminal Blocks** (side-by-side on desktop, stacked on mobile):
- Left: Install command (e.g., `npm install react`)
- Right: Verify command (`auths artifact verify --package npm:react`)
- Use extracted `TerminalBlock` component from fn-4.1
- Generate install command based on ecosystem: npm→`npm install`, pypi→`pip install`, cargo→`cargo add`

**Not Found State**: If the package has no data in the registry, show: "This package has no cryptographic signatures on the Auths Registry." + CTA to sign it.

### Files to Create
- `src/app/registry/package/[ecosystem]/[...name]/page.tsx`
- `src/app/registry/package/[ecosystem]/[...name]/package-client.tsx`
- `src/app/registry/package/[ecosystem]/[...name]/package-skeleton.tsx`

### Dependencies
- fn-4.1 (shared infrastructure, TerminalBlock, EcosystemIcon)
- fn-4.2 (usePackageDetail hook, PackageDetail types)
## Acceptance
- [ ] `/registry/package/npm/react` renders without errors
- [ ] `/registry/package/npm/@scope/pkg` handles scoped packages via catch-all
- [ ] generateMetadata produces correct title (e.g., "npm:react | Auths Registry")
- [ ] Ecosystem icon renders correctly for npm, pypi, cargo, docker
- [ ] "Cryptographically Verified" badge shows for packages with signers
- [ ] Two terminal blocks render: install command + verify command
- [ ] Install command is ecosystem-specific (npm install, pip install, cargo add)
- [ ] Not-found state renders for unknown packages
- [ ] Skeleton renders during loading
- [ ] Build passes
## Done summary
Created package route with page.tsx, package-client.tsx, package-skeleton.tsx. Catch-all [...name] for scoped packages. Zone A renders ecosystem icon, package name, verification badge with glow, side-by-side install+verify terminal blocks. Not-found state shows CTA to sign.
## Evidence
- Commits:
- Tests: next build
- PRs: