# fn-4.9 Cross-linking + search integration

## Description
## Cross-linking + search integration

### What
Wire the new detail pages into existing registry navigation. Update search results to link to detail pages and ensure smooth cross-page navigation.

### Changes

**1. Smart Back Button (CRITICAL)**:
The "← Back to Registry" link must not destroy the user's search context.

- Detail pages accept an optional `?from_query=` URL parameter
- The back button component:
  - If `from_query` exists: navigates to `/registry?q={from_query}` (preserves search)
  - Else: navigates to `/registry` (clean dashboard)
- All links TO detail pages from search results must append `?from_query={encodeURIComponent(currentQuery)}`
- Links from external sources (shared URLs) won't have `from_query`, so they correctly go to the dashboard

**2. Update search results to link to detail pages**:
- In `registry-client.tsx` / `SearchResults`: When an identity result is active, add a "View Full Profile →" link to `/registry/identity/{did}?from_query={query}`
- When artifact results appear, make package names clickable → `/registry/package/{ecosystem}/{name}?from_query={query}`
- Keep inline rendering — detail pages are a deeper view

**3. Update `ActiveIdentityDisplay`**:
- Add a "View Full Profile →" link at the bottom → `/registry/identity/{did}`

**4. Update `ArtifactResults`**:
- Make `package_name` clickable → link to `/registry/package/{parsed_ecosystem}/{parsed_name}`
- Parse ecosystem from package_name prefix (e.g., "npm:react" → ecosystem="npm", name="react")

**5. Cross-links between pages**:
- Identity profile → Artifact Portfolio cards link to package page
- Package page → Signer cards link to identity profile
- Package page → Chain of Trust identity node links to identity profile
- Package page → Provenance ledger signer DID links to identity profile

### Files to Modify
- `src/app/registry/registry-client.tsx` — add profile link, pass from_query
- `src/components/active-identity-display.tsx` — add "View Full Profile" link
- `src/components/artifact-results.tsx` — make package_name a Link
- `src/components/artifact-portfolio.tsx` — ensure cards link to package page
- `src/components/authorized-signers.tsx` — ensure cards link to profile
- `src/components/chain-of-trust.tsx` — ensure DID node links to profile
- `src/components/provenance-ledger.tsx` — ensure DID links to profile
- Detail page client components — read `from_query` param, render smart back button

### Dependencies
- fn-4.3, fn-4.4, fn-4.5 (identity page complete)
- fn-4.6, fn-4.7, fn-4.8 (package page complete)
## Cross-linking + search integration

### What
Wire the new detail pages into the existing registry navigation flow. Update search results to link to detail pages and ensure smooth cross-page navigation.

### Changes

**1. Update search results to link to detail pages**:
- In `registry-client.tsx` / `SearchResults`: When an identity result is active, add a "View Full Profile →" link to `/registry/identity/{did}`
- When artifact results appear, make package names clickable → `/registry/package/{ecosystem}/{name}`
- Keep inline rendering (don't remove it) — detail pages are a deeper view

**2. Update `ActiveIdentityDisplay`**:
- Add a "View Full Profile →" link at the bottom → `/registry/identity/{did}`
- Keep existing inline rendering intact

**3. Update `ArtifactResults`**:
- Make `package_name` clickable → link to `/registry/package/{parsed_ecosystem}/{parsed_name}`
- Parse ecosystem from package_name prefix (e.g., "npm:react" → ecosystem="npm", name="react")
- Keep `onSignerClick` behavior for signer DID clicks

**4. Cross-links between pages**:
- Identity profile → Artifact Portfolio cards link to package page
- Package page → Signer cards link to identity profile
- Package page → Chain of Trust identity node links to identity profile
- Package page → Provenance ledger signer DID links to identity profile

**5. Back navigation**:
- Both detail pages should have a "← Back to Registry" link at the top
- Use `<Link href="/registry">` (not router.back(), which may go elsewhere)

### Files to Modify
- `src/app/registry/registry-client.tsx` — add profile link from search results
- `src/components/active-identity-display.tsx` — add "View Full Profile" link
- `src/components/artifact-results.tsx` — make package_name a Link
- `src/components/artifact-portfolio.tsx` — ensure cards link to package page (from fn-4.5)
- `src/components/authorized-signers.tsx` — ensure cards link to profile (from fn-4.8)
- `src/components/chain-of-trust.tsx` — ensure DID node links to profile (from fn-4.7)
- `src/components/provenance-ledger.tsx` — ensure DID links to profile (from fn-4.8)

### Dependencies
- fn-4.3, fn-4.4, fn-4.5 (identity page complete)
- fn-4.6, fn-4.7, fn-4.8 (package page complete)
## Acceptance
- [ ] Smart back button: preserves search query when navigating back from detail pages
- [ ] Detail pages with `?from_query=auths-cli` → back goes to `/registry?q=auths-cli`
- [ ] Detail pages without `from_query` → back goes to `/registry` (dashboard)
- [ ] Search results pass `from_query` when linking to detail pages
- [ ] Search results show "View Full Profile" link for active identity results
- [ ] Package names in artifact results are clickable links to package page
- [ ] Identity profile artifact cards link to package detail pages
- [ ] Package page signer cards link to identity profiles
- [ ] Chain of trust DID node links to identity profile
- [ ] Provenance ledger DID column links to identity profile
- [ ] All links use Next.js `<Link>` component
- [ ] No broken links when navigating between pages
- [ ] Build passes
## Done summary
Smart back button with from_query param, package name links in ArtifactResults, View Full Profile link in ActiveIdentityDisplay, cross-links between all pages.
## Evidence
- Commits:
- Tests: next build
- PRs: