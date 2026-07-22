# auths — Architecture Improvement Spec

**Context.** During the 2026-07-19 production run, three separate releases were
needed to get one SDK function working inside a Vercel lambda. None of the three
failures were in domain logic — all were in the *delivery machinery* or in
*implicit environmental contracts* the code didn't state:

1. The published `@auths-dev/sdk-linux-x64-gnu` binding silently required
   GLIBC_2.38 (built on `ubuntu-latest`); AWS Lambda / Amazon Linux 2023 has
   2.34. Nothing in CI measured or asserted the baseline.
2. The relying-party worker shelled out to `git`, which serverless hosts don't
   have (`spawn git ENOENT`) — the fetch wire lived in the consumer, violating
   our own "the report is the only API / RPs re-implement no wire" rule.
3. The gateway's identity chain shells the *installed* `auths` CLI
   (`AUTHS_BIN`), so a stale `~/.cargo/bin/auths` (0.1.6) silently wrote
   pre-fix registry state (`delegator: null`) even though every freshly-built
   binary in the repo was correct. Version skew between our own components
   produced a data-level bug.

Also observed: a CI step that *passed green while doing nothing* (corepack broke
`pnpm` inside the napi-rs docker image; without `set -e` the step exited 0 with
no artifact, and `upload-artifact`'s missing-file outcome is a warning), and a
default `BundleGrant` that made honest evidence read as `expired`.

The epics below eliminate these classes, not just the instances.

---

## Epic 1 — Self-verifying release artifacts

The release train (7 workflows fanning out from a tag) is healthy, but it
publishes artifacts nobody re-checks. Tonight's glibc bug shipped in v0.1.9 and
v0.1.10 and was only found by a *consumer* failing in production.

### 1.1 Portability gate for native bindings

Assert the glibc ceiling of every linux binding *in the build job*, before any
artifact is uploaded. A binding that can't load on Amazon Linux 2023 must fail
the build, not a customer.

```yaml
# publish-node.yml, after the build step (linux jobs)
- name: Assert glibc baseline <= 2.26
  run: |
    set -e
    MAX=$(strings packages/auths-node/auths.*.node \
      | grep -oE 'GLIBC_2\.[0-9]+' | sort -t. -k2 -n -u | tail -1)
    echo "max requirement: $MAX"
    [ "$(echo "$MAX" | cut -d. -f2)" -le 26 ] || {
      echo "::error::binding requires $MAX; Lambda (AL2023) has 2.34, our floor is 2.26"
      exit 1
    }
```

Add a **load test in the actual target runtime**, which catches everything the
symbol scan can't (missing shared libs, wrong arch, napi probe misfires):

```yaml
- name: Load test on Amazon Linux 2023
  run: |
    docker run --rm -v "$PWD/packages/auths-node:/pkg" amazonlinux:2023 sh -ec '
      dnf -q install -y nodejs >/dev/null
      node -e "const s=require(\"/pkg/index.js\"); \
        if (typeof s.verifyPresentation !== \"function\") process.exit(1); \
        console.log(\"AL2023 load OK\")"
    '
```

### 1.2 One cross-build mechanism, both linux arches

Today linux-x64 builds inside `napi-rs/nodejs-rust:lts-debian` (with a
hand-rolled `rustup toolchain install 1.93` because the image ships 1.82), and
linux-arm64 builds natively on `ubuntu-24.04-arm` with a *high* glibc baseline
because the aarch64 cross image can't compile `aws-lc-sys` (tracked in
auths#393). Two mechanisms, one of which doesn't meet the portability bar.

Evaluate in order:
1. `napi build --use-napi-cross` (manylinux2014 sysroot, glibc 2.17 floor,
   works for both arches from one x64 runner). This is napi v3's intended path
   and removes the docker action, the rustup dance, and the corepack hazard in
   one move.
2. If `aws-lc-sys` blocks napi-cross too, replace it: the binding's TLS need is
   accidental (see Epic 2) — removing openssl/aws-lc from the graph may be the
   cheaper fix than fighting cross C toolchains.

Exit criterion: both linux bindings built by the same mechanism, both passing
the 1.1 gate.

### 1.3 Loud-by-default CI steps

The corepack failure taught us a build step can pass while producing nothing.
Rules to encode (an xtask lint over `.github/workflows/*.yml` can enforce the
first two):

- Every multi-line `run:` and every `docker-run` script starts with `set -e`.
- Every build step that exists to produce a file ends by *stat-ing that file*
  (`ls auths.*.node`) so absence is an error at the source, not three jobs later.
- `upload-artifact` steps for release binaries set `if-no-files-found: error`.

### 1.4 Post-release artifact verification job

A `verify-release.yml` triggered on `release: published` that consumes each
channel exactly like a user and fails loudly (this would have caught the glibc
bug the hour v0.1.9 shipped):

- `npm install @auths-dev/sdk@$TAG` + `require()` smoke on: AL2023 container,
  `node:22-alpine` (musl path), `ubuntu-latest`, macOS.
- `pip install auths==$TAG` + `import auths` on manylinux + musllinux.
- `brew install` the tap formula in a macOS job.
- `cargo add auths-verifier@$TAG` compile check.

### 1.5 Auto re-vendor dispatch to auths-mcp

Re-vendoring `@auths-dev/mcp` is a manual `gh workflow run` after every release
and was forgotten for 0.1.10 and 0.1.11 (0.1.12's is also pending as of this
writing). Fire it from the release itself:

```yaml
# release.yml, final job
- name: Trigger auths-mcp re-vendor
  run: |
    gh workflow run release.yml -R auths-dev/auths-mcp \
      -f auths_version="${GITHUB_REF_NAME#v}" -f dry_run=false
  env:
    GH_TOKEN: ${{ secrets.AUTHS_MCP_DISPATCH_TOKEN }}
```

See [auths-mcp.md](./auths-mcp.md) Epic 1 for the receiving side.

---

## Epic 2 — One TLS stack; the SDK owns the whole wire

`fetchRegistry` (added in v0.1.12) was the right move — the relying party no
longer re-implements the registry fetch. But it was shipped pragmatically with
`git2 = { features = ["https", "vendored-openssl"] }`, so the node binding now
carries **two TLS stacks** (reqwest→rustls and libgit2→vendored openssl): bigger
binary, two CVE surfaces, and openssl is exactly the dependency that blocks
cross-compilation (see 1.2).

### 2.1 rustls smart-subtransport for git2

Keep the workspace's git2 transportless (that was a deliberate choice) and
register a custom smart-HTTP subtransport backed by the rustls stack we already
ship — the same shape cargo uses with curl. libgit2 keeps doing the protocol;
our code only moves HTTPS bytes.

```rust
// auths-infra-git/src/rustls_transport.rs (sketch)
use git2::transport::{Service, SmartSubtransport, SmartSubtransportStream, Transport};

struct RustlsHttp;

impl SmartSubtransport for RustlsHttp {
    fn action(&self, url: &str, service: Service)
        -> Result<Box<dyn SmartSubtransportStream>, git2::Error>
    {
        // GET  {url}/info/refs?service=git-upload-pack   (UploadPackLs)
        // POST {url}/git-upload-pack                     (UploadPack, stateless-rpc)
        Ok(Box::new(HttpStream::new(url, service)))
    }
    fn close(&self) -> Result<(), git2::Error> { Ok(()) }
}

/// Call once at binding init, before any fetch.
pub fn register() {
    unsafe {
        git2::transport::register("https", |remote| {
            Transport::smart(remote, /* rpc */ true, RustlsHttp)
        }).ok();
    }
}
```

Then delete `vendored-openssl`/`https` from the binding's git2 features. Exit
criteria: binding size shrinks, `cargo tree -i openssl-sys` is empty, 1.2's
cross build no longer needs a C TLS library.

### 2.2 Collapse the market worker into one SDK call

The worker still choreographs: fetch `activity.json` → fetch sibling
`audit.json` → subject/manifest cross-checks → `fetchRegistry` →
`verifyActivityAttestation` → monotonicity. Everything except storage and
policy is wire, and wire belongs here. Ship:

```rust
/// Everything between "here is an attestation URL" and a verdict, in-process:
/// fetch doc + audit.json, cross-check subjects, fetch the registry, verify
/// signature + delegation. Returns the versioned JSON verdict the market
/// stores; the caller keeps only monotonicity-vs-own-history and persistence.
#[napi]
pub async fn verify_activity_attestation_from_url(attestation_url: String) -> Result<String>
```

The market's `deriveListing` shrinks to ~15 lines (cross-ref:
[auths-site-market.md](./auths-site-market.md) Epic 2). Every future RP —
another marketplace, a payment processor — gets the correct flow for free.

### 2.3 Registry fetch cache

`fetchRegistry` re-clones per verification. Registries are small but the market
verifies ~30 listings per cron tick. Key a cache on the remote's advertised
head (`ls-remote refs/auths/registry` costs one round-trip); fetch only on
change. This mirrors the head-keyed byte cache `resolve_chain` already uses —
same idiom, one layer down.

---

## Epic 3 — Kill the version-skew class: stop shelling the CLI

The `delegator: null` incident is the important lesson of the night. The fix
(v0.1.10) was correct and released — and production still broke, because
`chain.rs` builds the identity chain by shelling whatever `auths` binary
`AUTHS_BIN`/PATH points at. The gateway's *data correctness* depended on the
user's install state. That entire bug class — "our binary A behaves differently
depending on which version of our binary B is installed" — should not exist.

### 3.1 In-process chain construction

`Chain::build` currently runs `auths id create`, `auths id agent add`, and git
tree surgery via subprocesses. All of these are auths-sdk workflows already (or
belong there per the SDK-orchestrates rule). Replace the subprocess ceremony
with direct SDK calls:

```rust
// auths-mcp-gateway/src/chain.rs (target shape)
use auths_sdk::workflows::identity::{CreateIdentity, DelegateAgent};

impl Chain {
    pub fn build(lab: &Path, scope: &[String], clock: &dyn Clock) -> Result<Self, ChainError> {
        let org = GitIdentityStorage::open_or_init(lab.join("registry"))?;
        let root = CreateIdentity::run_or_resume(&org, clock.now())?;   // idempotent
        let agent = DelegateAgent::run_or_resume(&org, &root, scope, clock.now())?; // resume = 1eeb7124 semantics, in-process
        // materialize_agent_machine stays: pure git tree surgery, no CLI involved
        ...
    }
}
```

Notes:
- `run_or_resume` absorbs the agent-resume feature added in `1eeb7124` — the
  resume probe stops being "parse `git ls-tree` output" and becomes a typed
  registry read.
- The CLI keeps working the same way — it calls the same workflows. One
  implementation, two frontends, zero skew.
- `AUTHS_BIN` stays only for the signing-ceremony template warm-up until that,
  too, moves in-process.

### 3.2 Cached-state integrity audit

`state.json` is a cache of KEL replay; tonight proved caches written by old
code outlive the fix. Two mechanisms:

- **Verification-side (cheap, do first):** `get_key_state`'s cache-hit path
  trusts `cached.is_valid_for(&tip.said)`. Add a debug-assert-level audit and a
  CLI surface — `auths id verify-cache [--repo]` — that replays every identity
  and diffs against the cached state, reporting field-level divergence.
- **Schema-version the cache:** stamp `CachedStateJson` with a
  `stateVersion: u32`; bump it whenever `compute_state_after_event` changes
  semantics. Version mismatch → recompute and rewrite. The v0.1.10 fix would
  then have *healed* existing registries instead of leaving pre-fix state on
  disk indefinitely.

### 3.3 Typed access to cached state

The false-negative during the incident (`json.get("delegator")` on the wrapper
instead of `.state.delegator`) shows the on-disk nesting is a trap for every
consumer that reaches around the API. Document the wrapper in the registry
format doc, and have `auths id show --json` expose the *flattened* state so
operators and scripts never touch the raw file.

---

## Epic 4 — Honest verdicts need honest inputs

The evidence bundle for a genuinely-authorized, on-chain-settled call verified
as `expired` — because `receipts_server` without `AUTHS_RECEIPTS_GRANT`
synthesizes a default grant whose validity window trails "now". An honest
machine emitted a misleading verdict from a fabricated input.

### 4.1 Derive the grant from the anchored scope seal

The KEL already carries the truth: the wrap anchored a scope seal with the
delegation's scope, budget, and TTL. The receipts server should *derive*
`BundleGrant` from that seal, and only accept `AUTHS_RECEIPTS_GRANT` as an
explicit override:

```rust
let grant = match env("AUTHS_RECEIPTS_GRANT") {
    Some(raw) => serde_json::from_str::<BundleGrant>(&raw)?,
    None => BundleGrant::from_anchored_seal(&registry, &agent)   // the KEL's own terms
        .ok_or(ConfigError::NoGrantAndNoSeal)?,                  // fail closed, never fabricate
};
```

A fabricated default window is worse than refusing: it produces *wrong
evidence*. If neither seal nor env is available, the call verdict should be
`unverifiable(no-grant)`, never `expired`.

### 4.2 Split call-time validity from as-of status

`CallVerdict::Expired` currently conflates "the call was made outside the
mandate window" (damning) with "the mandate has since lapsed" (routine — every
mandate lapses eventually). Give the report both facts, per the
report-is-the-only-API rule:

```jsonc
"verdicts": {
  "call": "authorized",          // judged at record.receipt.at, the call's own instant
  "mandate": "lapsed",           // judged at the anchor instant (as-of H)
  "log": "consistent"
}
```

RPs act on `call`; `mandate` is context. Today a retailer refunds a legitimate
purchase because the verdict string says `expired`.

### 4.3 Wire-name conformance from the schemas

`budgetBasis: "settled-usd"` was my *first guess* from the field's doc comment;
the wire wants `single-rail`/`cross-rail`. We embed `RECEIPTS_V1_SCHEMA` —
enforce it both ways: a test that round-trips every serde enum in the wire
types through the embedded schema's `enum` lists, so a rename in either place
fails the build. Doc comments should quote wire literals exactly.

---

## Epic 5 — Seller ergonomics: spend → listed in one command

Getting one seller live tonight took: wrap, `export-attestation` with four
DIDs/flags, two manual `git push --force` invocations with refspec syntax, a
clone-commit-push of an activity repo, then market cron. Every step is scripted
in a maintainer's head. See the consuming side in
[auths-site-market.md](./auths-site-market.md) Epic 2 and the shim in
[auths-mcp.md](./auths-mcp.md) Epic 4.

### 5.1 Infer what the lab already knows

A single-agent live-dir has exactly one delegation. `export-attestation
--live-dir X` should infer `--agent`/`--root` (erroring only on ambiguity), and
default `--out` beside the log:

```
auths-mcp-gateway export-attestation --live-dir ~/lab   # that's the whole command
```

### 5.2 `publish-activity`: the one-shot

```
auths-mcp-gateway publish-activity \
  --live-dir ~/lab \
  --registry-remote https://github.com/acme/agent-registry \
  --activity-remote https://github.com/acme/agent-activity
```

Does: export attestation → push `refs/auths/*` + a `main` mirror to the
registry remote (the exact force-push refspec dance done by hand tonight) →
commit+push `activity.json` + `audit.json` to the activity remote. Remotes are
remembered in the lab dir after first use, so steady-state is
`publish-activity --live-dir ~/lab`. Cron-able: sellers publish on a schedule
and the market's witnessed-growth badge takes care of itself.

### 5.3 Conflict UX for `id agent add`

With gateway resume shipped, the raw CLI error `an agent key already exists
under alias 'agent'` should teach: suggest `--reuse` (resume the existing
delegation) and `--label <new>` as the two ways forward, in the error's
`suggestion` field like every other AUTHS-E code.

---

## Epic 6 — Repo hygiene

### 6.1 Pay the parked lint debt

Main CI is red (parked deliberately mid-release on 2026-07-19). Exact items,
all in `crates/auths-storage/src/git/adapter.rs`: unused `DipEvent` import in
the test module (×2 occurrences), `clone_on_copy` on `KeriSequence` at ~4268
and ~4520 (`icp.s.clone()` → `icp.s`), one `cargo fmt` diff at ~3081. One
commit, agent-signed.

### 6.2 Changed-crates-only lint for humans

Full-workspace clippy locally is unacceptable on this machine (operator
feedback, twice). Add `cargo xtask quick-lint`: diff against merge-base, map
changed files → owning crates, run `cargo fmt --check -p` and
`cargo clippy -p ... --no-deps` on those only. CI stays the full gate; the
xtask makes the fast path *correct* instead of "skip linting and let CI go red".
