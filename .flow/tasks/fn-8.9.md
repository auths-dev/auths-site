# fn-8.9 Unified /try page with flow selector

## Description
## What
Create the unified `/try` page with "Onboarding" title, two large flow selector buttons, and AnimatePresence to unfold the selected wizard.

## Files
- Create: `apps/web/src/app/try/page.tsx` — server component
- Create: `apps/web/src/app/try/try-client.tsx` — client component

## page.tsx (server component)
- `constructMetadata({ title: 'Onboarding | Auths', description: '...' })`
- Async: `const { flow, redirect } = await searchParams`
- Validate `flow` is `'individual' | 'org'` or undefined
- Validate `redirect` starts with `/` or set to undefined (security: open redirect prevention)
- `<Suspense fallback={skeleton}>` wrapping `<TryClient>`

## TryClient (client component)
- `AuthProvider` wraps everything
- "Onboarding" heading + description
- Two large selector buttons: `grid-cols-1 sm:grid-cols-2`
- Flow selector buttons use `aria-pressed` for accessibility (gap fix)
- `AnimatePresence mode="wait"` to unfold selected wizard
- `?flow=` param pre-selects the flow via `initialFlow` prop
- Renders `<IndividualFlow>` or `<OrgFlow>` based on selection

## Styling
- Selected button: `border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20`
- Unselected: `border-zinc-800 bg-zinc-950/50 hover:border-zinc-700`
- Wizard unfolds below a `border-t border-zinc-800 pt-10` separator
- Page wrapper: `min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30` (matches registry page)
## Acceptance
- [ ] `/try` renders "Onboarding" title and two selector buttons
- [ ] `?flow=individual` pre-selects individual wizard
- [ ] `?flow=org` pre-selects org wizard
- [ ] `?redirect` validated server-side (starts with `/`)
- [ ] Flow selector buttons have `aria-pressed`
- [ ] AnimatePresence mode="wait" for wizard transitions
- [ ] Metadata set via constructMetadata
- [ ] TypeScript compiles
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
