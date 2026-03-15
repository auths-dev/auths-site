# fn-8.3 ChallengeAuth component

## Description
## What
Create the shared DID challenge-response UI component used by both wizard flows.

## Files
- Create: `apps/web/src/components/challenge-auth.tsx`

## Details
- State machine: `idle → loading → awaiting-signature → verifying → error`
- Generates nonce via `createChallenge()`, displays CLI command with copy button
- User pastes signature, verifies via `verifyChallenge()`
- On success: calls `setAuth()` from AuthContext + `onSuccess` callback
- Nonce expiry check (client-side, compare `expiresAt` vs `new Date()`)
- "Generate new challenge" button when expired
- Inline error messages for invalid signature (don't regenerate nonce)
- Uses existing `copy-button.tsx` pattern for clipboard

## Styling
- Card: `rounded-xl border border-zinc-800 bg-zinc-950/50 p-6`
- Error: `rounded-lg border border-red-900 bg-red-950/30 p-4 text-red-400` (existing pattern from registry-client.tsx:194)
- Command block: emerald-400 text on zinc-950 bg with `$` prompt prefix
- Loading: `animate-pulse rounded-lg bg-zinc-800`

## Accessibility
- `aria-live="polite"` region for error/expiry messages
- Labels linked to inputs via `htmlFor`/`id`
## Acceptance
- [ ] Challenge flow works: idle → generate → paste signature → verify
- [ ] Nonce expiry shows "Generate new challenge" button
- [ ] Invalid signature shows inline error without regenerating nonce
- [ ] `aria-live` region for status messages
- [ ] Input has `id` linked to `<label htmlFor>`
- [ ] TypeScript compiles
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
