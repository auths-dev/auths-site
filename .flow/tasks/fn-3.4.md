# fn-3.4 Build omni-search UI with URL-synced state and results display

## Description
## Build omni-search UI with URL-synced state and results display

### What
Implement the full omni-search interface in `registry-client.tsx` with search input, URL-synced state, loading/error states, and result rendering for all search types — including paginated artifact results, DID identity state, and trust graph visualization.

### How
1. **Update** `apps/web/src/app/registry/registry-client.tsx`:

   **Search input:**
   - Full-width input with placeholder
   - Sync input value to URL `?q=` param using `useSearchParams` + **`useRouter.replace()`**
   - On mount, read `?q=` from URL to populate input
   - Properly decode URL params with special characters

   **Integration with query hooks:**
   - Use `useRegistrySearch(query)` from `@/lib/queries/registry`
   - Loading, error, placeholder data states handled as expected

   **Result rendering (by search type):**

   - `type === 'package'` / `type === 'repo'` (artifact results):
     Render using `<ArtifactResults>` (fn-3.8). Pass `onSignerClick` callback that sets the search input to the clicked DID.
     **Pagination**: "Load More" button at bottom, triggers `fetchNextPage()`, visible only when `hasNextPage`, disabled with spinner when `isFetchingNextPage`.

   - `type === 'repo'` (git resolver fallback):
     If registry returned nothing and git resolver produced results, display via `<TrustGraph />` — a **dedicated component** extracted from `registry-client.tsx` to keep the file clean.

   **`<TrustGraph />` component** (`apps/web/src/components/trust-graph.tsx`):
   - Accepts `ResolveResult` as a prop
   - Renders a vertical timeline: Repository → Signer DID → Platform Attestation → Device Key
   - Staggered `motion.div` animations for each node
   - Nodes connected by a vertical line using `var(--border)` color
   - DIDs/keys in Geist Mono with truncation and copy affordance

   - `type === 'identity'` active: display public keys and platform claims
   - `type === 'identity'` unclaimed: render `<ClaimIdentityCTA>` platform+namespace variant
   - `type === 'did'` active: render parsed KERI identity state
   - `type === 'did'` unclaimed: render `<ClaimIdentityCTA>` raw DID variant
   - No results / unknown: helpful empty state with example search links

   **Component cleanliness:**
   - Rely on component structure and clear variable names to communicate intent
   - Keep inline comments to an absolute minimum — reserve them only for tricky lifecycle management or complex `useMemo` dependencies
   - Extract `<TrustGraph />` into its own file to avoid a bloated registry-client.tsx

   **Styling:**
   - CSS variables from globals.css, `motion/react` for animations
   - Geist Mono for DIDs/keys/hashes, Geist Sans for UI text

### Key references
- Explorer client: `apps/web/src/app/explorer/explorer-client.tsx`
- KelTimeline: `apps/web/src/components/kel-timeline.tsx`
- CSS variables: `apps/web/src/app/globals.css`
- Query hooks: `apps/web/src/lib/queries/registry.ts` (fn-3.3)
- ArtifactResults: `apps/web/src/components/artifact-results.tsx` (fn-3.8)
## Build omni-search UI with URL-synced state and results display

### What
Implement the full omni-search interface in `registry-client.tsx` with search input, URL-synced state, loading/error states, and result rendering for all search types — including paginated artifact results, DID identity state, and trust graph visualization.

