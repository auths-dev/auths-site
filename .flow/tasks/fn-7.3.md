# fn-7.3 Create namespace browse page (/registry/browse/[ecosystem])

## Description
## Create namespace browse page (/registry/browse/[ecosystem])

Create a new page where users can browse all claimed namespaces in an ecosystem, using `fetchNamespaceList(ecosystem)`.

### Changes
1. Create `app/registry/browse/[ecosystem]/page.tsx` — server component with metadata
2. Create `app/registry/browse/[ecosystem]/browse-client.tsx` — client component
3. Use `useQuery` with `registryKeys.namespaceBrowse(ecosystem)` + `fetchNamespaceList(ecosystem)`
4. Display namespaces as a paginated list with: package name, owner DID (truncated), claimed date
5. Each namespace links to `/registry/package/{ecosystem}/{name}`
6. Update `ecosystem-grid.tsx` to link ecosystem buttons to `/registry/browse/{ecosystem}` instead of `/registry?q={ecosystem}:`

### Design
- Header: ecosystem icon + "Browse {Ecosystem} Packages"
- List: same card style as org members (rounded-lg, font-mono text-xs)
- Pagination: "Load More" button using `next_cursor`
## Acceptance
- [ ] `/registry/browse/npm` shows all npm namespace claims
- [ ] Each namespace links to its package page
- [ ] Ecosystem grid buttons link to browse pages
- [ ] Pagination works via Load More
- [ ] `pnpm typecheck` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
