# Design plan — private proof-of-activity: publish an aggregate attestation, never the per-call log

**Status:** PROPOSED · 2026-07-19
**Trigger:** the market's `spendLogUrl` requirement (RC-E5.4 in `../tools/auths-receipts.md`) forces
a listed tool to publish its **full per-call spend log**, which exposes the counterparty graph.
**Scope:** what a *listed* tool publishes to earn the market's `proven-live` badge, and how
`apps/market` verifies it. Touches the attestation *producer* (`auths` / `auths-mcp`) and the
*verifier* (`apps/market` receipts worker + prober + listing input + data model). **Not** the
per-call metered path, and **not** payments (which never needed a public log).

> **One-line decision:** proven-live is earned from a **signed aggregate activity attestation**
> (`{head, count, cumulative_cents, as_of}`) that the market re-checks for **witnessed monotone
> growth** — the raw per-call log is **never published**, so the counterparty graph is
> structurally impossible to leak.

---

## Context — why the full-log requirement is wrong

Today `apps/market` makes proven-live depend on a publicly-fetchable `spend.jsonl` (the receipts
worker git-fetches the registry and replays every record with `verify-spend`; see the market
map in the conversation record and `apps/market/src/lib/receipts-worker.ts`). That log is a
**seller's own revenue ledger**, and even though it carries `args_hash` (not arguments) and no
tool responses, it still exposes, per call:

- timestamps, per-call price, cumulative, rail;
- settlement tx hashes;
- **counterparty DIDs / the transaction graph** — who paid this tool, how often, for how much.

The last one is the dealbreaker. A public per-call log lets anyone reconstruct a seller's
customer graph and revenue shape by traffic analysis. **We will not expose the counterparty
graph.** But we still want the trust property the market is built on: a badge that means
"this listing is real, signed, and actively settling — verify it yourself, trust no one."

The resolution is that **"re-derivable by anyone" does not require "every row published."** The
badge only needs to prove *authenticity + liveness*, and both can be proven from a coarse,
signed aggregate that contains no per-call rows at all.

## Decision

1. **The published artifact is an aggregate `activity/v1` attestation**, signed by the seller's
   agent under their root (and, in the stronger tier, third-party countersigned — §Anchoring).
   It carries totals and a chain head, **never per-call rows**.
2. **The market verifies authenticity + witnessed monotone growth**, not a re-derivation of the
   raw log. It records each probe's `(head, cumulative, as_of)` and credits only the cumulative
   growth **it has itself witnessed** over time.
3. **The badge rule:** `proven-live` iff the market has witnessed `cumulative_cents` increase
   (delta `> 0`) within the trailing **90 days**. Otherwise the listing is `verified` (authentic,
   dormant), never silently proven-live.
4. **The per-call log stays private to the seller** and is disclosed only point-to-point, inside
   a consented `EvidenceBundle`, to a specific recipient (a dispute counterparty, an auditor) —
   the S3 data-classification already in `../tools/auths-receipts.md` §RC-E1.4.

### Non-goals
- Proving a seller's *exact* revenue to the public. Proven-live is a **liveness/authenticity**
  badge, not a revenue oracle. Exact figures are a consented, point-to-point disclosure.
- Any change to how payments work. Publishing is opt-in and only for a *public listing*;
  bilateral / enterprise / unlisted use already transacts with a fully-private log.

## What is published — the `activity/v1` attestation

A single signed JSON document at `attestationUrl` (replacing `spendLogUrl`). Every field is a
seller-owned aggregate; there is **no field capable of carrying a counterparty**.

```json
{
  "version": "activity/v1",
  "suite": "json-canon/p256",
  "subject": { "root": "did:keri:…", "agent": "did:keri:…" },   // the SELLER's own DIDs only
  "head": "<bindingₙ>",              // chain head = H(prefix); commits to the whole log without revealing it
  "count": 41230,                    // total settled calls (monotonic)
  "cumulative_cents": 3548200,       // total settled cents (monotonic)
  "as_of": {
    "ts": "2026-07-19T00:00:00Z",
    "anchor": { "tier": "treasury|witness|onchain|first-seen", "head": "…", "proof": "…" }
  },
  "signature": "<agent signature, chaining to root>"
}
```

**Structurally excluded (there is no field for them):** per-call rows, per-call timestamps,
per-call amounts, counterparty DIDs, settlement tx hashes, tool names/args/`args_hash`. A
verifier that only has this document **cannot** reconstruct who transacted with whom, when, or
for how much per call — it learns only *"authentic chain, N calls, $X total, as of T."*

- `head` is the same hash-chain head (`bindingₙ`) the per-call chain already maintains — it
  commits to the entire prefix, so the aggregate cannot be detached from a real chain.
