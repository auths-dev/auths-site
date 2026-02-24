# fn-4.5 Identity page: Artifact Portfolio (Zone D)

## Description
## Identity page: Artifact Portfolio (Zone D)

### What
Build Zone D for the identity profile page — a grid of packages this DID has cryptographically signed.

### Design

**Section Header**: "Signed Artifacts" + count badge: "Showing {n} cryptographically registered projects"

**Artifact Cards** (from `data.artifacts` on ActiveIdentity):
- Grid layout: `md:grid-cols-2` (2 columns desktop, 1 mobile)
- Each card: `rounded-lg border border-border bg-muted-bg px-4 py-3`
- Shows: Package name (bold, clickable → package page), digest info, relative timestamp
- Use existing rendering patterns from `artifact-results.tsx` adapted to card/grid form

**Visual Overload Mitigation (CRITICAL)**: If a highly active maintainer has hundreds of signed artifacts, rendering them all will crash the DOM.
- Default display: `artifacts.slice(0, 6)` — show only the first 6 cards
- If more exist, render a "View All ({total}) →" button below the grid
- Clicking "View All" either expands to show all, or paginates in batches of 12
- The count badge in the section header always shows the TOTAL count

**Gamification CTA** (bottom of zone):
- If artifacts exist: Dashed border box: "Maintain other packages? Publish their signatures to the registry to boost your Web of Trust rank."
- Style: `border-dashed border-zinc-700 text-zinc-500`

**Empty State**: If zero artifacts: "No signed artifacts yet." + CTA: "Sign your first package: `auths artifact sign ./my-package.tar.gz`"

### Component
- `src/components/artifact-portfolio.tsx` — Zone D

### Dependencies
- fn-4.3 (identity page scaffold)
## Identity page: Artifact Portfolio (Zone D)

### What
Build Zone D for the identity profile page — a grid of packages this DID has cryptographically signed.

### Design

**Section Header**: "Signed Artifacts" + count badge: "Showing {n} cryptographically registered projects"

**Artifact Cards** (from `data.artifacts` on ActiveIdentity):
- Grid layout: `md:grid-cols-2` (2 columns desktop, 1 mobile)
- Each card: `rounded-lg border border-border bg-muted-bg px-4 py-3`
- Shows: Package name (bold, clickable → links to `/registry/package/{ecosystem}/{name}`), digest algorithm + truncated hex, signer info, relative timestamp of last signature
- Use existing rendering patterns from `artifact-results.tsx` but in card/grid form instead of list

**Gamification CTA** (bottom of zone):
- If artifacts exist: Dashed border box saying "Maintain other packages? Publish their signatures to the registry to boost your Web of Trust rank."
- Link to onboarding/documentation
- Style: `border-dashed border-zinc-700 text-zinc-500` muted call-to-action

**Empty State**: If zero artifacts: "No signed artifacts yet." + CTA: "Sign your first package: `auths artifact sign ./my-package.tar.gz`"

### Component
- `src/components/artifact-portfolio.tsx` — Zone D
- Imported by `identity-client.tsx`

### Files to Create
- `src/components/artifact-portfolio.tsx`

### Files to Modify
- `src/app/registry/identity/[did]/identity-client.tsx` — add Zone D rendering

### Dependencies
- fn-4.3 (identity page scaffold)
## Acceptance
- [ ] Artifact Portfolio renders card grid for artifacts
- [ ] Default display capped at 6 cards to prevent DOM overload
- [ ] "View All (N)" button appears when more than 6 artifacts exist
- [ ] Count badge in header shows TOTAL count (not just visible count)
- [ ] Package names are clickable (link to package detail page)
- [ ] Gamification CTA appears when artifacts exist
- [ ] Empty state shows signing instructions when zero artifacts
- [ ] Grid layout: 2-col desktop, 1-col mobile
- [ ] Staggered animation on card entry
- [ ] Build passes
## Done summary
Created artifact-portfolio.tsx. Default 6-card cap, View All button, gamification CTA, empty state with signing instructions.
## Evidence
- Commits:
- Tests: next build
- PRs: