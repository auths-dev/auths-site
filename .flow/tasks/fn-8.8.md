# fn-8.8 Org flow: summary dashboard + orchestrator

## Description
## What
Create the org summary dashboard and the orchestrator that composes auth gate + task cards.

## Files
- Create: `apps/web/src/app/try/org/summary-dashboard.tsx`
- Create: `apps/web/src/app/try/org/org-flow.tsx`

## SummaryDashboard
- Pulls live data from `fetchOrgStatus(orgDid, token)` via `useQuery` with `refetchInterval: 10_000`
- Shows: org name, DID (copyable), member count, pending invites, signing policy status
- Stats grid: `grid-cols-1 sm:grid-cols-3` (gap fix: responsive)
- Links to `/registry/org/{did}` and registry explorer
- Uses optional chaining `auth?.token` instead of `auth!.token` (gap fix: non-null assertion)

## OrgFlow orchestrator
- Auth gate: if not authenticated, show ChallengeAuth + link to individual wizard
- Renders three TaskCards (create, invite, policy) — free-form, any order
- "View dashboard" button when orgDid is available
- State: `orgDid`, `orgName`, `policySet`, `showDashboard`

## Styling
- Dashboard stats: `rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center`
- Emerald for enabled policy, zinc-500 for disabled
## Acceptance
- [ ] SummaryDashboard polls org status every 10s
- [ ] No `auth!` non-null assertion (uses optional chaining)
- [ ] Stats grid responsive (1 col mobile, 3 col desktop)
- [ ] OrgFlow shows auth gate when unauthenticated
- [ ] "View dashboard" appears when orgDid available
- [ ] TypeScript compiles
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