### How
1. **Update** `apps/web/src/app/registry/registry-client.tsx`:

   **Search input:**
   - Full-width input with placeholder: "Search packages, repos, identities... (e.g., npm:auths-cli, github.com/org/repo, @username)"
   - Sync input value to URL `?q=` param using `useSearchParams` + **`useRouter.replace()`** (NOT `push`)
   - On mount, read `?q=` from URL to populate input (for shared links)
   - Properly decode URL params containing special characters (`@`, `/`, `:`)

   **Integration with query hooks:**
   - Use `useRegistrySearch(query)` from `@/lib/queries/registry`
   - Show loading spinner when `isFetching` is true
   - Show subtle opacity reduction when `isPlaceholderData` is true
   - Show error state with retry button when `isError`

   **Result rendering (by search type):**

   - `type === 'package'` / `type === 'repo'` (artifact results):
     Render using `<ArtifactResults>` component (from fn-3.8). Display a list of `ArtifactEntry` records.
     **Pagination UI**: At the bottom of the artifact results list, render a "Load More" button that triggers `fetchNextPage()` from the infinite query hook. Show the button only when `hasNextPage` is true. Disable it and show a spinner when `isFetchingNextPage` is true. Hide it when all pages are loaded.

   - `type === 'repo'` (git resolver fallback):
     If the registry API returned nothing and the git resolver fallback produced results, display the trust graph visualization as a vertical timeline: Repository → Signer DID → Platform Attestation → Device Key. Use staggered `motion.div` animations.

   - `type === 'identity'` with active status:
     Display the identity's public keys and platform claims from the `PubkeysResponse`.

   - `type === 'identity'` with unclaimed status:
     Render `<ClaimIdentityCTA>` (from fn-3.5) with platform + namespace variant.

   - `type === 'did'` with active status:
     Render the parsed KERI identity state returned by the backend. Display key state, signing thresholds, witnesses, or whatever fields the backend returns for an active identity.

   - `type === 'did'` with unclaimed status:
     Render `<ClaimIdentityCTA>` (from fn-3.5) with raw DID variant.

   - No results / unknown: Show helpful empty state with search tips

   **Empty state (no query):**
   - Show a hero section explaining the registry with example searches users can click to try

   **Styling:**
   - Use CSS variables from globals.css (--border, --muted-bg, --accent-verified, etc.)
   - Use `motion/react` for result entry animations and trust graph stagger
   - Font: Geist Mono for code-like elements (DIDs, keys, digest hashes), Geist Sans for UI text

### Key references
- Explorer client (primary template): `apps/web/src/app/explorer/explorer-client.tsx`
- KelTimeline component: `apps/web/src/components/kel-timeline.tsx`
- Motion usage: check existing components for `motion.div` patterns
- CSS variables: `apps/web/src/app/globals.css`
- Query hooks: `apps/web/src/lib/queries/registry.ts` (fn-3.3)
- ArtifactResults component: `apps/web/src/components/artifact-results.tsx` (fn-3.8)
## Build omni-search UI with URL-synced state and results display

### What
Implement the full omni-search interface in `registry-client.tsx` with a search input, URL-synced state, loading/error states, and result rendering — including a trust graph visualization for repo results.

### How
1. **Update** `apps/web/src/app/registry/registry-client.tsx`:

   **Search input:**
   - Full-width input with placeholder: "Search packages, repos, identities... (e.g., npm:auths-cli, github.com/org/repo, @username)"
   - Sync input value to URL `?q=` param using `useSearchParams` + **`useRouter.replace()`** (NOT `push` — using `push` would add a browser history entry per debounced keystroke, breaking the Back button)
   - On mount, read `?q=` from URL to populate input (for shared links)
   - Properly decode URL params containing special characters (`@`, `/`, `:`)
   - Submit on Enter or on typing (debounced via the query hook)

   **Integration with query hook:**
   - Use `useRegistrySearch(query)` from `@/lib/queries/registry`
   - Show loading spinner when `isFetching` is true
   - Show subtle opacity reduction when `isPlaceholderData` is true
   - Show error state with retry button when `isError`

   **Result rendering (by search type):**

   - `type === 'repo'` — **Trust Graph Visualization**:
     Instead of just listing DID/key/attestation data, visualize the chain of trust as a vertical timeline using staggered `motion.div` animations. The timeline should connect:
     1. **Repository** (top) — repo name, forge icon, link
     2. **Signer DID** — the identity that signed, truncated DID with copy
     3. **Platform Attestation** — verified GitHub/GitLab handle linked to the DID
     4. **Device Key** — the hardware/software key that produced the signature
     Each node connects to the next with a vertical line/connector. Use `motion.div` with staggered `transition.delay` for each node appearing in sequence. Reuse attestation chain data from `ResolveResult` / `IdentityBundle`.

   - `type === 'identity'` with `claimed: false`: Render `<ClaimIdentityCTA>` (from fn-3.5)

   - `type === 'stub'`: Show a styled info card with the "coming soon" message

   - No results / unknown: Show helpful empty state with search tips

   **Empty state (no query):**
   - Show a hero section explaining the registry with example searches users can click to try

   **Styling:**
   - Use CSS variables from globals.css (--border, --muted-bg, --accent-verified, etc.)
   - Use `motion/react` for result entry animations and trust graph stagger
   - Font: Geist Mono for code-like elements (DIDs, keys), Geist Sans for UI text
   - Trust graph connector line: use `var(--border)` color, 2px width

