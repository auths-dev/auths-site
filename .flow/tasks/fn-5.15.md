# fn-5.15 Add namespace delegation display (frontend)

## Description
## Add namespace delegation display (frontend)

**Repo:** auths-site

### Problem

`GET /v1/namespaces/{eco}/{pkg}` returns delegates (authorized publishers), but the package page doesn't display them. Users can't see who is authorized to publish under a namespace.

### Changes Required

1. **`apps/web/src/lib/api/registry.ts`** — Add `fetchNamespaceDetails(ecosystem: string, packageName: string)` if not already present, or verify existing fetch function returns delegate data
2. **`apps/web/src/lib/queries/registry.ts`** — Add `namespace` key to `registryKeys` factory
3. **Package detail page** — Add "Authorized Publishers" section below the provenance ledger, listing delegates with:
   - Delegate DID (truncated with `truncateMiddle()` + `CopyButton`)
   - Link to delegate's identity page
   - Delegation date if available
4. **`apps/web/src/lib/api/fixtures.ts`** — Add namespace fixture with delegates

### Design
- Section title: "Authorized Publishers" with a key icon
- List delegates as cards matching the existing signer card style
- If no delegates, show: "Only the namespace owner can publish to this package"
## Acceptance
- [ ] Package page shows "Authorized Publishers" section with delegates
- [ ] Delegate DIDs displayed with truncation and copy button
- [ ] Delegates link to their identity pages
- [ ] Empty state shown when namespace has no delegates
- [ ] Fixture includes namespace with delegates
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
## Done summary
- Added fetchNamespaceInfo and NamespaceInfo types to registry.ts
- Created AuthorizedPublishers component with owner + delegate display
- Added to package detail page
- Added namespace key to registryKeys
## Evidence
- Commits: 2ee43e68dd9981d0137df5982c520b35cb8f8b91
- Tests:
- PRs: