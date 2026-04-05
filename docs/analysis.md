# Auths Implementation Plans: Critical Review

## Plans Reviewed

| Epic | Scope | Tasks |
|------|-------|-------|
| **fn-7** (Unified Activity Feed) | `log_entries` table, sequencer integration, feed API, frontend component, dashboard cleanup | fn-7.1 through fn-7.8 |
| **fn-8** (Sequencer Durability) | Durable entry storage, transaction boundaries, signature verification, atomic composite ops, deterministic replay | fn-8.1 through fn-8.5 |
| **fn-9** (Operational Hardening) | Redis-based rate limiting, periodic Git export, cross-store reconciliation | fn-9.1 through fn-9.3 |

**Referenced repos:** `auths-cloud` (Rust backend), `auths` (Rust verification library), `auths-site` (Next.js frontend)

---

## I. Security & OpSec Critique

### What's Done Well

**Defense in depth is a first-class principle.** The plans explicitly mandate dual verification — both the route handler AND sequencer independently verify attestation signatures (fn-8.3). The explicit prohibition of a `pre_verified: bool` bypass flag shows mature security thinking. Too many systems degrade to "trust the caller" shortcuts.

**The idempotency oracle prevention in fn-8.4 is excellent.** The plan explicitly identifies that returning `Unauthorized` on signature mismatch but `NotFound` on missing key creates a distinguishing oracle. The mitigation — always return the same generic `DuplicateEntry` error regardless of why the duplicate check failed — is the correct approach. The timing side-channel note (don't fast-fail before verification) shows awareness beyond the median security review.

**Privacy-by-design separation between sequencer and client IP data.** The explicit decision to keep `anonymized_client_id` / quota tracking out of the sequencer (fn-7.2, fn-7.4) and out of the immutable log is a strong architectural boundary. The log is a cryptographic artifact — IP-derived data has no place in it.

**The CHECK constraints on `leaf_hash` and `actor_sig` byte lengths** (fn-8.1) prevent a class of subtle corruption bugs where truncated or padded cryptographic material would silently pass through.

### What Needs Improvement

**1. No explicit threat model document for the genesis phase trust boundary.**

The plans mention genesis-phase entries in multiple places (fn-7.1, fn-7.5, fn-7.7) with the correct architectural decision (genesis entries are NOT Merkle-backed and verification tooling should reject them by default). But the threat model is scattered across task files rather than centralized. A determined attacker who compromises the server could inject fake entries with `is_genesis_phase = TRUE` and negative sequence numbers. The CHECK constraint `NOT (is_genesis_phase = TRUE AND merkle_included = TRUE)` prevents one attack vector (claiming genesis entries are Merkle-verified), but doesn't prevent unbounded injection of fake genesis rows.

**Recommendation:** Add a migration-time constraint that freezes genesis-phase inserts after the backfill migration runs. Something like a `genesis_phase_closed BOOLEAN DEFAULT FALSE` flag in a config table, checked by a trigger. Or more simply: after fn-7.5 runs, run a follow-up migration that adds `CHECK (is_genesis_phase = FALSE)` to `log_entries` as a table constraint, permanently closing the genesis window at the database level. This is the kind of defense that survives a future developer who doesn't read the docs.

**2. The `decode_canonical_entry()` function (fn-8.1) is a footgun in waiting.**

The plan correctly warns "NEVER use this for signature verification or leaf hash computation." But a convenience function named `decode_canonical_entry` that returns JSONB will inevitably be used in application queries by a future developer who doesn't read the comment. JSONB normalizes key ordering, which means the decoded output will differ from canonical bytes — and if someone builds a view or materialized query on top of it, they'll silently break hash verification downstream.

**Recommendation:** Name it `debug_decode_canonical_entry()` to make the danger visible at every call site. Or better: create it in a `debug` schema (`debug.decode_canonical_entry()`) that is not in the default search path, so it can't be accidentally used in production queries.

**3. The 256KB body limit (fn-7.3) and 64KB sequencer content check create a gap.**

Axum gets a 256KB limit, the sequencer validates 64KB on the `Value` content. What about the 192KB between them? A payload that passes Axum's gate but fails the sequencer's check will return an error to the client, which is fine — but the route handler has already done signature verification, DID resolution, and potentially database lookups on a 256KB payload that was never going to succeed. This is a moderate amplification vector for resource exhaustion.

**Recommendation:** Either align the limits (both 64KB), or add a cheap size check in the route handler before doing expensive verification work: `if body.len() > 65536 { return Err(ApiError::PayloadTooLarge) }`. The Axum limit stays at 256KB as a hard OOM gate; the application-level check at 64KB prevents wasted work.

**4. No rate limiting on the feed endpoint is a missed opportunity.**

fn-7.6 correctly places the feed endpoint inside GovernorLayer. Good. But the plan doesn't specify feed-specific rate limits. The `/v1/activity/feed` endpoint with `?limit=100` hits Postgres on every request (no server-side caching beyond `Cache-Control` headers). A client that ignores cache headers can hammer this endpoint at the GovernorLayer's general rate limit, which may be tuned for lighter endpoints.

**Recommendation:** Consider a server-side cache (even a simple `tokio::sync::watch` with 10s refresh) for the feed response, so Postgres is hit at most once per 10 seconds regardless of request volume. The `Cache-Control: public, max-age=10, s-maxage=30` header is correct for CDN/browser caching but doesn't protect the origin.

**5. The `ON CONFLICT DO NOTHING` in backfill (fn-7.5) silently swallows collisions.**

The plan correctly uses `ON CONFLICT DO NOTHING` for idempotent backfill. But if the backfill has a bug that produces colliding sequence numbers across domains (e.g., an attestation and a registration both get sequence -1), the collision is silently swallowed and one entry is lost. The plan's static offset scheme (-1 for attestations, -1,000,000 for registrations) makes this unlikely, but "unlikely" is not "impossible."

**Recommendation:** Run the backfill in a transaction, count the rows affected by each INSERT, and verify the total matches the source count. Log a hard error if `rows_affected < expected_count`. This turns a silent data loss into a visible failure.

---

## II. Network Security & Infrastructure Critique

### What's Done Well

**The C2SP tlog-witness protocol integration is a strong foundation.** The witness system with TOFU semantics and quorum-based acceptance follows industry standards (Sigstore, Go sumdb). The `checkpoint_consistent` field in the feed response (fn-7.6) gives clients a real-time signal about whether their data is covered by a witnessed checkpoint.

**Redis fallback for rate limiting (fn-9.1) is operationally sound.** Degrading to burst-only rate limiting when Redis is down is the right tradeoff — availability over perfect quota enforcement.

### What Needs Improvement

**1. No TLS certificate pinning or mutual TLS for witness communication.**

The witness task (`witness_task.rs`) fans out `CosignRequest` to configured witness endpoints. The plans don't mention TLS requirements for witness communication. If a witness endpoint is reachable over plain HTTP or via a compromised CA, an attacker could MITM the cosignature exchange and serve fake cosignatures.

**Recommendation:** Require HTTPS for all witness endpoints. Consider mutual TLS or HTTP signature authentication for witness-to-log communication. The C2SP spec doesn't mandate this, but it's a low-cost hardening measure.

**2. The Git export worker (fn-9.2) has no authentication model.**

The worker uses `backend.append_event()` to write to Git refs. The plan doesn't discuss who has write access to the Git repository or how the export worker authenticates. If the Git backend is a bare repo on disk, this is fine. If it's a remote (GitHub, Radicle), the export worker needs credentials — and those credentials need rotation, scoping, and monitoring.

**Recommendation:** Document the Git backend authentication model. If using a remote, use a deploy key with write access scoped to the specific refs the worker touches. Rotate keys on a schedule.

**3. The reconciliation daemon (fn-9.3) has no alerting integration.**

The plan emits Prometheus metrics and logs warnings. But there's no mention of PagerDuty, Slack, or email alerts. A Merkle root divergence is a critical integrity violation — it means the transparency log may have been tampered with. Logging a warning is insufficient for a system whose entire value proposition is tamper-evidence.

**Recommendation:** Root divergence (`auths_reconciliation_divergence_total` with label `merkle_root`) should trigger a P1 alert, not just a log line. Define alert thresholds in the plan: root divergence = page immediately, Git export lag > 1 hour = warn, domain table spot-check failure = page.

**4. No discussion of database encryption at rest or backup verification.**

`sequenced_entries.entry_content_canonical` contains the canonical bytes of every transparency log entry. `actor_sig` contains raw Ed25519 signatures. These are the crown jewels. The plans don't mention encryption at rest, backup schedules, or backup integrity verification.

**Recommendation:** Add a note requiring encryption at rest for the Postgres volume. Add periodic backup verification (restore to a staging instance, run reconciliation, compare roots) to the operational runbook.

---

## III. Developer Experience Critique

### What's Done Well

**The task decomposition is exceptionally clean.** Each task has a single responsibility, clear dependencies, explicit file paths, and line-number references to existing code. A developer can pick up fn-7.2 without reading fn-7.1 beyond the schema it creates. This is rare and valuable.

**The "Key context" sections are a standout.** Pointing to exact line ranges (`sequencer/mod.rs:318-557`, `artifacts.rs:125-144`) eliminates the "where do I even start" problem that kills developer velocity on unfamiliar codebases.

**The acceptance criteria are testable, not aspirational.** Every acceptance item is a concrete, verifiable statement: "file exists," "CHECK constraint prevents X," "no `unwrap()` added." This is the difference between a plan that can be reviewed and a plan that generates debate.

**The decision rationale is inline.** "Why doesn't `public_registrations` move to the sequencer? Because it requires `anonymized_client_id` from client IP, and the sequencer must not have access to client IPs." Future developers don't have to reverse-engineer the reasoning.

### What Needs Improvement

**1. No test plan beyond "all existing tests pass."**

Every task's acceptance criteria includes `cargo build` compiles and existing tests pass. But none of the tasks specify NEW tests to write. fn-8.5 lists test scenarios (empty database, missing sequence gap, root mismatch, etc.) but doesn't require them as acceptance criteria — they're informational. For a transparency log where correctness is the product, this is a gap.

**Recommendation:** Each task should include specific test requirements. fn-8.5's test scenarios should be acceptance criteria, not suggestions. fn-8.4's idempotency logic (oracle prevention, signature verification on retry) desperately needs integration tests. fn-7.2's Attest validation (malformed JSON, invalid DIDs, oversized payloads) needs unit tests with specific rejection cases.

**2. No migration rollback strategy.**

The plans create migrations 012 through 015. None of them include a `DOWN` migration or rollback instructions. `sqlx::migrate!()` supports `down.sql` files. If migration 014 (backfill) runs for 30 minutes and fails halfway, what's the recovery procedure? Re-run (idempotent thanks to `ON CONFLICT`)? Drop and recreate `log_entries`? The plans don't say.

**Recommendation:** Add rollback instructions for each migration. For 014 (backfill), the rollback is `TRUNCATE log_entries` (safe because no live writes depend on it yet). For 012 (`sequenced_entries`), the rollback is `DROP TABLE sequenced_entries` — but only if no entries have been written. Document the point-of-no-return for each migration.

**3. The dependency graph has a critical path bottleneck.**

```
fn-8.1 → fn-8.2 → fn-8.4 → fn-7.4
                 → fn-7.2 → fn-7.3
                          → fn-7.5 → fn-7.6 → fn-7.7 → fn-7.8
fn-8.3 ──────────────────→ fn-7.3
fn-9.1 → fn-9.2 → fn-9.3
```

fn-8.1 and fn-8.2 are the bottleneck — everything depends on durable storage and the transaction boundary. But fn-7.6 (feed API), fn-7.7 (frontend component), and fn-7.8 (dashboard cleanup) don't actually depend on the sequencer being durable. They depend on the `log_entries` table existing (fn-7.1) and being queryable. These could be developed in parallel against the schema with fixture data.

**Recommendation:** Explicitly mark fn-7.6, fn-7.7, and fn-7.8 as parallelizable with fn-8.x. The frontend team shouldn't be blocked on sequencer durability to build the feed UI. Add a note: "fn-7.6/7.7/7.8 can be developed against manually-inserted test data in `log_entries` while fn-8.x is in progress."

**4. No local development setup instructions.**

The plans reference Redis (fn-9.1), Postgres with specific tables, a Git backend, and witness endpoints. There's no mention of how a developer sets up a local environment to work on these tasks. Does `docker-compose.yml` exist? Do they need a running sequencer? Can they test fn-7.6 without witnesses?

**Recommendation:** Add a "Local development" section to fn-7.1 or a shared prerequisites document that specifies: `docker compose up -d` for Postgres + Redis, `sqlx migrate run`, and which features can be tested without a full sequencer.

**5. fn-9.2's migration numbering conflicts.**

fn-9.1 creates `015_drop_anonymized_client_id.sql`. fn-9.2 also references `015_git_export_watermark.sql`. Two migrations can't share the same number. This will cause a runtime panic in `sqlx::migrate!()`.

**Recommendation:** Renumber fn-9.2's migration to 016: `016_git_export_watermark.sql`. Audit all migration numbers across the three epics to ensure no conflicts.

---

## IV. Product Critique

### What's Done Well

**The unified feed is a significant UX upgrade.** Replacing two separate components (`NetworkPulse` + `AuditLedger`) with a single `LiveNetworkActivity` component (fn-7.7/7.8) reduces cognitive load. Users no longer have to mentally merge two separate activity streams.

**The `checkpoint_consistent` signal is a differentiated feature.** Showing users whether their data is covered by a witnessed checkpoint (green badge vs. amber "pending") is a trust signal that no other package registry provides. This makes the transparency log visible and meaningful to end users, not just auditors.

**The genesis phase visual distinction is the right call.** Showing pre-launch data with a dashed border and "Recorded before transparency verification was enabled" tooltip is honest and builds trust. Hiding it would be dishonest; showing it without caveat would be misleading. This threading of the needle is good product thinking.

### What Needs Improvement

**1. No user-facing documentation or changelog for the unified feed.**

The plans build a new endpoint, new component, and delete old components — but don't mention updating user-facing docs, API documentation, or a changelog entry. External consumers of `/v1/activity/recent` and `/v1/audit/feed` (if any exist) will break when those endpoints are eventually removed.

**Recommendation:** Add a deprecation notice to the old endpoints (fn-7.8 says they "stay unchanged," but for how long?). If they're internal-only, document the sunset timeline. If external consumers exist, version the API or add `Sunset` / `Deprecation` headers per RFC 8594.

**2. The feed doesn't support filtering by entry type.**

The `GET /v1/activity/feed` endpoint (fn-7.6) supports `?limit=N` and `?before=<sequence>` but not `?type=attest` or `?actor=did:keri:E...`. Users who care only about attestations (the primary use case for a package registry) have to paginate through org membership changes, key rotations, and access grants.

**Recommendation:** Add `?entry_type=attest,register` and `?actor_did=did:keri:E...` filter parameters. The `idx_log_entries_actor` index (fn-7.1) already supports the actor filter. Add a composite index on `(entry_type, log_sequence DESC)` for the type filter.

**3. No webhook or streaming API for real-time consumers.**

The feed is poll-based (10s interval). For CI/CD integrations that want to know "was my package attestation recorded?", polling every 10 seconds with pagination is inefficient. A webhook or SSE (Server-Sent Events) endpoint would let consumers react in real-time.

**Recommendation:** This doesn't need to be in the current epic, but add it as a follow-up task. SSE on `/v1/activity/feed/stream` with `Last-Event-ID` support would be a natural extension of the keyset pagination design.

**4. The 14 entry types in the feed may overwhelm non-technical users.**

The `ENTRY_CONFIG` mapping in fn-7.7 shows 14 distinct entry types with different icons, colors, and labels. For a developer checking "did my package get signed?", scrolling through org membership changes, key rotations, and access grants is noise. The feed is designed for transparency maximalists, not the median user.

**Recommendation:** Consider a default filter that shows only high-signal entry types (attest, register, namespace_claim) with an "all activity" toggle. Or group entry types into categories: "Packages" (attest, namespace_*), "Identity" (register, rotate, device_*), "Organization" (org_*), "Access" (access_*).

**5. No mobile responsiveness mentioned.**

fn-7.7 specifies `max-h-[420px]` scrollable container with gradient fades and AnimatePresence. No mention of how this renders on mobile. The `auths-site` is a Next.js app that presumably serves mobile users.

**Recommendation:** Add responsive breakpoints to fn-7.7's acceptance criteria. At minimum: stack layout on `sm:`, reduce `max-h` on mobile, ensure touch targets are 44px+.

---

## V. Architectural Observations

**1. The two-phase write (Git + Postgres) in fn-7.4 is a known liability that fn-9.2 correctly addresses.** The plan explicitly calls out the intermediate state and documents that Git writes are idempotent. fn-9.2 then moves Git to a periodic background export. This is a clean migration path — the plan acknowledges tech debt and schedules its resolution.

**2. The single-writer sequencer is the correct architecture for this scale.** At thousands of entries (current volume), a single-writer actor with in-memory Merkle tree and Postgres durability is simpler and more correct than a distributed log. The streaming replay in fn-8.5 (handling 50M+ entries) shows forward-thinking without over-engineering the current implementation.

**3. The `operation_id` pattern for composite operations (fn-8.4) is well-designed.** Using a shared UUID rather than sequence adjacency for linking Register + DeviceBind is robust — it survives reordering, gaps, and partial replays. The idempotency key on Register (inception SAID) is content-derived and deterministic, which is the right approach.

**4. The authority model in fn-9.2 is clearly stated.** "Postgres is primary. Git is derived. Divergence is expected." This prevents the class of bugs where two systems are treated as co-authoritative and conflicts become unresolvable.

---

## VI. Innovation & Impact Assessment

### What Makes This System Notable

**This is one of the most architecturally complete transparency log implementations for package supply chain security in existence outside of Sigstore.**

Most package registries (npm, PyPI, crates.io) have no transparency log at all. Sigstore has a transparency log (Rekor) but it's purpose-built for signing events — it doesn't unify identity lifecycle, organizational governance, device management, namespace ownership, and artifact attestation into a single sequenced log. The auths system does.

**The specific innovations worth highlighting:**

1. **Unified transparency log across all identity and package operations.** Sigstore's Rekor logs signatures. Certificate Transparency logs certificates. Auths logs *everything* — identity inception, key rotation, device binding, org membership, namespace claims, and artifact attestations — in a single, monotonically sequenced, Merkle-backed log. This means an auditor can reconstruct the complete provenance chain from "identity created" to "package signed" without cross-referencing multiple systems. No other public system does this at the protocol level.

2. **The genesis phase trust boundary is a genuinely novel approach to bootstrapping.** Most transparency logs face a chicken-and-egg problem: how do you handle data that existed before the log? CT logs solved this with "precertificates." Sigstore solved it by not having pre-existing data. Auths solves it with a structurally enforced genesis phase: negative sequence numbers, `is_genesis_phase` flag, `merkle_included = FALSE`, and verification tooling that defaults to rejecting genesis entries. This is a clean, auditable approach that doesn't pretend pre-existing data has the same integrity guarantees as log-backed data. The structural enforcement (no application code path can set `is_genesis_phase = TRUE`) is stronger than policy-based approaches.

3. **Witness-backed checkpoints exposed directly in the user-facing feed.** CT logs have monitors and auditors, but they're invisible to end users. Sigstore has a public Rekor instance, but the verification is tool-side. Auths surfaces `checkpoint_consistent` directly in the dashboard UI — users can see whether their data is covered by a witnessed checkpoint in real-time. This closes the gap between "the log exists" and "the user knows the log is working." If this is executed well, it could set a new standard for transparency UX.

4. **Atomic composite operations with authenticated idempotency.** The Register + DeviceBind atomic operation (fn-8.4) with content-derived idempotency keys and oracle-resistant duplicate detection is more sophisticated than what most distributed systems implement. The signature-verified idempotency (verify `actor_sig` against stored canonical bytes before returning metadata) prevents a class of timing and enumeration attacks that most systems don't even consider.

5. **The KERI-based identity layer is a differentiator.** Using `did:keri` for identity (with key rotation, delegation, and multi-device support) rather than simple public keys or OAuth tokens means the identity model can survive key compromise, device loss, and organizational changes. This is architecturally closer to what a next-generation package registry needs than anything currently deployed.

### What Tempers the Innovation

- **Adoption is the hard part.** The architecture is strong, but no transparency log has value without verifiers. The `--allow-genesis` flag in verification tooling suggests the team knows this — but the plans don't address how to get package managers (cargo, npm, pip) to integrate verification. The technical innovation matters only if the ecosystem adopts it.

- **Operational complexity is high.** Running a sequencer + witnesses + Git export + reconciliation daemon + Redis + Postgres is a lot of moving parts for a small team. The plans are well-decomposed, but the total surface area is substantial. Sigstore runs Rekor as a single Go binary with a single database — simplicity of operation matters for a public good.

- **The single-sequencer design has a known scaling ceiling.** The plans acknowledge this (fn-8.5's streaming replay for 50M+ entries) but don't address horizontal scaling. For a public registry serving the entire open-source ecosystem, single-writer Postgres will eventually be a bottleneck. This is fine for now, but the migration path to sharded or distributed sequencing should be considered.

### Overall Verdict

**These plans represent serious, security-minded engineering applied to a genuine gap in the software supply chain.** The transparency log architecture is sound, the security considerations are above-average (oracle prevention, timing side-channels, defense in depth), and the developer experience of the plans themselves is excellent. The primary risks are operational complexity and adoption — both of which are business challenges, not technical ones.

If executed well, auths could become the reference implementation for "how to build a transparency-backed package registry" — a position currently held by no one, because no one has built the complete stack end-to-end.
