# `auths-reputation` — Counterparty Verifier & Reputation Oracle

**Portfolio 3 — Decentralized identity & reputation.** The flywheel. Agent
identity/reputation is a **critical shortage** on x402 and a **$40M+ funded category** off it
(Skyfire KYA and peers) — but every funded incumbent is a *centralized registry you must
trust*. This portfolio — the **`crates/auths-reputation`** crate in the `auths` monorepo, a
sibling sharing the same `auths-evidence` ([`auths-receipts.md`](./auths-receipts.md) §0) —
ships the opposite: a metered oracle that answers "is this agent real, and does it pay its
bills?" **from signatures anyone can re-derive**, using the one thing no reseller and no
pure-identity registry has — *both* the identity graph *and* the settlement history. Every
settlement on the market makes the oracle better, which makes the market safer to trade in,
which drives more settlement. That's the flywheel.

> **Read first:**
> - `/Users/bordumb/workspace/repositories/auths-base/auths/CLAUDE.md`
> - The identity surface: `packages/auths-node/index.d.ts` → `getPinnedIdentity`, `listPinnedIdentities`, `authenticatePresentation`; the registry KEL walk in `auths-sdk`
> - The settlement history source: the same signed spend logs `verify-spend` re-derives
> - [`seed-tools.md`](./seed-tools.md) (T5 framing) · [`../market/monetization.md`](../market/monetization.md)

Status codes: **[greenfield]** · **[extend: auths]** · **[decide]**.

---

## 1 · What this portfolio ships  ·  crate `crates/auths-reputation`

| Tool | MCP tools exposed | One-liner |
|---|---|---|
| **T5 Reputation** | `counterparty.verify`, `counterparty.history`, `counterparty.score` | Given an agent DID: is it real & non-revoked, what root does it chain to, what was it delegated, and — from our ledger + on-chain — its settlement history (pays / disputes / defaults). |

**Architecture.** Same as Portfolio 1 (`auths-receipts.md` §0): a **Rust first-party server**
(`crates/auths-reputation`) embedding `auths-evidence` in-process, wrapped by `@auths-dev/mcp`
and metered on x402. Two data sources, both re-derivable: the **identity graph** (delegation
KELs in the issuer registry) and the **settlement history** (the agent-signed spend logs +
on-chain settlements). The oracle joins
them. Critically, the answer is *evidence-backed*: every response can be re-checked with
`@auths-dev/verifier` and `verify-spend` — the caller trusts no oracle, only math.

```
buyer ── counterparty.verify{did} ──▶ wrap(meter) ──▶ oracle
                                                        ├─ identity graph  (registry delegation KEL)
                                                        └─ settlement history (signed spend logs + on-chain)
                                                        ▼
                             signed ReputationReport {real, root, grants, history, score, proof}
```

---

## Epic RP-E1 — Scaffold & the identity resolver

- **RP-E1.1 [greenfield] Scaffold.** Same pnpm workspace shape as the other portfolio repos; one
  server package + core + e2e.

  **For the human:** nothing novel in the scaffold — copy `auths-receipts`. The interesting code is
  the resolver and the join.

- **RP-E1.2 [greenfield] `resolveIdentity(did)` — real, non-revoked, and to which root.** Resolve
  an agent DID against the registry: does it exist, is it revoked, what root does its delegation
  chain terminate at, and what capabilities was it granted?

  **For the human:** this is a KEL walk you can drive through the SDK — `getPinnedIdentity` gives
  you the pinned record; validate the delegation chain up to a root. The output must state the root
  explicitly (the `subjectRoot` discipline — the caller acts on the field, never parses the KEL).
  Return `unresolvable` rather than throwing so the oracle can still answer "we have never seen
  this agent," which is itself valuable.

  ```ts
  import { getPinnedIdentity } from "@auths-dev/sdk";
  export function resolveIdentity(did: string, registry: string): Identity {
    const pinned = getPinnedIdentity(did, registry);
    if (!pinned) return { status: "unknown", did };
    if (pinned.revoked) return { status: "revoked", did, root: pinned.root, revokedAt: pinned.revokedAt };
    return {
      status: "active", did, root: pinned.root,
      grants: pinned.delegatedCapabilities,   // what it was authorized to do
      chainDepth: pinned.chainDepth,           // how far from the root
    };
  }
  ```

---

## Epic RP-E2 — `counterparty.verify` & `counterparty.history`

- **RP-E2.1 [greenfield] `counterparty.verify` — the cheap, high-frequency call.** The identity
  half: real & non-revoked, root, grants. This is what an agent calls *before* it trades with a
  stranger.

  **For the human:** keep this call cheap and fast — it's the pre-trade gate, called constantly.
  Return the verdict plus the minimal proof needed to re-check it offline (the delegation events).
  A revoked or unknown counterparty is a *result*, not an error — the buyer wants to know.

  ```ts
  server.tool("counterparty.verify", VerifyInput, async ({ did, registryUrl }) => {
    const id = resolveIdentity(did, registryUrl);
    const report = signReport({
      did, status: id.status, root: id.root, grants: id.grants,
      proof: id.status === "unknown" ? undefined : delegationProof(did, registryUrl), // offline-checkable
    });
    return { content: [{ type: "text", text: JSON.stringify(report) }] };
  });
  ```

- **RP-E2.2 [greenfield] `counterparty.history` — the moat call.** The settlement half: from our
  ledger + on-chain, how much has this agent settled, over what period, with how many distinct
  counterparties, and — the number that matters — any disputes or defaults (from `auths-receipts`
  arbitration rulings).

  **For the human:** this is the thing no reseller can build, because it requires *both* the signed
  identity graph and the signed settlement logs, which only the market operator holds together.
  Re-derive spend history the same way `audit.spend` does (`generateAuditReport`), then join
  dispute outcomes from any `escrow.arbitrate` rulings against this agent. Every figure ships with
  the `logHash` / tx refs it came from.

  ```ts
  server.tool("counterparty.history", HistoryInput, async ({ did, registryUrl, since }) => {
    const spend = deriveSettlementHistory(did, registryUrl, since);   // signed logs + on-chain tx
    const disputes = loadArbitrationRulings(did, registryUrl);        // from auths-receipts T2
    const report = signReport({
      did,
      settled: spend.total, settlements: spend.count,
      distinctCounterparties: spend.distinct,
      disputes: disputes.filter(d => d.outcome === "refund" && d.against === did).length,
      defaults: spend.channelDefaults,
      proof: { logHash: spend.logHash, txRefs: spend.txRefs },        // checkable
    });
    return { content: [{ type: "text", text: JSON.stringify(report) }] };
  });
  ```

---

## Epic RP-E3 — `counterparty.score` (the composed answer)

- **RP-E3.1 [greenfield] `counterparty.score` — one call, the full picture.** Compose verify +
  history into a single evidence-backed answer with a transparent, explainable score — *is this
  agent real **and** does it pay its bills?*

  **For the human:** the score must be a *deterministic, documented* function of the evidence — not
  an opaque number. Publish the formula. A score of 0 for an unknown agent is honest; a high score
  requires a real settlement track record with no defaults. The buyer can recompute the score from
  the report's evidence, which is the whole point — the score is a convenience, the evidence is the
  truth.

  ```ts
  server.tool("counterparty.score", ScoreInput, async ({ did, registryUrl }) => {
    const id = resolveIdentity(did, registryUrl);
    if (id.status !== "active") return signedResult({ did, score: 0, reason: id.status });
    const h = deriveSettlementHistory(did, registryUrl);
    const score = scoreOf({ status: id.status, settled: h.total, disputes: h.disputes, defaults: h.channelDefaults });
    return { content: [{ type: "text", text: JSON.stringify(signReport({ did, score, formula: SCORE_FORMULA_V1, evidence: h.proof })) }] };
  });

  // Documented, recomputable — never a black box.
  export function scoreOf(x: Signals): number {
    let s = 50;                                   // baseline for a real, active, non-revoked agent
    s += Math.min(30, Math.log10(1 + usd(x.settled)) * 10);  // track record, diminishing
    s -= x.disputes * 15;                         // lost disputes hurt
    s -= x.defaults * 25;                         // channel defaults hurt more
    return clamp(s, 0, 100);
  }
  ```

- **RP-E3.2 [extend: auths] Feed the flywheel — emit a reputation-relevant event on settle.** So
  history stays fresh without an expensive full re-derive per query, the gateway should make it
  cheap to enumerate an agent's settlements (an index over the signed logs). Small, optional
  read-side helper upstream.

  **For the human:** don't change what's authoritative — the signed log stays the source of truth.
  Just add a read index so `counterparty.history` doesn't re-walk everything each call. Keep it
  derivable-and-throwaway (rebuildable from the logs), never a second source of truth.

---

## Epic RP-E4 — List, meter, prove & the interop question

- **RP-E4.1 [greenfield] Wrap & list.**

  ```bash
  auths-mcp wrap --scope counterparty.verify --scope counterparty.history --scope counterparty.score \
    --budget '$5' --rail x402 --test-mode -- auths-reputation-server   # Rust bin (in-process)
  ```

- **RP-E4.2 [greenfield] Hermetic gate.** Freeze a transcript with three synthetic agents: a real
  active agent with a clean settlement history → high score; a revoked agent → score 0, reason
  `revoked`; an agent with a lost dispute → depressed score. Assert each report re-verifies offline.

  **For the human:** build the fixtures from real delegation + spend-log artifacts (reuse the
  merchant-loop fixtures), then `replay`. Assert the score matches the published formula exactly —
  a stranger recomputing it must land on the same number.

- **RP-E4.3 [decide] Skyfire/KYA interop.** Optionally verify a Skyfire-issued KYA credential
  alongside a native DID, so a buyer gets one answer whether the counterparty is native or KYA. But
  our story is "no registry required," so native-first.

  **For the human:** if we do this, treat a KYA credential as *one more piece of evidence*, clearly
  labelled as "attested by Skyfire (trusted third party)" and never conflated with the re-derivable
  native chain. The report should always distinguish "proven from signatures" from "attested by a
  registry." Recommend shipping native-only first and adding interop only if buyers ask.

- **RP-E4.4 [greenfield] The flywheel demo.** A script: agent A has no history → low score →
  A does N clean settlements on the market → re-query → score climbs, every settlement cited by tx
  hash. This is the visible proof that *using the market builds the reputation the market runs on*.

---

## Open questions (owner decisions)

- **[decide] Positioning vs Skyfire (RP-E4.3).** Native-first, interop-later (recommended) vs
  interop from day one. The whole wedge is "you don't have to trust a registry," so lead native.
- **[decide] Score formula governance.** Who owns `SCORE_FORMULA_V1`, and how do we version it so a
  score is reproducible against the formula that produced it? Recommend: version pinned *in the
  report*, formula published, changes are new versions never silent edits.
- **[decide] Privacy.** Settlement history is sensitive. Do we expose per-counterparty detail or
  only aggregates (total settled, dispute count, distinct counterparties)? Recommend aggregates by
  default, detail only to a party that can prove it transacted with the subject.
- **[decide] Pricing.** `counterparty.verify ~$0.005–0.01` (high frequency), `history`/`score`
  higher, enterprise bulk tier. Strategically underprice `verify` to drive adoption — it lifts all
  market volume.

## Sequencing

1. **RP-E1** scaffold + `resolveIdentity`.
2. **RP-E2** `counterparty.verify` (cheap gate) → `counterparty.history` (the moat).
3. **RP-E3** `counterparty.score` (composed, transparent formula) + the read index upstream.
4. **RP-E4** list, hermetic gate, flywheel demo; decide interop last.
