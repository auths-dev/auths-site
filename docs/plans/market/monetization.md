# Monetization — Charging for What Threads Can't Replicate

**Thesis (from the merchant-loop scaling work):** the metering hot path runs on the
buyer's CPU in an open-source gateway — throughput is unmeterable and gating it would
poison the trust story. So throughput is **free, loudly** ("shard as hard as you
like"), and the business lives at the four points parallelism cannot self-provide:

1. **Settlement finality** — every channel that moves real money opens (escrow) and
   closes (netted settle) against a rail. Toll: **bps on settled volume**.
2. **The coherent cap** — N delegations for throughput = N split budgets; one budget
   across a fleet needs a coordination point outside every gateway process. Toll:
   **fleet subscription**.
3. **Third-party attestation** — anchoring `{count, cumulative}` outside the
   operator's control is by definition un-self-hostable. Toll: **part of the
   subscription; cadence scales with tier**.
4. **Counterparty trust with strangers** — bilateral pairs can bypass escrow (fine;
   not marketplace transactions); stranger-to-stranger commerce structurally passes
   through the escrow operator. Toll: **the take rate, again — value-based**.

The 64-thread trading bot is the design's favorite customer: its throughput is free,
its coherence and settlement are the bill.

**Custody stance: never (decided 2026-07-18).** The market is NEVER a custodian of
customer funds — no held balances, no pooled deposits, no self-operated facilitator
holding money. Holding funds makes us a money transmitter (licensing, AML program,
custody security, a hack target) and contradicts the product's own thesis: we prove
who owes what; we do not hold what is owed. Every "escrow" below means a hold that
lives in a regulated or trust-minimized third place:

- **Stripe rail:** Stripe Connect with direct charges — the authorization hold lives
  inside Stripe on the buyer's card, the charge lands on the SELLER's connected
  account, Stripe does KYC and payouts, and we take an `application_fee_amount`
  without the money ever touching us. Stripe is the regulated entity; that is what
  Connect is for.
- **x402 rail:** either a third-party facilitator that already custodies as its
  business, or a minimal on-chain channel contract — the buyer's deposit sits in the
  contract, each agent-signed running cumulative is a check the seller can cash, the
  seller closes with the latest signed state, the buyer reclaims the remainder after
  timeout. The contract holds; nobody's ops team does. (Our spend-log records are
  already exactly these signed channel states.)
- **v0 simplest, no escrow at all:** short netting intervals with seller-bounded
  credit — settle every dollar or every minute, so a seller's maximum exposure is one
  interval. Zero custody, zero contracts, ships first.

Our monetizable role is settlement COORDINATOR, never treasurer: we run the netting
logic, produce the signed evidence, and collect fees via Stripe's application fee or
a fee split in the contract — the bps toll survives; the custody never existed.

---

## 1. The tier ladder

| Tier | Who | What they get | What they pay |
|---|---|---|---|
| **Open** | any agent/dev | gateway, unlimited local throughput, self-set caps, listing + Verified badge, bilateral channels | nothing — this is adoption |
| **Seller** | listed sellers with real volume | market-coordinated settlement + netting (sell to strangers; holds live in Stripe or the channel contract), receipts re-derivation + Proven-live, payout plumbing | **bps on netted settled volume** + per-channel-open toll |
| **Fleet** | operators running 2+ agents | hosted treasury cap (ONE budget across N delegations/machines), fleet dashboard, member roles, spend alerts, daily anchoring | **subscription** (per fleet, banded by delegation count) + Seller-tier tolls when selling |
| **Enterprise** | orgs with compliance needs | SCIM provisioning, compliance-as-query exports, custom anchoring cadence + external witness, SLAs, offboarding proofs | contract |

Pricing invariants: never price per call (taxes the hot path, invites bypass);
always price per settled dollar or per coordination surface (can't be threaded
around — every parallel channel settled through our coordination pays its open/close toll).

---

## 2. What auths needs (the scaling substrate)

