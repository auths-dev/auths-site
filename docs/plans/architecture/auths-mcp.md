# auths-mcp — Architecture Improvement Spec

**Context.** auths-mcp is the distribution and integration surface of the
gateway: the `@auths-dev/mcp` npm shim (re-vendored gateway binaries), and the
payments examples (notably the x402 adapter used for every real base-sepolia
settle in the 2026-07-19 run). Three friction classes showed up:

1. **Distribution lag** — the shim re-vendor is a manual workflow dispatch
   after each auths release. It was run for 0.1.9 and then forgotten: as of
   this writing `@auths-dev/mcp` still vendors 0.1.9 while the SDK is at
   0.1.12 — three releases of drift, including the agent-resume feature the
   attestation story depends on.
2. **Session lifecycle surprises** — a restarted `wrap` used to mint a fresh
   agent (fixed upstream by gateway agent-resume); the failure mode before the
   fix was a bare `an agent key already exists under alias 'agent'` with no
   path forward. Test-mode vs real settlement is decided by *env-var presence*,
   which is invisible in the command line that gets copy-pasted.
3. **Adapter fragility under concurrency** — two labs sharing one settle wallet
   raced on the account nonce: `replacement transaction underpriced`, a hard
   error surfaced all the way up through the MCP result.

---

## Epic 1 — Distribution automation

### 1.1 Re-vendor fires from the auths release

The sending side is specced in [auths.md](./auths.md) Epic 1.5 (a
`workflow_dispatch` fired by the release workflow). On this repo's side,
`release.yml` needs to be safe to fire automatically:

- **Idempotent**: if `@auths-dev/mcp@<version>` already exists on npm, exit 0
  with a skip notice (same pattern as auths' publish-node skip step) — a
  re-fired tag must not fail the pipeline.
- **Asset-gated**: the vendor step downloads
  `auths-mcp-gateway-<platform>.tar.gz` from the GitHub release; assert every
  platform asset exists *before* publishing anything, so a partially-uploaded
  release produces no shim at all rather than a shim missing one platform.

```yaml
- name: All gateway assets present?
  run: |
    set -e
    for p in darwin-arm64 linux-x64 linux-arm64 win32-x64; do
      gh release view "v${{ inputs.auths_version }}" -R auths-dev/auths \
        --json assets --jq '.assets[].name' | grep -qx "auths-mcp-gateway-$p.tar.gz" \
        || { echo "::error::missing asset for $p"; exit 1; }
    done
```

### 1.2 Backfill and drift alarm

Immediate action: dispatch re-vendors for 0.1.12 (0.1.10/0.1.11 can be
skipped — nothing pins them). Then add a scheduled job (daily) that compares
`npm view @auths-dev/mcp version` against the latest auths release tag and
opens/updates a single tracking issue when they diverge — the alarm for
whenever automation breaks silently, which is exactly how the current 3-version
drift happened.

---

## Epic 2 — Wrap session lifecycle UX

### 2.1 Surface resume decisions

Gateway agent-resume (auths `1eeb7124`) made restarts correct; make them
*legible*. On startup, wrap should print which path it took:

```
auths-mcp-gateway wrap: resumed agent did:keri:EL4aRe… (delegated 2026-07-19T15:35Z under did:keri:EKcZ0v…)
auths-mcp-gateway wrap: scope=paid.call budget=$1 ttl=6h (anchored at delegation; flags on resume do not widen it)
```

That second line matters: on resume, `--scope`/`--budget`/`--ttl` flags are
*not* re-anchored (the seal from delegation time governs). Today a user who
restarts with `--budget '$50'` silently keeps the $1 seal — correct and
fail-closed, but it must be said out loud or it will be filed as a bug.

### 2.2 Lab config instead of flag archaeology

Steady-state labs re-type the same six flags. Make the lab dir self-describing:

```toml
# <live-dir>/auths-mcp.toml — written on first wrap, read on every wrap
[wrap]
scope   = ["paid.call"]
budget  = "$1"
ttl     = "6h"
rail    = "x402"

[publish]                       # consumed by publish-activity (Epic 4)
registry_remote = "https://github.com/acme/agent-registry"
activity_remote = "https://github.com/acme/agent-activity"
```

Precedence: explicit flag > lab config > built-in default, with the resume
caveat from 2.1 (anchored seal wins regardless). `wrap --live-dir ~/lab -- node
server.mjs` becomes the whole steady-state command.

### 2.3 Explicit settlement mode

Tonight's real-money calls were triggered by `--test-mode` *plus the presence
of `X402_WALLET_PRIVATE_KEY` etc.* — the flag says "test" while the wallet env
silently upgrades settles to real on-chain transfers. That's an unacceptable
ambiguity for a payments tool. Make mode a single explicit axis:

```
--settle=simulated   # no rail traffic at all
--settle=testnet     # real rail, test network (base-sepolia) — requires wallet env
--settle=live        # real network — requires wallet env AND --yes-i-mean-live
```

Refuse to start when the flag and the provided env disagree (e.g.
`--settle=simulated` with a wallet key present → warn; `--settle=testnet`
without a wallet → error listing the missing vars). The current `--test-mode`
maps to `testnet` during a deprecation window.

---

## Epic 3 — Payment adapter robustness

### 3.1 Nonce discipline in the x402 adapter

`examples/payments/adapters/x402-adapter/settle.mjs` submits
`transferWithAuthorization` transactions with viem's default nonce handling;
two concurrent labs sharing a wallet raced to `replacement transaction
underpriced`, and the loss surfaced as a hard MCP error. Serialize per wallet
and retry the known-transient class:

```js
// settle.mjs — one in-flight settle per wallet, bounded retry on nonce races
const walletLocks = new Map();
async function withWalletLock(addr, fn) {
  const prev = walletLocks.get(addr) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  walletLocks.set(addr, next.catch(() => {}));
  return next;
}

const TRANSIENT = /replacement transaction underpriced|nonce too low/i;
async function submitWithRetry(send, tries = 3) {
  for (let i = 0; ; i++) {
    try { return await send(); }
    catch (e) {
      if (i + 1 >= tries || !TRANSIENT.test(String(e))) throw e;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));   // one block, then two
    }
  }
}
```

The gateway's spend-log semantics already handle the retry correctly (the
charge is recorded only on settle success), so this is purely adapter-local.

### 3.2 Adapter conformance harness

The x402 adapter is the de-facto reference for "how a paid tool behaves behind
wrap", and the market's prober imitates it. Extract the implicit contract into
a runnable conformance script in this repo — spawn any adapter, then assert:
402-style requirements shape on unpaid calls, `paid_call` happy path with
`amount_atomic`/`network`/`endpoint`, settle response carrying
`charge_ref`, and the error surface for underfunded/expired cases. New rails
(stripe-style auth-capture, ACH-shaped delays) get built against the harness
instead of against a memory of what x402 did.

---

## Epic 4 — The seller journey, end to end

The full path a seller walks today: wrap a tool → agent spends → export the
attestation (4 flags) → force-push registry refs with hand-written refspecs →
clone/commit/push an activity repo → market witnesses. Six manual steps, two of
which involve `git push --force 'refs/auths/*:refs/auths/*'` — that is not a
product surface, it's an incantation.

The one-shot lives in the gateway
([auths.md](./auths.md) Epic 5.2, `publish-activity`) and reads its remotes
from the lab config (Epic 2.2 here). This repo's parts:

- **Shim passthrough**: `npx @auths-dev/mcp publish-activity …` must reach the
  vendored gateway unchanged (the shim is already argv-passthrough; add the
  command to its README and smoke test).
- **Docs**: the seller quickstart currently documents the six-step dance;
  rewrite around `wrap` → `publish-activity` → "watch your listing turn
  proven-live", with the market's witnessing rules
  ([auths-site-market.md](./auths-site-market.md) Epic 2) linked as the
  explanation of *when* the badge appears — including the note that the badge
  needs two observations with growth, so publishing on a schedule (cron the
  one-shot) is the intended steady state.
- **Template**: `auths-dev/auths-tool-template` gets the lab config file and a
  scheduled `publish-activity` GitHub Action, so a new seller's repo is
  born publishing.
