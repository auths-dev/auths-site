# fn-4.8 Package page: Authorized Signers + Provenance Ledger (Zone C + D)

## Description
## Package page: Authorized Signers + Provenance Ledger (Zone C + D)

### What
Build Zone C (Authorized Signers grid) and Zone D (Release Provenance Ledger) for the package page.

### Zone C: Authorized Signers

**Section Header**: "Authorized Signers" + count

**Signer Cards** (from `PackageDetail.signers`):
- Grid: `md:grid-cols-3`
- Each card: `rounded-lg border border-border bg-muted-bg px-4 py-3`
- Shows: Avatar (GitHub or boring-avatars identicon), truncated DID, signature count, last signed date
- Clickable → navigates to `/registry/identity/{did}`
- Green checkmark for verified signers

**Ghost Signers** (deferred for MVP):
- Design the card component to accept a `ghost` prop for future use
- Ghost cards: `opacity-40 border-dashed`, "Unprotected" label

**Invite CTA** (below grid):
- "Know other maintainers? Share this link to secure their publishing rights."
- Copy button for the current package page URL

### Zone D: Release Provenance Ledger

**Section Header**: "Release History" + count

**Table Design**:
- Columns: Digest Hash | Signer DID | Timestamp | Status
- Status: "Valid" with green dot (designed for future "Revoked" with red dot)
- Signer DID: clickable → profile page
- Digest: truncated with copy-on-click

**Mobile Responsive (CRITICAL)**:
- Tables are terrible on mobile. On screens below `md` breakpoint:
- Show a simplified card list instead of a table
- Each card shows: Status + Signer DID at top level
- "Expand" accordion to reveal Digest Hash and Timestamp details
- This prevents horizontal scrolling on narrow screens

**Pagination**: Cursor-based "Load More" button (same pattern as registry search).

**Empty State**: "No releases published yet."

### Component Structure
- `src/components/authorized-signers.tsx` — Zone C
- `src/components/provenance-ledger.tsx` — Zone D

### Dependencies
- fn-4.6 (package page scaffold)
- fn-4.2 (PackageSigner, PackageRelease types)
## Package page: Authorized Signers + Provenance Ledger (Zone C + D)

### What
Build Zone C (Authorized Signers grid) and Zone D (Release Provenance Ledger) for the package page.

### Zone C: Authorized Signers

**Section Header**: "Authorized Signers" + count (e.g., "2 registered signers")

**Signer Cards** (from `PackageDetail.signers`):
- Grid: `md:grid-cols-3` (3 columns desktop, 1 mobile)
- Each card: `rounded-lg border border-border bg-muted-bg px-4 py-3`
- Shows: Avatar (GitHub avatar or boring-avatars identicon), truncated DID, signature count, last signed date
- Clickable → navigates to `/registry/identity/{did}`
- Green checkmark badge for verified signers

**Ghost Signers** (deferred for MVP — no npm API integration):
- For MVP, only show signers who have actually signed releases on the registry
- Design the card component to accept a `ghost` prop for future use
- Ghost cards: `opacity-40 border-dashed`, "Unprotected" label, invite CTA

**Invite CTA** (below signer grid):
- "Know other maintainers? Share this link to secure their publishing rights."
- Shareable URL: the current package page URL
- Copy button for the URL

### Zone D: Release Provenance Ledger

**Section Header**: "Release History" + count

**Table Design**:
- Columns: Digest Hash | Signer DID | Timestamp | Status
- (Version column omitted for MVP — not in current ArtifactEntry type)
- Status: "Valid" with green dot for all entries currently; design supports "Revoked" with red dot in future
- Rows: `border-b border-border hover:bg-muted-bg/50`
- Signer DID: clickable → profile page
- Digest: truncated with copy-on-click

**Pagination**: Use existing cursor-based pagination pattern from `useArtifactSearch`. Show "Load More" button (same as registry search results).

**Empty State**: "No releases published yet."

**Responsive**: On mobile, stack columns or show a simplified card list instead of table.

### Component Structure
- `src/components/authorized-signers.tsx` — Zone C
- `src/components/provenance-ledger.tsx` — Zone D
- Both imported by `package-client.tsx`

### Files to Create
- `src/components/authorized-signers.tsx`
- `src/components/provenance-ledger.tsx`

### Files to Modify
- `src/app/registry/package/[ecosystem]/[...name]/package-client.tsx` — add Zone C + D

### Dependencies
- fn-4.6 (package page scaffold)
- fn-4.2 (PackageSigner, PackageRelease types)
## Acceptance
- [ ] Authorized Signers renders card grid for each signer
- [ ] Signer cards show avatar, DID, signature count
- [ ] Signer cards clickable → navigate to profile page
- [ ] Ghost card prop exists for future use
- [ ] Invite CTA with copy-to-clipboard for share URL
- [ ] Provenance Ledger renders table on desktop with digest, signer, timestamp, status
- [ ] Mobile: card list view with expand accordion for digest/timestamp details
- [ ] Status shows "Valid" with green indicator
- [ ] Signer DID in table is clickable → profile page
- [ ] Pagination with "Load More" button
- [ ] Empty states for both zones
- [ ] Build passes
## Done summary
Created authorized-signers.tsx and provenance-ledger.tsx. Signer cards with avatars, ghost prop, invite CTA. Desktop table + mobile accordion cards. Pagination.
## Evidence
- Commits:
- Tests: next build
- PRs: