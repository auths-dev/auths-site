# fn-4.4 Identity page: Platform Passport + Key Display (Zone B + C)

## Description
## Identity page: Platform Passport + Key Display (Zone B + C)

### What
Build Zone B (Platform Passport) and Zone C (Hardware/Key Display) for the identity profile page.

### Zone B: Platform Passport (Cross-Forge Identity)

Display a grid of "stamped" passport cards showing cryptographic proof of accounts across platforms.

**Verified Cards** (from `data.platform_claims`):
- Card layout: `rounded-lg border border-border bg-muted-bg px-4 py-3`
- Each card shows: Platform icon (from `@/components/icons/platform-icon`), namespace/username, "Verified" badge with green dot + relative time
- Cards animate in with stagger: `delay: i * 0.04`

**Ghost Cards** (platforms not yet linked):
- Hardcoded list: `['github', 'gitlab', 'gitea', 'radicle', 'npm']`
- Filter out platforms that already have verified claims
- Ghost cards: `opacity-40 border-dashed`
- Show platform icon + "Unverified" label
- On click/hover: reveal CLI command `auths id attest {platform}`

**Layout**: CSS grid, 2 columns on desktop (md:grid-cols-2), 1 column on mobile

### Zone C: Hardware / Key Display

**Key Cards** (from `data.public_keys`):
- Each card: `rounded-lg border border-border bg-muted-bg px-4 py-3`
- Shows: Algorithm badge, derived label (`algorithm + ' · ' + truncateMiddle(key_id, 16)`), full `public_key_hex` truncated with title for hover
- **1-click "Copy Full Key" clipboard button** next to every key card (not just hover title). Security auditors need the full string without hunting for it.
- Creation date if available

**Threshold Display**:
- If threshold data is available (future field), show: "This identity requires {n}-of-{m} signatures to rotate keys"
- For now, show key count: "1 active key" or "3 active keys"

**Empty State**: If no keys, show: "No public keys registered yet."

### Component Structure
- `src/components/platform-passport.tsx` — Zone B
- `src/components/key-display.tsx` — Zone C

### Dependencies
- fn-4.3 (identity page scaffold exists)
## Identity page: Platform Passport + Key Display (Zone B + C)

### What
Build Zone B (Platform Passport) and Zone C (Hardware/Key Display) for the identity profile page.

### Zone B: Platform Passport (Cross-Forge Identity)

Display a grid of "stamped" passport cards showing cryptographic proof of accounts across platforms.

**Verified Cards** (from `data.platform_claims`):
- Card layout: `rounded-lg border border-border bg-muted-bg px-4 py-3` (match existing card pattern)
- Each card shows: Platform icon (from `@/components/icons/platform-icon`), namespace/username, "Verified" badge with green dot + relative time since verification
- Cards animate in with stagger: `delay: i * 0.04`

**Ghost Cards** (platforms not yet linked):
- Hardcoded list of all possible platforms: `['github', 'gitlab', 'gitea', 'radicle', 'npm']`
- Filter out platforms that already have verified claims
- Ghost cards: `opacity-40 border-dashed` styling
- Show platform icon + "Unverified" label
- On click/hover: show the CLI command to link it: `auths id attest {platform}`
- Use existing `generateCliInstructions` from `src/lib/registry.ts` (or a simpler variant)

**Layout**: CSS grid, 2 columns on desktop (md:grid-cols-2), 1 column on mobile

### Zone C: Hardware / Key Display

Show the active Ed25519 public keys authorized to sign for this DID.

**Key Cards** (from `data.public_keys`):
- Each card shows: Algorithm badge (e.g., "Ed25519"), derived label (`algorithm + ' · ' + truncateMiddle(key_id, 16)`), full public_key_hex truncated with title for hover, creation date if available
- Card pattern: `rounded-lg border border-border bg-muted-bg px-4 py-3`

**Threshold Display**:
- If threshold data is available in the API response (future field), show: "This identity requires {n}-of-{m} signatures to rotate keys"
- For now, show key count: "1 active key" or "3 active keys"
- Style: `text-sm text-zinc-500` informational line above the key cards

**Empty State**: If no keys, show: "No public keys registered yet." with a CTA link to documentation.

### Component Structure
- `src/components/platform-passport.tsx` — Zone B
- `src/components/key-display.tsx` — Zone C
- Both imported by `identity-client.tsx`

### Files to Create
- `src/components/platform-passport.tsx`
- `src/components/key-display.tsx`

### Files to Modify
- `src/app/registry/identity/[did]/identity-client.tsx` — add Zone B + C rendering

### Dependencies
- fn-4.3 (identity page scaffold exists)
## Acceptance
- [ ] Platform Passport renders verified cards for each platform_claim
- [ ] Ghost cards appear for platforms not in claims list
- [ ] Ghost cards show "Unverified" with dashed border and reduced opacity
- [ ] Ghost card click/hover reveals CLI attest command
- [ ] Platform icons render correctly via platform-icon component
- [ ] Key Display shows all public keys with algorithm and truncated key_id
- [ ] Every key card has a 1-click "Copy Full Key" clipboard button (not just hover)
- [ ] Key count shown (e.g., "3 active keys")
- [ ] Empty states render for zero claims and zero keys
- [ ] Grid layout: 2-col desktop, 1-col mobile
- [ ] Staggered animation on card entry
- [ ] Build passes
## Done summary
Created platform-passport.tsx and key-display.tsx. Verified cards with icons, ghost cards with CLI reveal, key cards with 1-click Copy Full Key button.
## Evidence
- Commits:
- Tests: next build
- PRs: