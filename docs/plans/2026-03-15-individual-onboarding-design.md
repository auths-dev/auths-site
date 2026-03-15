# Individual Onboarding Wizard — Design Document

**Date:** 2026-03-15
**Epic:** 6 — Interactive Onboarding Tutorial
**Repo:** `auths-site`

## Problem

The getting-started guide is text-only. An interactive, in-browser wizard that walks developers through the first 5 minutes dramatically improves conversion from visitor to user. This complements the org onboarding wizard (`/org/setup`) by covering the individual developer flow.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Interactivity | Fully interactive with registry verification | Confirms each step actually happened |
| Authentication | DID challenge-response (shared with org wizard) | Consistent UX, proves identity ownership |
| Step count | 3 (install, create identity, publish) | Tightest verified loop — sign is implicit in publish, verify is handled by WASM demo |
| Install verification | Self-reported | No registry event for installation |
| Completion CTAs | Dual: redirect-aware + explore | Bridges to org join flow when appropriate |

## Relationship to Org Wizard

- The org wizard's join page (`/join/[code]`) links to `/try?redirect=/join/{code}` for users who don't have Auths yet.
- After completing the individual wizard, the user sees a "Join {org name}" CTA that returns them to the join flow.
- Both wizards share the same `AuthContext` and `ChallengeAuth` components.
- The individual wizard is sequential (must create identity before publishing); the org wizard is free-form.

## Architecture

### Route: `/try`

**Three-step sequential wizard:**

1. **Install** (self-reported) — Show install command, user clicks "I've installed it."
2. **Create Identity** (registry-verified) — User runs `auths init` + `auths id register`, then authenticates via DID challenge. Site confirms DID exists via registry API.
3. **Publish** (registry-verified) — User signs and publishes an artifact. Site confirms the attestation exists on the registry.

**Auth integration:** Same DID challenge-response as the org wizard (`POST /v1/auth/challenge`, `POST /v1/auth/verify`). Triggered after step 2 when the user has a DID. Ephemeral session in React state via shared `AuthContext`.

**Redirect support:** Accepts optional `?redirect=/join/{code}` query param. On completion, shows contextual CTAs.

## Step-by-Step Flow

### Step 1: Install

- Shows `curl -fsSL https://get.auths.dev | sh` with copy button
- Homebrew alternative: `brew install auths-dev/tap/auths`
- "I've installed it" button advances to step 2
- No server verification

### Step 2: Create Identity

- Shows two commands: `auths init` then `auths id register`
- Explains what's happening: keypair generation, KERI inception event, registry publication
- After running the commands, user authenticates via DID challenge (paste signature for a nonce)
- On successful auth: site calls `GET /v1/identities/{did}` to confirm the DID exists on the registry
- Step marked complete, user's DID and identity info displayed as confirmation
- This is the pivotal step — everything after is authenticated

### Step 3: Publish

- Shows two commands: `auths artifact sign ./my-file` then `auths artifact publish`
- After publishing, site polls `GET /v1/artifacts?signer={did}` to confirm an artifact from this DID exists
- On confirmation: step marked complete, shows the published artifact details (name, digest, timestamp)

### Completion

- WASM verification demo — "Drop your `.auths.json` to verify it in-browser" using the existing `<auths-verify>` widget
- Two CTA buttons:
  - If `?redirect` param present: "Join {org name}" (primary) + "Explore the registry" (secondary)
  - If no redirect: "Explore the registry" (primary) + "Set up an organization" linking to `/org/setup` (secondary)

## File Structure

```
apps/web/src/app/try/
  page.tsx           — Server component, extracts ?redirect param, renders TryClient
  try-client.tsx     — Main client component, step state + auth gate
  install-step.tsx   — Step 1: install command + self-report
  identity-step.tsx  — Step 2: create identity + DID challenge auth
  publish-step.tsx   — Step 3: sign + publish with registry verification
  completion.tsx     — WASM demo + CTAs (redirect-aware)
```

### Shared Components (lifted from org wizard)

These components are shared between both wizards:

- `lib/auth/auth-context.tsx` — `AuthContext` provider (ephemeral token + DID in React state)
- `components/challenge-auth.tsx` — DID challenge-response UI (nonce display, signature input, copy button)

Previously planned under `app/org/setup/`, these are lifted to shared locations so both wizards can use them.

### API Functions (in `lib/api/registry.ts`)

Shared with org wizard (already planned):
- `createChallenge()` — `POST /v1/auth/challenge`
- `verifyChallenge(nonce, signature)` — `POST /v1/auth/verify`

Individual wizard specific:
- `fetchIdentity(did)` — `GET /v1/identities/{did}` (already exists)
- `fetchArtifacts(query)` — `GET /v1/artifacts?signer={did}` (already exists)

No new API endpoints required — the individual wizard only reads from the registry.

## Styling

- Same patterns as org wizard and existing site components
- Active step: `border-emerald-500/50 bg-emerald-500/5`
- Completed steps: checkmark icon, collapse to a summary line showing what was accomplished
- Inactive/future steps: `border-zinc-800 bg-zinc-900/30`, dimmed text
- `motion/react` for step expand/collapse transitions
- Copy button with `copied` feedback state (pattern from `OnboardingTerminal`)
- Card containers: `rounded-xl border border-zinc-800 bg-zinc-950/50 p-6`
- Inputs: zinc-900 bg, zinc-700 border, emerald focus ring (pattern from `registry-hero.tsx`)

## Step State Management

- `useState` tracking `currentStep: 1 | 2 | 3 | 'done'` and per-step completion booleans
- Steps are strictly sequential — can't publish without creating an identity first
- Auth token from `AuthContext` used for verified API calls in step 3
- Completed step data stored in state (e.g., DID from step 2, artifact details from step 3)
