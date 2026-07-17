# PRD: Auths Market — the paid-MCP directory (codename "Tollbooth")

## 1. Introduction / Overview

A platform where anyone can sell tool calls: a seller puts any MCP server
behind `@auths-dev/mcp` (per-call metering on Stripe or x402, credential
custody, signed receipts) and lists it; a buying agent pays cents per call,
bounded by its own budget, and both sides can re-derive every cent offline.

The problem it solves: today no agent operator dares point an agent at a paid
endpoint (unbounded spend risk), and no API owner can sell to agents at cent
granularity (card rails don't fit, trust doesn't exist). The bounded agent
solves the buyer side; this product creates the seller side and the meeting
place.

**v0 shape (per owner decisions):** sellers **bring their own endpoint**
(they run the wrapped server; we never host or custody anything), **both
rails** (x402 + Stripe) are supported at listing time, sellers sign in with
**GitHub OAuth behind a ports/adapters boundary** so Auths-native login can
replace it without a rewrite, and scope is **directory + verified listings +
receipt-derived dashboards** — not checkout, escrow, or search-ranking.

The non-negotiable that differentiates every page: **numbers shown are
re-derived from signed receipts (`verify-spend`), never reported by anyone's
server — ours included.**

## 2. Goals

- A seller goes from "I have an MCP server" to a **live, verified listing**
  in under 30 minutes without talking to us.
- A buyer goes from a listing page to a **first paid `tools/call`** in under
  5 minutes (test-mode), with one copy-paste.
- Every listing marked **Verified** has had its price and receipts proven by
  our prober driving a real (test-mode) call and re-deriving it.
- Seller earnings dashboards render **only** re-derived numbers.
- The directory itself is consumable by agents (JSON API + an MCP server).
- Zero platform custody of money or credentials in v0.

## 3. Where it lives (deployment decision)

**One repo, two deployments.** To be unambiguous:

- **NOT a separate repository.** The code lives inside the existing
  `auths-site` repository as a second app: `auths-site/apps/market`,
  sibling to the marketing app (`apps/web`). Shared design comes from
  extracting the ledger primitives (`globals.css` palette, terminal
  artifact, `SectionMark`/`InkTerminal`, copy buttons, tabs) into
  `auths-site/packages/ledger-ui`, consumed by both apps — same hand, same
  day, no copy-paste drift.
- **Separate Vercel project.** Two Vercel projects point at the same repo:
  the existing one builds `apps/web` → `auths.dev`; a new one builds
  `apps/market` → `market.auths.dev`. One `git push`, two independent
  deploys. Rationale: independent deploy cadence and blast radius (the
  marketplace ships daily, the marketing site rarely), separate env/secrets
  (Supabase keys never enter the marketing project), and server-side workers
  stay out of the marketing site's build.
- **auths.dev integration:** one nav item **`Market`** on the marketing
  site pointing at `market.auths.dev` (same pattern as `Docs` →
  `docs.auths.dev`). No iframe, no route proxying.

## 4. User Stories

### US-001: Ledger UI package extraction
**Description:** As a developer, I want the marketing site's design
primitives in a shared package so Market is visually identical without
copy-paste drift.

**Acceptance Criteria:**
- [ ] `packages/ledger-ui` exports the palette tokens (CSS), `SectionMark`,
      `InkTerminal`, `Prompt/Dim/Allow/Deny`, `CopyButton`, `VerdictChip`,
      code-tab components
- [ ] `apps/web` (marketing) consumes it with zero visual diff (screenshot
      compare of `/`)
- [ ] `apps/market` scaffolds on it (Next.js, paper/ink chrome, footer/nav
      variants)
- [ ] Typecheck + build green for both apps
- [ ] Verify in browser using dev-browser skill

### US-002: Supabase project + schema
**Description:** As a developer, I need persistent storage for sellers,
listings, and cached receipt summaries.

**Acceptance Criteria:**
- [ ] Tables per §7.2 created via checked-in SQL migrations
- [ ] RLS: sellers read/write only their own rows; listings publicly readable
      when `status = 'live'`
- [ ] Seed script creates one demo seller + one demo listing
- [ ] Typecheck passes; migration runs clean on a fresh project

### US-003: Auth port with GitHub adapter
**Description:** As a developer, I want authentication behind a port so
Auths-native login can be added later without touching call sites.

**Acceptance Criteria:**
- [ ] `lib/auth/port.ts` defines `AuthPort` (`getSession`, `signIn`,
      `signOut`, `getSellerIdentity`) with doc comments stating the
      Auths-native adapter is the planned second implementation and what it
      will return (a proven `root` identifier in `sellerIdentity.authsRoot`)
