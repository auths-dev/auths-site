# auths-site / apps/market — Architecture Improvement Spec

**Context.** The market became a *real* relying party on 2026-07-19: the
production lambda derives listings itself (SDK 0.1.12), witnessed 5¢→10¢
growth, and set the first `live_proven_at` from its own observations. Getting
there surfaced five distinct classes of production friction, each of which cost
a deploy-debug cycle:

1. **SDK loading** — bun skips napi platform `optionalDependencies`, Turbopack
   can't resolve the binding, so the app carries a bespoke
   `ensure-sdk-binding.mjs` + vendored tree + absolute-path `require`. It works,
   but it's ~90 lines of load-bearing build machinery with a hand-pinned
   version string, and it *masked* the real glibc bug for hours (identical code
   green locally on darwin, dead on the lambda).
2. **No runtime introspection** — diagnosing the lambda's filesystem/loader
   state took three deploys of a temporary debug endpoint. The information was
   trivial; the access path didn't exist.
3. **CDN staleness** — `raw.githubusercontent.com` caches ~5 min per PoP; the
   lambda's edge kept serving the count-1 attestation after publish, so the
   growth observation needed an external retry loop.
4. **RLS silent-empty** — `attestation_checkpoints` had RLS enabled with zero
   policies; the public observations endpoint returned `[]` with no error.
5. **Worker data hygiene** — 27 dead test listings fail derivation on every
   cron tick, and identical observations append duplicate checkpoint rows.

---

## Epic 1 — Deterministic SDK loading

### 1.1 One version source

`@auths-dev/sdk` is pinned in `package.json` **and** hard-coded as
`const VERSION = '0.1.12'` in `scripts/ensure-sdk-binding.mjs`. They drifted
once already mid-upgrade. The script must read the dependency:

```js
// ensure-sdk-binding.mjs
const pkg = JSON.parse(readFileSync(join(appDir, 'package.json'), 'utf8'));
const VERSION = pkg.dependencies['@auths-dev/sdk'];
if (!/^\d+\.\d+\.\d+$/.test(VERSION)) {
  throw new Error(`pin @auths-dev/sdk exactly; got "${VERSION}"`);
}
```

### 1.2 Shrink the machinery as upstream improves

The script exists for two reasons, each with an upstream fix in flight:

- *bun skips platform optionalDeps* → once
  [auths.md](./auths.md) Epic 1.2 publishes a `@auths-dev/sdk-wasm32-wasi`
  fallback (the napi v3 loader already probes for it), any host can load the
  SDK without a platform package — slower, but it turns "verifier unavailable"
  into "verifier slow", which is the right failure mode for a market.
- *the musl mirror hack* (copying the gnu binding under the musl name because
  napi's musl probe misfires under bun) → delete the moment the loader is
  exercised only under real node (Vercel build already runs node; local dev is
  the holdout).

Each removal needs the prod smoke test in Epic 5.1 as its safety net — the
loader saga is exactly where "works on darwin" proves nothing.

### 1.3 Permanent gated runtime diagnosis

The throwaway `/api/debug/verifier` endpoint was the single highest-leverage
debugging tool of the incident (it found both the vendored-tree state and the
napi `cause` chain). Rebuild it as a permanent, CRON-secret-gated route that
answers the questions we actually asked:

```ts
// src/app/api/ops/runtime/route.ts  (authorization: Bearer CRON_SECRET)
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return NextResponse.json({}, { status: 401 });
  const sdk = loadVerifier();
  return NextResponse.json({
    sdkLoaded: !!sdk,
    sdkSurface: sdk ? {
      authenticatePresentation: typeof sdk.authenticatePresentation,
      verifyActivityAttestation: typeof sdk.verifyActivityAttestation,
      fetchRegistry: typeof sdk.fetchRegistry,
    } : loadError(),          // full napi cause-chain, not just the top message
    sdkVersion: vendoredPackageVersion(),
    node: process.version, platform: process.platform, arch: process.arch,
  });
}
```

Rule of thumb this encodes: **any runtime whose environment differs from dev
must be able to describe itself in one authenticated request.** Three deploys
to learn `cwd` is unacceptable twice.

---

## Epic 2 — Attestation freshness and the fetch policy

### 2.1 Bypass CDN staleness for GitHub-hosted attestations

The worker fetches `attestation_url` verbatim; for
`raw.githubusercontent.com` that's a ~5-min-stale-per-PoP view, which directly
delays growth witnessing (and cost an external cron-retry loop tonight). When
the URL matches raw.githubusercontent, fetch through the contents API instead —
authoritative, no CDN lag:

```ts
function freshnessRewrite(url: string): { url: string; headers?: HeadersInit } {
  const m = url.match(
    /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/,
  );
  if (!m) return { url };                       // non-GitHub hosts: fetched as-is
  const [, owner, repo, ref, path] = m;
  return {
    url: `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
    headers: { accept: 'application/vnd.github.raw+json' },
  };
}
```

Unauthenticated rate limit (60/hr/IP) is fine at ~30 listings × 2 fetches per
tick from one egress IP only if ticks are ≥ hourly — pass a token via env when
cadence grows. Sellers on their own hosts are untouched.

### 2.2 Retry inside the worker, not around it

Growth landing is now an *operational* concern solved by an external loop.
Move the policy inside: if the fetched doc's `head` equals the last stored
checkpoint's `head`, that is not an error and not growth — record a heartbeat
(see 3.2) and let the *next scheduled tick* observe change. With 2.1 in place,
same-head means genuinely-unchanged, and no retry loop is needed anywhere.

### 2.3 SDK-owned derivation (cross-repo)

When [auths.md](./auths.md) Epic 2.2 ships
`verifyActivityAttestationFromUrl`, `deriveListing` keeps exactly: the
freshness rewrite decision (2.1), monotonicity vs *our own* stored history, and
persistence. The audit-manifest cross-checks and registry fetch leave this
codebase. The market's differentiation is its witnessing memory, not its wire
handling.

---

## Epic 3 — Worker scale and data hygiene

### 3.1 Bounded concurrency in `deriveAll`

Derivation is sequential per listing; each does 2 HTTP fetches + a registry
clone + crypto. At 29 listings the cron tick already flirts with function
timeouts, and each new seller makes it worse linearly.

```ts
const CONCURRENCY = 5;
const queue = [...listings];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  for (let l = queue.shift(); l; l = queue.shift()) await deriveOne(l);
}));
```

(Registry-fetch caching in [auths.md](./auths.md) Epic 2.3 attacks the same
budget from the other side.)

### 3.2 Append-on-change checkpoints + heartbeat

Tonight's table: four identical `count=1, 5c` rows from repeated ticks. The
witnessing history should record *observations of change*; "I looked and
nothing moved" is a heartbeat, not history.

```sql
alter table listings add column last_derived_at timestamptz;
```

```ts
const changed = !last || last.head !== doc.head;
if (changed) await insertCheckpoint(...);          // history: only state transitions
await supabase.from('listings')
  .update({ last_derived_at: observedAt, ... })    // heartbeat: every successful tick
  .eq('id', listing.id);
```

Growth logic is unchanged (first/last cents in the window); the table stops
growing per-tick; the public observations endpoint stops paginating noise.
`last_derived_at` also gives ops a staleness signal per listing for free.

### 3.3 Quarantine chronically-invalid listings

27 dead `x402-paid-call-*` test listings fail derivation on *every* tick —
wasted fetches, noisy `{invalid: 27}` metrics, and real failures hide in the
noise. Policy: track a consecutive-failure streak; past a threshold (e.g. 7
days of ticks), flip `status` to `delisted-stale` — out of the cron query, out
of public browse, reversible by the seller fixing their attestation and
re-verifying. Plus a one-time cleanup of the known test rows.

### 3.4 Derivation observability

`fail_reason` on the listing row was the debugging hero of the incident — keep
that pattern and extend it: per-tick structured log line
`{slug, outcome, reason?, ms}` and a counter per failure-reason class. The
`{derived, invalid}` summary hid "verifier missing" behind the same number as
"seller's attestation is stale" all night.

---

## Epic 4 — Access-model discipline

### 4.1 RLS-vs-endpoint conformance test

`attestation_checkpoints` had RLS on and zero policies: the anon-client
endpoint returned `[]` — indistinguishable from "no data" — while the
service-role worker wrote rows happily. Silent-empty is the worst failure mode
RLS has, and code review won't catch it (the query is correct!).

Add a CI test against a migrated shadow DB:

```ts
// for each route that reads with the ANON client:
// seed via service client → call route → assert the seeded rows are visible
test('public receipts endpoint sees checkpoints', async () => {
  await service.from('attestation_checkpoints').insert(fixtureRow);
  const res = await GET(reqFor('auths-receipts'));
  expect((await res.json()).observations).not.toHaveLength(0);
});
```

Mechanically: every table read by an anon-path route must have either a
`for select using (true)` policy (public by design, like the witnessing
history — migration `20260719000002`) or an explicit view that narrows it.

### 4.2 Name the two clients

`createSupabaseServerClient` (anon, RLS-bound) and `createServiceClient`
(RLS-exempt) read identically at call sites; picking the wrong one compiles,
runs, and lies. Rename the exports to carry the trust level —
`anonClient()` / `serviceClient()` — and lint (`no-restricted-imports`) so
route handlers can't import the service client except via the worker/ops
modules that are allowed to.

---

## Epic 5 — Prod-parity testing

The whole incident chain — glibc, missing git binary, CDN PoP behavior — shares
one root: **the lambda is a different computer than the laptop**, and nothing
exercised its differences before deploy.

### 5.1 Lambda-runtime smoke in CI

Cheap, catches the entire loader class (cross-ref [auths.md](./auths.md)
Epic 1.1, which gates the SDK side at its source):

```yaml
- name: SDK loads on Amazon Linux 2023
  run: |
    node scripts/ensure-sdk-binding.mjs
    docker run --rm -v "$PWD:/app" -w /app amazonlinux:2023 sh -ec '
      dnf -q install -y nodejs >/dev/null
      node -e "
        const p = process.cwd() + \"/vendor/auths-sdk/node_modules/@auths-dev/sdk\";
        const s = require(p);
        for (const fn of [\"authenticatePresentation\",\"verifyActivityAttestation\",\"fetchRegistry\"])
          if (typeof s[fn] !== \"function\") { console.error(\"missing \" + fn); process.exit(1); }
        console.log(\"lambda-parity OK\")"
    '
```

Note the vendor path must be built for linux in this step — run the ensure
script with a platform override, or run it inside the container.

### 5.2 Post-deploy synthetic check

After every prod deploy, hit `/api/ops/runtime` (Epic 1.3) and assert
`sdkLoaded && every surface fn === 'function'`; then trigger the cron and
assert `derived > 0`. Five lines in the deploy pipeline; would have flagged
both broken deploys tonight within a minute instead of after manual cron runs.

### 5.3 Merchant loop against previews

`tests/e2e/full-merchant-loop.mjs` runs against localhost. Point it at the
Vercel *preview* URL in CI (previews share the prod runtime exactly), with a
dedicated test seller row and the canary attestation repos. That makes
"verifier loads and derives in the real runtime" a merge gate instead of a
production discovery.
