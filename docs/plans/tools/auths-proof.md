# `auths-proof` — Signed Notary & Verified Fetch

**Portfolio 4 — Proof & verified data.** The volume on-ramp, differentiated by proof. This
portfolio — the **`crates/auths-proof`** crate in the `auths` monorepo, a sibling sharing the
same `auths-evidence` ([`auths-receipts.md`](./auths-receipts.md) §0) — ships the two tools
that prove the receipt thesis end-to-end on the cheapest possible payload, then apply it to the
one saturated category worth entering. **T7 (Signed Notary)** is the
"hello world" — the thinnest expression of "the receipt is the product," ship it *first* to
prove the whole pattern on a live listing. **T6 (Verified Fetch)** is the single volume tool
worth seeding: raw fetch is a race to the bottom (Agent402 alone has ~1,100), so we list *one*
and win on the **proof-of-fetch** — any agent can `curl`, none can *prove to a counterparty*
what a URL served at time T. That provenance turns a commodity into a trust tool and feeds
`auths-receipts` / `auths-compliance` evidence bundles.

> **Read first:**
> - `/Users/bordumb/workspace/repositories/auths-base/auths/CLAUDE.md`
> - The transparency-log/anchoring primitives already in-tree: `auths-transparency` (Merkle checkpoints, inclusion proofs) and the witness/checkpoint services
> - `packages/auths-node/index.d.ts` for the signing surface · [`seed-tools.md`](./seed-tools.md) (T6/T7) · [`../market/monetization.md`](../market/monetization.md)

Status codes: **[greenfield]** · **[extend: auths]** · **[decide]**.

---

## 1 · What this portfolio ships  ·  crate `crates/auths-proof`

| Tool | MCP tools exposed | One-liner |
|---|---|---|
| **T7 Notary** | `notary.stamp`, `notary.verify` | Submit bytes/hash → signed, optionally transparency-log-anchored proof-of-existence at time T. |
| **T6 Verified Fetch** | `fetch.get`, `fetch.verify` | URL → clean agent-ready content **plus** a signed proof-of-fetch (content hash, bytes, timestamp, TLS chain) bound into the receipt. |

**Architecture.** Same as Portfolio 1 (`auths-receipts.md` §0): **Rust first-party servers**
(`crates/auths-proof`) embedding `auths-evidence` in-process, wrapped by `@auths-dev/mcp` and
metered on x402 — and, being in-tree, T7's anchoring reuses the `auths-transparency` crate
directly rather than through a fresh binding. Both produce a signed proof that re-verifies
offline with `@auths-dev/verifier`. T7 is pure crypto over
infra we already have (signing + the transparency log). T6 adds a network fetch whose *provenance*
— not whose bytes — is the product.

```
agent ── notary.stamp{hash} ──▶ wrap(meter) ──▶ server: sign(hash, t) [+ anchor to transparency log]
                                                   ▼  signed ExistenceProof (offline-verifiable)

agent ── fetch.get{url} ──▶ wrap(meter) ──▶ server: fetch + capture(TLS,bytes,hash,t) + sign
                                                   ▼  content + signed FetchProof
```

---

## Epic PR-E1 — T7 Signed Notary (ship first, prove the pattern)

- **PR-E1.1 [greenfield] Scaffold + `notary.stamp`.** Submit a hash (or raw bytes → hash it),
  return a signed proof-of-existence: `{hash, ts, issued_by, signature}`. This is the smallest
  possible listable, metered, receipt-producing tool — deliberately.

  **For the human:** this exists to prove the *entire* market pattern (wrap → meter → settle →
  signed receipt → offline verify) on a payload with almost no domain logic. Don't gold-plate it.
  Hash with SHA-256, sign with the tool's agent key, canonicalize with `json-canon` so the
  signature is reproducible. If the caller sends raw bytes, hash them server-side and never store
  the bytes — a notary proves existence, it is not storage.

  ```ts
  // packages/notary-server/src/server.ts
  import { createHash } from "node:crypto";
  server.tool("notary.stamp", StampInput, async ({ hash, bytesB64, anchor }) => {
    const digest = hash ?? createHash("sha256").update(Buffer.from(bytesB64!, "base64")).digest("hex");
    const proof = signExistence({ hash: digest, ts: nowIso(), anchor: anchor ? await anchorTL(digest) : undefined });
    return { content: [{ type: "text", text: JSON.stringify(proof) }] };
  });
  ```

- **PR-E1.2 [greenfield] Optional transparency-log anchoring.** For a surcharge, anchor the stamp
  into a Merkle transparency log and return an inclusion proof — so the proof-of-existence is
  independently checkable against a public log, not just the tool's signature.

  **For the human:** reuse `auths-transparency` — it already has Merkle checkpoints and inclusion
  proofs; do not build a new log. `anchorTL(hash)` appends the digest and returns the inclusion
  proof + the checkpoint it's under. The upsell is "anchored" vs "signed-only": signed-only trusts
  the tool's key; anchored is checkable against the public log even if the tool key later rotates.

  ```ts
  import { appendAndProve } from "@auths-dev/transparency";   // over auths-transparency
  async function anchorTL(hash: string): Promise<Anchor> {
    const { inclusionProof, checkpoint } = await appendAndProve(hash);
    return { log: "auths-notary", inclusionProof, checkpoint };  // re-checkable against the public log
  }
  ```

- **PR-E1.3 [greenfield] `notary.verify` — offline.** Given a proof, re-check the signature and (if
  present) the inclusion proof against the named checkpoint. No network for the signature path.

  **For the human:** the signature path must verify with `@auths-dev/verifier` and nothing else. The
  anchor path needs the checkpoint, which can be pinned or fetched — but the *inclusion math* is
  offline. Add the tamper test: mutate the hash, assert `notary.verify` rejects.

  ```ts
  server.tool("notary.verify", VerifyInput, async ({ proof }) => {
    const sigOk = verifySignature(proof);                    // @auths-dev/verifier, offline
    const anchorOk = proof.anchor ? verifyInclusion(proof.hash, proof.anchor) : true;
    return { content: [{ type: "text", text: JSON.stringify({ ok: sigOk && anchorOk }) }] };
  });
  ```

- **PR-E1.4 [greenfield] List T7 as the pattern-proving launch.** Wrap, list, and run a hermetic
  gate. This is the first live listing of the whole portfolio program — treat its green gate as the
  signal that the tool skeleton (shared across all four repos) is sound.

  ```bash
  auths-mcp wrap --scope notary.stamp --scope notary.verify \
    --budget '$1' --rail x402 --test-mode -- auths-proof-notary-server   # Rust bin (in-process)
  ```

---

## Epic PR-E2 — T6 Verified Fetch (the volume on-ramp)