- `count` / `cumulative_cents` are the same aggregates the treasury/witness checkpoint already
  signs (`../market/monetization.md` M-A2.2: coordinator signs `{fleet, count, cumulative}`;
  M-A3.1: witness accepts `{log_hash, count, cumulative, sig}`). This attestation **is** that
  artifact — we are not inventing a new one, we are pointing proven-live at it.
- **Rail split is omitted by default.** Even coarse per-rail totals can be revealing; expose
  `rail_split_cents` only if the seller opts in.

## What the market verifies (new receipts-worker path)

Per probe, given the stored last checkpoint `(head₀, cum₀, ts₀)` and the freshly-fetched
attestation `(head₁, cum₁, ts₁)`:

1. **Authenticity.** Verify `signature` chains to the pinned root, using the **public registry /
   KEL only** (identity is already public in Auths) — never the spend log. In the stronger tier,
   verify the third-party **anchor** cosignature on `as_of` (§Anchoring).
2. **Monotonicity (no rollback).** Require `cum₁ ≥ cum₀`, `count₁ ≥ count₀`, `ts₁ ≥ ts₀`, and
   `head₁ ≠ head₀` whenever `cum₁ > cum₀`. A regression (smaller cumulative, earlier `as_of`, or
   a head that abandons a previously-seen one) is a **signed self-contradiction** → mark
   `verification_stale`, never silently accept.
3. **Witnessed growth (the badge).** Append `(head₁, cum₁, ts₁, observed_at)` to a checkpoint
   **history**. Compute the delta the market itself has witnessed across the trailing 90 days;
   set `live_proven_at` iff that witnessed delta is `> 0`. **Credit only witnessed growth, never
   the seller's absolute claim** — this is what makes the badge robust (see game theory).
4. **Never fetch or parse per-call rows.** The raw log is not requested; the counterparty graph
   cannot leak because it never crosses the wire.

## The badge rule, precisely

- `verified` (authentic): signature valid + `tools/list` covers the listed tools (unchanged
  prober check (a)).
- `proven-live`: `verified` **and** the market has **witnessed** `cumulative_cents` grow (`> 0`)
  within the trailing 90 days.
- `dormant` (new, honest state): `verified` but zero witnessed growth in 90 days — the badge
  reflects "authentic, quiet," never a false proven-live.

## Why this is safe — the game theory

Honesty is the dominant strategy; every form of lying is either detectable-over-time, worthless,
or collapses under audit.

1. **Forging the number breaks the chain/signature.** `cumulative_cents` is bound to `head =
   H(prefix)` and signed under the root. You cannot bump the number without producing a head and
   signature that correspond to it — i.e., fabricating a whole parallel signed chain.
2. **Rollback is a signed contradiction the market already recorded.** To hide recent activity
   you must republish an *earlier* head — so `cumulative` snaps **down** and `as_of` cannot move
   **forward** while showing **less** money. The market stored last week's *higher* cumulative and
   *later* `as_of`; the new, lower one is a visible regression. The "10,000 tx/day → 0 a week ago"
   pattern is exactly this, and it is **cryptographically loud**, not a hunch: a fresh timestamp
   with stale money is internally inconsistent, and an old timestamp is a rollback the market flags.
3. **Inflation buys nothing and is fragile.** The market credits only the growth **it witnesses**
   over wall-clock across probes — not the seller's claimed total. Faking that means publishing
   steadily-rising, chain-consistent, signed (and, in the strong tier, cosigner-anchored) heads on
   the market's probe cadence — i.e., *doing the real thing*. And the moment any point-to-point
   `EvidenceBundle` (a dispute, an audit) re-derives the real head, a divergent public head proves
   the seller lied.
4. **Anchoring closes backdating.** An anchored `as_of` (treasury/witness cosigner) is a
   third-party-signed timestamp — freshness can't be forged.
5. **First-probe inflation is defeated by "witnessed, not claimed."** A brand-new listing can
   *claim* any total, but proven-live is **earned over time** from observed deltas, so a fresh
   listing starts at `verified` / `dormant` and reaches `proven-live` only once the market watches
   real growth accrue. Fabricating that is indistinguishable from transacting for real.

**Net:** the only attestation that is cheap to maintain, stable across re-probes, and
non-collapsing under audit is a truthful one.

## Privacy guarantee

The published artifact's schema has **no field that can carry counterparty identity, per-call
amounts, per-call timing, or tx references.** The counterparty graph is therefore not "redacted"
(which is fragile) — it is **structurally absent**. The only things a public reader learns are
the seller's own DIDs, coarse totals, a head hash, and an anchored timestamp. Everything with
transaction-level detail (including counterparties) lives in the seller's **private** per-call
log, disclosed only inside a consented `EvidenceBundle` handed to one named party.

