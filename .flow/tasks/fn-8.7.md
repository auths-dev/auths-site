# fn-8.7 Org flow: TaskCard shell + create/invite/policy cards

## Description
## What
Create the TaskCard shell and three org task cards: create, invite, policy.

## Files
- Create: `apps/web/src/app/try/org/task-card.tsx`
- Create: `apps/web/src/app/try/org/create-org-card.tsx`
- Create: `apps/web/src/app/try/org/invite-card.tsx`
- Create: `apps/web/src/app/try/org/policy-card.tsx`

## TaskCard shell
- Expandable/collapsible card with status indicator (not-started/in-progress/complete)
- Status dots: zinc-600 (not started), yellow-400 (in progress), emerald-500 (complete)
- `aria-expanded` on toggle button (gap fix)
- `AnimatePresence` for expand/collapse with `height: "auto"` animation
- `disabled` prop dims card and prevents interaction

## CreateOrgCard
- Input: org name text field
- **Manual org DID input**: "I already have an org" collapsible section with DID paste field (gap fix)
- Action: `createOrg(name, token)` — stores returned `org_did`
- On success: card marks complete, DID available to other cards

## InviteCard
- Requires orgDid (disabled without it)
- Role selector (member/admin), expiry selector (24h/7d/30d)
- Creates invites via `createInvite()`, shows list of generated invites
- Each invite shows join command via `CopyCommand` + invite URL + expiry
- Repeatable — user can generate multiple

## PolicyCard
- Requires orgDid
- Shows CLI commands for repo setup via `CopyCommand`
- "Require all commits to be signed" button → `setOrgPolicy()`
- On success: card marks complete

## Styling
- Cards: `rounded-xl border border-zinc-800 bg-zinc-950/50 p-6`
- Complete cards: `border-emerald-500/30 bg-emerald-500/5`
- Inputs follow registry-hero.tsx pattern (line 35-41)
## Acceptance
- [ ] TaskCard has expand/collapse with `aria-expanded`
- [ ] CreateOrgCard has org name input AND manual org DID input
- [ ] InviteCard generates multiple invites and lists them
- [ ] PolicyCard shows CLI commands and calls setOrgPolicy
- [ ] Cards disabled without orgDid where required
- [ ] Form inputs have `id` linked to `<label htmlFor>`
- [ ] TypeScript compiles
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