- **PR-E2.1 [greenfield] `fetch.get` — fetch + capture provenance.** Fetch a URL, return clean
  agent-ready content, and *capture the provenance while fetching*: the exact bytes served, their
  hash, the timestamp, and the TLS certificate chain. The provenance is the product.

  **For the human:** the trick is capturing provenance *at fetch time* — you cannot reconstruct the
  TLS chain or the exact bytes after the fact. Use a fetch path that exposes the peer certificate
  (Node's `tls`/`https` with `getPeerCertificate`). Hash the raw response body before any cleaning.
  Store nothing about the body except its hash — we prove what was served, we don't cache the web.

  ```ts
  // packages/fetch-server/src/server.ts
  import https from "node:https";
  server.tool("fetch.get", FetchInput, async ({ url }) => {
    const { bodyRaw, tlsChain, servedAt, status } = await fetchWithProvenance(url); // captures peer cert
    const proof = signFetch({
      url, status,
      contentHash: sha256(bodyRaw),
      bytes: bodyRaw.length,
      ts: servedAt,
      tls: { subject: tlsChain[0].subject, issuer: tlsChain[0].issuer, fingerprint: tlsChain[0].fingerprint256, validTo: tlsChain[0].valid_to },
    });
    return { content: [{ type: "text", text: JSON.stringify({ content: cleanForAgent(bodyRaw), proof }) }] };
  });
  ```

- **PR-E2.2 [greenfield] `signFetch` → a proof bound into the receipt.** The `FetchProof` must be
  the artifact that lets a *counterparty* — not just the fetcher — trust what a URL served at time
  T. Shape it so `auths-receipts` and `auths-compliance` can embed it as grounding evidence.

  **For the human:** this is why fetch is worth doing despite saturation — the proof composes. A
  compliance screen that cites "the sanctions list I read at time T, here's the signed proof of
  exactly what that URL served" is far more defensible than "I checked a list." Make `FetchProof`
  self-describing and offline-verifiable, and add a cross-repo test embedding it in a
  `dispute.evidence` bundle.

  ```ts
  export interface FetchProof {
    version: "proof/fetch/v1";
    url: string; status: number;
    contentHash: string; bytes: number; ts: string;
    tls: { subject: string; issuer: string; fingerprint: string; validTo: string };
    issued_by: string; signature: string;   // signed by the T6 tool's agent key
  }
  ```

- **PR-E2.3 [greenfield] `fetch.verify` — offline, and it checks the binding.** Given content + a
  `FetchProof`, confirm the content hashes to `contentHash` and the signature is valid. This proves
  "this exact content is what that URL served at time T, per this tool."

  **For the human:** the crucial check is the *binding*: recompute `sha256(content)` and compare to
  the proof — a proof that doesn't match its content is worthless. Then verify the signature offline.
  The TLS chain is informational unless the caller supplies a trust anchor; verifying it fully is a
  later enhancement (PR-E3).

  ```ts
  server.tool("fetch.verify", FetchVerifyInput, async ({ content, proof }) => {
    if (sha256(Buffer.from(content)) !== proof.contentHash) return json({ ok: false, reason: "content-mismatch" });
    return json({ ok: verifySignature(proof), servedAt: proof.ts, from: proof.url });
  });
  ```

---

## Epic PR-E3 — Hardening & the differentiators

- **PR-E3.1 [greenfield] TLS chain verification (the real moat over `curl`).** Optionally verify the
  captured TLS chain to a system/pinned root and record the verification result in the proof — so
  the proof asserts not just "these bytes" but "served over a valid TLS session to this domain."

  **For the human:** this is the feature that makes the proof legally interesting and impossible to
  fake with a plain `curl`. Verify the chain to a trust store at fetch time and stamp the result
  into the proof (`tlsVerified: true/false`). Do it as an opt-in surcharge tier — it costs more CPU
  and it's the premium provenance.

  ```ts
  import tls from "node:tls";
  function verifyTlsChain(chain: tls.DetailedPeerCertificate, host: string): boolean {
    // authorized by a trusted CA + host matches the cert's SANs, captured at fetch time
    return chain.issuerCertificate != null && matchesHost(chain, host) && withinValidity(chain);
  }
  ```

- **PR-E3.2 [greenfield] Content normalization for agents.** `cleanForAgent` turns raw HTML/PDF into
  clean, token-efficient text — the *usability* half of the volume pitch — while the proof stays
  bound to the *raw* bytes.

  **For the human:** never hash the cleaned output — always hash the raw bytes, or the proof stops
  meaning "what the server served." Cleaning is a convenience layer on top; the proof sits under it.
  Keep normalization boring and deterministic (readability extraction, PDF-to-text) so two fetches
  of the same bytes clean identically.

- **PR-E3.3 [extend: auths] Reusable transparency-log helper.** If PR-E1.2 needs a Node-facing
  wrapper over `auths-transparency`, add a thin `@auths-dev/transparency` binding rather than
  re-implementing Merkle logic in JS. Small upstream packaging task.

  **For the human:** the Merkle log, checkpoints, and inclusion-proof math already exist in Rust
  (`auths-transparency`). The only gap is a Node binding; expose `appendAndProve` / `verifyInclusion`
  via napi. Do not port the crypto to TypeScript.

---

## Epic PR-E4 — List, meter, prove

- **PR-E4.1 [greenfield] Wrap & list both.**

  ```bash
  auths-mcp wrap --scope fetch.get --scope fetch.verify \
    --budget '$5' --rail x402 --test-mode -- auths-proof-fetch-server   # Rust bin (in-process)
  ```

- **PR-E4.2 [greenfield] Hermetic gate.** Freeze transcripts: a stamp round-trips and `notary.verify`
  → ok; a mutated hash → rejected; an anchored stamp verifies its inclusion proof offline; a fetch
  of a fixture server round-trips and `fetch.verify` → ok; content mutated by one byte →
  `content-mismatch`. No live network in the gate — serve the fixture over a local TLS server.

  **For the human:** for the fetch gate, stand up a local HTTPS fixture with a known cert so the TLS
  capture is deterministic. Mirror `tests/e2e/test_mcp_spend_log_audit.py` structure. This gate
  doubles as the proof that the shared tool skeleton is correct.

- **PR-E4.3 [greenfield] Composition demo.** `fetch.get` a page → embed its `FetchProof` into a
  `dispute.evidence` bundle (auths-receipts) → verify the whole thing offline. Shows the on-ramp
  tool feeding the flagship trust tool — the reason we seed fetch at all.

---

## Open questions (owner decisions)

- **[decide] Anchoring default (PR-E1.2).** Signed-only by default with anchoring as a surcharge
  (recommended — keeps the base call cheap), or anchor everything?
- **[decide] Fetch abuse posture (PR-E2).** A metered fetch tool can be pointed at anything. Do we
  enforce robots/ToS, rate-limit per agent, or block classes of targets? Recommend a minimal
  allow-the-web-but-rate-limit posture at launch, with a documented abuse policy — and never cache
  bodies, only hashes, which sidesteps most content-liability questions.
- **[decide] Do we store proofs?** Stateless + re-derive vs a queryable proof store. Recommend
  stateless, with a paid pinning tier (consistent with the other repos).
- **[decide] Pricing.** `notary.stamp ~$0.0005–0.002` (+ anchoring surcharge), `fetch.get
  ~$0.001–0.005` (+ TLS-verify/proof surcharge). These are the volume tools — price for frequency,
  charge the premium on the proof.

## Sequencing

1. **PR-E1** T7 Notary — ship *first*, it proves the entire market pattern on the cheapest payload.
2. **PR-E2** T6 `fetch.get` / `fetch.verify` — the volume on-ramp with proof-of-fetch.
3. **PR-E3** TLS verification + normalization + the transparency-log Node binding (the differentiators).
4. **PR-E4** list, hermetic gate, composition demo into `auths-receipts`.
