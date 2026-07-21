# Witness node URLs — the intuition & the scheme

**Status:** Decided (this doc is the spec) · **Date:** 21 July 2026
**Supersedes:** the earlier draft's open questions — the decisions are made below.

---

## 1. The one idea (everything follows from this)

A witness has **three** distinct things we keep conflating:

| Thing | What it is | Changes? | Used for |
|---|---|---|---|
| **Key** | its member key (`did:key:…`), from its seed | **never** | **trust** — verifying |
| **URL** | where it answers HTTP now | yes (moves host) | **fetch** — where to get bytes |
| **Name** | the human label (`--witness-name`) | yes (rename) | **label** — display only |

> **Fetch by URL. Trust by key. Label by name. Never conflate them.**

- The **URL** is the join key for *reaching* a witness — have it and you can fetch + verify, listed or not.
- The **key** is the join key for *identity* — a node that moves or renames keeps its key; the key is the only thing that is actually *the witness*. Never hardcoded — always read live from `/health`.
- The **name** is only a label.

---

## 2. The domains — who is what

We split cleanly along the trust boundary (the node is the thing you *check*; the explorer is the *lens* that checks it — the lens must never live inside the thing it checks):

| Domain | Is | Runs on |
|---|---|---|
| **`network.auths.dev`** | **the network's front door** — the explorer + directory. Where you go to *see* the network. | Vercel (the explorer app) |
| **`auths-network`, `auths-network-2`, …** | the **witness nodes** — the signers. Each at its own host. | fly (one container each), later other clouds |

So `network.auths.dev` stops being a witness node and becomes the browse
surface. The nodes get boring, numbered, honest names (`auths-network-N`) at
their own URLs. `explorer.auths.dev` stays as an alias of `network.auths.dev`.

**Browse a node:** `network.auths.dev/node/<name-or-host>`.

---

## 3. The URL scheme (what a visitor sees)

`/node/<segment>` — one clean path, no query string in the common case.

| Case | URL | How it resolves |
|---|---|---|
| Listed node, by name | `network.auths.dev/node/auths-network` | segment matches a **directory name** → its URL + curated facts |
| Listed node named by domain | `network.auths.dev/node/w1.auths.dev` | same (if we give it a custom domain and name it that) |
| Unlisted (stranger's) node | `network.auths.dev/node/their-node.example` | segment **looks like a host** → fetch `https://their-node.example`, no listing required |
| Escape hatch (odd port/scheme) | `network.auths.dev/node/label?witness=http://host:3333` | explicit `?witness=` URL wins; rare |

Sub-routes spell out too: `/node/<w>/member/<prefix>`, `/node/<w>/anchor/<seed>`.

**Why this kills `?witness=<self-url>`:** the segment already *is* the address —
a bare name for the listed, a host for everyone else. `?witness=` shrinks to a
rarely-needed escape hatch (non-standard scheme/port/path). No node's normal
"browse me" link needs it.

### `/node/` config → display → alias, at a glance

| Witness type | Configured in code | Displays as | Aliasable? |
|---|---|---|---|
| First-party (listed) | Hardcoded in `packages/witnesses/src/witnesses.ts` — `{ name: 'auths-network', url: 'https://auths-network.fly.dev' }` | `/node/auths-network` | **Yes** — name is a stable alias for the URL; a custom domain is a separate DNS alias |
| Third-party (unlisted) | **Not in code** — the host is in the path (or `?witness=`) | `/node/their-node.example` | **No** — by raw host, until listed |
| Local dev | `AUTHS_LOCAL_WITNESS_URL` (dev only) | `/node/local-dev` | Yes, on that machine only |

The **key is never aliased** — names and URLs alias freely; the member key is the fixed point, read live from `/health`.

---

## 4. Where a URL lives (source-of-truth rules)

- **First-party URL** → hardcoded in the checked-in directory (`packages/witnesses`), version-controlled + reviewable. **Never an env var** (a hidden `AUTHS_W1_URL` is exactly what drifted to `null` and broke the directory). A load-time guard throws if any first-party entry has a null URL.
- **First-party key** → never stored; read live from `/health` (`witness_did`). We can advertise a stale URL (visible, reviewable) but never a stale key.
- **Third-party URL** → never persisted; supplied at browse time via the path/`?witness=`.

---

## 5. How the node's "browse me" link is built (rename-/move-proof)

The status page (`GET /`) knows its own host. It links:

```
https://network.auths.dev/node/<self-host>
```

- Listed node → its host matches a directory entry → shown with the curated name + facts.
- Unlisted node → shown by host, still fully browsable + verifiable. **No listing required.**
- Renamed node → browsing is host-based, so the link still works; only the display label lags until the directory catches up (cosmetic).
- Moved node → its status page emits its **new** host, so its own link works immediately; the directory's old URL goes "unreachable" (a visible prompt to fix), and because the **key is unchanged**, it's provably the same witness at a new address.

---

## 6. The nodes (the diversity plan)

The point of >1 witness is **independence** — a `t-of-N` quorum across distinct
operators, jurisdictions, and clouds. Two Auths-run fly-lhr nodes give *zero*
independence. So:

| Node | Role now | Plan |
|---|---|---|
| **`auths-network`** | the primary — full roles incl. `registry`, holds the real member, currently at `network.auths.dev` | becomes `auths-network`; its witness URL moves off `network.auths.dev` (which becomes the front door) to its own host (`auths-network.fly.dev`, or a custom domain) |
| **`auths-network-2`** | was `auths-w1` — thin: `anchor,kel,cosign`, no `registry`, witnessed nothing, just mirrored the primary | **made real:** add the `registry` role (so it has a roster) and deploy in a **different region** (real infra/jurisdiction diversity — still first-party, but independent failure domain). True multi-cloud (AWS) is the `terraform/` path when we want a second operator-grade leg. |

Honesty we keep on the surface: both are still first-party (same operator), so
the directory should say so — the *most valuable* witness is still the one we
don't run.

---

## 7. Two display nuances to fix while we're here

1. **Roster-less witnesses.** A node without the `registry` role has no roster.
   The explorer's node page must **degrade gracefully** — offer search-by-prefix
   + "this node doesn't publish a roster" — never a bare "unavailable." (And
   first-party browsable nodes should run `registry` — hence §6 for
   `auths-network-2`.)
2. **"Members held" is two things.** The status page counts git-registry
   prefixes (which a node may *mirror* from a peer), not members it has itself
   witnessed (`first_seen_count`). Relabel to distinguish **"registry entries
   (mirrored)"** from **"witnessed here."**

---

## 8. Migration (network.auths.dev: witness → front door)

`network.auths.dev` is a *live* witness the whole network syncs from, so the
order matters — nobody points at it as a witness after it becomes the explorer:

1. Give node 1 a stable alternate URL that already works (`auths-network.fly.dev`, its default fly host).
2. Repoint everything that treats `network.auths.dev` as a *witness* → `auths-network.fly.dev`: the directory entry, `auths-network-2`'s `sync-registry --from`, docs/deploy configs.
3. Rename node 1: `--witness-name auths-network`.
4. **Then** move the `network.auths.dev` DNS from fly → the explorer's Vercel project (the zone is on Vercel, so it's a record repoint).
5. Redeploy the explorer (now at `network.auths.dev`) with the `/node/` scheme; keep `explorer.auths.dev` as an alias.