- [ ] `lib/auth/supabase-github.ts` implements it via Supabase GitHub OAuth
- [ ] No component or route imports Supabase auth directly — only the port
      (enforced by an ESLint no-restricted-imports rule)
- [ ] Sign in / sign out works end to end
- [ ] Verify in browser using dev-browser skill

### US-004: Seller onboarding wizard (`/sell`)
**Description:** As a seller, I want a guided flow from "I have an MCP
server" to a submitted listing.

**Acceptance Criteria:**
- [ ] Step 1 — the wrap: shows the exact command for their case with synced
      rail tabs (x402 / Stripe), test-mode first, copy buttons:
      `npx -y @auths-dev/mcp wrap --scope paid.call --budget … --rail … --custody-credential … -- <their server>`
- [ ] Step 2 — the listing form: name, slug, description, tool list, price
      per call (cents), rails offered, endpoint transport (stdio command or
      URL), spend-log publication URL (see US-007), docs link
- [ ] Step 3 — submit → listing created with `status='pending_verification'`
      and the verification prober queued (US-005)
- [ ] Form validation with explicit errors; no listing goes live unprobed
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Verification prober
**Description:** As the platform, I must prove a listing's claims before
badging it, by being its first (test-mode) customer.

**Acceptance Criteria:**
- [ ] A worker (Vercel cron/queue) that, per pending listing: (a) speaks MCP
      to the endpoint and confirms `tools/list` matches the listed tools,
      (b) drives one `tools/call` in test-mode through its own wrapped
      client with a small budget, (c) fetches the seller's spend log and
      runs `verify-spend` — the call must re-derive `consistent` at the
      listed price
- [ ] Pass → `status='live'`, `verified_at` set; fail → `status='failed'`
      with a human-readable reason shown to the seller
- [ ] Re-probe on demand (seller button) and weekly (freshness); a listing
      that starts failing gets a visible "verification stale" state, not
      silent delisting
- [ ] The prober's own budget cap bounds worst-case spend per probe
- [ ] Typecheck passes

### US-006: Listing page (`/e/[slug]`)
**Description:** As a buyer, I want one page that tells me what the tool
does, what it costs, and gives me a working integration in one copy.

**Acceptance Criteria:**
- [ ] Shows: name, description, tools, price per call, rails, verified badge
      with `verified_at` + what verification means (link), seller identity
- [ ] Integration pane: synced tabs (mcp.json config / raw CLI), test-mode
      variant first, copy buttons; buyer budget placeholder prefilled small
      (`--budget '$1'`)
- [ ] Live receipts module: recent-activity sparkline + totals labeled
      **"re-derived from signed receipts"** (from the US-007 cache), and an
      "audit this yourself" block with the exact `verify-spend` command
- [ ] A refusal is shown before a success in the example terminal (house
      style: the cap refusing is the trust moment)
- [ ] OG card per listing (ledger style)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Receipt ingestion (pull model) + re-derivation worker
**Description:** As the platform, I want dashboard numbers that are derived,
not reported.

**Acceptance Criteria:**
- [ ] Sellers register a **spend-log URL** (their gateway's published
      `spend.jsonl` + registry snapshot; static hosting or git raw URL is
      fine — the log is signed, transport needs no trust)
- [ ] Worker polls each live listing's log, runs `verify-spend` against it,
      and upserts per-day aggregates into `receipt_summaries` **only from
      the re-derived output**; a log that fails verification marks the
      listing `receipts_invalid` and shows the failing verdict
      (`tampered-proof` / `dropped-call` / `budget-mismatch`) on the
      dashboard rather than hiding it
- [ ] Raw logs are not stored beyond the working copy; aggregates carry the
      log's content hash for reproducibility
- [ ] Typecheck passes

### US-008: Seller dashboard (`/dashboard`)
**Description:** As a seller, I want earnings and endpoint health at a
glance — numbers I could re-derive myself.

**Acceptance Criteria:**
- [ ] Per-listing: status, last probe result, earnings chart (day buckets)
      from `receipt_summaries`, rail split, call counts, refusal counts
- [ ] Every figure footnoted "re-derived via verify-spend @ <log hash>"
- [ ] Re-probe button; edit listing; unlist
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Public read API + directory-as-MCP
**Description:** As a buying agent (or its developer), I want to discover
endpoints programmatically.

**Acceptance Criteria:**
- [ ] REST per §8 (list, detail, receipts summary) with stable JSON shapes
      and no auth required for reads
- [ ] `@auths-dev/market-directory`: a tiny MCP server exposing
      `search_endpoints` / `get_endpoint` / `get_integration` tools backed by
      the same API — the directory is itself consumable by agents (and is
      listed on the directory, priced at $0)
