# The Network Explorer — making `network.auths.dev` legible

**Status:** Draft v1.0 · **Date:** 21 July 2026
**Builds on:** `auths/docs/plans/network/network-auths-dev.md` (the node + its read
surfaces), `witness-receipting-write-path.md` Part IV (the write path is live:
per-prefix KELs, receipts, roster, replication), the shipped `/network`
directory page in `auths-site`.
**Scope:** what a human sees when they point a browser at the witness network —
a status page on the node, and a sigstore-search-style explorer that *verifies*
everything it displays.

---

# Part I — Decisions (the two questions, answered)

## D1. New app in `auths-site/apps`? → **Yes: `apps/explorer`**

A new workspace app, deployed as its own Vercel project at
**`explorer.auths.dev`** — not routes inside `apps/web`, and not a page on the
node.

Why not on the node: `network-auths-dev.md` §6 is explicit — growth pressure
never goes into making the witness bigger. Every feature added to the node is
one a stranger's conformant witness lacks, and it grows the audited surface.
The node gets only the tiny status page its own spec already calls for (W0
below). This is also exactly the sigstore shape: `search.sigstore.dev` is a
separate web app over Rekor's public API, not part of Rekor.

Why not inside `apps/web`: the marketing site is static-first and
LCP-tuned; the explorer needs server route handlers (git fetch of
`refs/auths/*` into a cache), WASM assets, and per-member dynamic pages with
their own caching policy. `apps/market` already proved this exact split — its
own app, its own subdomain, depends on `@auths-dev/sdk`, deployed from the
same monorepo. A separate app is an independent failure domain (an explorer
bug can't take down auths.dev) and an independent deploy cadence. The
`/network` directory page in `apps/web` stays where it is and links each
witness row to `explorer.auths.dev/w/<witness>`.

```
auths-site/
├─ apps/
│  ├─ web/        # auths.dev (marketing + /network directory) — unchanged
│  ├─ market/     # market.auths.dev — unchanged
│  └─ explorer/   # NEW — explorer.auths.dev (Next.js, same stack as market)
└─ packages/
   ├─ ledger-ui/  # shared UI the explorer reuses (verdict chips, ledger rows)
   └─ widget/     # <auths-verify> — its verifier-bridge.ts is the WASM-loading
                  # pattern the explorer copies
```

## D2. Does the app import `auths-base/verify`? → **No — that repo is the CI action**

`verify` is the GitHub **Action** (`auths-dev/verify@v1`): it downloads a
pinned `auths` CLI and runs `auths verify` over commit ranges in CI. It is a
CLI wrapper for runners, not a browser library, and importing it would drag a
Node/CLI toolchain into a web app to shell out to a binary.

What "verify what it displays" actually imports — both already published, both
already used in this monorepo:

| layer | package | role in the explorer |
|---|---|---|
| **browser** | `@auths-dev/verifier` (wraps the `auths-verifier` WASM; exports `validateKelJson`, `verifyChainWithWitnesses`, `verifyCommitJson`, `verifyPresentationJson`, `verifyEvidencePackOffline`, …) | re-verifies every KEL/receipt/anchor **client-side** before anything renders as "valid" |
| **server** | `@auths-dev/sdk` (napi; `fetchRegistry(url, dest)` — in-process libgit2 HTTPS, built for serverless and proven on market) | transport only: mirrors a witness's `refs/auths/*` into a cache dir and serves raw evidence bytes to the browser |

**And the widget, precisely** — there are three widget-adjacent artifacts, and
only one is the right import:

- `auths-verify-widget` (standalone repo) = the published `@auths-dev/verify`
  web component (npm at 0.4.0; repo at 0.5.0 with a new DOM-free
  `@auths-dev/verify/core` headless entry). Its verification surface is the
  commit-badge path only (`verifyAttestation`, `verifyChain`,
  `verifyArtifactSignature`) — **not enough for the explorer**.
- `auths-site/packages/widget` = an in-monorepo copy (local `auths-verify`
  0.1.1) that builds the script auths.dev embeds. It has **drifted** from the
  standalone repo (`verifier-bridge.ts` differs; no headless core).
- `@auths-dev/verifier` = the full-surface WASM wrapper. **This is the
  import.** What the widget contributes is the packaging recipe — its
  `INLINE_WASM` Vite build and lazy `verifier-bridge` loader are the pattern
  the explorer copies for shipping WASM to browsers.

Housekeeping finding (file an issue when X1 starts): the two widget copies are
diverging implementations of the same bridge — consolidate by either making
`auths-site/packages/widget` consume `@auths-dev/verify` from npm, or growing
`@auths-dev/verify/core` to re-export the full verifier surface so exactly one
browser-verification package exists. Neither blocks the explorer MVP.

The `verify` action still matters to the explorer in one way: **parity copy**.
Every explorer view shows the offline command that proves the same thing
(`git fetch 'https://network.auths.dev' '+refs/auths/kel/*:refs/auths/kel/*'`,
`auths verify <commit>`, `auths anchor verify …`) — the UI is a convenience
over evidence anyone can check without it.

## D3. The trust story (why this architecture is honest)

The explorer's server is **transport, never a verdict source**. It fetches
bytes (KELs, attachments, receipts, anchors) and hands them to the browser;
the WASM verifier in the browser recomputes SAIDs, replays chains, and checks
signatures before any green state renders. A compromised explorer server can
therefore *omit* (withholding — which freshness labels and receipts surface)
but cannot *forge* — the same property the node itself has. Verdict vocabulary
comes from `@auths-dev/sdk/conformance/verdicts.json` (0.1.15+), the same
manifest the rest of the site now validates against — the explorer never
invents a verdict string.

---

# Part II — Build

## Epic W0 — the node's `GET /` status page (in `auths`, prerequisite, tiny)

The deployment spec's surface table already lists `GET /` ("liveness + the
public withholding view"); it was never implemented — a browser at
`https://network.auths.dev` sees nothing today.

| Task | Detail |
|---|---|
| **W0.1 — status page** | One embedded-HTML handler in `auths-witness-node` (no JS build, no deps): node name + member key (from the health state), roles, member count (roster), the `git fetch` + `auths witness add` one-liners, links to docs + `auths.dev/network` + `explorer.auths.dev`. Served by whichever role owns `/health`. |
| **W0.2 — CORS on public GETs** | `Access-Control-Allow-Origin: *` on the read-only GETs (`/health`, `/v1/registry/roster`, `/witness/{prefix}/{head,key-state,said,receipt}`, `/v1/anchor/{seed}`). Spec §4 already declares these public and CDN-friendly; CORS is what lets the explorer's *browser-direct* mode (W3.3) query witnesses without any proxy. Never on POSTs. |

**Acceptance:** a browser at the node root sees the status page; `curl -H
"Origin: https://explorer.auths.dev" -i https://network.auths.dev/v1/registry/roster`
shows the CORS header; a stranger's witness gets both for free from the same
binary.

## Epic X1 — `apps/explorer` scaffold + resolve pipeline

| Task | Detail |
|---|---|
| **X1.1 — scaffold** | Next.js app mirroring `apps/market`'s config (bun workspace member, `@auths/ledger-ui` dep, `@auths-dev/sdk` pinned, `@auths-dev/verifier` dep). Vercel project + `explorer.auths.dev` DNS (zone is already Vercel). |
| **X1.2 — witness sources** | The witness list comes from the same data as `apps/web`'s directory (extract `witnesses.ts` into a tiny shared package or duplicate deliberately with a drift test — decide in review; shared package preferred). Every page is witness-scoped: `/w/[witness]/…`. |
| **X1.3 — server resolve routes** | Route handlers: `GET /api/w/[witness]/roster` (proxy until W0.2 lands everywhere), `GET /api/w/[witness]/kel/[prefix]` → `fetchRegistry` the witness into a per-witness cache dir (`/tmp`, revalidated on a short TTL), return the member's raw events + attachments + receipts as JSON. **SDK gap to close:** the napi SDK has `fetchRegistry` but no KEL-read export — add `readKelJson(registryDir, prefix)` (events + attachment b64 + stored receipts) to `packages/auths-node` and ship it in `@auths-dev/sdk@0.1.16`. The explorer must not re-implement the registry layout (the "RPs re-implement no wire" rule). |
| **X1.4 — client verifier bridge** | Port `verifier-bridge.ts`'s lazy-WASM pattern; wrap `validateKelJson` / `verifyChainWithWitnesses` behind one `useVerifiedKel(prefix)` hook returning `{events, keyState, verdict, receiptQuorum}` — components render **only** what came back verified, with an explicit "verified in your browser" affordance (and an honest failure state naming what failed). |

## Epic X2 — the pages

| Task | Detail |
|---|---|
| **X2.1 — home / search** | Search box (accepts `did:keri:…` or bare prefix, later commit SHA), witness picker, roster browse with tip sequence — the search.sigstore.dev landing analog. |
| **X2.2 — member page** | `/w/[witness]/m/[prefix]`: KEL timeline (event type, seq, SAID, key transitions), per-event receipt status against the witness's pinned key, current key state, freshness label (verifier-computed, never asserted), and the "verify it yourself" command block. |
| **X2.3 — anchors view** | `/w/[witness]/a/[seed]`: latest co-signed anchor (`GET /v1/anchor/{seed}`), cosignature set vs the KEL-anchored witness set, inclusion proof state, duplicity evidence if any (`/v1/duplicity/{seed}`). |
| **X2.4 — evidence drop-zone** | Drag in an `activity.json` / evidence bundle → `verifyEvidencePackOffline` / `verifyPresentationJson` entirely client-side, no upload. The purest demo of the thesis and nearly free given the WASM surface. |
| **X2.5 — design** | **Borrow, don't invent.** The explorer is visibly the same product family as auths.dev and market.auths.dev: clone `apps/market`'s `MarketNav` as `ExplorerNav` — the Auths logo SVG (`/images/auths_logo.svg`) + the `font-display` "Auths" wordmark with **"Explorer"** beside it in the same baseline-paired span, the same fixed header treatment (`border-rule bg-paper/90 backdrop-blur`). Reuse the shared design tokens (paper/ink/rule palette, type scale) and `@auths/ledger-ui` components (verdict chips, ledger rows, code blocks) rather than styling anew; new visual elements (KEL timeline, receipt quorum meter) extend the existing system's look. Every verdict chip validated against the conformance manifest at build time (same assertion pattern `apps/web` now uses). |

## Epic X3 — hardening + wiring

| Task | Detail |
|---|---|
| **X3.1 — directory links** | `apps/web` `/network` rows link to `explorer.auths.dev/w/<name>`; explorer links back to docs (`onboard-as-a-seller`) everywhere a visitor might be a would-be member. |
| **X3.2 — caching honesty** | Server mirrors carry a "fetched Xs ago from <witness>" stamp; a stale mirror renders as stale, never silently. No server-side verdicts cached — verification is always client-side on current bytes. |
| **X3.3 — browser-direct mode** | Once W0.2 is deployed on the first-party witnesses: JSON endpoints (`key-state`, `head`, `receipt`, roster, anchors) queried straight from the browser, the explorer server reduced to serving static assets + the git-object KEL path (browsers can't speak git smart-HTTP natively; revisit only if it ever matters). |
| **X3.4 — conformance** | The explorer runs against ANY conformant witness by URL (`?witness=https://…`), not a hardcoded first-party list — the federation, not the node, is the product. |

---

# Part III — Sequencing & out-of-scope

1. **W0** (node status page + CORS) — in `auths`, small, independently
   shippable, fixes the "I see nothing" problem this plan started from.
2. **SDK 0.1.16** with `readKelJson` — gates X1.3.
3. **X1 → X2.1/X2.2** — the core loop (search → member → verified KEL) is the
   MVP; ship behind `explorer.auths.dev` as soon as it verifies one real
   member (one exists: the write-path smoke member on network.auths.dev).
4. **X2.3/X2.4 → X3** — anchors, drop-zone, browser-direct.

Out of scope (file issues when the epics start): watcher-grade duplicity
scanning across witnesses (that's `auths-monitor`'s job — the explorer only
*displays* evidence others produce); any write path from the explorer; search
by email/artifact-hash à la sigstore (auths keys aren't email-bound; revisit
when OIDC-bound attestations warrant it); embedding the explorer in the node.

The one-line thesis, restated: **the node stays a dumb, small signer you
check; the explorer is a pretty, untrusted lens whose every claim is
recomputed by the verifier in your own browser.**
