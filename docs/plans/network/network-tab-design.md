# The Network tab — design

**Date:** 2026-07-19 · **Input:** `auths/docs/plans/network/final_spec.md` §6 (Epics I, J)
**Scope:** everything §6 assigns to `auths-site`, plus the one SDK seam it needs.

## What ships

A public **Network** tab at `auths.dev/network` — the product surface of the
Auths Witness Network — backed by real data end-to-end: the market's own
witnessing observations (it is the network's first honest watcher) and a
live-probed witness directory. Plus the market-side Epic I upgrades that make
the page's claims true.

## Decisions

**N1 — The tier is derived, never claimed.** `attestation_checkpoints.anchor_tier`
currently stores whatever tier string the seller's doc claims in `as_of.anchor`
— unverified. That violates the house rule (figures come only from
re-derivation). From now on the worker stores `witness` **iff** the SDK
verified an embedded `FinalizedAnchor` (the SDK call fails closed when an
anchor is present but bad), and `first-seen` otherwise. The SDK reports the
verified quorum shape (`threshold`, set size) in the same result — derivation
lives in the SDK (architecture plan's "SDK-owned derivation"), presentation in
the site.

**N2 — Version-tolerant by design, not by hack.** Production vendored SDK is
0.1.12 (pre-AWN). The site treats the SDK's `anchor` summary as optional:
absent → tier stays `first-seen`. Nothing spoofable either way; when 0.1.13 is
vendored, the `witness` tier lights up with zero site changes. Local dev uses
`AUTHS_SDK_PATH` at the AWN-enabled checkout, so the full path is exercised
now.

**N3 — The web page reads the network through public surfaces only.** The
`/network` page consumes (a) the market's public watcher-feed API and (b) each
directory witness's public `/health` — the same surfaces any stranger gets. No
private channel between the two apps; `MARKET_API_URL` (default
`https://market.auths.dev`) only exists so local dev can point at `:3002`.

**N4 — The directory is checked-in data; liveness is probed.** Witness
directory entries (name, operator, jurisdiction, infra class, member key,
endpoint) live in a typed module. Status is probed server-side at render with
a short timeout and rendered honestly (`up` / `unreachable`); entries without
a public endpoint yet render as `standing up`. A local witness is added via
`AUTHS_LOCAL_WITNESS_URL` so the local network shows live on the local page.
Listing requirement stays what the spec says: pass the published conformance
harness.

**N5 — Money appears once, honestly.** The cloud tiers section (anchoring /
monitoring / pinning) names what each tier meters and takes a request-access
contact. No invented prices pre-launch.

## Changes by repo

### `auths` (one seam)
- `packages/auths-node/src/evidence.rs`: `verify_activity_attestation` result
  gains `"anchor": null | {tier: "witness", threshold, witnesses, cosigners,
  seedId, witnessSetSaid}` — computed from the doc's embedded anchor **after**
  `verify_activity_against_registry` passed (which includes finalization
  verification). Additive; old consumers unaffected.

### `apps/market` (Epic I)
- **I1** `receipts-worker.ts`: consume the SDK result's `anchor` summary; stop
  reading `doc.as_of.anchor`. New migration adds nullable
  `anchor_threshold int` / `anchor_witnesses int` to `attestation_checkpoints`.
- **I2** `badges.tsx` + `e/[slug]`: `proven live` badge carries provenance —
  `market-witnessed` or `quorum-anchored (t-of-N)` from the latest
  checkpoint's verified columns.
- **I3** `GET /api/v1/network/observations`: the market's watcher feed —
  recent observations across live listings (anon client under RLS, coarse
  aggregates only, cached like the other public routes), plus totals.

### `apps/web` (Epic J)
- Drop the `/network → /` redirect; add the **Network** tab to `SiteNav`,
  sitemap entry.
- `app/network/page.tsx` (server component, `revalidate = 60`):
  1. Hero — what the witness layer is for (freshness: rollback, withholding,
     equivocation), and that verification itself stays offline and free.
  2. How it works — `witness-network-diagram.tsx` (Frame/Node toolkit reuse).
  3. The watcher feed — live observations table from the market API (J-side
     face of I3), graceful empty state.
  4. The witness directory (J1) — entries + live-probed status + "join the
     directory" (conformance harness requirement).
  5. Run a witness (J2) — compose quickstart, conformance drive, and the
     hand-this-key-to-your-principal flow.
  6. The cloud network (J3) — three tier cards, request access.
- `src/lib/network/witnesses.ts` (directory data) and
  `src/lib/network/live.ts` (probes + feed fetch, timeouts, never-throw).

## Local proof (the "must")

1. `cargo build -p auths-witness-node -p xtask`; run the node on `:3333` with
   a real registry dir; drive it with `xtask witness-conformance --url`.
2. Web dev on `:3000` with `AUTHS_LOCAL_WITNESS_URL=http://127.0.0.1:3333` and
   `MARKET_API_URL=http://localhost:3002`; market dev on `:3002`.
3. `/network` shows the local witness live in the directory and the real
   watcher feed; if the end-to-end anchor loop is reproducible locally (gateway
   anchor leg), verify an anchored `activity.json` with the locally built SDK
   and confirm the `witness` tier derivation.

## Vercel

No new required env. Web defaults `MARKET_API_URL` to the public market URL;
the directory's first-party entry renders `standing up` until the quorum
deploys; the feed endpoint serves existing Supabase data. Deploy = push to
`main` (both Vercel projects build from this repo), then verify
`auths.dev/network` and `market.auths.dev/api/v1/network/observations`.