- [ ] Rate limiting on anonymous reads
- [ ] Typecheck passes

### US-010: Directory home (`/`)
**Description:** As a visitor, I want to grasp the product and browse
verified endpoints immediately.

**Acceptance Criteria:**
- [ ] Hero: one sentence ("Sell tool calls. Buy them bounded."), a terminal
      artifact showing a metered call → `allowed` with cost → then a cap
      refusal, and the network-wide re-derived totals (calls, cents, distinct
      endpoints)
- [ ] Grid of live listings (name, price, rails, verified badge), filter by
      rail
- [ ] "Sell yours" CTA → `/sell`; "How verification works" explainer section
- [ ] Copy passes the house copy audit (no banned vocabulary; commands real)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Marketing-site nav link
**Description:** As an auths.dev visitor, I can find the Market.

**Acceptance Criteria:**
- [ ] `Market` item in the auths.dev nav (and footer) →
      `https://market.auths.dev`, ledger-consistent
- [ ] auths.dev link-check passes
- [ ] Verify in browser using dev-browser skill

### US-012: Deploy pipeline
**Description:** As the team, we want Market shipping independently and
safely.

**Acceptance Criteria:**
- [ ] Separate Vercel project on `apps/market`, domain `market.auths.dev`
- [ ] Env: Supabase URL/key, cron secret; nothing shared with the marketing
      project
- [ ] CI: typecheck, build, copy-audit greps, link check (reuse the
      auths-docs `check-docs` pattern)
- [ ] Preview deployments per PR

## 5. Functional Requirements

- FR-1: Sellers authenticate exclusively through `AuthPort`; v0 adapter =
  Supabase GitHub OAuth; the port's contract must be documented in code as
  the seam for Auths-native login.
- FR-2: A listing records: slug, name, description, tools, price-per-call
  (integer cents), rails (`x402`, `stripe`, or both), endpoint (stdio
  command or URL), spend-log URL, docs URL, status.
- FR-3: Listing statuses: `pending_verification → live | failed`, plus
  `verification_stale` and `receipts_invalid` overlays; only `live` listings
  appear in the directory and API.
- FR-4: The prober must drive a real test-mode call through a wrapped client
  and re-derive it via `verify-spend` before any listing goes `live`; probe
  spend is bounded by the prober's own `--budget`.
- FR-5: All displayed spend/earnings figures must originate from
  `verify-spend` re-derivation of seller-published logs; a gateway-reported
  or seller-reported number must never render.
- FR-6: A failing log verification must be surfaced with its exact verdict
  string; the platform never silently drops a listing.
- FR-7: The platform holds no rail credentials and settles no money in v0;
  buyers pay sellers directly over the listed rail.
- FR-8: Buyer integration snippets must show test-mode first, include a
  small default `--budget`, and be copy-complete (runnable as pasted).
- FR-9: Public reads (web + API + MCP) require no account.
- FR-10: All copy follows the house rules (no banned vocabulary; every
  command runnable; verdict strings exact).

## 6. Non-Goals (v0)

