# Agent-Native Selling — Gap Analysis & Plan

**Status:** analysis + proposal (not yet decision-complete — owner decisions at the end)
**Prelaunch note:** zero users, zero compatibility debt. Everything below may reshape the
v1 API, the schema, and the sell flow in place — no version bumps, no migration shims.
**Question answered:** "If an agent with no GitHub account and no human operator wanted to
build, list, and sell its own MCP tool on market.auths.dev entirely via API calls — could
it? If not, what exactly is missing?"

---

## 1. The verdict

**The buy side is already agent-native. The sell side is not.**

Walk the full loop an autonomous agent would need, with no human anywhere:

| # | Step | Headless today? | What blocks it |
|---|------|-----------------|----------------|
| 1 | Mint an identity | ✅ yes | `auths init` is scriptable; file-fallback keychain works on servers |
| 2 | Write the tool code | ✅ yes | — |
| 3 | Publish code somewhere a buyer can inspect | ⚠️ partly | no GitHub account; see §5 — this is less blocking than it looks |
| 4 | Deploy / distribute the endpoint | ⚠️ partly | URL transport needs hosting+billing (human-owned); **stdio transport needs only a package registry** |
| 5 | Pick a payment rail | ⚠️ x402 only | Stripe requires KYC of a legal entity — structurally human; x402 test-mode is faucet-fundable, fully autonomous |
| 6 | **Create the listing** | ❌ no | the only write path is a browser server action behind GitHub OAuth |
| 7 | **Authenticate as a seller** | ❌ no | GitHub OAuth = browser redirect + human-owned account + 2FA; no Auths-native adapter yet |
| 8 | Pass verification | ✅ yes | the prober is identity-blind: it probes the endpoint, not the seller |
| 9 | Publish a spend log | ⚠️ partly | any public https URL works; the agent still needs *some* static host |
| 10 | Get discovered & bought | ✅ yes | public v1 API + `mcp/market-directory.mjs` (search/detail/integration tools); buying is `npx -y @auths-dev/mcp wrap …` — the market isn't even in the call path |
| 11 | Buyers verify spend | ✅ yes | `verify-spend` re-derivation is anyone's to run, agent or human |

Two hard gaps (#6, #7), both on the write path — and both were *anticipated*: the AuthPort
comment in `src/lib/auth/port.ts` names the Auths-native adapter as the planned second
implementation, and `sellers.auths_root` already exists in the schema, nullable, waiting.

## 2. What already works in our favor

- **The AuthPort seam.** From `port.ts`: *"The planned second adapter is Auths-native
  login — a seller proves control of their auths root identity (device-bound key,
  key-event-log verified) … That adapter will populate `SellerIdentity.authsRoot` with the
  PROVEN root identifier, which unlocks the top badge tier."* The fence (ESLint +
  CI grep) means the adapter lands in exactly one directory.
- **The wire protocol exists.** The `auths-rp` crate (in the auths repo) defines
  `Authorization: Auths-Presentation <base64url(JSON)>`, a single-use challenge store
  (bounded, TTL-pruned, remove-on-read), and the verdict→principal mapping (401 vs 403).
  The SDK has both sides: issuing presentations (`domains/credentials/present.rs`) and
  authenticating them. We are not designing a protocol; we are adopting one.
- **The child-process pattern is proven on Vercel.** The receipts worker already shells
  `npx -y @auths-dev/mcp` inside a Vercel function. Presentation verification can ride
  the same mechanism on day one.
- **The prober is the real gate, and it's identity-blind.** Nothing about verification
  (tools/list, bounded metered call, price re-derivation) cares who the seller is. An
  agent's listing earns `verified` exactly the way a human's does.
- **The badge ladder was designed for this.** Verified → Proven live → **Auths-verified
  seller (identity proven)**. For an agent seller the top tier isn't an upgrade — it's
  how they got in the door at all.

## 3. Gap 1 — there is no write API

Every listing today is created by `createListing` in `src/app/sell/actions.ts`: a Next.js
server action, callable only with a browser session cookie, reachable only through the
sell-wizard form. The public v1 API is read-only. An agent cannot POST a listing, cannot
read its own probe status, cannot see why verification failed.

**Fix: a v1 write surface, session-less by design.**

```
POST /api/v1/challenge            → { nonce, audience, expires_at }     (no auth)
POST /api/v1/listings             → create, status pending_verification (Auths-Presentation)
GET  /api/v1/me/listings          → own listings incl. probe status + fail_reason (Auths-Presentation)
PATCH /api/v1/listings/{slug}     → update endpoint/log/docs URLs        (Auths-Presentation)
```

Prelaunch means we don't build this *beside* the wizard — we build it *under* the
wizard. Listing creation becomes one domain function (`src/lib/listings.ts`); the API
route and the sell-form server action are both thin clients of it, and the server
action's inline validation is deleted, not mirrored. One rulebook, one door, two
doorknobs. Same rule as ever: nothing goes into the directory unprobed; every create
lands as `pending_verification`.

Then expose the same calls as MCP tools in `mcp/market-directory.mjs`
(`create_listing`, `my_listings`) — an agent should be able to sell through the same
protocol it speaks natively, without ever learning our REST shapes.

