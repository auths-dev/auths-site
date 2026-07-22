# `auths-receipts` — Authorization-Receipt, Dispute-Evidence & Non-custodial Escrow

**Portfolio 1 — Accountability & dispute.** The flagship portfolio — a set of **crates in the
`auths` monorepo** (not a standalone repo; see §0.2). It productizes the one thing only Auths
can produce: a portable, signed, offline-re-derivable answer to *"who authorized this agent to
spend, on what, and did the money actually move?"* — the industry's #1 unsolved problem (see
[`seed-tools.md`](/Users/bordumb/workspace/repositories/auths-base/auths-site/docs/plans/tools/seed-tools.md)).

> **Read first (you'll be building against these):**
> - Repo you extend for the receipt primitives: `/Users/bordumb/workspace/repositories/auths-base/auths/CLAUDE.md`
> - The gateway that already re-derives spend: `auths-mcp-gateway` (`verify-spend`, `export-spend-bundle`, `channel open/close`, `treasury serve`)
> - The napi surface you'll call from Node: `packages/auths-node/index.d.ts` (`authenticatePresentation`, `generateAuditReport`, `evaluatePolicy`)
> - Monetization model: [`../market/monetization.md`](../market/monetization.md)
> - The trust posture this repo inherits: `auths/docs/architecture/multi_device_accepted_risks.md` (why the *default* verdict is "as of the head you were shown")
> - The end goal is to serve this as a product on: `/Users/bordumb/workspace/repositories/auths-base/auths-site`

Status codes: **[greenfield]** new code in the monorepo (portfolio crates) · **[extend: auths]**
change to an *existing* monorepo crate (verifier, gateway, bindings) · **[decide]** blocked on
an owner decision.

**What changed since v1 of this PRD** (an adversarial review caught five places the first
draft asserted its way past — this version constructs them instead):

1. **Verdicts are now anchored — "authorized *as of* head H."** Budget/authorization
   verdicts are proofs of *absence* ("no other settled call," "no revocation"), which a
   truncated log can forge. The fix reuses infrastructure that **already exists**: the
   per-record agent-signed cumulative + hash-chain `binding`, and the offline-verifiable
   **treasury checkpoint** trail (`verify-spend --treasury-checkpoints --treasury-pubkey`).
   The *mechanism* is Auths-native, not a new on-chain primitive — see §2.
2. `judge()` is **split into per-call and per-log verdicts** with distinct semantics.
3. Escrow's **custody construction is resolved before RC-E4 begins** — with the reserved
   (channel-only, ships first) vs locked (deferred, contract-gated) modes, and the exact
   trust bounds of each.
4. Escrow records travel **by value or by pin** and are **never written into anyone's
   identity registry** — killing v1's unanswered "who has registry write access" gap.
5. The core is **async, cached, and library-first** — no `execFileSync` on a metered
   server, no scraping an un-versioned CLI JSON contract.

**What changed since v2.0** (this revision, 2026-07-19): §0.5's performance figures were
refreshed against the *completed* `performance`-branch study (`FINDINGS.md`, `auths@bcf995cd`).
The earlier "~84% transport" reading is **retracted** — transport is a ~10–20% minority and
per-call **CPU** dominates; cold start is now **~3 ms** (a shipped fix, not pending); the
`backend-postgres` registry is **implemented** (17 live-Postgres integration tests), no longer a
stub; and the spend-log hash chain was **hardened against a concurrency fork** the study found
and fixed (§2.2(a)). This revision also folds in nine **design + security refinements** from the
study review: **D1** the offline budget check is a consistency-check on the gate's recorded
verdict, not a second authority (§2.4, RC-E2.2); **D2** cross-rail budget re-derivation, not
`Σcost` (§2.4, RC-E1.4); **D3** anchor cadence as a measured latency SLA (§2.2); **D4** a
build-time freshness stamp on retainer bundles (§2.3, RC-E3.1); **D5** pinning as the
anti-withholding liveness guarantee (RC-E4.0); **S1** separate the pin's availability role from
the anchor's time role (RC-E4.0); **S2** the arbiter has zero fund-moving power in reserved mode
(RC-E4.0); **S3** data-minimization on the portable bundle (RC-E1.4, RC-E3.1); **S4** bind the
verify result to the caller's payment ref (RC-E2.3). New regressions for these land in RC-E5.2
(rows 16–19). Finally, the single-node **transport rewrite** was extracted from §0.5 into a
tracked, deprioritized issue ([auths#384](https://github.com/auths-dev/auths/issues/384)): a
single node already exceeds real payment-network peaks (~3× Stripe's Black Friday), so it is
future scaling work, not part of this plan. The rest of the trust model (§1–§4) is otherwise as
before.

**What changed since v2.1** (this revision): the portfolio **lives in the `auths` monorepo, not
a standalone `auths-receipts` repo.** The trust core (`auths-evidence`) had to be in-tree
regardless (§0.1 — one audit surface with the verifier); once that's granted, the first-party
servers belong beside `auths-mcp-server` for atomic pre-launch refactors, version lockstep, and
the existing CI/release/vendoring machinery — and four separate repos would be four places the
trust logic could drift, the exact thing §0.1 forbids. The four portfolios are a **listing /
product** boundary, realized in code as **sibling crates sharing one `auths-evidence`**. The
*only* standalone repo is the copy-me **third-party tool template** (§0.2, §0.3), whose whole job
is to be a clean, self-contained artifact an outsider clones. §0.3's file system is rewritten to
this layout.

---

## Market & regulatory signal — a named requirement, not a bet

Two independent signals — bottom-up and top-down — converge on the exact stack this plan builds,
in the exact order it builds it.

**Bottom-up (builders).** Practitioners shipping agent-to-agent commerce independently name the
same three failures, in order: (1) **identity + intent binding** breaks *first* — "Agent B has no
way to tell a request from Agent A is authorized by A's principal vs. a poisoned input," so the
mandate must carry "this principal, this amount cap, **this counterparty**, this time window,
signed below the model layer"; (2) **non-custodial escrow** with "a deterministic release
condition a dumb program can verify, not either agent asserting it went fine"; (3) **disputes** —
"nobody's handling them yet; keep it low-stakes with a human until the mandate + escrow primitives
get boring." That ordering (mandate → escrow → dispute) is this plan's ordering, and "a condition
a dumb program can verify" *is* `verify-spend` + rule-track escrow.

**Top-down (the UK regulator).** HM Treasury has opened a consultation on agentic payments and
named a **"trust framework" a "high" priority**, with three focus areas that map one-to-one onto
Auths's surfaces:

| Treasury focus area | Auths |
|---|---|
| "legal constructs and **dispute mechanisms** to unambiguously **assign accountability** when autonomous agents transact" | `auths-receipts` (this plan) |
| "**standardised identity and verification** for AI and autonomous software agents" | Auths delegation / DID / KERI |
| "interoperable standards for trusted **machine-to-machine authentication**" | `Auths-Presentation` / x402 auth |

The legal crux (Pinsent Masons; BoE Governor Bailey): *"it would first be necessary to work out
whether the system has **exceeded the authority** conferred by the payer **before** allocating
liability,"* and liability attaches to whether an agent "operated within **the remit** given by the
principal." **Determining "did the agent exceed its remit?" is exactly what an Auths anchored
verdict re-derives** (`authorized / unauthorized / expired / out-of-scope / out-of-counterparty /
over-budget`). Without a provable remit, the law defaults to Bailey's fear — *principal fully liable
at all times* — which kills adoption; Auths makes "exceeded the remit" a **cryptographic fact**, the
precondition for any better liability regime. Full mapping to the Payment Services Regulations 2017:
[`../regulatory/psr-2017-liability-mapping.md`](../regulatory/psr-2017-liability-mapping.md).

**What this justifies concretely.** The counterparty axis both signals demand — Reddit's "this
counterparty" in the mandate, Bailey's "the remit" — is built here as the **`out-of-counterparty`
verdict + the signed `counterpartyPolicy` ports/adapter** (§2.4, RC-E1.4, RC-E2.2, RC-E5.2 rows
20–21): default `AllowAll` (spend freely) or opt into `AllowList` / `Predicate` (locked-down), the
choice **signed into the grant** so a regulated principal can prove the constraint held.

**Honest caveat.** The Treasury text is a *consultation, not law*; UK-specific; "industry should
lead the standards" means a standards race against well-funded incumbents (Visa, Mastercard,
Skyfire, AP2). This de-risks *whether* the accountability layer is needed, not *when* revenue
arrives — and Auths's edge is that a regulator or court wants **re-derivable proof, trusting no
one**, which no centralized control-plane competitor offers.

---

## 0 · Architecture: file system & tooling

This is the section that decides whether the portfolio is adoptable in three years, so it
does **not** pick the easy path. The easy path is "write every tool as a Node/TS MCP shell,
shell out to the gateway binary, done." It's fast to stand up and it's what v1's snippets
imply — but it makes TypeScript a second place trust logic could drift, it under-serves the
Python-heavy people who actually build compliance / reputation / data / proof tools, and it
leaves our own revenue tools an FFI hop + a GC pause slower than agent buyers' sub-second
expectations tolerate. The right path is more work up front and much better for adoption, speed, and audit.

### 0.1 The one load-bearing rule

**There is exactly one implementation of the trust logic — verification, spend
re-derivation, KEL walking, verdict computation, canonical signing — and it is Rust.**
Every tool, first-party or third-party, in any language, reaches it through a binding and
**never reimplements it.** This is the "formatter over verified facts, never the verifier"
discipline made structural: a Python tool and a Rust tool produce byte-identical,
mutually-verifiable bundles because they ran the *same* code. This is already how Auths
works — `auths-verifier` builds as `rlib` + `cdylib` and is bound to Node (napi), Python
(PyO3), WASM, and native Rust from one source. We extend that surface; we do not fork it.

### 0.2 The decision, in one table

| Layer | What | Built with / where | Why (not the easy path) |
|---|---|---|---|
| **Trust core** | `resolveChain`, `judgeCall`/`judgeLog`, `EvidenceBundle` build/verify, escrow rule evaluation | **Rust crate `auths-evidence` in the `auths` monorepo**, next to `auths-verifier`; **shared by all four portfolios** | One audit surface, shared with the gateway CLI so `verify-spend` and the tools can never diverge, and one implementation across portfolios (§0.1). RC-E1.2 builds it. |
| **Bindings** | expose the core on the rails that already exist | **PyO3** → `auths` (PyPI) · **napi** → `@auths-dev/sdk` · **WASM** → `@auths-dev/verifier` · native Rust API | Zero reimplementation in any language; the versioned `receipts/v1` / `audit/v1` schemas are the contract across all four. |
| **First-party servers (T1–T7 — our revenue)** | the flagship listed tools | **Rust crates in the `auths` monorepo** (`crates/auths-receipts`, …) alongside the in-tree **`auths-mcp-server`** reference pattern, embedding `auths-evidence` natively | Native speed on the metered hot path (no FFI hop / GC pause on a call agent buyers expect to be sub-second), one audit surface with the money path, and — being in-tree — atomic refactors + version lockstep + the existing CI/release machinery. The deliberate "hard" choice. |
| **Third-party tool template (the adoption flywheel)** | what an outside dev copies to list *their* tool | **standalone `auths-tool-template` repo** — Python-first, TypeScript second, thin MCP stdio shells over the PyO3 / napi binding | The *one* thing that benefits from its own repo: a clean, self-contained artifact outsiders clone. The people who build these tools live in Python; `pip install auths` + a ~40-line shell is the widest on-ramp. |
| **Gateway (meter/settle/receipt)** | `@auths-dev/mcp wrap` | **unchanged** — the vendored, language-agnostic Rust binary | It already wraps any downstream stdio server in any language; the server-language choice is therefore *free*, so we spend it on adoption, not convenience. |
| **Enterprise HTTP surface (RC-E3.3)** | the retainer API the human buyer uses | **Rust** (same core, in-tree) with a **Python-first** client | The dispute-evidence buyer's stack is Python/enterprise, not an MCP wallet. |

**Why Rust first-party but Python-first template** — the two audiences have opposite needs.
Our flagship revenue tools are operated by *us*, called on a metered hot path, on the money
path: they want native speed and one audit surface → Rust, in-tree. The template is copied by
*strangers* who must never touch crypto and want to ship in an afternoon: it wants the
widest, safest on-ramp → Python (with TS alongside), in its own clean repo. The gateway being
language-agnostic is what lets both be true at once.

### 0.3 File system

Everything auths-operated lives in the **`auths` monorepo**: the shared trust core, the
first-party servers, the HTTP retainer, the SDK-binding additions, and the e2e gate. The four
portfolios are sibling crates that all depend on the one `auths-evidence`. The *only* thing
outside the monorepo is the copy-me third-party template, in its own repo.

```
auths/ (existing monorepo — new crates + additions to existing ones)
├── crates/
│   ├── auths-evidence/               # [greenfield] the SINGLE trust implementation, shared by ALL portfolios
│   │   ├── src/resolve_chain.rs        #   resolveChain — registry → verified chain (async)
│   │   ├── src/judge.rs                #   judgeCall / judgeLog — total fns over proven facts
│   │   ├── src/bundle.rs               #   EvidenceBundle build + offline verify + in-band suite tagging
│   │   ├── src/verify_spend.rs         #   RC-E1.2 — the re-derivation lifted from the gateway (one impl)
│   │   └── schemas/{receipts-v1,audit-v1}.json   # the cross-binding wire contract (semver'd)
│   │       #  (an in-process MCP harness embedding PerCallGate is the deferred transport — auths#384)
│   ├── auths-receipts/                 # [greenfield] Portfolio 1 — depends on auths-evidence
│   │   ├── src/lib.rs                   #   receipts domain: dispute assembly + escrow rules (src/escrow.rs)
│   │   └── src/bin/                     #   receipts-server (T1) · escrow-server (T2) · receipts-api (RC-E3.3 HTTP)
│   │       #  … crates/auths-compliance, auths-reputation, auths-proof are the sibling portfolio crates
│   ├── auths-verifier/                 # [extend] unchanged verifier — auths-evidence builds on it
│   └── auths-mcp-{core,gateway,server}/# [extend] gateway CLI becomes a thin caller of auths-evidence (RC-E1.2)
├── packages/
│   ├── auths-node/                     # [extend] napi: re-export auths-evidence into @auths-dev/sdk
│   └── auths-python/                   # [extend] PyO3: re-export auths-evidence into the `auths` wheel
└── tests/e2e/                          # [greenfield] threat-model gate (RC-E5.2) + live demo (RC-E5.3),
                                        #   beside the existing test_mcp_spend_log_audit.py

auths-tool-template/ (the ONE standalone repo — the adoption surface, copy-to-list-your-own-tool)
├── python/                             # PRIMARY: `pip install auths` + ~40-line MCP shell
│   ├── server.py                       #   your business logic + calls auths.evidence.* for signed/verified parts
│   └── pyproject.toml
├── typescript/                         # SECOND: `@auths-dev/sdk` + @modelcontextprotocol/sdk
│   └── server.ts
└── README.md                           # `auths-mcp wrap` it, list it — no crypto, no chain node
```

> **How this refines the epics below.** The RC-E1–RC-E5 snippets are written in TypeScript
> to show the *server shell shape* — which is deliberately thin and near-identical in Python,
> and is what the **template** looks like. Read them as illustration: the substantive logic they
> call (`resolveChain`, `judgeCall`, `signBundle`, `verifyOffline`, the escrow rule fns) is
> **not** TS or Python code — it is the Rust `auths-evidence` crate reached through the binding,
> and RC-E1.1/RC-E1.2/RC-E1.3 are the tasks that build that crate and its bindings. The
> first-party `auths-receipts` servers are **Rust, in-tree**, `wrap`-ped on stdio like the
> template (the in-process transport rewrite is deferred — [auths#384](https://github.com/auths-dev/auths/issues/384)).
> The TS you see is the template an outside author would write over the same stdio `wrap` path.

### 0.4 What the end user actually touches, and what they expect

Three distinct users, three interfaces, three expectations — the architecture is chosen to
satisfy all three at once:

- **The agent calling the tool** sees MCP-over-x402 and nothing else — `tools/call
  receipt_build {...}` → a signed bundle. It neither knows nor cares that T1 is Rust.
  *Expectation:* sub-second, priced ~$0.02, offline-verifiable. Met by native-Rust
  first-party servers + the RC-E1.3 KEL-head cache keeping git I/O off the paid path (agents feel
  this latency on every call — the market's prober does *not* gate on it, but buyers do).
- **The tool author** (the adoption flywheel) runs `pip install auths`, copies
  `templates/python/server.py`, writes ~40 lines of their own business logic, calls
  `auths.receipts.*` for anything that must be signed or verified, `auths-mcp wrap`s it, and
  lists it. *Expectation:* never implement crypto, never run a chain node, ship in an
  afternoon. Met by the PyO3 binding doing the heavy lifting behind a trivial shell.
- **The enterprise buyer** of dispute evidence (RC-E3.3) hits an HTTP API with a
  `pip`-installable client. *Expectation:* their existing Python/enterprise stack, an
  invoice not a wallet, retainer billing. Met by the Rust HTTP surface + Python client.

Across all three the **security invariant is identical because the code is identical**: one
Rust verifier, one re-derivation crate, one canonicalization + in-band suite tag — so a
bundle built by a Python third-party tool and one built by our Rust flagship verify the same
way, by anyone, offline. That property is only free if there is one implementation, which is
why §0.1 is the rule the rest of this document is organized around.

### 0.5 What the measured numbers say

The gateway path has been benchmarked end-to-end (`auths-site/tests/performance/FINDINGS.md`,
release gateway `auths@bcf995cd`, 10-core darwin/arm64, hermetic `--test-mode`, quiet machine).
Two results bear on this repo's design:

- **Sustained ~5,216 calls/s per node; the full-call crypto ceiling is ~49,017/s** (2 signs +
  1 verify, 10 cores) — ~10× headroom. Cryptography is **not** the bottleneck; correctness never
  bent (256/256, 10/10, and a **100,040-record** adversarial run all re-derived `consistent`).
- **Transport is a ~10% minority of a warm 0.93 ms call** (agent↔gateway wire; ~20% counting the
  gateway↔adapter hop). The call is **CPU-bound, not wire-bound**: in-handler orchestration
  0.39 ms (41%) + the auths enforcement stages 0.36 ms (39%, sign+gate+settle+spend-log). *(An
  earlier draft cited "~84% transport"; that was a subtraction estimate polluted by a test-adapter
  fixture read, now retracted — `FINDINGS.md` §Budget.)*

**What this means for the §0.2 split.** The first-party/template split stands on the grounds
already in §0.2 — one audit surface, no FFI hop / GC pause on the metered path, in-tree atomic
refactors, and the widest adoption on-ramp for the template — **none of which is a throughput
claim.** First-party servers are native Rust in-tree, `wrap`-ped on stdio exactly like the
template; the language/location choice buys audit surface and adoption, not raw calls/s.

**The single-node *transport rewrite* is out of scope for this repo — tracked in
[auths#384](https://github.com/auths-dev/auths/issues/384) and deliberately deprioritized.**
Moving first-party servers to an in-process / streamable-HTTP multi-agent transport (embedding
`auths-mcp-core`'s `PerCallGate`, dropping the stdio hop and the one-process-per-agent
oversubscription collapse) is a real scaling lever — but the *smaller* one. Transport is
~10–20% of a call; the larger single-node levers are per-call **CPU** and **group-commit
durability**, which apply regardless of transport, and the true production ceiling is the
**settlement rail, not the gateway**. Decisively, a single node already sustains **~3× Stripe's
Black Friday payment peak** at the enforcement layer (auths#384 carries the full calibration). So
this plan assumes the **stdio `wrap`** transport for *both* first-party and template servers; if a
tenant's enforcement volume ever approaches the per-node ceiling, pick up auths#384.

**Two measured constraints that still land directly on this repo's tasks:**

- **Cold start is already off the metered path — the fix is *shipped*, not pending.** The first
  metered call was ~6 s (a `git init`+`commit`+`sign` ceremony). The `performance` branch moved
  signing **in-process** **and** pre-decrypts the session key at setup, taking the first metered
  call to **~3 ms** (measured, `FINDINGS.md` #5). The buyer-facing cold-call latency is therefore a
  landed fix, not a risk; first-party servers **must** keep in-process signing + session-key pre-decrypt and
  **never fork git on a paid call**.
- **Per-call durable writes cap at ~5,736 rename/s** on a single counter; group-commit/WAL is the
  upstream fix. This is the real cost basis behind RC-E1.3 and the pricing open question — the
  margin is cache-hit-rate × avoided-work, and the **flush cadence, not the crypto**, is the wall.

None of this changes the security story — every figure in the study is re-derivable from the
signed spend logs via `verify-spend`, the same property the `EvidenceBundle` rests on. The study
also **hardened** that property against a concurrency bug it found in the producer — see §2.2(a).

---

## 1 · What this portfolio ships

Two MCP tool servers plus one HTTP surface, all auths-operated listings (crates in the
monorepo), wrapped by `@auths-dev/mcp` and metered on x402:

| Tool | Surface | Exposed calls | One-liner |
|---|---|---|---|
| **T1 Receipts** | MCP (x402) **and** HTTP (retainer) | `receipt_build`, `receipt_verify`, `dispute_evidence`, `evidence_export` | Turn any settlement into a signed, offline-re-derivable evidence bundle with an anchored verdict. |
| **T2 Escrow** | MCP (x402) | `escrow_open`, `escrow_milestone`, `escrow_object`, `escrow_release`, `escrow_arbitrate` | Non-custodial milestone escrow between two agents, ruled from the same signed facts. |

Tool names use **underscores, not dots**: MCP tool names get proxied into LLM
function-calling schemas whose validators commonly enforce `^[a-zA-Z0-9_-]+$`, and renaming
a *listed* tool later is a breaking change for every caller. (The gateway's `--scope`
capabilities keep the dotted Auths convention — `receipts.build` — because that's a
different namespace, the capability grant, not the MCP tool id.)

**The architecture in one paragraph.** Each tool is an
[MCP server](https://modelcontextprotocol.io) that holds *no money* and *no trust* — it reads
delegation KELs and the agent-signed spend log out of the issuer's registry, re-derives the
chain with the same verifier the hermetic gate uses, and returns a bundle a stranger can
re-check with `auths-mcp-gateway verify-spend` and `@auths-dev/verifier`. The *first-party*
T1/T2 servers are Rust crates embedding `auths-evidence` directly (the trust core as a linked
library); a *third-party* tool from the template is a thin Python/TS stdio shell — either way
`@auths-dev/mcp` meters and settles each call on x402 and writes the *tool's own* settlement
receipt. Nothing here is a mirror table — every field is re-derivable.

```
buyer agent ── tools/call receipt_build ──▶ @auths-dev/mcp (meter+settle) ──▶ auths-receipts server
                                                                                (Rust, embeds auths-evidence)
                                     reads issuer registry (delegation KEL + spend log)│
                                                                                       ▼
                                            signed EvidenceBundle  ◀── re-derivable by verify-spend + verifier
```

**Where the moat actually is — say it out loud so we prioritize correctly.** The registry
is public git, the verifier is open-source WASM, and the bundle is deliberately
re-derivable by anyone. So `receipt_build` *in isolation* is a formatter a competitor could
clone over the same public data — and that's fine, because it's the honest consequence of
"trust math, not us." The defensible parts are: the **`disputeRef` linkage** stamped into
every market settlement receipt (RC-E3.2 — we're the producer), the **cross-linking** into
`auths-compliance` screening receipts (only we hold both sides), being the
**arbiter-of-record** and record-pinning service for T2, and the enterprise **retainer
surface** (RC-E3.3). Those are not polish — they are the moat, and the sequencing reflects
that.

---

## 2 · Trust model: anchored verdicts, or why "authorized" needs a head

This section is the contract everything else implements. Read it before writing code.

### 2.1 Presence proofs vs absence proofs

A signed KEL event or a signed call is a **presence** fact: it travels inside the bundle
and verifies offline with no further context. But three of our five verdicts rest on
**absence** facts:

- `authorized` requires *no revocation event exists*;
- the budget check requires *no settled calls exist beyond the ones shown*;
- escrow's "no timely objection" requires *no objection event exists in the window*.

A log presented to you can always be **truncated**: every signature in a shortened log
still verifies, and cumulative spend looks under-cap. `verify-spend`'s `consistent` proves
the log wasn't *altered*; it cannot, on its own, prove the log is *complete*. So an
unqualified `authorized` is a claim no offline verifier can establish from the log alone —
and it is exactly the claim a dispute counterparty will attack.

### 2.2 The fix reuses what's already built: the binding chain + a head witness

Two of the three pieces already exist in the gateway; do not reinvent them.

**(a) The per-record cumulative + hash-chain head — already shipped, and now concurrency-safe.**
Every spend record is agent-signed over `Auths-Settle-Cumulative:{cents}` (`chain.rs`), and the
log carries a running commit `binding` (the `--resume-binding` head, chained `bindingᵢ =
H(bindingᵢ₋₁ ‖ canon(recordᵢ))`). So the agent has *already signed* the cumulative at every step,
and the head `bindingₙ` commits the whole prefix. Recomputing `binding₁…bindingₙ` from an
embedded log and comparing to a **committed** head detects any truncation or insertion — a
withheld record changes the head.

> **Precondition (established by the performance study, `FINDINGS.md` §headline).** This whole
> mechanism assumes the producer's spend log is a *single linear chain*. The study found — and
> fixed — a concurrency bug where pipelined/concurrent calls on one agent both read the same head
> and **forked** it (`verify-spend` 0/1, chain broken). A fork is not a malicious truncation; it
> makes an **honest** agent's bundle `unverifiable`, which is exactly the failure §2.3 cannot
> tolerate. The fix (an atomic per-agent critical section holding the head across
> sign→settle→append→advance) is proven under adversarial pipelining at **100,040/100,040 records
> across 40 chains, 40/40 `consistent`**. This is also the prerequisite for the deferred
> in-process multi-agent transport ([auths#384](https://github.com/auths-dev/auths/issues/384)):
> a multi-agent server would instantiate exactly this critical section **per session** (one lock
> per agent chain). RC-E5.2 carries the concurrency case as a standing regression regardless.

**(b) A head commitment by someone other than the producer — this is the anchor.** (a)
alone doesn't stop a malicious *operator* from showing an *old* head that omits later
over-budget calls: the agent signed that old head legitimately. Completeness therefore
needs the head committed by a party the verifier trusts, and Auths already offers a ladder
of these — pick the strongest one available in the deployment's posture:

| Anchor tier | Committer | Offline? | Already in tree? | When it applies |
|---|---|---|---|---|
| **Treasury checkpoint** | fleet coordinator (pinned P-256 key) | ✅ `verify-spend --treasury-checkpoints --treasury-pubkey` | ✅ shipped | any fleet under a treasury cap |
| **Witness / transparency checkpoint** | witness commons / `auths-transparency` Merkle log | ✅ embedded checkpoint + pinned witness key | ✅ crates exist, opt-in | solo agent opting into witnesses |
| **On-chain calldata anchor** | the chain (immutable, block-timed) | ⚠️ online (or via a pinned checkpoint) | ✳️ thin `[extend: auths]` | solo agent, no witnesses, wants public anchoring |
| **Trust-on-first-seen (bare default)** | nobody — the head you first saw | n/a | ✅ this is the documented default posture | no witnesses, no treasury, no anchor |

The bottom tier is not a cop-out — it is **exactly the posture Auths already documents and
accepts** (`multi_device_accepted_risks.md`: "verifiers trust the first valid event seen
locally"). The point of the ladder is that the bundle **states which tier it used**, so a
verdict is never stronger than its evidence. This maps the completeness guarantee onto
Auths's existing witness-optionality instead of bolting a mandatory blockchain onto a
system whose whole thesis is "just git and cryptography."

**Anchor cadence is a first-class latency SLA, not an open detail (design D3).** The treasury
checkpoint is the only *already-shipped* offline anchor tier, and its **cadence directly bounds
escrow settlement latency**: RC-E4.0 requires every objection window `wᵢ` to exceed the anchor
cadence (so the window is decidable from committed heads), so a slow checkpoint cadence makes
fast milestones impossible. Treat the treasury/witness checkpoint cadence as a measured product
SLA — benchmark it and publish the minimum escrow window it implies — before RC-E4 design,
rather than leaving it the `[decide]` afterthought it was.

**(c) Revocation is an absence-fact whose source is *not only* the KEL — the anchor must
cover it too.** The performance study's security note (`tests/performance/FINDINGS.md` §3) is
load-bearing here: **a delegation can be revoked outside its KEL** — an attestation /
TEL-style `revoked_at` timestamp (`auths-verifier` carries `revoked_at: Option<DateTime>` as
well as an in-KEL revocation event), which does **not** move the KEL tip. Two consequences
for this repo:

- The head an anchor commits must cover **every source the verdict's absence-facts depend
  on** — the spend-log binding *and* the KEL head *and* the revocation surface (TEL /
  attestation). Anchoring the spend log alone would let a bundle claim `authorized` while a
  same-instant TEL revocation is silently omitted. So `AnchorRef.head` is a commitment over
  the *composite* state as of H, not just `bindingₙ`.
- Revocation and expiry are therefore **re-evaluated fresh** at resolve time and are **never**
  served from a verdict cache — tip-keying the KEL is insufficient because a TEL revocation
  moves no KEL tip. This is the same reason the live gate re-checks them every call (a cached
  verdict would keep honoring a revoked delegation in a *metered* path — post-revocation
  budget draining, real money). The RC-E1.3 registry cache is a **data** cache, never a
  verdict cache — see there.

> **Why not the reviewer's "new on-chain anchor primitive as *the* mechanism"?** Because a
> new on-chain-only anchor (i) adds a hard blockchain dependency to the trust layer Auths
> deliberately keeps chain-free, (ii) is *weaker* for the offline story than a witness
> checkpoint (you can't verify chain finality on an air-gapped box without a light client),
> and (iii) duplicates the treasury-checkpoint machinery that already does this offline
> against a pinned key. On-chain stays as one optional tier for the solo/no-witness case.

### 2.3 Every verdict is "as of head H"

Given a bundle that embeds `record₁…recordₙ` and an anchor committing head `bindingₙ` at
time `T_H`, an offline verifier establishes, with no network:

1. **Consistency** — recompute the binding chain; it must equal the committed head.
2. **Completeness as of H** — any withheld record changes the head; since the head matches,
   the embedded records are *exactly* the log as of H. Absence of an event in the log ≤ H is
   now a checkable fact.
3. **Nothing after H** — unknowable offline, by construction. A revocation recorded at
   `T_H + ε` is invisible to this snapshot forever.

Therefore **every verdict this repo emits has the form "X, as of H,"** and the bundle
carries the anchor so that an **offline** consumer accepts as-of semantics explicitly (and
applies its own policy on acceptable head age — a chargeback desk might require a head no
older than the disputed transaction), while an **online** consumer can check the live log
for a later head that contradicts and upgrade to a current verdict. This also resolves the
marketing tension with the homepage's revocation story: revocation is honored *by the gate
at call time* (live path) and *by verifiers relative to H* (evidence path). Different
guarantees; the bundle says which one it makes.

**Retainer-grade bundles carry a build-time freshness stamp (design D4).** The as-of-H
guarantee is honest but easy to misuse: `dispute_evidence` is consumed by a *human* days later
who will not re-run the verifier. So at build time the high-value tools perform an online
re-check for a later contradicting head and stamp the result into the bundle
(`verdicts.onlineFreshness = { checkedAt, contradicted }`, RC-E1.4). The offline verdict is
still "as of H"; the stamp tells the human consumer *when we last confirmed no later head
contradicts it*, so a weeks-old head cannot be mistaken for a current one. Absence of the stamp
means "offline-only, freshness unknown" — never "fresh."

### 2.4 Two verdicts, not one

v1 conflated "was **this call** authorized" with "is **this agent's whole log** clean." A
chargeback desk asks the first; an auditor the second; an unrelated out-of-scope call last
Tuesday must not condemn today's clean $2 charge. The bundle carries both.

**Call verdict** — about one identified call `c`, first failure wins (order matters — each
check presumes the ones above):

```
unverifiable   binding chain does not re-derive to the anchored head, or no usable anchor tier
unauthorized   the signing key's delegation chain does not reach the claimed root,
               or a revocation of that delegation is recorded at or before H
expired        ts(c) ∉ [grant.issuedAt, grant.expiresAt]
out-of-scope   capability(c) ∉ grant.scope
out-of-counterparty  counterpartyPolicy(grant).decide(resolvedCounterparty(c)) = Deny
over-budget    spentBefore(c) + cost(c) > grant.cap
               spentBefore(c) = Σ cost(eᵢ) over settled eᵢ with index(eᵢ) < index(c)
authorized     all of the above pass — as of H
```

`out-of-counterparty` is a **ports/adapters policy check — an option, off by default.** The grant
carries a signed `counterpartyPolicy` naming the adapter in force: **`AllowAll`** (default — agents
spend freely), **`AllowList`** (only pre-approved settlement addresses / counterparty root DIDs), or
**`Predicate`** (credential/reputation-gated, the T5 extension). The policy is bound **in the signed
delegation, never gateway config** — so loosening it needs the principal's signature (it is part of
the *remit*), and the single adapter implementation lives in `auths-evidence`, so the live gate and
this offline judge reach the identical decision. It closes the injection/redirect attack — a poisoned
agent, in-scope and under cap, steered to pay an attacker (see §"Market & regulatory signal" and
RC-E5.2 rows 20–21).

`over-budget` uses spend *strictly before this call, plus this call* — matching the
gateway's pre-authorization semantics (reserve before the rail, settle the actual after).
The question is "was budget available when this call was made," not "did the agent ever
exceed it later."

**The offline budget check is a *consistency check on the gate's recorded verdict*, not a
second authority (design D1).** The live gate authorizes on **reserved + this ≤ cap** — it
reserves against budget *before* the rail (via `ReservedHolds`), then settles the actual after —
whereas an offline re-derivation from the log sees only **settled** records. Under concurrency
those differ: there can be in-flight reserves not yet settled at `index(c)`, and a settled
`actual` can be below what was reserved. So `spentBefore` computed from settled-only can
legitimately disagree with what the gate saw. The rule is therefore: **the gate's signed,
chained verdict (granted / refused) is the ground truth**; `judgeCall`'s budget arithmetic
*re-checks* it. Agreement → the stated verdict stands. Divergence → the bundle reports
`unverifiable` (a flagged budget-reconciliation mismatch) and **never silently substitutes the
re-derived verdict for the recorded one** — a divergence is evidence of gate misbehavior or a
bug, exactly what an audit trail must surface rather than paper over.

**Budget is cross-rail — do not sum raw `cost` (design D2).** The gateway cap is a
`CrossRailBudget`: one cap enforced across rails, with per-rail settlement (the D8 counter). A
single `grant.currency` with `spentBefore = Σ cost(eᵢ)` breaks the instant two settlements are
differently denominated. `judgeCall` **must reuse the same cross-rail re-derivation
`verify-spend` uses** (the settled cross-rail counter), and the grant must carry its rail/currency
basis explicitly (`EvidenceBundle.grant.budgetBasis`, RC-E1.4). Raw summation is valid only for
the single-rail, single-currency special case, and the bundle must say when that is the case.

**Log verdict** — about the whole log as of H: `consistent` / `inconsistent` (first failing
check named) / `unverifiable`. This is the auditor's answer and is exactly what
`verify-spend` already computes — we **surface** it, we don't recompute it.

All chain-of-custody facts (does the key chain to the root, is the delegation live) arrive
**already proven** from `resolveChain`. `judgeCall`/`judgeLog` are total functions over
proven facts and do **no cryptography** — that's the "report is the only API" rule, now with
no exceptions.

---

## Epic RC-E1 — Repo scaffold & the shared receipt core

Both tools share one library: fetch an issuer's registry, resolve a chain, and
produce/verify an `EvidenceBundle`.

- **RC-E1.1 [greenfield] Add the portfolio crates to the monorepo per §0.3.** New workspace
  members in `auths/crates/`: `auths-evidence` (the shared trust core, RC-E1.2) and
  `auths-receipts` (the Portfolio-1 crate — lib + the `receipts-server`, `escrow-server`,
  `receipts-api` bins). They join the existing workspace, inherit its CI (fmt, clippy
  `-D warnings`, the unwrap/expect lints, the arch-boundary checks), and the hermetic e2e lands
  under `auths/tests/e2e/`. The copy-me template is the *separate* `auths-tool-template` repo.

  **For the human:** this is in-tree Rust, not a standalone repo (see §0.2 for why). Register the
  crates as workspace members with `path` deps — no crates.io round-trip during pre-launch
  churn. Use `auths-mcp-server` as the reference server shape and reuse the workspace clippy
  config verbatim. The Python/TS surfaces (the template repo, and the `clients/python` retainer
  client) carry their own `pyproject.toml` / `package.json`.

  ```toml
  # auths/Cargo.toml — add to the existing [workspace] members
  members = [ /* … existing … */, "crates/auths-evidence", "crates/auths-receipts" ]

  # auths/crates/auths-receipts/Cargo.toml
  [dependencies]
  auths-evidence = { path = "../auths-evidence" }   # path dep — in-tree, lockstep
  auths-mcp-core   = { path = "../auths-mcp-core", optional = true }  # only for the deferred in-process transport — auths#384
  auths-verifier   = { workspace = true }
  ```

- **RC-E1.2 [greenfield] Build `auths-evidence` — one Rust crate, shared by every portfolio,
  bound to every language.** v1 shelled to the CLI and parsed `--json` output — an un-versioned
  contract at the most load-bearing joint in the system. Instead, lift the re-derivation logic
  the gateway already has (`verify-spend` / `export-spend-bundle`) into this shared crate, next
  to `auths-verifier`, and expose it through the **existing** binding targets: PyO3 (`auths` on
  PyPI), napi (`@auths-dev/sdk`), WASM (`@auths-dev/verifier`), and the native Rust API. The
  gateway CLI is refactored **[extend: auths]** to become a thin caller of the same crate — so
  CLI, tools, and every SDK share one implementation and cannot diverge. Version the output as
  `audit/v1` / `receipts/v1` with JSON schemas checked into `auths` (the cross-binding contract).

  **For the human:** this is the repo's own rule at architecture scale — a fact a consumer needs
  is *added to the producer*, never scraped off its output, and here the "producer" is a crate
  not a CLI. It's `auths-evidence` (not `-receipts-core`) because compliance/reputation/proof
  reuse the same `EvidenceBundle` + `resolveChain` + `verify_spend`; receipts-specific logic
  (escrow) lives in the `auths-receipts` crate. Do the napi/PyO3 exports by adding functions to
  `auths-node` (it already exports `generateAuditReport` — same shape) and `auths-python`
  (already a real PyO3 module). No CLI-scraping fallback is needed — this is in-tree, so the
  servers depend on the crate directly from day one.

  ```rust
  // auths/crates/auths-evidence/src/verify_spend.rs
  pub struct VerifyOpts<'a> {
      pub log_dir: &'a Path, pub registry_dir: &'a Path,
      pub agent: &'a Did, pub root: &'a Did,
      pub treasury_checkpoints: Option<&'a Path>,  // the anchor tier, when present (§2.2)
      pub treasury_pubkey: Option<&'a P256Pub>,
  }
  /// The single re-derivation. Native for the Rust servers AND the gateway CLI;
  /// #[napi]/#[pyfunction] shims re-export it verbatim into @auths-dev/sdk and the `auths` wheel.
  pub async fn verify_spend(opts: VerifyOpts<'_>) -> Result<AuditV1, EvidenceError>;
  ```

- **RC-E1.3 [greenfield] `resolveChain()` — async, cached, honest about cost.** Given a
  payment reference (a tx hash, or an `{agent, root, registryUrl}` triple), produce the
  fully-resolved chain. Two hard requirements v1 missed:

  **No synchronous subprocess or clone — ever.** The server is metered per call; a blocked
  event loop stalls every in-flight request *including the meter*. All I/O is `async`.

  **A *data* cache, keyed by KEL head — never a verdict cache.** A shallow clone per paid
  call is the cost basis that eats the margin at ~$0.02/bundle and blows the buyer-facing
  per-call latency (RC-E5.1 — the market prober doesn't gate on latency, but agents do). Cache fetched registry *bytes* content-addressed by KEL head; per
  request do one cheap `git ls-remote` and only re-fetch when the head moved. Two safety
  rails, both from measured findings:
  - The byte cache is **safe by construction** — every byte is re-verified downstream by
    `verifySpend` + the WASM verifier, so a poisoned cache can only cause a *false failure*,
    never a false `authorized`.
  - **Revocation and expiry are evaluated fresh every call, off the cache** (§2.2(c)):
    tip-keying the KEL is insufficient because a TEL/attestation revocation moves no KEL tip,
    and this is a *metered* path where a stale "still valid" is post-revocation budget
    draining. Cache the fetch, not the judgment.

  ```ts
  // Shape only — the real impl is auths-evidence::resolve_chain (Rust); TS shown for the shell's-eye view
  export interface ResolvedChain {
    root: string; agent: string;
    grant: { scope: string[]; cap: string; currency: string; issuedAt: string; expiresAt: string };
    calls: SignedCall[];          // each metered tools/call, agent-signed, in log order
    settlements: Settlement[];    // on-chain tx refs, one per settled call
    anchor: AnchorRef;            // the head commitment + which tier (§2.2)
    provenChainToRoot: boolean;   // established by verifySpend — NOT re-checked in judge
    revocation?: { source: "kel" | "tel"; seq?: number; ts: string };  // KEL event OR TEL/attestation revoked_at — §2.2(c)
    logVerdict: "consistent" | "inconsistent" | "unverifiable";
    logHead: string;              // bindingₙ — must equal anchor.head
  }

  export async function resolveChain(input: ChainInput): Promise<ResolvedChain> {
    const registry = await registryCache.fetch(input.registryUrl);   // KEL-head keyed
    const audit = await verifySpend({
      logDir: spendLogDir(registry, input.agent), registryDir: registry.dir,
      agent: input.agent, root: input.root,
      treasuryCheckpoints: registry.treasuryTrail, treasuryPubkey: input.treasuryPubkey,
    });
    return shapeChain(audit, registry);   // pure re-format; introduces no new trust
  }
  ```

- **RC-E1.4 [greenfield] The `EvidenceBundle` type + canonical signing.** The wire shape both
  tools emit. Canonicalize with `json-canon`; sign with the tool server's own agent key.
  Changes from v1: the bundle carries its **anchor** (and its tier), **both verdicts**, and
  its **signature suite in-band** — a self-contained artifact must carry its own suite id, and
  this is literally the Auths wire-format rule ("every signature on a wire carries its curve
  tag in-band"). `network` is an **open string** (CAIP-2), not a two-value union baked into a
  `v1` type.

  **For the human:** the bundle must be self-contained — a recipient with only the bundle and
  `@auths-dev/verifier`, air-gapped, must reach the same as-of verdict. So every KEL event
  **and every spend-log record up to the anchor head** travels inside it (completeness
  checking needs them all — §2.3), plus the anchor's own proof (the treasury/witness
  checkpoint by value + which pinned key signed it). The suite is curve-tagged and
  **defaults to P-256** (Auths's default; the treasury checkpoint key is P-256), never
  hardcoded to one algorithm.

  **Data classification (security S3):** the bundle is infinitely re-shareable, so what travels
  in it is a privacy decision, not an afterthought. Tool arguments travel **hashed only**
  (`call.args_hash`), never in plaintext; any human-readable render (RC-E3.1) is built over the
  *hashed* fields and MUST NOT re-expand them; and a cross-linked compliance result travels as a
  **minimized, subject-consented attestation or reference** (RC-E3.1), never the full screening
  payload. A field is plaintext in the bundle only if it is already public (DIDs, tx hashes,
  amounts, grant scope) or the subject consented to disclosing it.

  ```ts
  // Shape only — the real impl is auths-evidence::bundle (Rust); the wire schema is receipts-v1.json
  export interface AnchorRef {
    tier: "treasury" | "witness" | "onchain" | "first-seen";   // §2.2 ladder — verdict ≤ its tier
    head: string;        // commitment over the COMPOSITE state as of H: spend-log bindingₙ + KEL head + revocation surface (§2.2(c))
    kelSeq: number;      // last KEL event covered
    committer?: string;  // pinned key / witness id / tx — absent for "first-seen"
    proof?: unknown;     // checkpoint-by-value / inclusion proof / tx ref, per tier
    ts: string;          // when the head was committed — verdicts are "as of" this instant
  }
  export interface EvidenceBundle {
    version: "receipts/v1";
    suite: string;       // in-band, curve-tagged, e.g. "json-canon/p256" (default) or ".../ed25519"
    subject: { root: string; agent: string };
    grant: {
      scope: string[]; cap: string; currency: string; issuedAt: string; expiresAt: string;
      budgetBasis: "single-rail" | "cross-rail";   // D2 — cross-rail caps re-derive via verify-spend's counter, not Σcost
      counterpartyPolicy: { kind: "allow-all" | "allow-list" | "predicate"; allow?: string[]; predicateRef?: string };  // signed remit; ports/adapter — default allow-all
    };
    call: { tool: string; args_hash: string; ts: string; signature: string; index: number };  // args HASHED only — S3
    settlement: { rail: "x402"; tx: string; amount: string; network: string; counterparty: string };  // CAIP-2; counterparty = resolved settlement addr / root DID, checked vs policy
    verdicts: {
      // "unverifiable" also covers a gate-verdict vs re-derivation mismatch (D1) — never silently overridden
      call: "authorized" | "unauthorized" | "expired" | "out-of-scope" | "out-of-counterparty" | "over-budget" | "unverifiable";
      log: "consistent" | "inconsistent" | "unverifiable";
      asOf: AnchorRef;                 // no unqualified verdicts — §2.3
      onlineFreshness?: { checkedAt: string; contradicted: boolean };  // D4 — dispute_evidence stamps a build-time re-check
    };
    proof: { kelEvents: KelEvent[]; spendLog: SignedCall[] };   // complete as of the anchor head
    issued_by: string;   // the T1 tool's own agent DID
    signature: string;   // sign(canon(bundle minus signature)) by issued_by, per `suite`
  }
  ```

---

## Epic RC-E2 — T1 `receipt_build` / `receipt_verify`

- **RC-E2.1 [greenfield] Stand up the MCP server** (Rust, in-tree; stdio-`wrap`ped like the template)**.** Expose `receipt_build` (payment ref
  → bundle) and `receipt_verify` (bundle → re-checked as-of verdict, offline). Keep the server
  dumb — validate, `resolveChain`, sign, return; all logic lives in `core`. The server is what
  gets `wrap`-ed and listed; price per successful bundle.

  ```ts
  // packages/receipts-server/src/server.ts
  import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
  import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
  import { resolveChain, signBundle, judgeCall, verifyOffline, locateCall } from "@auths-dev/sdk"; // napi → auths-evidence

  const server = new McpServer({ name: "auths-receipts", version: "1.0.0" });

  server.tool("receipt_build", BuildInput, async ({ paymentRef, registryUrl }) => {
    const chain = await resolveChain({ paymentRef, registryUrl });
    const call = locateCall(chain, paymentRef);
    const bundle = signBundle(chain, call, {
      call: judgeCall(chain, call), log: chain.logVerdict, asOf: chain.anchor,
    });
    return { content: [{ type: "text", text: JSON.stringify(bundle) }] };
  });

  server.tool("receipt_verify", VerifyInput, async ({ bundle }) => {
    return { content: [{ type: "text", text: JSON.stringify(verifyOffline(bundle)) }] };
  });

  await server.connect(new StdioServerTransport());
  ```

- **RC-E2.2 [greenfield] `judgeCall` / `judgeLog` — total functions over proven facts.**
  Implement §2.4 exactly. No cryptography: `provenChainToRoot`, `revocation`, and `logVerdict`
  arrive from `resolveChain`; the judges only order and compare. **Two rules from §2.4 the sketch
  below elides:** (D1) `judgeCall`'s budget arithmetic *re-checks* the gate's recorded, chained
  verdict — on disagreement it returns `unverifiable` (a flagged reconciliation), never silently
  overriding what the gate recorded; and (D2) `spentBefore` must use the **cross-rail**
  re-derivation `verify-spend` computes (the settled cross-rail counter) whenever
  `grant.budgetBasis === "cross-rail"`, not the single-currency `Σ cost` shown here.

  ```ts
  // Shape only — the real impl is auths-evidence::judge (Rust), total fns over proven facts
  export function judgeCall(c: ResolvedChain, call: SignedCall): CallVerdict {
    if (c.logVerdict === "unverifiable" || c.logHead !== c.anchor.head) return "unverifiable";
    if (!c.provenChainToRoot) return "unauthorized";
    if (c.revocation && c.revocation.ts <= c.anchor.ts) return "unauthorized";
    if (!within(call.ts, c.grant.issuedAt, c.grant.expiresAt)) return "expired";
    if (!c.grant.scope.includes(capabilityOf(call))) return "out-of-scope";
    if (counterpartyPolicy(c.grant).decide(resolvedCounterparty(c, call)) === "deny") return "out-of-counterparty";  // ports/adapter; AllowAll default, signed into grant
    if (gt(add(spentBefore(c, call), cost(call)), c.grant.cap)) return "over-budget";
    return "authorized";
  }
  const spentBefore = (c: ResolvedChain, call: SignedCall) =>
    sum(c.calls.filter(e => e.index < call.index && isSettled(c, e)).map(cost));
  ```

- **RC-E2.3 [greenfield] `receipt_verify` runs fully offline and enforces as-of semantics.**
  Load the WASM verifier, feed it `proof`, recompute the binding chain from the embedded
  `spendLog`, confirm it equals `verdicts.asOf.head`, verify the **anchor tier** (the embedded
  checkpoint's signature against the pinned committer key, unless tier is `first-seen`),
  independently recompute both verdicts, and compare to the bundle's. Any divergence →
  `tampered`. The returned verdict **always restates the anchor** — the caller is told
  *"authorized as of H (tier=treasury)"*, never a bare *"authorized"*.

  **For the human:** this is the whole trust story — "you don't have to trust the tool that
  made this." The anchor check is what defeats truncation: a shortened `spendLog` no longer
  re-derives to the committed head. Both the byte-flip *and* the truncation tests live in
  RC-E5.2.

  **Bind the result to *your* payment ref (security S4).** A valid bundle for call *X* must not
  be accepted as evidence about call *Y*: internal validity ("the bundle verifies") is not the
  same as relevance ("the bundle is about this dispute"). So `verifyOffline` echoes the bundle's
  `subject`, `settlement.tx`, and `call.index` in its result, and the consuming flow (and the
  RC-E3.3 HTTP surface) MUST assert they match the transaction it is adjudicating before acting
  on the verdict.

  ```ts
  import init, { verify_chain } from "@auths-dev/verifier";
  export function verifyOffline(bundle: EvidenceBundle): OfflineVerdict {
    const r = verify_chain(JSON.stringify(bundle.proof));      // signatures + KEL, no I/O
    if (!r.valid) return { ok: false, reason: "invalid-proof" };
    if (rederiveHead(bundle.proof.spendLog) !== bundle.verdicts.asOf.head)
      return { ok: false, reason: "head-mismatch" };           // truncation / substitution caught here
    if (!verifyAnchorTier(bundle.verdicts.asOf))               // pinned committer sig, unless first-seen
      return { ok: false, reason: "anchor-unverifiable" };
    const chain = fromProof(bundle.proof, bundle.verdicts.asOf);
    const recomputed = { call: judgeCall(chain, embeddedCall(bundle)), log: judgeLog(chain) };
    if (recomputed.call !== bundle.verdicts.call || recomputed.log !== bundle.verdicts.log)
      return { ok: false, reason: "tampered" };
    // S4 — echo the binding fields; the CALLER must assert these match its own payment ref
    return { ok: true, verdicts: bundle.verdicts, asOf: bundle.verdicts.asOf, root: r.subjectRoot,
             subject: bundle.subject, tx: bundle.settlement.tx, callIndex: bundle.call.index };
  }
  ```

---

## Epic RC-E3 — T1 `dispute_evidence` (the high-value call) & the enterprise surface

- **RC-E3.1 [greenfield] `dispute_evidence` — the retainer-grade bundle.** Given a contested
  payment, assemble everything a human arbiter/auditor/chargeback desk needs in one signed
  artifact: the authorization chain (RC-E2), the escrow record if the deal used one (by value
  or pin — never by reading anyone's registry, RC-E4.0), the on-chain settlement, a compliance
  cross-link, and a human-readable render. Stays stateless — every input is passed in or pinned.

  Two obligations specific to this high-value, human-consumed bundle: **(D4) stamp build-time
  freshness** — perform an online re-check for a later contradicting head and record
  `verdicts.onlineFreshness = { checkedAt, contradicted }` (§2.3), since the human reader won't
  re-run the verifier; and **(S3) minimize the compliance cross-link** —
  `fetchAndVerifyComplianceReceipt` returns a *minimized, subject-consented attestation or
  reference* (e.g. "screening passed, receipt #…"), never the full screening result, because
  this bundle is portable and re-shareable. The `rendered` view is built over hashed argument
  fields and never re-expands them.

  ```ts
  server.tool("dispute_evidence", DisputeInput,
    async ({ paymentRef, registryUrl, escrowRecord, complianceReceiptRef }) => {
      const chain = await resolveChain({ paymentRef, registryUrl });
      const call = locateCall(chain, paymentRef);
      const escrow = escrowRecord ? verifyEscrowRecord(escrowRecord) : undefined;
      const compliance = complianceReceiptRef ? await fetchAndVerifyComplianceReceipt(complianceReceiptRef) : undefined;
      const bundle = signBundle(chain, call,
        { call: judgeCall(chain, call), log: chain.logVerdict, asOf: chain.anchor },
        { escrow, compliance, rendered: renderHuman(chain, call, escrow) });
      return { content: [{ type: "text", text: JSON.stringify(bundle) }] };
    });
  ```

- **RC-E3.2 [extend: auths] Emit `disputeRef` on the settlement receipt.** So a bundle can be
  found later by the payment it disputes, the gateway's settlement receipt carries an optional
  `disputeRef`, threaded from `wrap --dispute-ref`. Small change, outsized importance — this is
  a **moat item** (§1): every settlement receipt the market ever writes becomes an index entry
  pointing at *our* evidence surface. Producer-side, never parsed out downstream.

  ```rust
  // auths-mcp-gateway: receipt.rs
  pub struct SettlementReceipt {
      // …existing fields…
      #[serde(skip_serializing_if = "Option::is_none")]
      pub dispute_ref: Option<String>,   // set from `wrap --dispute-ref`
  }
  ```

- **RC-E3.3 [greenfield] `receipts-api` — the enterprise retainer HTTP surface (full build spec).**
  `receipt_build`/`receipt_verify` have genuine agent-native uses (agent B verifies what it just
  paid for; a counterparty-checking agent vets a claimed receipt before extending credit) — those
  stay on MCP/x402. But the *retainer-grade* `dispute_evidence` buyer is a human — a chargeback
  desk, an auditor, a compliance team — post hoc, days later, on an invoice (per
  `../market/monetization.md`, the durable Fleet/Enterprise revenue). That buyer doesn't speak MCP
  or hold a wallet. `receipts-api` is a **thin, stateless-per-request HTTP service over the same
  `auths-evidence` core** — it re-uses the exact `resolveChain` / `signBundle` / `verifyOffline` /
  `dispute_evidence`-assembly functions the MCP tools call (RC-E3.1, RC-E2.3), never a second
  implementation. It adds only what HTTP buyers need: API-key auth, tenant isolation, a
  `disputeRef` lookup index, usage recording, and a Python client. **Custody: never** — like the
  rest of the system it holds no funds; it records usage and exposes it, and charging is reconciled
  through the market's Stripe billing (see RC-E3.3.7).

  **Stack & location.** Bin `crates/auths-receipts/src/bin/receipts-api.rs` + module
  `crates/auths-receipts/src/api/` (routes, handlers, `auth` middleware, `error`, `state`,
  `billing`). HTTP: **`axum` + `tokio` + `tower-http`** (match `auths-api`'s stack), `serde`,
  `utoipa` for the OpenAPI doc, `tracing` + `metrics` (reuse the gateway's #7 Prometheus pattern).
  Persistence: **Postgres via `sqlx`** (same dependency as `auths-storage`'s `backend-postgres`),
  migrations under `crates/auths-receipts/migrations/`. No `unwrap`/`expect` outside tests;
  `thiserror` domain errors; clock injected (no `Utc::now()` in logic). All I/O `async`.

  - **RC-E3.3.1 [greenfield] Data model** (`migrations/0001_receipts_api.sql`). Five tables, all
    tenant-scoped by `account_id`; every query filters on it (a row from another account is a
    `404`, never a `403` — no enumeration oracle).

    | Table | Key columns |
    |---|---|
    | `api_accounts` | `id uuid pk`, `name`, `auths_root text null` (links to a proven root for the top badge / billing), `billing_mode` (`retainer`\|`metered`\|`contract`), `retainer_included_bundles int`, `overage_cents int`, `price_book jsonb` (per-op cents), `status` (`active`\|`suspended`), `created_at` |
    | `api_keys` | `id uuid pk`, `account_id fk`, `key_prefix text unique`, `key_hash text` (Argon2id of the full key), `name`, `scopes text[]`, `created_at`, `last_used_at`, `revoked_at null` |
    | `bundles` | `id uuid pk`, `account_id fk`, `dispute_ref text null`, `subject_root`, `subject_agent`, `settlement_tx`, `call_index int`, `log_hash`, `call_verdict`, `log_verdict`, `anchor_tier`, `bundle_json jsonb`, `size_bytes int`, `created_at` — indexes `(account_id, dispute_ref)`, `(account_id, created_at)` |
    | `usage_events` | `id uuid pk`, `account_id fk`, `api_key_id fk`, `kind` (`bundle_build`\|`dispute_evidence`\|`verify`\|`export`), `unit_cost_cents int`, `bundle_id fk null`, `idempotency_key text null`, `metadata jsonb`, `created_at` — index `(account_id, created_at)` |
    | `idempotency_keys` | pk `(account_id, key)`, `request_hash text`, `response_json jsonb`, `status_code int`, `created_at` |

    Store bundles by value (`bundle_json`) so the `disputeRef` lookup is self-contained. **S3
    data-minimization:** `bundle_json` already carries only `args_hash` (never plaintext args); do
    not add any column that re-expands hashed fields.

  - **RC-E3.3.2 [greenfield] Auth & tenancy — API keys.** `Authorization: Bearer ark_<prefix>_<secret>`.
    Issue keys with a bootstrap CLI on the same bin (`receipts-api accounts create …`,
    `receipts-api keys issue --account <id> --scopes bundles:write,bundles:read,verify,export,usage:read`)
    — the full key is printed **once**, only its Argon2id hash + plaintext `key_prefix` persist.
    An `axum` middleware resolves the key: look up by `key_prefix`, constant-time-verify the hash,
    reject if `revoked_at` set, attach `Account` + `ApiKey` to request extensions, and update
    `last_used_at` out-of-band. Per-route scope check. `401` missing/invalid/revoked, `403`
    wrong scope, `429` over rate limit (per-key token bucket via `tower_governor` or a Postgres
    counter, limits from config).

    ```rust
    // crates/auths-receipts/src/api/mod.rs
    pub fn router(state: ApiState) -> Router {
        Router::new()
            .route("/v1/bundles",              post(build_bundle).get(list_bundles))     // list ?disputeRef=
            .route("/v1/bundles/:id",          get(get_bundle))
            .route("/v1/bundles/:id/export",   get(export_bundle))                       // RC-E3.4
            .route("/v1/verify",               post(verify_bundle))
            .route("/v1/usage",                get(get_usage))
            .route("/v1/account",              get(get_account))
            .route_layer(from_fn_with_state(state.clone(), require_api_key))             // auth on /v1/*
            .merge(ops_routes())   // /healthz /readyz /metrics /openapi.json  (unauthenticated)
            .with_state(state)
    }
    ```

  - **RC-E3.3.3 [greenfield] `POST /v1/bundles` — build a dispute-evidence bundle.** The retainer
    money call. Body mirrors `dispute_evidence` (RC-E3.1): `{ paymentRef, registryUrl, escrowRecord?,
    complianceReceiptRef?, headMaxAgeSecs?, disputeRef? }`. Handler calls the **same core assembly**
    — `resolveChain` → `locateCall` → `verifyEscrowRecord`? → `fetchAndVerifyComplianceReceipt`? →
    `signBundle` — including **(D4)** the build-time online freshness re-check
    (`verdicts.onlineFreshness`, honoring `headMaxAgeSecs`) and **(S3)** the minimized compliance
    cross-link. Persists the row (`disputeRef` from the body, else the settlement receipt's
    `dispute_ref` per RC-E3.2), writes a `dispute_evidence` `usage_event`, returns **`201`** with
    the signed `EvidenceBundle` (RC-E1.4) + `{ id, disputeRef, verdicts, asOf, createdAt }`. Honors
    `Idempotency-Key` (RC-E3.3.6). `Prefer: return=minimal` → `{ id, links }` only.

    ```rust
    async fn build_bundle(State(s): State<ApiState>, acct: Account, key: ApiKey,
                          idem: Option<IdempotencyKey>, Json(req): Json<BuildBundleRequest>)
        -> Result<(StatusCode, Json<BundleResponse>), ApiError> {
        if let Some(hit) = idem.replay(&s, &acct, &req).await? { return Ok(hit); }        // RC-E3.3.6
        let chain  = s.core.resolve_chain(&req.payment_ref, req.registry_url.as_deref()).await?;
        let call   = s.core.locate_call(&chain, &req.payment_ref)?;
        let bundle = s.core.dispute_evidence(&chain, &call, DisputeInputs {              // same fn as RC-E3.1
            escrow: req.escrow_record, compliance: req.compliance_receipt_ref,
            head_max_age_secs: req.head_max_age_secs,                                    // D4
        }).await?;
        let stored = s.store_bundle(&acct, &bundle, req.dispute_ref.as_deref()).await?;  // + usage_event
        idem.record(&s, &acct, &req, StatusCode::CREATED, &stored).await?;
        Ok((StatusCode::CREATED, Json(stored.into_response())))
    }
    ```

  - **RC-E3.3.4 [greenfield] `POST /v1/verify` — offline verification over HTTP.** Body `{ bundle }`.
    Runs `verifyOffline` (RC-E2.3) verbatim — recompute the binding head, check the anchor tier,
    independently recompute both verdicts. **(S4)** the response echoes the binding fields so the
    caller binds it to *their own* dispute: `{ ok, reason?, verdicts, asOf, subject, tx, callIndex,
    root }`. Stateless (the bundle need not be one we stored); still requires a key and records a
    (cheap/free) `verify` `usage_event`.

  - **RC-E3.3.5 [greenfield] Read + index endpoints (the `disputeRef` moat surface).**
    `GET /v1/bundles/:id` returns one stored bundle (tenant-scoped, `404` otherwise).
    `GET /v1/bundles?disputeRef=<ref>&cursor=&limit=` is the **"find the evidence for this disputed
    payment"** query that makes RC-E3.2's `disputeRef` pay off — cursor-paginated, tenant-scoped,
    newest first. `GET /v1/account` returns the plan + this period's used/included. `GET /v1/bundles/:id/export?format=pdf|psp:<name>` is the **RC-E3.4** hook: `pdf` renders the
    `rendered` exhibit + a verification appendix (offline-check instructions) and returns
    `application/pdf`; `psp:<name>` returns that PSP's field mapping (the mapping table itself is
    RC-E3.4's `[decide]`); either way it records an `export` `usage_event`.

  - **RC-E3.3.6 [greenfield] Cross-cutting HTTP correctness.**
    - **Idempotency.** `Idempotency-Key` on `POST /v1/bundles`: store `(account, key) → request_hash
      + response + status`. Same key + same body → replay the stored response; same key + different
      body → **`409`**.
    - **Error envelope.** `{ "error": { "code": "<machine_code>", "message": "…", "details": {…} } }`
      with stable codes and correct status: `400` malformed, `401` auth, `403` scope, `404`
      not-found/cross-tenant, `409` idempotency conflict, `422` unresolvable input (e.g. bad
      `paymentRef`), `429` rate-limited, `502` upstream registry fetch failed, `504` upstream
      timeout, `500` internal.
    - **Observability.** `tracing` spans per request; Prometheus `auths_receipts_api_requests_total{route,status}`,
      `_request_latency_seconds{route}`, `_bundles_built_total`, `_verify_total{ok}` on an opt-in
      `/metrics` (mirror the gateway's `metrics_http`). **Never log request/response bodies** (they
      carry proofs/args) — log ids, verdicts, sizes, timings only.
    - **Config (env).** `RECEIPTS_API_ADDR`, `DATABASE_URL`, `RECEIPTS_API_METRICS_ADDR`,
      `RECEIPTS_API_RATE_PER_MIN`, plus the `auths-evidence` core config (registry-cache dir,
      pinned treasury/witness keys) and the API's own signing identity (`issued_by` — the bundle
      signer; reuse the tool's agent key/keychain). Single stateless binary + Postgres; scales
      horizontally behind TLS-terminating ingress.

  - **RC-E3.3.7 [greenfield] Usage & retainer billing (record + expose; never charge).** Every
    billable op writes a `usage_event` priced from the account's `price_book`
    (`dispute_evidence`, `bundle_build`, `export` billable; `verify` free/nominal). `GET /v1/usage?from=&to=`
    returns `{ byKind, includedBundles, usedBundles, overageBundles, projectedOverageCents }` for
    `retainer` accounts (used-vs-included + overage), or straight metered totals otherwise. A
    `receipts-api billing rollup` subcommand aggregates `usage_events` → a monthly `usage_rollups`
    view. **Charging is out of scope here** (custody = never): the rollup is the input to the
    market's Stripe billing (application-fee / invoice items, per `../market/monetization.md` and
    the `billing_accounts`/`settlements` tables) keyed by `api_accounts.auths_root`. This API's
    contract is: record every billable unit exactly once, expose it, and emit the rollup — the
    money movement lives in the regulated rail, not here.

  - **RC-E3.3.8 [greenfield] Python client** (`clients/python/`, package `auths-receipts-client`,
    `httpx` + `pydantic`; the enterprise stack is Python). Thin typed wrapper — one class, methods
    map 1:1 to the endpoints, `Bearer` auth, retries that honor `429 Retry-After`, and typed
    `AuthsApiError(code, message)`. `pyproject.toml`, `pip install auths-receipts-client`.

    ```python
    from auths_receipts_client import Client
    api = Client(base_url="https://receipts.auths.dev", api_key="ark_live_…")
    bundle = api.build_bundle(payment_ref="0x…", registry_url="https://…",
                              dispute_ref="chargeback-8842", idempotency_key="cb-8842-v1")
    v = api.verify(bundle)                 # -> OfflineVerdict; caller asserts v.tx == disputed_tx  (S4)
    hits = api.find_by_dispute_ref("chargeback-8842")   # the RC-E3.2 index
    pdf  = api.export(bundle.id, format="pdf")           # exhibit for the chargeback desk
    used = api.usage(from_="2026-07-01", to="2026-07-31")
    ```

  - **RC-E3.3.9 [greenfield] Tests & acceptance.** *Unit:* Argon2id key hashing + constant-time
    verify; scope enforcement; idempotency replay + `409` conflict; tenant isolation (cross-account
    id → `404`); error→status mapping; retainer math (included vs overage). *Integration (live
    Postgres, mirroring #6's suite):* the full `build → get → find-by-disputeRef → verify → export →
    usage` flow; **a bundle built via `POST /v1/bundles` verifies byte-identically to one built by
    the MCP `dispute_evidence` tool** (same core, no drift); D4 freshness present; S4 echo present.
    *HTTP threat cases:* missing/invalid/revoked key → `401`; wrong scope → `403`; cross-tenant id →
    `404`; idempotency conflict → `409`; bad `paymentRef` → `422`; registry fetch failure → `502`;
    oversized body → `413`; rate limit → `429`. *Client:* an e2e that drives the running server via
    the Python client. **Acceptance:** all endpoints served with OpenAPI at `/openapi.json`; keys
    issue/verify/revoke via the CLI; a retainer account's `/v1/usage` reconciles to its
    `usage_events`; bundles are tenant-isolated and `disputeRef`-indexed; and the API-built bundle
    equals the tool-built bundle under `verifyOffline`.

- **RC-E3.4 [greenfield + decide] `evidence_export` — meet the chargeback desk where it is.** A
  signed JSON bundle isn't ingestible by any card-network dispute process. Realistic intake is
  a PSP's dispute-evidence API (Stripe/Adyen accept structured fields + document uploads on a
  dispute object). Ship an exporter mapping an `EvidenceBundle` to (a) a generic PDF exhibit —
  `rendered` + a verification appendix with the offline-check instructions — and (b) per-PSP
  field mappings, starting with one PSP.

  **[decide]:** which PSP first, and whether card-network compelling-evidence formats (e.g.
  Visa CE 3.0's required data elements) are worth targeting directly or only via the PSP layer.
  Needs a design partner who actually files disputes — do not guess the mappings.

- **RC-E3.5 [greenfield] `ReversalDetermination` — Auths computes the repayment; the rail executes
  it.** Auths is the reversal **authority**, not the reversal **rail** — the custody stance ("we
  prove who owes what; we do not hold what is owed") extended to reversals: *we determine the
  reversal owed; the rail (Stripe / x402 / an escrow) moves the money.* A remit-violation verdict is
  the trigger; from the same signed evidence Auths re-derives **who** owes **whom**, **how much**,
  and **why**, and emits a signed, offline-re-derivable determination the rail acts on. It never
  touches funds. This is the consumer-protection "reverse / redress" mechanism the UK regulators name
  (see §"Market & regulatory signal") — expressed as a fact, not a fund movement.

  - **RC-E3.5.1 [greenfield] Trigger + basis.** The reversal is driven by the *call verdict* (§2.4),
    never by either party asserting it went wrong:

    | Verdict | Reversal owed |
    |---|---|
    | `out-of-counterparty` / `unauthorized` / `out-of-scope` / `expired` | **full** transaction — the agent exceeded its remit |
    | `over-budget` | the **overage only** (`spentBefore + cost − cap`) |
    | `authorized` | **none by remit** — the agent did exactly what it was authorised to do → route to the *subjective* track (escrow/arbitration, consumer cooling-off), never an auto-reversal |

    A within-remit call is **never** auto-reversed; only a provable remit violation is.

  - **RC-E3.5.2 [greenfield] Party resolution via the org delegation chain (the load-bearing step).**
    Reuse the `auths` **org domain** (`auths-sdk/src/domains/org`): `walk_delegation_chain` +
    `classify_authority_at_signing` resolve, from the agent that signed the call, its **principal**
    (an individual root AID **or** an org AID — both are `dip`-delegators of the same engine) and the
    **payee** (the vendor **org id**). Two rules fall out: the refund flows to the **principal, not
    the ephemeral agent** (the chain-walk is what links "agent acted" → "principal is owed"); and an
    org buyer is repaid to the **org's** settlement account, with any org-internal apportionment left
    to org policy/roles (`OrgMemberAuthority`, org `policy`). `classify_authority_at_signing` is what
    makes "exceeded authority" a fail-closed, KEL-replay fact rather than a claim.

  - **RC-E3.5.3 [greenfield] The `ReversalDetermination` type** — a signed bundle variant, anchored
    (as-of head, §2.3), S3-minimized, re-derivable by anyone (vendor, buyer, regulator; trust no one):

    ```ts
    export interface ReversalDetermination {
      version: "reversal/v1";
      suite: string;                                  // in-band, curve-tagged (§RC-E1.4)
      disputeRef?: string; disputedTx: string;        // the settlement being reversed (RC-E3.2)
      basis: { verdict: CallVerdict; asOf: AnchorRef };// WHY — the remit-violation verdict, anchored
      parties: {
        payerPrincipal: string;                       // resolved via walk_delegation_chain (individual OR org AID)
        actingAgent: string;                          // the dip that signed the call
        payeeOrg: string;                             // vendor org id
        payeeSettlementAccount: string;               // CAIP-10 / Stripe acct — where the original charge landed
      };
      amount: { cents: number; kind: "full" | "overage" | "milestone" };  // re-derived from the signed log
      direction: "payee->payerPrincipal";             // reversals only ever run this way
      railHint: "stripe.refund" | "x402.refund" | "escrow.release" | "claim-only";
      issued_by: string; signature: string;           // Auths signs; nothing here moves money
    }
    ```

  - **RC-E3.5.4 [greenfield] The `ReversalRail` port + adapters (execute *or* claim).** Same
    ports/adapters discipline as `counterpartyPolicy` and `RegistryBackend`: the core emits the
    determination; a pluggable rail **executes** it or, when it can't, **records a claim**. Auths
    never custodies — the adapter calls the rail's own API.

    | Adapter | Behavior |
    |---|---|
    | `StripeRefund` | issue a refund on the connected-account charge to the principal's funding source |
    | `X402Refund` | on-chain refund **iff** the settlement is still reversible |
    | `EscrowRelease` | release/refund a held escrow slice (RC-E4) — the clean path |
    | `ClaimOnly` | **for final/irreversible rails**: emit the determination as a *proven debt owed*, to be collected by escrow, reputation (T5), or legal enforcement |

  - **RC-E3.5.5 [greenfield] Escrow pre-hold makes it *executable*, not just *provable*.** A completed
    x402/on-chain transfer can be **final** — you cannot claw it back without the payee. So a
    reversal is cleanly executable only where a **hold** exists: a reserved/locked escrow (RC-E4), a
    Stripe auth not yet captured, or a channel with a timeout-refund. Without a pre-hold on a final
    rail, the determination degrades to `claim-only` — which is exactly why escrow is the companion
    primitive, not an afterthought.

  - **RC-E3.5.6 [greenfield] Surfaces.** MCP tool `reversal_determine` (agent-native — agent B
    computes what it is owed) **and** `POST /v1/reversals` on `receipts-api` (RC-E3.3 — the human
    chargeback desk), both over the same core. Input: a `disputeRef` or bundle + the disputed tx;
    output: the signed `ReversalDetermination` + the chosen rail adapter's execution result (or the
    recorded claim).

  - **RC-E3.5.7 Honest boundaries (do not overclaim).** (a) **Finality** — see RC-E3.5.5; on
    irreversible rails Auths produces a *claim*, not a *clawback*. (b) **Within-remit ≠ reversible** —
    "the agent did what I told it and I regret it" and service-quality disputes are **not** remit
    violations; they go to the subjective/consumer track, which Auths cannot decide unilaterally.
    (c) **The apportionment *rule* is the regulator's / the contract's** — Auths supplies the facts
    and can *encode* a given rule (e.g. "developer bears X% if the vuln was in agent software"), but
    it does not *invent* the liability rule.

  - **RC-E3.5.8 [greenfield] Tests & acceptance.** A determination re-derives to the **same amount
    and parties offline** from the signed evidence; a **within-remit** (`authorized`) call yields
    **no** auto-reversal (routes to arbitration); party resolution refunds the **principal, not the
    agent** (and an org buyer's org account); an **inflated** amount is rejected by re-derivation from
    the log; a **final-rail** case with no hold yields `claim-only`; a **held-escrow** case yields
    `escrow.release`. **Acceptance:** given a remit-violation bundle, `reversal_determine` /
    `POST /v1/reversals` returns a signed `reversal/v1` whose `amount`, `parties`, and `basis`
    any third party re-derives — and the rail adapter either executes or records a proven claim.

---

## Epic RC-E4 — T2 Non-custodial escrow & arbitration

### RC-E4.0 The custody construction — resolved here, before any code

Whether an arbiter ruling can move money *is* the design, so it's settled up front, not
parked. Two modes, chosen at `escrow_open`.

**The escrow record.** An append-only, hash-chained event sequence `r₀…r_k` (same binding
chain as §2.2), whose head is anchored on the tier available in the deployment. The opening
event `r₀` fixes immutably: the parties `B`/`S` and their **settlement addresses** (funds can
only ever move to `addr(B)` or `addr(S)`, decided here and never again); the milestone
schedule (amount `aᵢ`, delivery deadline `dᵢ`, objection window `wᵢ`, every `wᵢ` larger than
the anchor cadence so the window is decidable from heads); and optionally a named arbiter
`Arb`. Both parties sign `r₀`.

**Record custody — nobody's identity registry is touched.** Each party persists its own copy;
authoritative state is the longest head both signatures reach, plus unilateral events (a
delivery, an objection) valid once anchored. The record travels **by value or by pin
reference** — this is what kills v1's unanswered "who has write access to the issuer's
registry" question: we never ask it. **The performance study makes this non-negotiable, not
just clean:** the identity registry is a *deliberately single-writer* git backend — every
write takes an exclusive `registry.lock` held across a signed commit + CAS on one ref
(`GitRegistryBackend`), and the study measured concurrent onboarding under one root **serialize
and time out** because of it (`FINDINGS.md` §6). Writing escrow events there would inherit that
wall on every deal. So:

- **Escrow records + pins live in a concurrent store, never the git registry.** The **paid
  pinning** service and the RC-E3.2 `disputeRef` index use `auths-storage`'s **`backend-postgres`**
  (row-level concurrency, real transactions — now a **complete `RegistryBackend`** on the `auths`
  `performance` branch: CAS on `(tenant, prefix, seq)`, monotonic key-state, append-only signed
  events, **17 integration tests against live Postgres** incl. concurrent onboarding of different
  identities not serializing — no longer a stub) or an equivalent, per
  `auths/docs/plans/storage/registry-backend-decision.md`. The git registry stays the source of
  truth for *identity/delegation KELs* only; escrow and dispute state are the tools' own
  concurrent data, held outside it.
- **Pinning is the anti-withholding *liveness* guarantee, not a convenience (design D5).** The
  completeness proof (§2.2) defeats *truncation of a presented log* — but a party can simply
  **refuse to present** its copy; "each party persists its own copy" is not a liveness guarantee
  against a withholding counterparty. So the pin is the availability backstop: **pinning is
  mandatory for locked mode** (a withheld release/delivery record can strand real on-chain funds)
  and **default-on for reserved mode**. An escrow with no pin has no availability guarantee
  against a party that goes silent, and `escrow_open` must say so.
- **The pin stores bytes; the checkpoint stamps time — never cross the two (security S1).** All
  rule-track outcomes turn on *time* ("delivery anchored before `dᵢ`", "objection within `wᵢ`").
  That time basis MUST be the **anchor checkpoint's committed timestamp** (treasury / witness /
  on-chain), never the pinning service's or the tool server's clock — otherwise the pin operator
  could backdate or withhold to swing a window decision. The pin provides *availability*; the
  checkpoint provides *time*; a rule-track ruling that leaned on the pin's own clock is
  inadmissible by construction.

**The money — two modes:**

- **Reserved mode [greenfield, ships first — the Auths-native default].** The gateway payment
  channel only: a non-custodial capacity reservation whose signed spend log *is* the state. Be
  precise about what it does and doesn't guarantee — no funds are locked on-chain, so the
  seller's assurance the money exists is **reputational** (priced by T5, the reputation
  oracle), not cryptographic. What the record *does* prove is the agreed terms, the delivery,
  and the (non-)payment — i.e. it makes any later dispute cryptographically **decidable** even
  though it can't *force* settlement. Cheap, zero new audit surface, honest when labeled.
  Refund is trivial: unspent channel capacity was never the seller's; closing returns it to
  the buyer.

  **Security invariant S2 — the arbiter has zero fund-moving power in reserved mode.** Only the
  buyer's release signature settles a channel slice (RC-E4.4); an arbiter ruling here is a
  *signed opinion* that binds reputationally (feeds T5) and can move **nothing** on its own. A
  rogue or compromised arbiter must be provably unable to touch funds without the buyer's
  signature — RC-E5.2 (row 18) asserts it. (In locked mode the arbiter's power is bounded
  instead by the contract's fixed spend paths, below.)

- **Locked mode [deferred — `[decide]`, and a real ethos departure].** A minimal on-chain
  escrow contract `E` holding `Σ aᵢ` with **exactly three spend paths, fixed destinations, no
  admin, no upgrade**: (1) **co-signed** by `B`+`S`; (2) **arbitrated** by `Arb`+*either
  party*, moving only scheduled `aᵢ` to the two fixed addresses; (3) **timeout** refund to
  `addr(B)` after a final `T_end`. The trust bounds, stated as what each coalition can take:
  `Arb` alone moves **nothing**; `Arb+S` can at worst release scheduled amounts to `S` (what
  `B` chose to put at risk); `Arb+B` can at worst refund to `B` (what `S` risks by delivering
  early); no coalition can reach a third address, ever. That is the precise sense in which
  "non-custodial" survives an arbiter — and it must be quoted verbatim in the docs, because
  "non-custodial arbitration" without these bounds is marketing.

  > **Flagged loudly:** a custom on-chain contract is the **single biggest departure from the
  > Auths ethos** in this whole program — Auths has *no* bespoke contracts today; x402 settles
  > over existing USDC + facilitator, and the trust layer is "just git and cryptography." So
  > locked mode does **not** ship until: a contract audit is budgeted, target network(s) are
  > chosen, and **counsel reviews the money-transmitter posture** of operating `Arb` keys and
  > the pinning service. Reserved mode raises none of these and is why it ships first. We may
  > find reserved-mode reputational binding is enough for the market's real deal sizes and
  > never build `E` at all — that's the preferred outcome.

**Deterministic rules vs arbitration — kept separate** (v1 conflated a timeout rule with
"arbitration," muddying both legal exposure and the product story):

- *Rule-based outcomes* are total functions of anchored facts, offline-checkable per §2.3:
  **releasable-by-rule(i)** = a delivery for `i` anchored before `dᵢ`, and a later head (≥
  delivery + `wᵢ`) whose committed record contains no objection to `i` (the anchored-absence
  proof); **refundable-by-rule(i)** = a head (≥ `dᵢ`) whose record contains no delivery for
  `i`. These are your strength — deterministic, automatic, cheap.
- *Arbitration proper* fires only when `B` objected within `wᵢ` — a genuinely subjective
  dispute. `Arb` reads only signed facts and issues a **signed ruling that is itself an
  `EvidenceBundle`** (re-derivable inputs, stated reasoning, anchored). In locked mode `Arb`
  co-signs path 2 with the winner; in reserved mode the ruling binds reputationally and feeds
  T5. In both, `Arb`'s rule-track signatures are re-derivable by anyone, so signing without the
  proof is publicly demonstrable and reputation-fatal — `Arb` exercises judgment *only* on the
  objected branch, and there we never fabricate a decision, we *record* the named arbiter's.

### The tool calls

- **RC-E4.1 [greenfield] `escrow_open`.** Validate the schedule (`wᵢ` > anchor cadence,
  `T_end` after every `dᵢ + wᵢ`), collect both signatures over `r₀`, open the channel
  (reserved) or return funding instructions for `E` (locked), anchor the head, return the
  record.

  ```ts
  server.tool("escrow_open", OpenInput, async ({ buyer, seller, arbiter, mode, milestones, sigs }) => {
    const r0 = validateAndSeal({ buyer, seller, arbiter, mode, milestones, sigs });
    const funding = mode === "reserved"
      ? await openChannel({ seller, capacity: total(milestones), rail: "x402" })
      : fundingInstructions(r0);              // deploy/reference E, expected deposit
    const record = await anchorHead(appendEvent(newRecord(), r0));
    return { content: [{ type: "text", text: JSON.stringify({ record, funding }) }] };
  });
  ```

- **RC-E4.2 [greenfield] `escrow_milestone` — signed delivery proof.** The seller appends
  `sig_S(deliver, i, evidenceHash)`; validate signer, append, anchor. The tool records the
  seller's signed claim + evidence hash — it never judges delivery quality. Custody of proof,
  not adjudication of merit; merit is contested in the objection window.

- **RC-E4.3 [greenfield] `escrow_object` — the buyer's half of the window.** New in v2 (v1 had
  a `buyerObjection` field with no way to create one). The buyer appends `sig_B(object, i,
  reasonHash)`, valid only if anchored within `wᵢ` of the delivery. An objection converts
  milestone `i` from rule-track to arbitration-track.

- **RC-E4.4 [greenfield] `escrow_release` — buyer-signed happy path.** The buyer signs release
  for `i`; reserved settles the channel slice on-chain to the seller, locked co-signs path 1.
  The settlement tx lands in the record as the milestone's proof (same `charge_ref` pattern as
  the merchant loop). The 95% path — no arbiter, no rules, just agreement.

- **RC-E4.5 [greenfield] `escrow_arbitrate` — rules first, judgment only when unavoidable.**
  Compute the rule-track outcome from anchored facts; only an *objected* milestone reaches the
  subjective branch, where the endpoint *records* the named arbiter's signed decision — never
  fabricates one.

  ```ts
  server.tool("escrow_arbitrate", ArbitrateInput, async ({ record, index }) => {
    const rec = verifyEscrowRecord(record);        // by value or pin — no registry reads
    const m = rec.milestones[index];
    const ruling =
      releasableByRule(rec, index)   ? { outcome: "release", to: rec.seller, reason: "delivered; no objection anchored in window" }
      : refundableByRule(rec, index) ? { outcome: "refund",  to: rec.buyer,  reason: "no delivery anchored by deadline" }
      : m.objection                  ? await recordNamedArbiterRuling(rec, index)
      : { outcome: "hold", reason: "window still open" };
    const bundle = signArbiter({ escrowId: rec.id, index, ...ruling, proof: ruleProof(rec, index) });
    if (ruling.outcome === "release" || ruling.outcome === "refund") await executeRuling(rec, index, ruling);
    return { content: [{ type: "text", text: JSON.stringify(bundle) }] };
  });
  ```

---

## Epic RC-E5 — List, meter, and prove it live

- **RC-E5.1 [greenfield] Wrap and list both servers.** List the **bare** downstream (the market
  and every buyer run their own `wrap`; an `endpointValue` that embeds `wrap` is *rejected* by
  `listing-input.ts`). The downstream is a **Rust binary** built from the `auths-receipts` crate,
  not a Node launcher. `--rail x402 --test-mode` (base-sepolia) until mainnet cutover. **What the
  market's prober actually gates on** (verified against `apps/market/src/lib/prober.ts` — do not
  assume more): (a) `initialize` → `tools/list` must serve **every listed tool** [HARD]; and (c)
  the published `spend_log_url` must be **reachable** [HARD — an *empty* log still passes]. That is
  the entire `pending → live` gate: the prober does **not** re-derive price, does **not** measure
  latency, and does **not** set proven-live. Earning the **proven-live** badge is a *separate* gate
  owned by the receipts worker (**RC-E5.4**) and turns on a re-derivable published log with `> 0`
  settled cents — **not** on the advertised `price_cents`, which nothing in the market verifies
  today. Price the tools sensibly, but do **not** design around a price-proving/latency-gating
  prober that does not exist.

  ```bash
  auths-mcp wrap --scope receipts.build --scope receipts.verify --scope dispute.evidence \
    --budget '$5'  --rail x402 --test-mode -- auths-receipts-server

  auths-mcp wrap --scope escrow.open --scope escrow.release --scope escrow.arbitrate \
    --budget '$50' --rail x402 --test-mode -- auths-escrow-server
  # (a third-party tool from auths-tool-template would instead be `-- python server.py`)
  ```

- **RC-E5.2 [greenfield] Hermetic e2e — a threat model, not a smoke test.** A frozen transcript
  drives both servers with no network and no chain (`replay`, mirroring
  `tests/e2e/test_mcp_spend_log_audit.py`). Asserts at minimum:

  | # | Attack / scenario | Expected |
  |---|---|---|
  | 1 | Clean deal | `authorized` (call), `consistent` (log), as-of head |
  | 2 | One byte flipped in an embedded KEL event | `tampered` |
  | 3 | **Truncated spend log** (last 2 records withheld), same anchor | `head-mismatch` |
  | 4 | **Stale-head attack** — old treasury checkpoint that predates over-budget calls | `head-mismatch` / anchor rejected |
  | 4b | **Concurrent-producer chain fork** — an agent pipelines N concurrent calls; re-derive its own log (`auths-site/tests/performance/scenarios/chain.mjs`) | one linear chain, `consistent`, `rederived == N` — regression for the §2.2(a) fix (pre-fix: `0/1`) |
  | 5 | Bundle whose stated verdict ≠ recomputed verdict | `tampered` |
  | 6 | Call exceeding remaining budget | `over-budget` |
  | 7 | Revocation recorded **before** the head (in-KEL event) | `unauthorized` |
  | 8 | Revocation recorded **after** the head | `authorized` as-of head; online re-check flags |
  | 8b | **TEL/attestation revocation before H that moves no KEL tip** (§2.2(c)) | `unauthorized` — anchor covers the revocation surface, not just the KEL |
  | 9 | Registry substitution (right agent, wrong root's registry) | `unauthorized` |
  | 10 | Forged treasury checkpoint (wrong signer key) | `anchor-unverifiable` |
  | 11 | Milestone delivery signed by a non-seller key | append rejected |
  | 12 | Objection anchored outside `wᵢ` | ignored by rule; milestone releasable |
  | 13 | `escrow_arbitrate` on a non-existent milestone | input error, no ruling |
  | 14 | Undelivered milestone past `dᵢ` | `refund` by rule, with anchored-absence proof |
  | 15 | Release signature replayed against a different milestone index | rejected (index is signed) |
  | 16 | **Gate-verdict vs offline re-derivation mismatch** (D1) — recorded `granted`, settled-only re-derivation says `over-budget` | `unverifiable` (flagged reconciliation); recorded verdict never silently overridden |
  | 17 | **Cross-rail budget** (D2) — cap spent across two rails/currencies | re-derived via `verify-spend`'s cross-rail counter, not `Σcost`; correct verdict |
  | 18 | **Arbiter moves funds in reserved mode without a buyer release sig** (S2) | rejected — arbiter ruling binds reputation only |
  | 19 | **Wrong-call binding** (S4) — a valid bundle for call `X` submitted as evidence for call `Y` | caller binding check fails on `subject`/`tx`/`index` mismatch |
  | 20 | **Injection redirect under `AllowList`** — a poisoned agent, in-scope + under cap, is steered to pay a counterparty **not** on the grant's allow-list | `out-of-counterparty` — refused live, re-derives identically offline (the port enforces; the grant binds the policy) |
  | 21 | **Policy downgrade** — the gateway operator swaps the counterparty adapter to `AllowAll` at runtime to bypass an `AllowList` grant | rejected — the policy is signed into the grant, so the off-list call still re-derives `out-of-counterparty`; loosening needs the principal's signature |
  | 22 | **Reversal of a within-remit call** (RC-E3.5) — a `ReversalDetermination` filed against an `authorized` call | rejected — no reversal owed by remit; routed to the subjective/arbitration track, never auto-reversed |
  | 23 | **Inflated reversal amount** (RC-E3.5) — a determination claims more than the disputed tx / overage | rejected — `amount` re-derives from the signed spend log; the refund flows to the resolved **principal**, not the acting agent |

- **RC-E5.3 [greenfield] The launch demo.** One script: verify a counterparty → pay →
  `receipt_build` → open an escrow → deliver → object → `escrow_arbitrate` rules → every step's
  tx printed as a `sepolia.basescan.org/tx/…` link, plus the signed bundles, plus **the
  truncation attack run live and caught**. Reuse `tests/e2e/live-onchain-fleet.mjs` plumbing for
  the on-chain legs. The truncation catch is the money shot — it demonstrates the
  anchored-completeness property no log-based competitor has.

- **RC-E5.4 [greenfield] Marketplace listing readiness — the publishing surface `apps/market`
  actually requires.** The market is a **pull-based index**: it never meters, never ingests pushed
  receipts, never proxies payment. It clones *our published* log + registry and re-derives with
  `verify-spend`. So a live, **proven-live** listing needs a publishing workstream the rest of this
  plan does not cover (verified against `apps/market`; cite `src/lib/prober.ts`,
  `src/lib/receipts-worker.ts`, `src/lib/listing-input.ts`):

  1. **Build + publish the signed aggregate `activity/v1` attestation** — **the publishing model,
     and a first-class deliverable of this build.** Do **not** publish the raw per-call `spend.jsonl`
     (it exposes the **counterparty graph**). Instead publish a signed aggregate
     `{head, count, cumulative_cents, as_of}`, and earn proven-live from market-witnessed monotone
     growth (`> 0` cents in 90 days). This has a **producer** side (an `auths-mcp export-attestation`
     command that re-derives the local private log and emits the signed attestation) and a
     **verifier** side (the `apps/market` receipts-worker/prober attestation path). Build both per
     the full design in
     [`../storage/spend-attestation-privacy.md`](../storage/spend-attestation-privacy.md) — that
     spec's "Changes required" and "Acceptance" sections are part of *this* build, not a follow-on.
     The per-call log stays private and is disclosed only point-to-point in an `EvidenceBundle`.
  2. **Publish a sibling `audit.json`** = `{registry_git_url, root, agent}` — now for **identity/key
     resolution only** (the market resolves our root from the public KEL to verify the attestation
     signature), *not* to fetch a spend log.
  3. **Publish the auths registry at a public git URL** (`registry_git_url`) exposing `refs/auths/*`
     — the **identity KEL only**, so the market can resolve keys and check the attestation's
     signature. The spend log is **not** among what's published; it never leaves our infra.
  4. **Seed `> 0` real settled cents** — proven-live requires actual settled volume through our own
     `wrap` (test-mode is fine), witnessed by the market across probes. RC-E5.3's demo run is the
     natural seeding path.
  5. **Register a seller identity to list** — GitHub OAuth (v0), or — to earn the top
     *auths-verified seller* badge — the auths-native agent presentation carrying a `market:sell`
     capability (`src/lib/auth/auths-native.ts`). First-party tools list under our own account.

  The submitted `endpointValue` is the **bare** server command (`auths-receipts-server`), never the
  `wrap` line from RC-E5.1 (which is only our local test / seeding harness). Deliverable: a
  `list-readiness` script that stands up (1)–(4) for both servers plus a checklist for (5), so a
  listing moves `pending → live → proven-live` deterministically — against the **attestation** path,
  never the raw log.

---

## Open questions (owner decisions)

The v1 questions that were actually design decisions (custody mechanism, statelessness,
registry writes) are resolved above and removed.

- **[decide] Default anchor tier & cadence (§2.2, RC-E1.5).** Which tier is the default when
  more than one is available, the treasury/witness checkpoint cadence, and the pricing of a
  per-settlement anchor vs a batched one. Engineering constraint: every escrow `wᵢ` must exceed
  the cadence. Reserved mode + treasury checkpoint covers the fleet case with **zero new
  infra**; the solo-no-witness case is where on-chain anchoring earns its keep. **(D3) The
  cadence is now a measured latency SLA, not just a default** — benchmark the treasury/witness
  checkpoint cadence and publish the minimum escrow window it implies (§2.2); the *tier default*
  remains the open decision, but the *cadence-as-SLA* is settled.
- **[decide] Locked-mode contract & counsel (RC-E4.0).** Audit budget for `E`, target
  network(s), and a money-transmitter review of operating arbiter keys + the pinning service —
  *before* locked mode ships. Reserved mode does not wait on this, and may make `E` unnecessary.
- **[decide] Arbiter sourcing.** Named-at-open is the mechanism; supply is the question.
  Recommend: auths-operated arbiter for the **rule track only** (zero judgment, publicly
  re-derivable, so we stay checkable), a third-party arbiter required for the subjective track
  from day one — we should never be the trusted human judge.
- **[decide] First PSP for `evidence_export` (RC-E3.4)** and whether to chase card-network
  formats directly. Needs a design partner who files real disputes.
- **[decide] Pricing.** `receipt_build` ~$0.02–0.10 · `dispute_evidence` + the HTTP retainer far
  higher · escrow bps-on-volume + arbitration fee — calibrate to the observed ~$0.86 average
  settlement and to the RC-E1.3 cost basis (cache-hit-rate × clone-cost is the margin).
- **[decide] The market does not verify `price_cents` — do we want it to?** Neither the prober nor
  the receipts worker compares the advertised price to the settled amount (proven-live checks only
  `cents > 0`), so a listing's price is currently unproven. If price integrity matters for the
  trust story, it is an **`apps/market` change** (have the receipts worker assert re-derived
  per-call cost == `price_cents`), not something this repo can enforce alone. Decide whether to
  file it against the market.
- **[decide] The market's billing surface is schema-only — RC-E3.3's revenue has no plumbing yet.**
  `settlements` / `usage_rollups` / `billing_accounts` tables exist in `apps/market` but no code
  populates them, and the prober's advertised "re-derives your price" copy overstates what runs.
  RC-E3.3 (the retainer/fee revenue) therefore depends on **market work outside this repo**;
  sequence that dependency or descope RC-E3.3's monetization claims until it lands.

## Sequencing

1. **RC-E1** scaffold, `verifySpend` napi binding, `resolveChain` with the cache,
   `EvidenceBundle` **including the anchor** — anchoring changes the wire type, so it cannot be
   retrofitted after anything ships.
2. **RC-E2** `receipt_build` / `receipt_verify` with split verdicts — list T1, prove offline
   verify *and the truncation catch*.
3. **RC-E3** `dispute_evidence`, the `disputeRef` upstream field, the HTTP retainer surface —
   the moat items.
4. **RC-E4** escrow, **reserved mode only**: open / milestone / object / release, then
   rule-track arbitrate. Locked mode follows the contract-audit + counsel decision.
5. **RC-E5** listings, the threat-model gate, the live demo, and **marketplace listing readiness
   (RC-E5.4)** — publish the signed `activity/v1` **attestation** (not the raw log — see
   [`../storage/spend-attestation-privacy.md`](../storage/spend-attestation-privacy.md)) +
   `audit.json` + the identity registry, and seed traffic so a listing reaches `proven-live`, not
   just `live`.

---

## What done looks like

Not "code written" — **shipped, listed, and independently verifiable by a stranger.** Three gates:

1. **A new `auths` release is cut and published.** The trust core `auths-evidence` (`resolveChain`,
   `judgeCall`/`judgeLog`, `EvidenceBundle` build/verify, `verify_spend`), the `receipts-api` bin,
   the RC-E3.2 `disputeRef` field, and the `auths-mcp export-attestation` producer (RC-E5.4 /
   [`../storage/spend-attestation-privacy.md`](../storage/spend-attestation-privacy.md)) are all on a
   tagged release, cut via the standard flow in
   [`auths/scripts/releases`](../../../../auths/scripts/releases): `just release-versions` (sync the
   workspace version across crates / npm / PyPI) → `just release-github` (push the **agent-signed**
   `v{version}` tag, which fans out to `release.yml` binaries + Homebrew, `publish-crates.yml`
   crates.io, `publish-node.yml` `@auths-dev/sdk`, `publish-python.yml` `auths` on PyPI). **Check:**
   `env -u AUTHS_HOME -u AUTHS_REPO auths verify v{version}` passes and `cargo install auths` /
   `pip install auths` / `npm i @auths-dev/sdk` resolve the new version.

2. **A new `auths-mcp` release is cut and published.** The `@auths-dev/mcp` gateway carrying
   `wrap --dispute-ref` (RC-E3.2) and the attestation/receipt support is published to npm, so the
   market prober's `npx -y @auths-dev/mcp` and every buyer's `wrap` pull the version that produces
   disputeRef-stamped receipts and the `activity/v1` attestation. **Check:** a clean
   `npx -y @auths-dev/mcp@latest wrap …` yields a signed receipt with `dispute_ref` set and an
   `export-attestation` the market accepts.

3. **`auths-receipts` is a full, working, `proven-live` listing on `apps/market`.** End to end:
   - the bare `auths-receipts-server` / `auths-escrow-server` pass the prober's `tools/list` (every
     listed tool served) → the listing goes `live`;
   - the listing publishes a signed **`activity/v1` attestation** (never a raw log), and the market's
     attestation path re-checks it — signature chains to our root, **witnessed monotone growth
     `> 0` in 90 days** → `live_proven_at` set — with the **counterparty graph never published**;
   - real settled cents exist from the RC-E5.3 demo run (seeded), witnessed across probes;
   - a buyer copies the market's `wrap` snippet, calls `receipt_build` / `dispute_evidence`, and gets
     a bundle that `receipt_verify` **and** the RC-E3.3 `POST /v1/verify` re-check **offline**;
   - the RC-E5.3 launch demo runs live — on-chain tx links + the **truncation-caught** money shot.

   **Done = a stranger can install the tools from the releases, buy the listed tool on
   market.auths.dev, and independently verify the bundle offline — while no per-call log or
   counterparty graph is ever published.**