- No hosted gateways, no custody of seller credentials or keys (BYO only).
- No platform fees, checkout, escrow, or payouts — money moves seller↔buyer
  on the rails directly (the facilitator take-rate is play #4, separate).
- No buyer accounts, reviews, or reputation scores (receipts are the only
  reputation; marketplace ranking is play #6).
- No search relevance work beyond filters (rail, price).
- No Auths-native login implementation (only the port that admits it).
- No SLA monitoring beyond the weekly probe.

## 7. Technical Considerations

### 7.1 Stack
Next.js (App Router) on Vercel · Supabase (Postgres, GitHub OAuth, RLS) ·
Vercel Cron for the prober + receipts worker (both shell
`npx -y @auths-dev/mcp` — the published package vendors the gateway and
verifier; workers need Node only, but must run on a runtime with child
processes → Vercel Functions with `runtime: nodejs`, not edge) ·
`packages/ledger-ui` for shared design.

### 7.2 Schema (initial)
```
sellers            id, auth_provider ('github'), auth_subject, github_login,
                   auths_root (nullable — filled by future adapter), created_at
listings           id, seller_id, slug, name, description, tools jsonb,
                   price_cents int, rails text[], endpoint jsonb,
                   spend_log_url, docs_url, status, verified_at,
                   fail_reason, created_at, updated_at
probe_runs         id, listing_id, started_at, verdict, detail jsonb
receipt_summaries  listing_id, day, calls int, refused int, cents_settled int,
                   rail_split jsonb, log_hash, derived_at
```
The database is an **index/cache**. The receipts and registries remain the
source of truth; every row in `receipt_summaries` must be reproducible from
the referenced `log_hash`.

### 7.3 API design (v0)
```
GET  /api/v1/endpoints?rail=&q=&cursor=      → [{slug,name,price_cents,rails,verified_at,…}]
GET  /api/v1/endpoints/:slug                 → full listing + integration snippets
GET  /api/v1/endpoints/:slug/receipts        → day-bucket summaries + log_hash + the verify-spend command
POST /api/v1/listings                        (auth) create listing
PATCH /api/v1/listings/:id                   (auth) update; re-queues probe on material change
POST /api/v1/listings/:id/probe              (auth) re-verify now
GET  /api/v1/me/earnings                     (auth) dashboard aggregates
```
Versioned under `/v1`; reads are public and cacheable; mutations behind the
AuthPort session. Errors as `{error: {code, message}}` with stable codes.

### 7.4 Risks
- **Seller log availability**: pull model depends on sellers publishing the
  log; mitigate with a `--publish-log` recipe in onboarding (git repo or any
  static host) and the `verification_stale` state.
- **Probe cost on Stripe rail**: test-mode only for probes; never probe with
  live keys.
- **child_process on Vercel**: verify `auths-mcp-gateway` executes within
  function limits (binary ~10MB, cold start acceptable); fallback is a tiny
  Fly.io worker for the prober if Vercel constraints bite.

## 8. Success Metrics

- Seller time-to-verified-listing < 30 min (measured from signup).
- Buyer time-to-first-paid-call (test-mode) < 5 min from listing page.
- 10 live verified listings (≥3 not ours) within 30 days of launch.
- 100% of rendered spend figures traceable to a `verify-spend` run
  (`log_hash` present) — audited by CI.
- First organic seller-reported dollar earned through a listing.

## 9. Decided (was: open questions)

1. **Domain: `market.auths.dev`; app dir `apps/market`; nav label
   `Market`.**
2. **Our own seed listings (e.g. verifier-as-a-service) live in this repo**
   (`auths-site`, alongside `apps/market`), not in `mcp-examples`.
3. **Re-probe cadence: weekly; stale after 7 days.**

4. **Badge tiers (Stripe-honesty question resolved).** The Verified badge
   is awarded on test-mode proof alone, labeled honestly ("metering,
   receipts & price proven in test mode"). A listing upgrades to **Proven
   live** automatically when the receipts worker re-derives its first real
   settled calls from the seller's published log — the market bootstraps
   its own live proof from real usage; no live probe charge, nobody eats
   $0.50. Rationale: a seller gains nothing from a badge with broken live
   credentials (their first real buyer fails and they lose the sale), so
   there is no incentive to fake it, and an up-front live-charge
   requirement taxes exactly the early sellers the cold start needs.
5. **Auths-native identity is never required.** Sellers who prove their
   auths identity get the top badge tier. Full ladder:
   **Verified (test-proven) → Proven live (receipts observed) →
   Auths-verified seller (identity proven).**

## 11. Owner setup — the only manual steps

Everything below this list is automated (or will be, by the build agent via
CLI). Already done for you:

- **Supabase project created**: `auths-market`, ref `xpbzlbwferiodzgphbac`,
  region us-east-1, in org `dmehukhmpxquyhgkuzwc` (the org of your most
  recent project — say the word if it should live in the other org and it
  will be recreated there). The generated DB password will land in
  `apps/market/.env.local` (gitignored) when the app is scaffolded.
- **Vercel**: the `apps/market` project, its root-directory config, env
  vars, and the `market.auths.dev` domain (your `auths.dev` zone is already
  on Vercel DNS) are all CLI-automatable and will be handled during the
  build.
- **Fly.io**: not used in v0 (decision: Supabase over self-managed Postgres
  — Fly PG is unmanaged and buys nothing here). Only if the verification
  prober outgrows Vercel's function limits will a small Fly worker appear,
  and only then would `flyctl auth login` be needed.

Your list (one item, ~2 minutes):

1. **Create the GitHub OAuth app** (GitHub offers no API/CLI for this — web
   UI only): <https://github.com/settings/applications/new>
   - Application name: `Auths Market`
   - Homepage URL: `https://market.auths.dev`
   - Authorization callback URL:
     `https://xpbzlbwferiodzgphbac.supabase.co/auth/v1/callback`
   Then paste the two values into `auths-site/apps/market/.env.local` as
   `GITHUB_OAUTH_CLIENT_ID=…` and `GITHUB_OAUTH_CLIENT_SECRET=…` (the file
   will exist with placeholders). The agent pushes them into Supabase's
   auth-provider config via CLI from there — you never touch the Supabase
   dashboard.

Nothing else. Sign-in will not work until item 1 is done, but the entire
build (schema, UI, prober, API) proceeds without it.
