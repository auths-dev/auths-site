# fn-8.6 Individual flow: completion + orchestrator

## Description
## What
Create the completion view and the orchestrator that composes all three steps into the sequential wizard.

## Files
- Create: `apps/web/src/app/try/individual/completion.tsx`
- Create: `apps/web/src/app/try/individual/individual-flow.tsx`

## Completion
- Checkmark icon + "You're set up" heading
- Published artifact details (package, digest, date)
- WASM verify demo via `AuthsVerifyWidget` component (mode="detail", size="lg")
- Hint: "Your .auths.json file is in the same directory as the file you signed" (gap fix)
- Redirect-aware CTAs:
  - If `?redirect` present: "Continue to join org" (primary) + "Explore the registry" (secondary)
  - If no redirect: "Explore the registry" (primary) + "Set up an organization" → `/try?flow=org` (secondary)
- **Security**: Validate `redirectTo` starts with `/` to prevent open redirects (gap fix)

## IndividualFlow orchestrator
- State: `currentStep: 1 | 2 | 3 | 'done'`, `completedSteps: Set<number>`, `did`, `artifact`
- Step indicator: `<nav aria-label="Onboarding steps"><ol>` with `aria-current="step"` (gap fix)
- `AnimatePresence mode="wait"` for step transitions
- Sequential gating: can't advance without completing prior step
- Receives `redirectTo?: string` prop

## Styling
- Step indicator: numbered circles with emerald-500 for complete, zinc-700 for current, zinc-800 for future
- Transitions: `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}`
- Import `{ motion, AnimatePresence } from 'motion/react'`
## Acceptance
- [ ] Completion shows artifact details and WASM demo
- [ ] `redirectTo` validated to start with `/` (no open redirect)
- [ ] Correct CTAs based on redirect presence
- [ ] IndividualFlow sequential gating works
- [ ] Step indicator uses `<ol>` with `aria-current="step"`
- [ ] AnimatePresence mode="wait" for transitions
- [ ] TypeScript compiles
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