## Anchoring (the stronger, recommended tier)

Two tiers, same schema:

- **Self-signed** (baseline): the seller's agent signs the aggregate. The market trusts the
  signature + witnessed monotonicity. Sufficient given the game theory above.
- **Third-party countersigned** (recommended): `as_of.anchor` carries a **treasury/witness
  checkpoint** cosignature over `{head, count, cumulative, ts}` — the anchor ladder from
  `../tools/auths-receipts.md` §2.2 and the checkpoint infra in `../market/monetization.md`
  M-A2.2 / M-A3.1. Now the ordering and freshness are attested by a party *outside the seller*,
  and even first-probe inflation is bounded by the cosigner's monotonic history. The anchor
  cadence must be `≤` the probe/window cadence so the 90-day window is decidable from anchored
  heads.

## Changes required (buildable)

### Producer — `auths` / `auths-mcp`
- **`auths-mcp export-attestation`** (or `verify-spend --attest`): re-derives the chain from the
  **local, private** `spend.jsonl`, computes `{head, count, cumulative_cents}`, stamps `as_of`
  (obtaining a treasury/witness cosignature when `--anchor` is given), signs `activity/v1` with
  the agent key under the root, writes `activity.json`. No per-call data leaves the process.
- Reuse the existing signed-checkpoint aggregate (M-A2.2 / M-A3.1) as the anchored form; this
  command is that artifact plus the `activity/v1` envelope.

### Verifier — `apps/market`
- **Listing input:** replace `spendLogUrl` with **`attestationUrl`** (an `activity/v1` doc). Drop
  the "publish your raw log" requirement. Keep the public registry/KEL fetch for **identity
  resolution only**, never for the spend log; `audit.json` reduces to `{registry_git_url, root,
  agent}` for key resolution.
- **Prober check (c):** "`attestationUrl` reachable + `activity/v1`-shaped + signature valid"
  replaces "spend-log reachable + JSONL-shaped."
- **Receipts worker:** the new path in §"What the market verifies" — authenticity → monotonicity
  → witnessed-growth → `live_proven_at`; `verification_stale` on regression/bad-signature. It
  **never** git-fetches or parses per-call rows.
- **Data model:** the existing `receipt_checkpoints` already stores `last_binding` (head) and
  `last_cents` (cumulative) — extend to an **append-only `attestation_checkpoints` history**
  `(listing_id, head, cumulative_cents, count, as_of, anchor_tier, observed_at)` so witnessed
  90-day deltas are computable. Retire the per-call `receipt_summaries` rows (they were the leak);
  keep at most a coarse windowed cumulative, never per-call.
- **Badges:** `live_proven_at` ← witnessed 90-day delta `> 0`; add the `dormant` state; the badge
  tooltip states "signed aggregate; activity in last 90 days," not per-call figures.

### Migration
Pre-launch, no back-compat (repo rule: "violently rip things"). Replace the full-log path
outright — remove the raw-log fetch/replay, ship the attestation path.

## Open questions / future

- **Window + cadence:** 90 days is the default; the probe/anchor cadence must be `≤` the window
  so the delta is always decidable. Confirm the exact numbers with the anchor cadence decision in
  `../tools/auths-receipts.md` §2.2 (D3).
- **Rail split exposure:** default omit; decide whether opt-in coarse `rail_split_cents` is worth
  offering.
- **ZK tier (future, overkill now):** a succinct zero-knowledge proof of "there exists a valid
  chain signed under root R with `cumulative ≥ C` and `last_activity ≥ T`" — hides even the
  aggregate head/total while proving liveness. Not needed given the game theory; noted for when a
  seller wants to prove activity without revealing *any* number.
- **Fully-private (unlisted) mode:** already supported — don't list, publish nothing, still
  transact. Document it as the answer for sellers who want zero public footprint.

## Acceptance

1. The market sets `proven-live` from an `activity/v1` attestation **alone**, never fetching or
   parsing per-call rows (assert no raw-log request in the worker path).
2. **Rollback test:** republishing an earlier head (lower cumulative / earlier `as_of`) → listing
   goes `verification_stale`, not silently accepted.
3. **Inflation test:** an attestation claiming a large absolute total but with no market-witnessed
   growth → badge unchanged (credit is witnessed-only).
4. **Privacy test:** the published `activity/v1` document contains zero counterparty-identifying
   fields (schema conformance + a fuzz check that no per-call data is serializable into it).
5. **Consistency test:** `verify-spend` on a point-to-point `EvidenceBundle` re-derives the same
   `head` the public attestation commits to (public aggregate and private detail cannot diverge
   without detection).
