# fn-8.5 Individual flow: install, identity, publish steps

## Description
## What
Create the three individual onboarding steps: install, identity, publish.

## Files
- Create: `apps/web/src/app/try/individual/install-step.tsx`
- Create: `apps/web/src/app/try/individual/identity-step.tsx`
- Create: `apps/web/src/app/try/individual/publish-step.tsx`

## InstallStep
- Shows `curl -fsSL https://get.auths.dev | sh` via `CopyCommand`
- Homebrew alternative as secondary text
- "I've installed it" button calls `onComplete()`

## IdentityStep
- Shows `auths init` + `auths id register` via `CopyCommand`
- Explanation of what each command does
- "I already have an identity" link that skips directly to auth (gap fix)
- After commands: `ChallengeAuth` component for DID challenge-response
- On auth success: calls `fetchIdentity(auth.did)` to verify DID exists on registry
- If identity active: calls `onComplete(did)`
- If unclaimed: shows error "Make sure you ran `auths id register`"

## PublishStep
- Shows `auths artifact sign` + `auths artifact publish` via `CopyCommand`
- "Verify my artifact was published" button
- Uses `fetchArtifactsBySigner(auth.did)` (NOT `fetchArtifacts`) — gap fix
- On success: calls `onComplete(artifact)`
- Error: "No published artifacts found yet"
- Tells user where `.auths.json` file was created (gap fix for WASM demo)

## Patterns
- Each step receives `onComplete` callback prop
- Each is `'use client'`
- Error blocks follow existing `border-red-900 bg-red-950/30` pattern
## Acceptance
- [ ] InstallStep renders command and "I've installed it" button
- [ ] IdentityStep has "I already have an identity" shortcut
- [ ] IdentityStep integrates ChallengeAuth and verifies DID on registry
- [ ] PublishStep uses `fetchArtifactsBySigner` (not `fetchArtifacts`)
- [ ] All error states have user-friendly messages
- [ ] TypeScript compiles
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
