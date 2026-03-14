# fn-7.6 Add org policy display on org pages

## Description
## Add org policy display on org pages

Add a read-only policy section to the org page showing the current signing policy (if set) from `GET /v1/orgs/{org_did}/policy`.

### Changes
1. Add `fetchOrgPolicy(orgDid)` to `registry.ts` using `registryFetch`
2. Add `orgPolicy` key to `registryKeys`
3. Create a `OrgPolicy` section in `org-client.tsx` that fetches and displays the policy
4. If no policy set, show: "No signing policy configured"
5. If policy set, display the policy expression as formatted JSON
6. Add a `staleTime: 300_000` (policies change rarely)

### Design
- Section card matching existing org sections
- Title: "Signing Policy" with a shield icon
- Policy display: monospace JSON in a dark code block
- Empty state: muted guidance text
## Acceptance
- [ ] Org page shows "Signing Policy" section
- [ ] Fetches from `GET /v1/orgs/{org_did}/policy`
- [ ] Shows formatted policy or "No policy configured"
- [ ] `pnpm typecheck` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
