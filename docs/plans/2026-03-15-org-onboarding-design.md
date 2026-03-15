# Organization Onboarding Flow — Design Document

**Date:** 2026-03-15
**Epic:** 5 — Organization Onboarding Flow
**Repos:** `auths-site`, `auths` (CLI), `auths-cloud`

## Problem

Individual developer adoption is necessary but not sufficient for revenue. Teams pay. The org management APIs exist (create org, add member, set capabilities, revoke) but the UX for "invite your team and enforce signed commits" is not streamlined. This epic creates a full interactive onboarding wizard.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Wizard interactivity | Full interactive (backend writes) | Validates setup in real time, not just a tutorial |
| Authentication | DID-based challenge-response | Fits product philosophy, no third-party OAuth |
| Session persistence | Ephemeral (browser session only) | Simple, fewer security concerns |
| Step ordering | Free-form checklist | Users complete cards in any order |
| Post-completion view | Summary dashboard with live registry data | Confirms setup actually worked |

## Architecture

### Route: `/org/setup`

Three layers:

1. **Auth layer** — DID challenge-response. Site generates a nonce, user signs with `auths auth challenge --nonce <X>`, pastes signature back. Verified server-side against the registry. Creates an ephemeral session token held in React state (not cookies, not localStorage — gone on tab close).

2. **Wizard layer** — Client component with three independent task cards (create org, invite members, set policy). Each card tracks its own completion state. No enforced ordering. The session token is attached to any backend calls.

3. **API contract** — The wizard needs `auths-cloud` endpoints (to be built separately).

### API Endpoints Required

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `POST` | `/v1/auth/challenge` | None | Generate nonce for DID challenge |
| `POST` | `/v1/auth/verify` | None | Verify signed nonce, return ephemeral token |
| `POST` | `/v1/orgs` | Bearer | Create organization |
| `POST` | `/v1/orgs/{did}/invite` | Bearer | Create invite session, return short code |
| `PUT` | `/v1/orgs/{did}/policy` | Bearer | Set signing policy |
| `GET` | `/v1/orgs/{did}/status` | Bearer | Live status for summary dashboard |
| `GET` | `/v1/invites/{code}` | None | Fetch invite details (public) |
| `GET` | `/v1/invites/{code}/status` | None | Poll invite acceptance (nice-to-have) |

## Authentication Flow

1. User lands on `/org/setup` and sees a pre-auth gate: "Prove your Auths identity to get started."
2. Site calls `POST /v1/auth/challenge` — gets back `{ nonce, expires_at }` (nonce valid ~5 minutes).
3. Site displays: `auths auth challenge --nonce <NONCE>` with a copy button.
4. User runs the command in their terminal, gets a signature string.
5. User pastes the signature into an input field on the page.
6. Site calls `POST /v1/auth/verify` with `{ nonce, signature }` — gets back `{ token, did, expires_at }`.
7. Token + DID stored in React state via `AuthContext`. All subsequent API calls include `Authorization: Bearer <token>`.

**Edge cases:**
- Nonce expires: show "Expired, generate new challenge" button.
- Invalid signature: inline error, let them retry without regenerating the nonce.
- Tab closed: session gone, must re-authenticate. Intentional.

**No route protection needed** — the page renders for everyone, but the task cards are disabled/read-only until authenticated. Unauthenticated visitors can still see what the wizard does (useful for evaluation before installing Auths).

## Task Cards

Layout: three cards in a responsive grid (single column on mobile, three columns on desktop). Each card has a status indicator (not started / in progress / complete), title, description, and expandable action area. Cards are independent of each other.

### Card 1: Create Organization

- **Input:** org name (text field)
- **Action:** calls `POST /v1/orgs` with `{ name, creator_did }` (DID from auth context)
- **On success:** stores returned `org_did` in wizard state, card marks complete
- The org DID is then available to the other two cards automatically

### Card 2: Invite Members

- **Requires:** org DID (from Card 1 or pasted manually if org already exists)
- **Input:** role selector (member/admin), optional expiry duration
- **Action:** calls `POST /v1/orgs/{did}/invite` — gets back `{ short_code, invite_url, expires_at }`
- **Displays:** invite link, short code, and `auths org join --code XXXX` command
- **Repeatable:** user can generate multiple invites
- Shows list of pending/accepted invites if available

### Card 3: Set Signing Policy

- **Requires:** org DID
- Shows the three CLI commands (`auths git setup`, `auths signers sync`, `git config commit.gpgsign true`) with copy buttons
- **Toggle:** "Require all commits to be signed" — calls `PUT /v1/orgs/{did}/policy`
- **On success:** card marks complete

**Wizard state:** if all three cards have an org DID available (either from Card 1 or pasted in), a "View Dashboard" button appears at the bottom linking to the summary view.

## Summary Dashboard

Appears when the user clicks "View Dashboard" or when all three cards are complete.

- Pulls live data from `GET /v1/orgs/{did}/status`
- Shows: org name, DID (copyable), member count, pending invites count, signing policy status (enabled/disabled)
- Links to the live `/registry/org/{did}` page on the public registry
- Quick-action buttons: "Invite another member", "Update policy"

## Join Page (`/join/[code]`)

Separate route, no auth required.

- Calls `GET /v1/invites/{code}` to fetch invite details (org name, role, expires_at)
- Displays: "You've been invited to join **{org name}** as a **{role}**"
- Primary CTA: `auths org join --code {CODE}` with copy button
- Below that: "Don't have Auths yet?" links to the individual onboarding tutorial
- Nice-to-have for v1: polls `GET /v1/invites/{code}/status` to show real-time confirmation when the invitee completes the join

## File Structure

```
apps/web/src/app/org/setup/
  page.tsx              — Server component, renders SetupClient
  setup-client.tsx      — Main client component, auth gate + task cards
  auth-context.tsx      — AuthContext provider (ephemeral token + DID)
  challenge-auth.tsx    — DID challenge-response UI
  task-card.tsx         — Reusable card shell (status, expand/collapse)
  create-org-card.tsx   — Card 1 implementation
  invite-card.tsx       — Card 2 implementation
  policy-card.tsx       — Card 3 implementation
  summary-dashboard.tsx — Post-completion live status view

apps/web/src/app/join/[code]/
  page.tsx              — Server component
  join-client.tsx       — Invite landing page
```

## Styling

- Tailwind classes matching existing patterns (zinc-900/950 backgrounds, emerald-500 accents, zinc-700 borders)
- `motion/react` for card expand/collapse and status transitions
- Card pattern: `rounded-xl border border-zinc-800 bg-zinc-950/50 p-6`
- Inputs follow `registry-hero.tsx` styling (zinc-900 bg, zinc-700 border, emerald focus ring)
- Copy buttons with `copied` feedback state (existing pattern from `OnboardingTerminal`)

## API Client Additions

Add to `lib/api/registry.ts`:
- `createChallenge()` — `POST /v1/auth/challenge`
- `verifyChallenge(nonce, signature)` — `POST /v1/auth/verify`
- `createOrg(name, token)` — `POST /v1/orgs`
- `createInvite(orgDid, role, expiresIn, token)` — `POST /v1/orgs/{did}/invite`
- `setOrgPolicy(orgDid, policy, token)` — `PUT /v1/orgs/{did}/policy`
- `fetchOrgStatus(orgDid, token)` — `GET /v1/orgs/{did}/status`
- `fetchInvite(code)` — `GET /v1/invites/{code}` (public, no token)

All authenticated calls gated behind the ephemeral auth token except `fetchInvite()`.