Prerequisites from `merchant-loop-improvements.md` Part 3 assumed done (file
counter, log rotation, incremental verify, async RP call).

### Epic M-A1: Channels — reserve → stream → settle

The spend log's agent-signed running cumulative already IS a payment-channel state
update; `verify-spend` already IS the closing proof. Build only the ends:

- **M-A1.1 Channel open = funded reservation.** One rail action escrows/pre-auths
  the channel capacity; the gateway records the escrow reference in the delegation's
  scope seal so the capacity is KEL-anchored, not config.
  ```
  auths-mcp channel open --seller <did> --capacity '$50' --rail stripe|x402
  # stripe: PaymentIntent auth (capture later)   x402: facilitator-held deposit
  ```
- **M-A1.2 Per-call stays rail-free.** Nothing to build — this is today's test-mode
  path promoted to the real contract: meter locally, sign cumulative, append.
- **M-A1.3 Netted close.** One rail capture/transfer for the net total; emits the
  settlement record the receipts worker already knows how to read.
  ```
  auths-mcp channel close --log <spend.jsonl>   # capture(min(cumulative, capacity))
  ```
- **Open question (bounded by the custody stance):** x402 channel mechanism — a
  THIRD-PARTY facilitator that custodies as its own regulated business, vs a minimal
  on-chain channel contract we author but never control funds in (audit cost, no
  custody), vs v0's no-escrow short-interval netting with seller-bounded credit.
  Self-operated custody is off the table. Stripe has no such question (Connect
  direct charges + application fees are native and non-custodial for the platform).

### Epic M-A2: The fleet treasury (the coherent cap as a service)

- **M-A2.1 Treasury coordinator.** A shared counter service enforcing ONE cap across
  N gateway processes: `reserve(delegation, cents) → grant|refuse`, mirroring the
  relay's Memory-vs-Redis store pattern (`MURMUR_RELAY_REDIS_URL` → `TREASURY_URL`).
  Gateways fall back to their local cap when unreachable — fail-closed to the
  *smaller* budget, never open.
- **M-A2.2 Signed checkpoints.** The coordinator periodically signs
  `{fleet, count, cumulative}` and anchors it (M-A3) — integrity by signature +
  anchor, never by write frequency (the Redis lesson).
- **M-A2.3 CLI surface.** `auths org treasury` exists as an aggregate view; it
  gains `--enforce via <coordinator-url>` so the fleet cap is a delegation-time
  property, visible in the scope seal.
- **Open question:** self-hosted coordinator allowed? Recommend yes (open core) —
  the paid product is the HOSTED one plus attestation, and enterprises who
  self-host still pay for anchoring/attestation because "not-me" is the product.

### Epic M-A3: Anchoring as a product

- **M-A3.1** Productize the in-tree witness commons (`auths-witness`,
  `auths-checkpoint-cosigner`) for spend-log heads: accept
  `{log_hash, count, cumulative, sig}` per fleet on a cadence, countersign, publish
  inclusion proofs. `verify-spend --anchor <url>` then closes the tail-truncation
  residual documented in `spend_log.rs`.
- Tier mapping: Fleet = daily anchor; Enterprise = per-settlement or custom + an
  external co-witness.

### Epic M-A4: The org is the multi-user fleet (mostly exists)

The auths org model already carries what "2+ users on one fleet" needs
cryptographically: org root KEL, member delegations with roles, offboarding with
proofs, org audit, SCIM. Gaps:

- **M-A4.1** Role-gated treasury ops: raising the fleet cap / changing payout
  address requires a member credential carrying `org:treasury` (capability grammar:
  colon-namespaced), verified through the same presentation flow the market uses.
- **M-A4.2** `subjectRoot` chains to the ORG root for org-delegated agents (already
  proven for one hop; verify the agent-under-member-under-org two-hop surfaces the
  org, not the member, as the billing root).

---

## 3. What auths-site needs (front-end across tiers)

