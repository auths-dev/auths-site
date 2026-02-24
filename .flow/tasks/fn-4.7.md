# fn-4.7 Package page: Chain of Trust Timeline (Zone B)

## Description
## Package page: Chain of Trust Timeline (Zone B)

### What
Build the centerpiece of the package page — an animated, scroll-triggered vertical timeline that visualizes the cryptographic chain of trust.

### Design

**Section Header**: "Chain of Trust" with subtext: "You aren't trusting a server. You are trusting math."

**Timeline Nodes** (5 nodes per release):
1. **The Artifact**: Package icon + version + digest hash (SHA256: truncated)
2. **The Signature**: Lock icon + "Valid Ed25519 signature" + timestamp
3. **The Device**: Laptop icon + "Signed by Key" + truncated key_id
4. **The Identity**: User icon + "Key authorized by DID" + truncated DID (clickable → profile page)
5. **The Authority**: Shield icon + "DID controls {platform} {namespace}" (if claims exist)

**Visual Design**:
- Vertical line connecting nodes: `border-l-2 border-zinc-700`
- Each node: circle marker on the line + content card to the right
- Content cards: `rounded-lg border border-border bg-muted-bg px-4 py-3`

**Scroll-Triggered Animation**:
- Use `motion.ol` with `whileInView` + `viewport={{ once: true, amount: 0.2 }}`
- **CRITICAL**: `once: true` is strictly required. Re-triggering on scroll up/down is annoying, not impressive.
- Parent: `staggerChildren: 0.15, delayChildren: 0.1`
- Children: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`

**Connector Line Draw Effect**:
- Use `motion.div` with `style={{ originY: 0 }}` and `animate={{ scaleY: [0, 1] }}`
- This makes the vertical line "draw itself" downward as nodes appear

**Data Source**: Use `buildTrustChain()` from fn-4.2 for the most recent release. Dropdown to select other versions if multiple exist.

**Empty State**: If no releases, show: "No signed releases yet."

### Component
- `src/components/chain-of-trust.tsx`

### Accessibility
- `<ol>` with `role="list"` and `aria-label="Chain of trust verification"`
- Each node is an `<li>` with descriptive text
- motion/react respects `prefers-reduced-motion` automatically

### Dependencies
- fn-4.6 (package page scaffold)
- fn-4.2 (buildTrustChain, TrustChainNode type)
## Package page: Chain of Trust Timeline (Zone B)

### What
Build the centerpiece of the package page — an animated, scroll-triggered vertical timeline that visualizes the cryptographic chain of trust from artifact to authority.

### Design

**Section Header**: "Chain of Trust" with subtext: "You aren't trusting a server. You are trusting math."

**Timeline Nodes** (5 nodes per release, connected by vertical lines):

1. **The Artifact**: Package icon + version + digest hash (SHA256: truncated)
2. **The Signature**: Lock icon + "Valid Ed25519 signature" + timestamp
3. **The Device**: Laptop icon + "Signed by Key" + truncated key_id
4. **The Identity**: User icon + "Key authorized by DID" + truncated DID (clickable → profile page)
5. **The Authority**: Shield icon + "DID controls {platform} {namespace}" (if platform claims exist)

**Visual Design**:
- Vertical line connecting nodes: `border-l-2 border-zinc-700` (match existing trust-graph.tsx pattern)
- Each node: circle marker on the line + content card to the right
- Node markers: colored by type (use tier colors or verified green)
- Content cards: `rounded-lg border border-border bg-muted-bg px-4 py-3`

**Scroll-Triggered Animation**:
- Use `motion.ol` with `whileInView` + `viewport={{ once: true, amount: 0.2 }}`
- Parent: `staggerChildren: 0.15, delayChildren: 0.1`
- Children: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`
- The connecting line draws itself as nodes appear (use `scaleY` transform with `useScroll` or simple opacity)

**Data Source**: Use `buildTrustChain()` from fn-4.2 to produce the 5 nodes for the most recent release. Show the chain for the latest release by default, with a dropdown to select other versions.

**Empty State**: If no releases, show: "No signed releases yet."

### Component
- `src/components/chain-of-trust.tsx`
- Imported by `package-client.tsx`

### Accessibility
- Use `<ol>` with `role="list"` and `aria-label="Chain of trust verification"`
- Each node is an `<li>` with descriptive text
- Respect `prefers-reduced-motion` (motion/react handles this automatically)

### Files to Create
- `src/components/chain-of-trust.tsx`

### Files to Modify
- `src/app/registry/package/[ecosystem]/[...name]/package-client.tsx` — add Zone B

### Dependencies
- fn-4.6 (package page scaffold)
- fn-4.2 (buildTrustChain function, TrustChainNode type)
## Acceptance
- [ ] Chain of trust timeline renders 5 connected nodes for a release
- [ ] Nodes animate in with scroll-triggered stagger (whileInView)
- [ ] `viewport={{ once: true }}` is set — animation does NOT re-trigger on scroll
- [ ] Vertical connecting line "draws itself" with scaleY animation (originY: 0)
- [ ] Identity node DID is clickable (links to profile page)
- [ ] Each node shows correct icon and data
- [ ] Uses `<ol>` with proper ARIA attributes
- [ ] Empty state renders for packages with no releases
- [ ] Animation respects prefers-reduced-motion
- [ ] Build passes
## Done summary
Created chain-of-trust.tsx. 5-node scroll-triggered timeline with whileInView once:true, scaleY connector line draw, per-type icons/colors, DID links.
## Evidence
- Commits:
- Tests: next build
- PRs: