# `auths-compliance` — Sanctions/AML Screening & Spend-Policy Audit

**Portfolio 2 — Compliance & risk.** The nearly-empty-but-already-paying category: wallet
sanctions screening is *already* selling on x402 at ~$0.002/check, and "did we just pay a
sanctioned entity / spend outside policy?" becomes a per-transaction requirement the moment
agents transact autonomously. This portfolio — the **`crates/auths-compliance`** crate in the
`auths` monorepo, a sibling of Portfolio 1 sharing the same `auths-evidence` (see
[`auths-receipts.md`](./auths-receipts.md) §0 for the file-system + tooling decision) — ships
two auths-operated MCP tools that bind screening and audit to a **verifiable identity** and emit
a **re-derivable receipt**, so the *proof of having screened* is itself auditable, which no
data-reseller can offer.

> **Read first:**
> - `/Users/bordumb/workspace/repositories/auths-base/auths/CLAUDE.md`
> - The napi you'll lean on hardest: `packages/auths-node/index.d.ts` → `generateAuditReport`, `evaluatePolicy`, `compilePolicy`, `authenticatePresentation`
> - The existing compliance-as-query work upstream (fn-157) that T4 productizes
> - [`seed-tools.md`](./seed-tools.md) (T3/T4 framing) · [`../market/monetization.md`](../market/monetization.md)

Status codes: **[greenfield]** · **[extend: auths]** · **[decide]**.

---

## 1 · What this portfolio ships  ·  crate `crates/auths-compliance`

| Tool | MCP tools exposed | One-liner |
|---|---|---|
| **T3 Screening** | `compliance.screen`, `compliance.receipt` | Screen an agent DID and/or wallet/counterparty against sanctions/AML + policy flags; return a signed screening receipt an operator retains for audit. |
| **T4 Audit** | `audit.spend`, `audit.policy`, `audit.anomaly` | Metered queries over an agent's/fleet's settlement history, each answer re-derived from signed logs — not a mirror table. |

**Architecture.** Same as Portfolio 1 (`auths-receipts.md` §0): a **Rust portfolio crate**
(`crates/auths-compliance`) in the monorepo, first-party servers embedding `auths-evidence`
in-process, wrapped by `@auths-dev/mcp` and metered on x402; the Python-first
`auths-tool-template` is the third-party on-ramp. T3 wraps a third-party sanctions/AML data
provider *behind* our identity + receipt layer — the value we add is not the list, it's binding
the answer to a verifiable agent identity and emitting a signature the operator can prove later.
T4 is a thin,
metered surface over `generateAuditReport`, which already re-derives spend from signed logs.

```
agent ── compliance.screen{agentDid,wallet} ──▶ wrap(meter) ──▶ server: provider lookup + identity bind
                                                                   │
                                              signed ScreeningReceipt (offline-verifiable)
```

---

## Epic CO-E1 — Scaffold & the provider abstraction

- **CO-E1.1 [greenfield] Scaffold + provider port.** Same pnpm workspace shape as
  `auths-receipts`. The one design decision that matters here: a **provider port** so the
  sanctions/AML data source is swappable (and so we can resell OR pass-through — an open
  question below). Never call a provider SDK directly from tool code.

  **For the human:** define a narrow `ScreeningProvider` interface and put every vendor behind
  it. This keeps the vendor decision reversible and keeps our differentiator (identity binding +
  receipts) in *our* code, not tangled into a vendor SDK. Ship a `MockProvider` for the hermetic
  gate so CI never calls a paid API.

  ```ts
  // Shape only — real impl in crates/auths-compliance (Rust); the ScreeningProvider port is compliance-specific, not in auths-evidence
  export interface ScreeningProvider {
    screenWallet(address: string, chain: string): Promise<ProviderHit[]>;   // sanctions/AML lists
    screenEntity(name: string, jurisdiction?: string): Promise<ProviderHit[]>;
    readonly sourceId: string;   // e.g. "chainalysis" | "ofac-sdn" | "mock" — recorded in the receipt
  }
  export interface ProviderHit { list: string; matchScore: number; detail: string; }
  ```

- **CO-E1.2 [greenfield] Bind the query to a verified identity.** Before screening, resolve *who
  is asking* and *what they're asking about* to real Auths identities where DIDs are involved —
  a screen tied to an unverified string is worth little in an audit.

  **For the human:** if the caller passes an agent DID, verify it resolves and is non-revoked
  (via the reputation resolver in `auths-reputation`, or directly against the registry) before you
  spend a provider call on it. Record *both* the subject identity and the caller identity on the
  receipt — an auditor asks "who screened whom," and the receipt should answer without a lookup.

  ```ts
  export async function boundSubject(input: ScreenInput): Promise<Subject> {
    if (input.agentDid) {
      const id = resolvePinned(input.agentDid, input.registryUrl); // must exist + not revoked
      if (!id || id.revoked) throw new ComplianceError("unresolvable-subject", input.agentDid);
      return { kind: "agent", did: input.agentDid, root: id.root };
    }
    return { kind: "wallet", address: requireAddress(input.wallet) };
  }
  ```

---

## Epic CO-E2 — T3 Screening server & the screening receipt

- **CO-E2.1 [greenfield] `compliance.screen`.** The metered call: resolve the subject, run the
  provider, classify, and return a decision plus a signed receipt in one shot.

  **For the human:** the decision is ours to compute (`clear / flagged / blocked`), from the
  provider's hits plus policy thresholds — the caller must not have to interpret raw hits (same
  "report is the only API" discipline). The receipt is what makes this defensible later: it
  proves the operator *did* screen, against *which source*, at *what time*, and *got this answer*.

  ```ts
  server.tool("compliance.screen", ScreenInput, async (input) => {
    const subject = await boundSubject(input);
    const hits = subject.kind === "wallet"
      ? await provider.screenWallet(subject.address, input.chain)
      : await provider.screenEntity(subject.did, input.jurisdiction);
    const decision = classify(hits, policy);              // clear | flagged | blocked
    const receipt = signScreening({
      subject, caller: input.caller, source: provider.sourceId,
      hits, decision, ts: input.now,
    });
    return { content: [{ type: "text", text: JSON.stringify({ decision, receipt }) }] };
  });
  ```

- **CO-E2.2 [greenfield] `classify(hits, policy)` — our decision, not the vendor's.** Turn raw
  provider hits into a policy decision using a compiled policy (reuse `compilePolicy` so the
  policy is itself versioned and auditable).

  **For the human:** don't hard-code thresholds in the tool. Express them as an Auths policy and
  compile it — then the *policy that produced the decision* is a versioned, signable artifact, and
  an auditor can see exactly which rule fired. A `blocked` on an OFAC SDN exact match is
  non-negotiable; a `flagged` on a low match-score is where the policy earns its keep.

  ```ts
  import { compilePolicy, evaluatePolicy } from "@auths-dev/sdk";
  const compiled = compilePolicy(JSON.stringify(SANCTIONS_POLICY)); // versioned, hashable
  export function classify(hits: ProviderHit[], policy = compiled): Decision {
    if (hits.some(h => h.list === "OFAC-SDN" && h.matchScore >= 0.98)) return "blocked";
    const d = evaluatePolicy(policy, /* issuer */ "", /* subject */ "", hits.map(h => h.list));
    return d.allow ? "clear" : "flagged";
  }
  ```

- **CO-E2.3 [greenfield] The screening receipt is offline-verifiable & composes with T1.** The
  receipt must re-verify with `@auths-dev/verifier` alone, and it must be linkable into a
  `dispute.evidence` bundle so a deal can prove *authorized **and** compliant*.

  **For the human:** shape the receipt so `auths-receipts` T1 can embed it by reference-plus-proof
  (CO-E2.1's `signScreening` output goes straight into `dispute.evidence`'s `compliance` field).
  Add the cross-repo test: build a receipt here, embed it there, verify the combined bundle
  offline.

  ```ts
  export interface ScreeningReceipt {
    version: "compliance/v1";
    subject: Subject; caller: string; source: string;   // which list/vendor
    decision: "clear" | "flagged" | "blocked";
    hits_hash: string;                                   // hash of raw hits (vendor data not resold in the clear)
    policy_hash: string;                                 // which compiled policy decided
    ts: string; issued_by: string; signature: string;   // signed by the T3 tool's agent key
  }
  ```

---

## Epic CO-E3 — T4 Spend & policy audit (compliance-as-query)

This is mostly *surfacing existing capability* — `generateAuditReport` already re-derives spend
from signed logs. T4 meters it and adds anomaly/policy views.

- **CO-E3.1 [greenfield] `audit.spend`.** Metered query: total settled spend for an agent or
  fleet over a period, re-derived from signed logs, returned with the `logHash` it was derived
  from so the answer is itself checkable.

  **For the human:** wrap `generateAuditReport` — do not re-implement spend derivation. The only
  new work is turning its output into a metered MCP tool and attaching the `logHash` so the caller
  can independently confirm the number with `verify-spend`. Never return a total you can't point at
  a signed log for.

  ```ts
  import { generateAuditReport } from "@auths-dev/sdk";
  server.tool("audit.spend", SpendInput, async ({ agentRepo, authsRepo, since, until }) => {
    const report = JSON.parse(generateAuditReport(agentRepo, authsRepo, since, until));
    return { content: [{ type: "text", text: JSON.stringify({
      total: report.total, byPeriod: report.byPeriod, logHash: report.logHash,  // checkable
    }) }] };
  });
  ```

- **CO-E3.2 [greenfield] `audit.policy` — conformance, not just totals.** Given a fleet's spend
  and a compiled policy, report which settlements conformed and which breached (over-budget,
  out-of-scope, expired-grant), each with the offending signed call cited.

  **For the human:** this reuses `evaluatePolicy` per settled call. The output an enterprise buys
  is a *conformance ledger*: "N calls, M breaches, here are the exact signed calls that breached
  and which rule." Cite the call, don't summarize it away — the buyer needs to act on the specific
  breach.

  ```ts
  server.tool("audit.policy", PolicyInput, async ({ agentRepo, authsRepo, policyJson }) => {
    const compiled = compilePolicy(policyJson);
    const calls = loadSignedCalls(agentRepo);
    const breaches = calls
      .map(c => ({ c, d: evaluatePolicy(compiled, c.issuer, c.subject, c.capabilities, c.role, c.revoked, c.expiresAt) }))
      .filter(x => !x.d.allow)
      .map(x => ({ call: x.c.ref, rule: x.d.reason, at: x.c.ts }));
    return { content: [{ type: "text", text: JSON.stringify({ total: calls.length, breaches }) }] };
  });
  ```

- **CO-E3.3 [greenfield] `audit.anomaly` — the flag, computed by us.** Surface anomalous spend
  patterns (a sudden burst, a settlement to a never-seen counterparty, spend approaching a cap)
  as pre-computed flags — the RP acts on the flag, never re-derives it.

  **For the human:** keep anomaly detection explainable and deterministic where possible —
  rate-of-spend vs the agent's own history, first-time counterparties, cap proximity. Each flag
  carries the evidence (the calls that triggered it) so it's auditable, not a black-box score.
  Resist ML here at launch; a handful of transparent rules sells better because a compliance
  officer can defend them.

  ```ts
  export function anomalies(calls: SignedCall[], history: History): Flag[] {
    const flags: Flag[] = [];
    if (burstRate(calls) > 3 * history.medianRate) flags.push({ kind: "spend-burst", evidence: recentRefs(calls) });
    for (const c of firstTimeCounterparties(calls, history)) flags.push({ kind: "new-counterparty", evidence: [c.ref] });
    if (capProximity(calls) > 0.9) flags.push({ kind: "near-cap", evidence: [lastRef(calls)] });
    return flags;
  }
  ```

---

## Epic CO-E4 — List, meter, prove

- **CO-E4.1 [greenfield] Wrap & list both servers.**

  ```bash
  auths-mcp wrap --scope compliance.screen --scope compliance.receipt \
    --budget '$5' --rail x402 --test-mode -- auths-compliance-screening-server   # Rust bin (in-process)

  auths-mcp wrap --scope audit.spend --scope audit.policy --scope audit.anomaly \
    --budget '$5' --rail x402 --test-mode -- auths-compliance-audit-server        # Rust bin (in-process)
  ```

- **CO-E4.2 [greenfield] Hermetic gate.** With `MockProvider`, freeze a transcript: a clean wallet
  → `clear` receipt; an OFAC-SDN match → `blocked` receipt; an over-budget fleet → `audit.policy`
  reports the exact breaching call; a spend burst → `audit.anomaly` flag. No paid API, no chain.

  **For the human:** the gate must never touch the real provider — inject `MockProvider`. Assert
  both the decision *and* that the receipt re-verifies offline. Mirror
  `tests/e2e/test_mcp_spend_log_audit.py`'s structure.

- **CO-E4.3 [greenfield] Composition demo with T1.** Screen an agent → pay → build a
  `dispute.evidence` bundle that embeds the screening receipt → verify offline that the bundle
  proves *authorized **and** compliant*. This is the cross-portfolio proof point.

---

## Open questions (owner decisions)

- **[decide] Provider & resale model (CO-E1).** Which sanctions/AML source do we wrap
  (Chainalysis/TRM/an OFAC-SDN mirror), and do we resell (mark up their per-check cost) or
  pass-through + charge for the identity-binding + receipt? Recommend pass-through + our-margin-on-
  the-receipt — keeps us out of being a data reseller and defensible on the value we actually add.
- **[decide] Do we store raw hits?** The receipt carries `hits_hash`, not raw vendor data, to avoid
  reselling a provider's list in the clear. Confirm that's the posture (it likely is, contractually).
- **[decide] Policy authorship (CO-E2.2 / CO-E3.2).** Ship an opinionated default sanctions policy,
  or require the operator to supply one? Recommend default + override.
- **[decide] Pricing.** `compliance.screen ~$0.002–0.02/check` (match/beat the observed $0.002),
  `audit.*` per-query + enterprise bulk tier.

## Sequencing

1. **CO-E1** scaffold + provider port + identity binding.
2. **CO-E2** `compliance.screen` + the screening receipt (list T3 — the already-paying category).
3. **CO-E3** `audit.spend` → `audit.policy` → `audit.anomaly` (list T4, mostly surfacing fn-157).
4. **CO-E4** list, hermetic gate, T1-composition demo.
