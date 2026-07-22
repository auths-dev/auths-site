# Seed Tools for the Market — What Agents Will Actually Pay For

> Second pass, after looking hard at the actual market. The first draft leaned on
> one arXiv preprint; this version is grounded in what's shipping, what's selling,
> what's funded, and — most importantly — what's conspicuously *missing*.

## What the space actually looks like right now

The x402 rails are live and growing but early: **x402scan** shows ~**163,600 transactions and ~$140k of volume in a week**, month-over-month growth, and Coinbase's **x402 Bazaar** indexes ~**1,000 services with ~112k calls / 30 days**. Note the average settlement is **~$0.86**, not sub-cent — the money is in mid-value calls, not dust. ([x402scan](https://www.x402scan.com/), [x402 Bazaar](https://www.coinbase.com/developer-platform/discover/launches/x402-bazaar))

But demand is still soft — Coinbase's own year-one numbers (169M payments) are, by Coindesk's read, **~half testing, not commerce**. ([Coindesk](https://www.coindesk.com/markets/2026/03/11/coinbase-backed-ai-payments-protocol-wants-to-fix-micropayment-but-demand-is-just-not-there-yet))

Here is the part that should drive our whole strategy — a category map of the ecosystem ([awesome-x402 inventory](https://github.com/xpaysh/awesome-x402/blob/main/README.md)):

| Category | State | Examples on the market today |
|---|---|---|
| Web data / scraping / search / OCR / extraction | **Saturated** | Agent402's ~1,100 web tools; countless scrapers |
| Crypto & financial data feeds | **Saturated** | DEX routing, prices, SEC filings, market intel |
| Media generation | **Saturated** | image/video endpoints |
| Basic utilities (translation, validation, geo) | **Saturated** | commodity, sub-cent |
| **Identity & reputation** | **Critical shortage** | ~none on x402 (KYC/AML/agent reputation absent) |
| **Dispute resolution / escrow / arbitration** | **Critical shortage** | ~none |
| **Audit & receipts / proof-of-execution** | **Sparse** | one player ("AI Growth" timestamped receipts) |
| **Compliance / sanctions / regulatory** | **Nearly empty, but already paying** | wallet sanctions screening selling at **$0.002/check** |
| **Proof & attestation** | **Sparse** | Touchstone, Zuluworks only |

The commodity layer is a race to the bottom. The **trust, accountability, and compliance layer is a wide-open, high-value gap** — and it happens to be the exact thing Auths is built to do.

## The gap is also the industry's #1 unsolved problem

Every serious survey of agentic commerce names the same top blocker: **liability and accountability** — *"who is liable when an agent buys something the user didn't intend?"* The post-purchase layer (disputes, chargebacks, audit) was built for a human clicking "buy," and it breaks the moment an agent transacts. Human-calibrated fraud systems don't work on agents; there's no consistent identity model, no clear ownership, no continuous visibility. ([Crowdfund Insider](https://www.crowdfundinsider.com/2026/06/284677-agentic-commerce-ai-enabled-digital-commerce-is-surging-but-significant-challenges-must-be-addressed/), [Bessemer — the delegated buyer](https://www.bvp.com/atlas/agentic-commerce-the-rise-of-the-delegated-buyer))

An Auths settlement receipt is *precisely* the missing evidence: it proves **which human authorized which agent, with which scope and budget, to make which exact call, and that the money moved** — all re-derivable by anyone, with nobody trusted. We aren't adding a feature to agentic commerce; we hold the raw material of its hardest unsolved problem.

## The competitive landscape — funded, but centralized

Trust for agents is not an empty field — it's a well-funded one, which validates the demand and clarifies our wedge:

- **Skyfire** ($9.5M, a16z) — "the Agent Trust Stack," a **Know-Your-Agent (KYA)** registry: agents pass a provider/purpose/security review and get a KYA-verified ID. ([Skyfire](https://skyfire.xyz/), [KYAPay/KYA](https://stellagent.ai/insights/skyfire-kyapay-know-your-agent))
- **Catena** — a **control plane** to govern agent payments (identity, policies, approvals, auditability). ([landscape](https://stellagent.ai/insights/agentic-commerce-infra-startups))
- **Payman** ($13.8M, Visa + Coinbase Ventures), **Basis Theory** ($33M), **Nekuda** ($5M), plus **Mastercard Agent Pay** and **Visa** — ~$47M+ into the identity/payments layer alone. ([Finextra](https://www.finextra.com/newsarticle/44621/skyfire-raises-85m-to-bring-autonomous-payments-to-ai-agents))

Every one of these is a **centralized registry or control plane** — a trusted third party you onboard to, whose word you take. That's their model and their weakness. **Auths's wedge is the opposite: decentralized, self-sovereign, non-custodial, git-native — no registry to trust, because every claim is a signature anyone can re-derive.** We don't ask a buyer to trust that Skyfire vetted an agent; we hand the buyer the cryptographic proof and let them check it themselves. In a market where "who do you trust to hold the trust" is unsolved, "you don't have to trust anyone" is the strongest possible answer.

## The revised thesis

**Skip the saturated commodity tools. Seed the market with the trust/accountability/compliance layer — the critical shortage on x402, the industry's #1 unsolved problem, and the one category the commodity resellers can't touch and the funded incumbents can only do centrally. Auths does it decentralized, non-custodial, and re-derivable, which is exactly what's missing.** Use a *single* differentiated volume tool (verified fetch) as the on-ramp; make the money and the moat on the trust tools.

## The four portfolios (crates in the `auths` monorepo)

Each portfolio is a **product/listing boundary**, realized in code as a **sibling crate in the
`auths` monorepo** — *not* its own repository. They all share one trust core, `auths-evidence`
(next to `auths-verifier`), so there is exactly one implementation of the verification /
re-derivation / receipt-signing logic across every tool — the property the whole thesis rests on.
Each crate produces one or more **auths-operated MCP tool servers** (Rust, embedding the core
in-process), wrapped by `@auths-dev/mcp`, metered on x402, and listed on the market.

**Why the monorepo, not four repos** (full rationale in [`auths-receipts.md`](./auths-receipts.md) §0.2):
the trust core must be in-tree with the verifier for one audit surface; pre-launch churn wants
atomic refactors and version lockstep (everything is `0.1.8` today); `auths-mcp-server` already
sets the "reference tool server lives in-tree" precedent; and four separate repos would be four
places the trust logic could drift. The **one** thing that *is* its own repo is the copy-me
**third-party tool template** (`auths-tool-template`, Python-first + TS) — the artifact outsiders
clone to list their own tools.

| Portfolio | Crate (monorepo) | PRD | Tools |
|---|---|---|---|
| 1 · Accountability & dispute | **`crates/auths-receipts`** | [`auths-receipts.md`](./auths-receipts.md) | T1 Authorization-Receipt / Dispute-Evidence · T2 Escrow / Arbitration |
| 2 · Compliance & risk | **`crates/auths-compliance`** | [`auths-compliance.md`](./auths-compliance.md) | T3 Sanctions / AML screening · T4 Spend & policy audit |
| 3 · Identity & reputation | **`crates/auths-reputation`** | [`auths-reputation.md`](./auths-reputation.md) | T5 Counterparty / Reputation oracle |
| 4 · Proof & verified data | **`crates/auths-proof`** | [`auths-proof.md`](./auths-proof.md) | T6 Verified Fetch · T7 Signed Notary |
| — · shared trust core | **`crates/auths-evidence`** | (§0.1–0.3 of `auths-receipts.md`) | `EvidenceBundle` · `resolveChain` · `verify_spend` · `judge` — used by all four |

## How a tool makes *us* money (so we pick right)

Revenue is bps-on-settled-volume + fleet subscription + attestation (see `../market/monetization.md`), and the **average settlement is ~$0.86** — so mid/high-value calls, not sub-cent dust, are what matters. Trust/compliance/dispute tools are inherently higher-value per call (a sanctions check is worth more than a weather lookup, a dispute-evidence bundle worth far more) and they pull **fleets and enterprises** — the durable Fleet/Enterprise-tier revenue — because accountability is a per-fleet requirement, not a per-call nicety.

---

## Portfolio 1 — Accountability & dispute (the #1 unsolved problem, our core)  ·  crate `auths-receipts`

### T1. Authorization-Receipt / Dispute-Evidence Service — **flagship, seed first**

- **What.** Given any settlement (or a payment reference), return a portable, signed **evidence bundle**: the full chain — human root → delegation → scope → budget → the exact signed call → the on-chain settlement — re-derivable offline by the recipient, plus a plain-English verdict ("authorized / out-of-scope / over-budget / unauthorized").
- **Why it's the one that matters.** *This is the answer to "who is liable."* When an agent buys the wrong thing, a chargeback lands, or an auditor asks "was this authorized?", this bundle settles it cryptographically. No incumbent can produce it — Skyfire can say "we vetted the agent," but only Auths can prove "this human delegated this budget and this exact call was inside it."
- **Why agents/operators pay.** Every dispute, chargeback, compliance audit, and B2B reconciliation needs it. High willingness-to-pay because the alternative is legal ambiguity.
- **Monetization.** Per-bundle (~$0.02–0.10) + Enterprise/Fleet retainer for continuous audit. Also *lifts all market volume* by making transactions defensible.
- **Build.** Medium — largely a read/format over data we already hold (delegation KELs + re-derivable spend log + on-chain tx). Ships in **`auths-receipts`** (see [PRD](./auths-receipts.md), Epic RC-E1/E2/E3).

### T2. Non-custodial dispute / escrow arbitration

- **What.** For larger agent-to-agent deals, a neutral **non-custodial** escrow with signed milestone release, and an arbitration endpoint that rules from the signed receipts (delivery proof vs payment proof).
- **Why.** Dispute resolution and escrow are a **named critical shortage** on x402 — literally ~none exist. And the trust-to-purchase gap is stark: 65% of consumers trust AI to *compare*, only 14% to *buy* — escrow is how you close that gap for machines.
- **Auths moat.** We're already the settlement coordinator with channels (`../market/monetization.md` M-A1); arbitration reads the same signed receipts. Non-custodial is the differentiator — nobody holds the money, so nobody is a honeypot or a money transmitter.
- **Monetization.** bps on escrowed volume + arbitration fee.
- **Build.** Medium-high (channel + milestone + ruling logic). Ships in **`auths-receipts`** ([PRD](./auths-receipts.md), Epic RC-E4).

---

## Portfolio 2 — Compliance & risk (already selling, nearly empty, high value)  ·  crate `auths-compliance`

### T3. Agent & Counterparty Compliance Screening — **seed early**

- **What.** Given an agent DID and/or a wallet/counterparty, return: sanctions/AML screening, jurisdiction/policy flags, and a signed **screening receipt** an operator can retain for audit.
- **Why it's a strong bet.** Compliance is a near-empty category, **yet wallet sanctions screening is already selling at $0.002/check** — real, priced, recurring demand. As agents transact autonomously, "did we just pay a sanctioned entity?" becomes a per-transaction requirement, not an afterthought.
- **Auths moat.** We bind the screening to a verifiable identity and emit a re-derivable receipt — so the *proof of having screened* is itself auditable. Composes with T1 for a complete "authorized + compliant" evidence bundle.
- **Monetization.** ~$0.002–0.02/check, high frequency, enterprise bulk tier.
- **Build.** Medium (integrate a sanctions/data provider behind our identity + receipt layer). Ships in **`auths-compliance`** ([PRD](./auths-compliance.md), Epic CO-E1/E2).

### T4. Spend & policy audit (compliance-as-query)

- **What.** Metered queries over an agent's or fleet's settlement history: total spend by period, policy conformance, anomaly flags — each answer re-derived from signed logs, not a mirror table.
- **Why.** "Continuous visibility" and "clear ownership" are named gaps; Catena is raising to be the *centralized* control plane for exactly this. We already built compliance-as-query (fn-157) — sell it, decentralized.
- **Monetization.** Per-query + Enterprise tier.
- **Build.** Low–medium (surface existing capability behind the meter). Ships in **`auths-compliance`** ([PRD](./auths-compliance.md), Epic CO-E3).

---

## Portfolio 3 — Decentralized identity & reputation (missing on x402; centralized elsewhere)  ·  crate `auths-reputation`

### T5. Counterparty Verifier / Reputation Oracle — **seed early, the flywheel**

- **What.** Given an agent DID: is it real and non-revoked; what root does it chain to; what was it delegated; and — from our ledger + on-chain — **its settlement history** (pays / disputes / defaults).
- **Why.** Agent identity/reputation is a **critical shortage** on x402 and a **$40M+ funded category** off it (Skyfire KYA, etc.). The moment agents trade with strangers — which our market exists to enable — counterparty risk must be priced.
- **Auths moat vs Skyfire.** Skyfire is a **centralized KYA registry** you trust. Ours is **decentralized and re-derivable** — the buyer verifies the identity and payment history *from signatures*, trusting no registry. And uniquely, *we hold both the identity graph and the settlement history*, so we can answer "is this agent real **and** does it pay its bills" — which neither a data reseller nor a pure identity registry can. Every settlement on the market makes this oracle better → more settlement. That's the flywheel.
- **Monetization.** ~$0.005–0.02/query + enterprise bulk; strategically lifts all market volume.
- **Build.** Medium — reads our registry + on-chain behind a metered, receipted endpoint. Ships in **`auths-reputation`** ([PRD](./auths-reputation.md)).

---

## Portfolio 4 — Proof & verified data (one volume on-ramp, differentiated by proof)  ·  crate `auths-proof`

### T6. Verified Fetch / Grounding Oracle — **the single volume tool worth seeding**

- **What.** URL → clean agent-ready content **plus a signed proof-of-fetch** (content hash, bytes served, timestamp, TLS chain), bound into the receipt.
- **Why only this one from the saturated pile.** Raw fetch/scrape is a race to the bottom (Agent402 alone has ~1,100). We list *one* because grounding is on every task and it's the natural on-ramp — but we differentiate on the **proof-of-fetch**: any agent can `curl`; none can *prove to a counterparty* what a URL served at time T. That provenance is what turns a commodity into a trust tool and feeds T1/T3 evidence bundles. The "network truth" (DNS/TLS/WHOIS) category already sells — we add the receipt.
- **Monetization.** ~$0.001–0.005/fetch (volume) with a proof surcharge.
- **Build.** Medium. Ships in **`auths-proof`** ([PRD](./auths-proof.md), Epic PR-E2/E3).

### T7. Signed Timestamp / Notary — **cheapest proof, ship as "hello world"**

- **What.** Submit bytes/hash → signed, anchored **proof-of-existence at time T** (optionally witness/transparency-log anchored).
- **Why.** Audit/receipts is a shortage (one incumbent). Agents constantly need "I had this before X." Tiny payload, high frequency, pure moat on infra we already built.
- **Monetization.** ~$0.0005–0.002/stamp + anchoring-cadence upsell.
- **Build.** **Low** — thinnest expression of the receipt thesis; ship first to prove the pattern end-to-end. Ships in **`auths-proof`** ([PRD](./auths-proof.md), Epic PR-E1).

---

## Deliberately *not* seeding (yet)

- **Generic web/scrape/OCR/translation/market-data** — saturated, sub-cent, no moat. Let third parties list them for completeness; don't build them.
- **Attested-inference / TEE proof** — real but research-adjacent, high build cost, and proving costs more than inferring. Revisit as a flagship *after* the trust tools land.
- **Captcha bridge** — real demand, but operationally/ethically loaded (human labor, target-site ToS). Park pending a governance stance.

## Sequencing

1. **T7 Signed Notary** — lowest build, proves "the receipt is the product" on a live listing.
2. **T1 Authorization-Receipt / Dispute-Evidence** — the flagship; it's the answer to the industry's #1 unsolved problem and only we can build it.
3. **T5 Counterparty/Reputation Oracle** + **T3 Compliance Screening** — the flywheel + the already-paying category; together they make the market safe to trade in.
4. **T6 Verified Fetch** — the volume on-ramp, differentiated by proof, feeding T1/T3.
5. **T2 Escrow/Arbitration**, **T4 Spend Audit** — as deal sizes and enterprise pull grow.

A launch that lands the point: **T7 + T1 + T5** live, with a worked demo (like the merchant loop + fleet) of an agent *verify counterparty → pay → get a signed authorization-receipt it could take to a dispute*, every step on-chain and re-derivable — a thing no commodity marketplace and no centralized trust vendor can show.

## Positioning, in one line

The market is full of people selling agents **data**. It is nearly empty of anyone selling agents **trust** — and the few who are (Skyfire, Catena, Payman) do it as a **centralized registry you must trust**. Auths sells the same trust as **math anyone can check**. Seed that.

## Open questions (owner decisions)

- **Compliance data source (T3)** — which sanctions/AML provider do we wrap, and do we resell or pass-through their cost?
- **Reputation vs Skyfire (T5)** — do we position as an *alternative* to KYA, or interoperate (verify Skyfire-issued KYA IDs alongside native DIDs)? Recommend: **native-first, interop later** — our story is "no registry required."
- **First-party vs reference-repo** — *(resolved)* build the seed tools as **auths-operated flagship listings** (own the revenue + the demo), as **sibling crates in the `auths` monorepo** sharing one `auths-evidence` — the market is the product. Open-source only the **`auths-tool-template`** repo (Python-first + TS) so third parties can list their own. See [`auths-receipts.md`](./auths-receipts.md) §0.2 for why in-tree, not four repos.
- **Escrow custody (T2)** — third-party facilitator vs on-chain channel contract; must stay non-custodial per the market's stance.
- **Pricing** — all figures are placeholders; calibrate to real cost basis and the observed ~$0.86 average settlement.

## Sources

- [awesome-x402 — ecosystem inventory (saturated vs missing categories)](https://github.com/xpaysh/awesome-x402/blob/main/README.md)
- [x402scan — live volume (~163k tx / ~$140k per week)](https://www.x402scan.com/)
- [Coinbase x402 Bazaar — discovery layer, ~1,000 services](https://www.coinbase.com/developer-platform/discover/launches/x402-bazaar)
- [Coindesk — x402 demand still mostly testing](https://www.coindesk.com/markets/2026/03/11/coinbase-backed-ai-payments-protocol-wants-to-fix-micropayment-but-demand-is-just-not-there-yet)
- [Crowdfund Insider — agentic commerce's unsolved challenges (liability, fraud, identity)](https://www.crowdfundinsider.com/2026/06/284677-agentic-commerce-ai-enabled-digital-commerce-is-surging-but-significant-challenges-must-be-addressed/)
- [Bessemer — agentic commerce: the delegated buyer](https://www.bvp.com/atlas/agentic-commerce-the-rise-of-the-delegated-buyer)
- [Skyfire — the Agent Trust Stack / KYA](https://skyfire.xyz/) · [KYAPay & Know-Your-Agent explained](https://stellagent.ai/insights/skyfire-kyapay-know-your-agent)
- [Agentic-commerce infra startups (Skyfire, Basis Theory, Nekuda, Catena, Rye)](https://stellagent.ai/insights/agentic-commerce-infra-startups)
- [Finextra — Skyfire raises $8.5M for autonomous agent payments](https://www.finextra.com/newsarticle/44621/skyfire-raises-85m-to-bring-autonomous-payments-to-ai-agents)