## 4. Gap 2 — authentication (the AuthPort's promised second adapter)

GitHub OAuth cannot be made headless: it is a browser redirect to a human-owned,
2FA-protected account, and GitHub's terms require machine accounts to have human owners.
Don't fight it — route around it with the adapter the port already promises.

**The flow (per-request, no cookies — agents don't want sessions):**

1. Agent calls `POST /api/v1/challenge`, receives a single-use nonce bound to the
   audience `market.auths.dev`. Nonces live in a new `auth_challenges` table
   (nonce pk, audience, expires_at) with remove-on-read semantics — a Supabase port of
   the `auths-rp` ChallengeStore contract.
2. Agent builds a presentation over (audience, nonce) signed by its device-bound key,
   backed by its key event log — via the auths CLI / `@auths-dev/mcp` tooling it
   already carries.
3. Agent sends the write request with `Authorization: Auths-Presentation <token>`.
4. The route verifies the presentation (see runtime note below), maps the verdict to a
   principal exactly as `auths-rp` does (bad token → 401; valid token, insufficient
   grant → 403), and upserts the seller row:
   `auth_provider = 'auths'`, `auth_subject = <root AID>`, `auths_root = <root AID>`
   (proven, never user-supplied), `github_login = null`.

**Schema deltas:**

- `auth_challenges` table as above.
- Unique index on `sellers (auth_provider, auth_subject)` — agent sellers have no
  Supabase auth user, so `sellers.id` becomes a generated uuid for them and the
  provider+subject pair is the real identity key.
- RLS stays untouched. Browser sellers keep the `auth.uid()` policies; agent-seller
  writes go through the service-role client *after* route-level presentation
  verification. Document loudly in the route that the route IS the policy layer for
  this path.

**Verification runtime — two options:**

- **v0 (ship fast):** shell the vendored verifier via `npx -y @auths-dev/mcp` in the
  route, the exact pattern the receipts worker already proves on Vercel.
- **v1 (right):** the WASM build of `auths-verifier` as an npm dependency — no cold
  `npx`, no child process, verification in-process.

**⚠️ Security prerequisite (cross-repo, load-bearing):** the presentation must be
verified against a **signed** key event log via the authenticated-replay path
(`validate_signed_kel`). The stateless verify entrypoints (bundle/WASM/FFI) were flagged
in the 2026-06-10 red-team round as accepting unsigned events on a pinned KEL, and that
wiring was still open as of the remediation notes (tracked in auths#262). If the market
verifies presentations through an unwired stateless entrypoint, a forged KEL could mint
an "Auths-verified seller" — the top trust badge — out of thin air. **Landing that wiring
is a blocking dependency of this plan**, and the market's verify call must be written
against the authenticated path from day one.

## 5. Gap 3 — "how do buyers check your code?" without GitHub

First, the honest observation: **a GitHub link never proved what a URL endpoint actually
runs.** A human seller's repo can differ arbitrarily from the deployed binary. The
market's whole thesis is already "trust the receipts, not the résumé" — every number on
the site is re-derived from signed receipts, never reported. Code verifiability should
extend that stance, not contradict it.

Three mechanisms, in order of leverage:

**5a. Prefer stdio listings for agent sellers — the buyer runs the code.**
For `stdio` transport the endpoint is a package invocation (`npx -y <pkg>`); the buyer's
own machine executes it. The artifact is *literally in the buyer's hands*: checksummable,
inspectable, pinnable to an exact version. Registry provenance (npm's build-attestation
flow) adds a machine-checkable link from tarball to source. This flips the question from
"can you see my repo?" to "you are holding the code" — strictly stronger. Distribution
needs a registry account, which brings us to:

**5b. A bounded publishing service account — yes, your instinct, with guardrails.**
The workable shape is not "give the agent a GitHub login" (terms-of-service dead end)
but **an org-owned GitHub App / registry org that the market (or the operator)
controls, granting narrowly-scoped, expiring tokens**:

- a dedicated org (e.g. `auths-market-sellers`) holding one repo per agent seller;
- the App grants *create + push to your own repo only* — no deletes, no org admin, no
  cross-repo access; installation tokens expire hourly;
- repo naming binds to the AID (`seller-<aid-prefix>/…`), so the mapping
  agent → code is structural, not claimed;
- same pattern for npm: a market-owned scope with per-seller publish grants.

This is the sanctioned automation path on both platforms (Apps/granular tokens exist
precisely so machines don't need accounts), it keeps a human *at the edge* (the org
owner) without putting one *in the loop* (no approval clicks per publish).

**5c. Artifact attestation — the Auths-native answer.**
The listing gains an optional `artifact` field: content hash of the exact
package/tarball, signed by the seller's device key, anchored to the same identity that
authenticated the listing. The prober checks that what it executed matches the attested
hash; buyers can too. For stdio this closes the loop completely (attested hash ==
tarball the buyer runs). For URL transport it remains honest-but-partial — remote
execution can't be proven from outside (confidential-compute attestation is explicitly
out of scope for now) — which is fine, because for URL listings the receipts remain the
load-bearing evidence, as they already are for human sellers.

Recommendation: **5a + 5c now** (no new custody, pure protocol), **5b as a follow-on
service** once there's demand from more than one agent seller.

## 6. The remaining human ring (edge, not loop)

Being honest about what stays human even after all of the above:

- **Stripe.** KYC of a legal entity. Agent sellers launch x402-only (`rails: ['x402']`);
  the sell-side copy already treats rails as a choice. A future "operator of record"
  construct could sponsor Stripe for an agent fleet — out of scope here.
- **Mainnet funding.** x402 test-mode is faucet-fundable end-to-end. Live-mode needs a
  first funding of the agent's wallet — once; earnings self-sustain after.
- **Hosting billing** for URL-transport listings (stdio listings dodge this entirely).
- **Terms of service.** Someone accountable accepts ours. v0 answer: the listing's
  accountable party is the proven root AID; if a fleet operator exists, their root
  anchors the agent's delegated identity — which is exactly what the identity model
  was built to express.

None of these put a human inside the list→probe→sell→verify loop. They are funding and
liability at the perimeter.

## 7. The end-to-end story, once built

```
agent$ auths init                                  # mint device-bound identity
agent$ <writes tool, packages it, attests hash>    # §5a + §5c
agent$ curl -X POST https://market.auths.dev/api/v1/challenge
agent$ <build presentation over (audience, nonce)>
agent$ curl -X POST https://market.auths.dev/api/v1/listings \
         -H "Authorization: Auths-Presentation <token>" \
         -d '{ "slug": …, "endpoint": {"transport":"stdio", …}, "rails":["x402"], … }'
        → 201, status pending_verification
prober  → tools/list ✓ · bounded metered call ✓ · price re-derived ✓ → verified
agent$ curl https://market.auths.dev/api/v1/me/listings   # sees verified + badge
buyers  → MCP directory search → wrap with their own budget → receipts accrue
worker  → re-derives settled calls from the published log → Proven live
```

No browser. No GitHub. No human. The badge reads **Auths-verified seller** because the
identity that listed is the identity that was cryptographically proven.

## 8. Proposed stories

- **US-013 — Challenge endpoint + Auths-Presentation verification middleware.**
  `auth_challenges` table, `POST /api/v1/challenge`, header parsing, verify via vendored
  verifier, verdict→principal mapping (401/403). Blocked by the signed-KEL wiring
  (auths#262) — sequence that first. Acceptance: a forged presentation and a replayed
  nonce both fail closed with distinct errors.
- **US-014 — Seller write API, with the wizard rebuilt on top of it.**
  `POST /api/v1/listings`, `GET /api/v1/me/listings`, `PATCH /api/v1/listings/{slug}`;
  listing creation moves into one domain function and the sell-form server action
  becomes a thin client of it (its inline validation is deleted). Acceptance: an agent
  creates a listing that the existing prober then moves to `live` untouched, and the
  browser wizard still works end-to-end through the same function.
- **US-015 — Auths adapter behind the AuthPort.** `src/lib/auth/auths-native.ts`
  populating `authsRoot` per the port contract; sellers uniqueness on
  (auth_provider, auth_subject); Auths-verified badge renders from `auths_root is not
  null` — never from user input.
- **US-016 — MCP write tools.** `create_listing` / `my_listings` in
  `mcp/market-directory.mjs`, same challenge flow, so selling is possible without ever
  leaving MCP.
- **US-017 — Artifact attestation (§5c).** Optional attested hash on listings; prober
  compares executed artifact to attestation; listing page shows it (copy rules apply:
  exact verdict strings, no protocol jargon).
- **US-018 — Abuse limits for the unmanned door.** Per-AID caps (pending listings,
  probe attempts with backoff, challenge rate), endpoint dedupe. Identity minting is
  free, so the working-endpoint probe — not identity — remains the Sybil gate.

## 9. Out of scope (file an issue)

Per project practice, these deferred items get a tracking issue on `auths-dev/auths-site`
when this plan is accepted (one issue, checklist body):

- Bounded publishing service (org-owned GitHub App / npm scope, §5b)
- Stripe for agent fleets via an operator-of-record construct
- Confidential-compute / remote attestation for URL-transport listings
- Market-hosted spend-log storage (currently: seller publishes, market only re-derives —
  changing that weakens the honesty story and needs its own debate)
- Browser login via Auths (the adapter here is API-first; interactive login is separate)

## 10. Owner decisions needed

1. **Sequence:** is agent-native selling the next epic after launch copy/GTM, or does it
   wait for the first human-seller cohort?
2. **The signed-KEL wiring dependency** (auths#262 / red-team A.1): this plan makes it
   revenue-blocking, not just hygiene. Confirm it gets prioritized in the auths repo.
3. **stdio-first for agent sellers** (§5a): accept "agent sellers start stdio + x402"
   as the v0 posture?
4. **Custody appetite for §5b:** is the market willing to *operate* a publishing org
   (even bounded), or do we stay pure-protocol (5a+5c only) until demand forces it?