Step 4 is the only irreversible-ish beat; steps 1–3 make it safe.

---

## 9. Build checklist

- [x] **Explorer** — `/w/…` → `/node/…` (+ `/member/`, `/anchor/`); resolver: name → directory, host → `https://host`, `?witness=` escape hatch; graceful roster-less node page; "members held" relabel. *(live at explorer.auths.dev)*
- [x] **Directory** (`packages/witnesses`) — `auths-network` (url `auths-network.fly.dev`) + `auths-network-2` (url `auths-network-2.fly.dev`); URLs in code + null guard; both labelled "Auths (first-party)".
- [x] **`auths-network-2`** — deployed in `iad` (distinct region) with `--roles anchor,kel,cosign,registry`, its own seed (member key `z6Mkg94iG…`), syncing its registry from `auths-network`; `auths-w1` destroyed.
- [x] **Node status page** — links `/node/<self-host>` at `explorer.auths.dev`; "browse in the network"; "registry entries" relabel. *(live on both nodes)*
- [~] **Migration §8** — steps 1–3 done: node 1 answers at `auths-network.fly.dev`, all witness refs repoint there, `--witness-name auths-network`. **Step 4 (DNS flip) is the one gated beat — not done.**
- [x] Redeploy + verify the whole stack. *(both nodes `/health` 200; explorer resolves both by name and by host)*

---

## 10. Current state (honest)

- **Done and live (this pass):** the `/node/` scheme, `auths-network-2` as a real diverse node (iad, registry role, distinct key), the directory + status-page changes, `auths-w1` retired. Verified end-to-end.
- **The network today:** two genuinely-distinct first-party nodes — `auths-network` (`z6Mkqt4EJ…`, lhr) and `auths-network-2` (`z6Mkg94iG…`, iad) — both full-role, each with its own roster; `auths-network-2` mirrors the primary's registry. Still same operator; the directory says so. The most valuable witness remains the one we don't run.
- **The one thing left, gated on an explicit go:** §8 step 4 — flipping `network.auths.dev` DNS from the witness (fly) to the explorer (Vercel). Everything up to it is done and reversible; that beat repoints a production domain the network depends on, so it stays deliberate. `explorer.auths.dev` is the explorer's stable home meanwhile, and every browse link already points there, so the flip is cosmetic-front-door only, not load-bearing.