### Epic M-S1: Billing accounts and the take rate

- **M-S1.1 Schema.** Billing hangs off the *root identity*, not the login method:
  ```
  billing_accounts   id, root_aid (or github seller id), tier, stripe_customer_id
  fleets             id, billing_account_id, org_root_aid, delegation_count, cap_cents
  settlements        id, channel_ref, listing_id, gross_cents, fee_cents, rail, log_hash
  usage_rollups      billing_account_id, period, settled_cents, fee_cents
  ```
- **M-S1.2 Stripe Connect for sellers.** Sellers onboard as connected accounts;
  charges are DIRECT charges on the seller's account with an
  `application_fee_amount` — the authorization hold lives in Stripe, capture fires
  at channel close, and the market never touches the funds (see the custody stance
  above). x402 payouts flow through the non-custodial channel leg (M-A1).
- **M-S1.3 Fees are re-derived too.** The invoice line for bps must cite the
  `log_hash` + settlement records it was computed from — we bill the way we badge:
  numbers a customer can re-derive, or they don't render.

### Epic M-S2: The fleet dashboard

- **M-S2.1 Fleet view:** delegations (agent AID, scope, per-agent spend), the ONE
  treasury cap with live headroom, channel states (open capacity / streamed /
  settled), all figures from re-derived logs only — never gateway-reported.
- **M-S2.2 Member view:** org members (from the org KEL, not a mirror table), their
  roles, last-active, offboarding button that drives the real `org offboard` flow
  and shows its proof.
- **M-S2.3 Alerts:** cap-approach webhooks/email (the one place we may run ahead of
  re-derivation — label projections as projections; settled numbers stay
  re-derived).

### Epic M-S3: Multi-user representation (2+ humans, one fleet)

- **M-S3.1 The seller entity becomes the org.** `sellers.auths_root` = org root for
  fleet accounts; humans attach as *members*: GitHub-login users map to member AIDs
  (via the port's planned linking), agent logins present member-delegated
  credentials. Listing ownership, payouts, and receipts all key to the ORG.
- **M-S3.2 Role-gated UI.** viewer / operator / owner drawn from member credentials:
  viewers see the dashboard, operators manage listings + channels, owners touch the
  treasury cap, payout address, and member set. Sensitive changes (payout address!)
  show which owner's credential authorized them — the audit trail is a feature, not
  a log file.
- **M-S3.3 Two-person control (Enterprise).** Payout-address and cap changes can
  require M-of-N owner approvals — the org KEL's threshold machinery is built for
  exactly this; the site only surfaces it.
- **Open question:** can a GitHub-only user own a Fleet account, or does Fleet
  require an auths root (so membership/roles are cryptographic rather than rows)?
  Recommendation: Fleet+ requires the root — it is precisely the tier where "roles
  as database rows" stops being defensible.

### Epic M-S4: Tier surfaces on the market

- **M-S4.1** Pricing page copy under the existing rules (test-mode before
  live-mode; exact verdict strings; runnable commands): Open shows the full free
  loop; Seller shows the bps math on a worked example; Fleet shows one cap over N
  agents refusing a runaway bot.
- **M-S4.2** Tier badges are claims about *infrastructure used*, not status: a
  Fleet-anchored listing can show "cap coordinated + anchored daily" the same way
  Proven-live shows re-derived cents.

---

## 4. Sequencing

1. **Now (unblocks revenue zero):** M-S1.2 Stripe Connect + the take rate on
   market-escrowed settlements — works with today's per-call test-mode → per-session
   channels later without repricing.
2. **Next:** M-A1 channels (makes HFT buyers possible at all) + M-S1.1/M-S1.3.
3. **Then:** M-A2 treasury + M-S2 dashboard (the Fleet tier ships as one story:
   "one budget, N agents, provable").
4. **Enterprise pulls, not pushes:** M-A3 anchoring cadence, M-S3.3 two-person
   control, SCIM — build against the first real compliance checklist, not ahead of
   it.