### Key references
- Explorer client (primary template): `apps/web/src/app/explorer/explorer-client.tsx`
- KelTimeline component (attestation chain rendering): `apps/web/src/components/kel-timeline.tsx`
- Motion usage: check existing components for `motion.div` patterns
- CSS variables: `apps/web/src/app/globals.css`
- Query hook: `apps/web/src/lib/queries/registry.ts` (from fn-3.3)
## Build omni-search UI with URL-synced state and results display

### What
Implement the full omni-search interface in `registry-client.tsx` with a search input, URL-synced state, loading/error states, and result rendering for all search types.

### How
1. **Update** `apps/web/src/app/registry/registry-client.tsx`:

   **Search input:**
   - Full-width input with placeholder: "Search packages, repos, identities... (e.g., npm:auths-cli, github.com/org/repo, @username)"
   - Sync input value to URL `?q=` param using `useSearchParams` + `useRouter.replace()`
   - On mount, read `?q=` from URL to populate input (for shared links)
   - Submit on Enter or on typing (debounced via the query hook)

   **Integration with query hook:**
   - Use `useRegistrySearch(query)` from `@/lib/queries/registry`
   - Show loading spinner when `isFetching` is true
   - Show subtle opacity reduction when `isPlaceholderData` is true
   - Show error state with retry button when `isError`

   **Result rendering (by search type):**
   - `type === 'repo'`: Display identity bundle — DID, public key hex, attestation chain. Reuse patterns from explorer-client.tsx (not the component directly — adapt the rendering). Use `motion.div` for entry animations.
   - `type === 'identity'` with `claimed: false`: Render `<ClaimIdentityCTA>` (from fn-3.5)
   - `type === 'stub'`: Show a styled info card with the "coming soon" message
   - No results / unknown: Show helpful empty state with search tips

   **Empty state (no query):**
   - Show a hero section explaining the registry with example searches users can click to try

   **Styling:**
   - Use CSS variables from globals.css (--border, --muted-bg, --accent-verified, etc.)
   - Use `motion/react` for result entry animations
   - Font: Geist Mono for code-like elements (DIDs, keys), Geist Sans for UI text

### Key references
- Explorer client (primary template): `apps/web/src/app/explorer/explorer-client.tsx`
- Motion usage: check existing components for `motion.div` patterns
- CSS variables: `apps/web/src/app/globals.css`
- Query hook: `apps/web/src/lib/queries/registry.ts` (from fn-3.3)
## Acceptance
- [ ] Search input syncs to URL `?q=` via `router.replace`
- [ ] Loading `/registry?q=github.com/auths/auths` pre-populates input and triggers search
- [ ] URL params with special characters decode correctly
- [ ] Package/artifact results render via `<ArtifactResults>` with `onSignerClick` for search pivoting
- [ ] "Load More" button appears when `hasNextPage`, triggers `fetchNextPage()`, shows spinner during fetch
- [ ] "Load More" hidden when all pages loaded
- [ ] Git resolver fallback results render via `<TrustGraph />` component
- [ ] `<TrustGraph />` is extracted into `components/trust-graph.tsx` (NOT inline in registry-client.tsx)
- [ ] `<TrustGraph />` accepts `ResolveResult` as prop, renders vertical timeline with staggered animations
- [ ] Identity active → public keys/platform claims displayed
- [ ] Identity unclaimed → `<ClaimIdentityCTA>` platform+namespace variant
- [ ] DID active → parsed KERI identity state rendered
- [ ] DID unclaimed → `<ClaimIdentityCTA>` raw DID variant
- [ ] Empty state shows clickable example search links
- [ ] Minimal inline comments — code clarity through naming and structure
- [ ] All styling uses CSS custom properties
- [ ] `pnpm build` succeeds
## Done summary
- Updated apps/web/src/app/registry/registry-client.tsx with full omni-search UI
- Created apps/web/src/components/trust-graph.tsx (extracted, not inline)
- Search input syncs to URL ?q= via router.replace, decodes special characters on mount
- Uses useRegistrySearch hook for all search routing
- Result rendering: artifacts via ArtifactResults with pagination Load More button, pubkeys display, active identity display, unclaimed CTA variants, repo fallback via TrustGraph
- TrustGraph: vertical timeline with staggered motion animations, shows Repository → Signer DID → Public Key → Platform Attestation → Device Key
- PubkeysDisplay: shows DID, platform claims with verification badges, public keys
- ActiveIdentityDisplay: shows DID, platform claims, public keys, signed artifacts
- ExampleSearches: clickable example search links in empty state
- Opacity reduction during isFetching, skeleton during isLoading, error state display
- Verification: `pnpm build` succeeds
## Evidence
- Commits:
- Tests: pnpm build
- PRs: