# Namespace Verification Adapter Spec

## Problem

Anyone can claim any package name on any ecosystem today. There's no proof that the person claiming `npm/react` actually controls that package on npmjs.com. This creates squatting, confusion, and erodes trust.

## Solution

Proof-of-ownership verification for namespace claims. Before you can claim `npm/my-package` on Auths, you prove you can publish to it on the upstream registry.

Same pattern as GitHub platform claims — but for package registries instead of forges.

## Architecture

Ports/adapters. One trait defines the verification contract. Each ecosystem gets an adapter. The SDK orchestrates, the CLI presents, the registry validates.

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  auths-cli   │────▶│    auths-sdk     │────▶│  auths-registry  │
│  (commands/  │     │  (workflows/     │     │  (routes/        │
│   namespace) │     │   namespace.rs)  │     │   namespace.rs)  │
└─────────────┘     └────────┬─────────┘     └──────────┬───────┘
                             │                          │
                    ┌────────▼─────────┐       ┌────────▼───────┐
                    │  auths-core      │       │  sequencer     │
                    │  (ports/         │       │  (validates    │
                    │   namespace.rs)  │       │   proof before │
                    └────────┬─────────┘       │   appending)   │
                             │                 └────────────────┘
                    ┌────────▼─────────┐
                    │  auths-infra-http │
                    │  (adapters per    │
                    │   ecosystem)      │
                    └──────────────────┘
```

## The Port (trait)

Lives in `auths-core/src/ports/namespace.rs`. This is the only thing ecosystem contributors need to understand.

### Shared types (in `auths-core/src/ports/namespace.rs`)

These types are used across the trait, adapters, SDK, and registry. Strong typing
prevents stringly-typed bugs at compile time.

```rust
use auths_verifier::CanonicalDid;
use url::Url;

/// Closed set of supported package registries. Adding a new ecosystem is a
/// compile-time-visible change — the compiler flags every match arm that
/// needs updating.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Ecosystem {
    Npm,
    Pypi,
    Cargo,
    Docker,
    Go,
    Maven,
    Nuget,
}

impl Ecosystem {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Npm => "npm",
            Self::Pypi => "pypi",
            Self::Cargo => "cargo",
            Self::Docker => "docker",
            Self::Go => "go",
            Self::Maven => "maven",
            Self::Nuget => "nuget",
        }
    }

    pub fn parse(s: &str) -> Result<Self, NamespaceVerifyError> {
        match s.to_lowercase().as_str() {
            "npm" => Ok(Self::Npm),
            "pypi" => Ok(Self::Pypi),
            "cargo" | "crates.io" => Ok(Self::Cargo),
            "docker" => Ok(Self::Docker),
            "go" => Ok(Self::Go),
            "maven" => Ok(Self::Maven),
            "nuget" => Ok(Self::Nuget),
            _ => Err(NamespaceVerifyError::UnsupportedEcosystem(s.to_string())),
        }
    }
}

/// Validated package name. Non-empty, no control characters, no path traversal.
/// Ecosystem-specific rules (e.g. npm scoped packages) are validated by the
/// adapter, not here — this just enforces universal invariants.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct PackageName(String);

impl PackageName {
    pub fn parse(s: &str) -> Result<Self, NamespaceVerifyError> {
        let trimmed = s.trim();
        if trimmed.is_empty() {
            return Err(NamespaceVerifyError::InvalidPackageName("empty".into()));
        }
        if trimmed.contains(|c: char| c.is_control()) {
            return Err(NamespaceVerifyError::InvalidPackageName("control chars".into()));
        }
        if trimmed.contains("..") || trimmed.starts_with('/') {
            return Err(NamespaceVerifyError::InvalidPackageName("path traversal".into()));
        }
        Ok(Self(trimmed.to_string()))
    }

    pub fn as_str(&self) -> &str { &self.0 }
}

/// Opaque verification token. Prefixed, hex-encoded suffix, collision-resistant.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct VerificationToken(String);

const TOKEN_PREFIX: &str = "auths-verify-";

impl VerificationToken {
    /// Generate a new random token: `auths-verify-{16 hex chars}`.
    pub fn generate() -> Self {
        use rand::Rng;
        let bytes: [u8; 8] = rand::thread_rng().gen();
        Self(format!("{}{}", TOKEN_PREFIX, hex::encode(bytes)))
    }

    pub fn as_str(&self) -> &str { &self.0 }

    /// Parse and validate a token string. Checks the prefix and that the
    /// suffix is valid hex. Does NOT hardcode a length — if we change the
    /// random byte count in `generate()`, existing tokens still parse.
    pub fn parse(s: &str) -> Result<Self, NamespaceVerifyError> {
        let suffix = s.strip_prefix(TOKEN_PREFIX).ok_or_else(|| {
            NamespaceVerifyError::ProofInvalid {
                reason: format!("token must start with '{TOKEN_PREFIX}'"),
            }
        })?;
        if suffix.is_empty() || !suffix.chars().all(|c| c.is_ascii_hexdigit()) {
            return Err(NamespaceVerifyError::ProofInvalid {
                reason: "token suffix must be non-empty hex".into(),
            });
        }
        Ok(Self(s.to_string()))
    }
}
```

### The Port (trait)

```rust
/// Proof that the caller controls a package on an upstream registry.
pub struct NamespaceOwnershipProof {
    pub ecosystem: Ecosystem,
    pub package_name: PackageName,
    /// URL of the proof artifact (e.g. published package, Gist, DNS record).
    pub proof_url: Url,
    /// The verification method used.
    pub method: VerificationMethod,
    /// When the proof was created (server-assigned, not client-supplied).
    pub verified_at: chrono::DateTime<chrono::Utc>,
}

pub enum VerificationMethod {
    /// Published a tarball/package containing a verification token.
    PublishToken,
    /// API-based ownership check (e.g. crates.io owners → GitHub match).
    ApiOwnership,
    /// DNS TXT record on a custom domain.
    DnsTxt,
}

/// Verifies that an identity controls a package on an upstream registry.
///
/// Each ecosystem implements this trait. The SDK calls it during
/// `auths namespace claim`. The registry server re-verifies server-side
/// before accepting the claim into the transparency log.
#[async_trait]
pub trait NamespaceVerifier: Send + Sync {
    /// The ecosystem this verifier handles.
    fn ecosystem(&self) -> Ecosystem;

    /// Start the verification flow. Returns instructions for the user
    /// (e.g. "publish this token as a new version" or "run this command").
    async fn initiate(
        &self,
        package_name: &PackageName,
        did: &CanonicalDid,
    ) -> Result<VerificationChallenge, NamespaceVerifyError>;

    /// Check whether the user completed the challenge.
    /// Called after the user says they've done the required step.
    async fn verify(
        &self,
        package_name: &PackageName,
        did: &CanonicalDid,
        challenge: &VerificationChallenge,
    ) -> Result<NamespaceOwnershipProof, NamespaceVerifyError>;
}

/// A challenge is bound to a specific (ecosystem, package, identity) triple.
/// This prevents challenge-swapping attacks where someone reuses a token
/// issued for a different package or identity.
pub struct VerificationChallenge {
    /// The ecosystem this challenge was issued for.
    pub ecosystem: Ecosystem,
    /// The package this challenge was issued for.
    pub package_name: PackageName,
    /// The identity this challenge was issued for.
    pub did: CanonicalDid,
    /// Token the user must place where the verifier can find it.
    pub token: VerificationToken,
    /// Human-readable instructions for the user.
    pub instructions: String,
    /// How long the challenge is valid.
    pub expires_at: chrono::DateTime<chrono::Utc>,
}

/// Error codes: AUTHS-E44xx (namespace verification block).
/// Each variant maps to a stable code for `auths error AUTHS-E44xx` lookups
/// and structured JSON output.
#[derive(Debug, thiserror::Error)]
pub enum NamespaceVerifyError {
    /// AUTHS-E4401: The ecosystem is not supported.
    #[error("unsupported ecosystem: {0}")]
    UnsupportedEcosystem(String),

    /// AUTHS-E4402: The package name is invalid.
    #[error("invalid package name: {0}")]
    InvalidPackageName(String),

    /// AUTHS-E4403: The package doesn't exist on the upstream registry.
    #[error("package not found on upstream registry")]
    PackageNotFound,

    /// AUTHS-E4404: The challenge token was not found — user hasn't completed the step.
    #[error("verification token not found — complete the challenge first")]
    ProofNotFound,

    /// AUTHS-E4405: The proof was found but didn't match (wrong token, wrong publisher).
    #[error("proof invalid: {reason}")]
    ProofInvalid { reason: String },

    /// AUTHS-E4406: The challenge expired before verification.
    #[error("verification challenge expired")]
    Expired,

    /// AUTHS-E4407: Network or API error talking to the upstream registry.
    #[error("upstream registry error: {0}")]
    UpstreamError(String),

    /// AUTHS-E4408: The caller's identity doesn't match the package owner upstream.
    #[error("ownership mismatch: {reason}")]
    OwnershipMismatch { reason: String },
}

impl AuthsErrorInfo for NamespaceVerifyError {
    fn error_code(&self) -> &'static str {
        match self {
            Self::UnsupportedEcosystem(_) => "AUTHS-E4401",
            Self::InvalidPackageName(_) => "AUTHS-E4402",
            Self::PackageNotFound => "AUTHS-E4403",
            Self::ProofNotFound => "AUTHS-E4404",
            Self::ProofInvalid { .. } => "AUTHS-E4405",
            Self::Expired => "AUTHS-E4406",
            Self::UpstreamError(_) => "AUTHS-E4407",
            Self::OwnershipMismatch { .. } => "AUTHS-E4408",
        }
    }

    fn suggestion(&self) -> &'static str {
        match self {
            Self::UnsupportedEcosystem(_) => "Supported ecosystems: npm, pypi, cargo, docker, go, maven, nuget",
            Self::InvalidPackageName(_) => "Package names must be non-empty with no control characters",
            Self::PackageNotFound => "Verify the package exists on the upstream registry first",
            Self::ProofNotFound => "Complete the verification step shown in the instructions, then retry",
            Self::ProofInvalid { .. } => "Ensure the verification token matches exactly",
            Self::Expired => "Generate a new challenge with `auths namespace claim`",
            Self::UpstreamError(_) => "Check your network connection and the upstream registry status",
            Self::OwnershipMismatch { .. } => "Your verified platform identity must match the package owner",
        }
    }
}
```

## Ecosystem Adapters

Each adapter lives in `auths-infra-http/src/namespace/` as its own module. One file per ecosystem.

### npm (`npm_verifier.rs`)

**Method: API ownership check**

npm has a public API to check package collaborators.

```
Flow:
1. initiate():
   - GET https://registry.npmjs.org/{package_name} → verify package exists
   - Return challenge with token and instructions:
     "Add this to your package.json under `auths.verification`: {token}
      Then publish: npm publish"

2. verify():
   - GET https://registry.npmjs.org/{package_name}/latest
   - Check that `auths.verification` field matches the token
   - OR check npm access API: GET https://registry.npmjs.org/-/package/{name}/collaborators
     and verify the user's npm username matches a verified platform claim
```

**Alternative (simpler, works today):** If the user has a verified GitHub claim, and the npm package has a GitHub repository link, verify that the GitHub username matches. This piggybacks on the existing GitHub verification.

### PyPI (`pypi_verifier.rs`)

**Method: Publish token**

```
Flow:
1. initiate():
   - GET https://pypi.org/pypi/{package_name}/json → verify exists
   - Generate token
   - Instructions: "Create a file `auths-verify.txt` containing: {token}
     Include it in your next release's sdist, or publish a patch version."

2. verify():
   - GET https://pypi.org/pypi/{package_name}/json → get latest version
   - Download sdist, check for auths-verify.txt with matching token
   - OR: check PyPI maintainers API (if available) against platform claims
```

### Cargo/crates.io (`cargo_verifier.rs`)

**Method: API ownership check**

crates.io has a public owners API.

```
Flow:
1. initiate():
   - GET https://crates.io/api/v1/crates/{name} → verify exists
   - GET https://crates.io/api/v1/crates/{name}/owners → get owner list
   - Return challenge: "Verify your GitHub account is listed as an owner"

2. verify():
   - GET https://crates.io/api/v1/crates/{name}/owners
   - Check if any owner's GitHub login matches the user's verified GitHub claim
   - If match → proof is valid
```

This is the easiest adapter because crates.io owners are GitHub accounts, and we already verify GitHub.

### Docker Hub (`docker_verifier.rs`)

**Method: Image label**

```
Flow:
1. initiate():
   - Generate token
   - Instructions: "Add this label to your Dockerfile and push:
     LABEL dev.auths.verification={token}"

2. verify():
   - Pull image manifest via Docker Hub API
   - Check labels for matching token
```

### Go modules (`go_verifier.rs`)

**Method: DNS TXT record or module file**

Go modules are identified by their import path, which is often a domain.

```
Flow:
1. initiate():
   - Generate token
   - Instructions: "Add a DNS TXT record to your module's domain:
     _auths.{domain} TXT {token}"

2. verify():
   - DNS TXT lookup on _auths.{domain}
   - Match token
```

## How the SDK Orchestrates

In `auths-sdk/src/workflows/namespace.rs`, the claim flow changes from:

**Before (current):**
```
sign_namespace_claim() → SignedEntry → POST /v1/log/entries
```

**After:**
```
1. verifier = registry.get_verifier(ecosystem)  // from adapter registry
2. challenge = verifier.initiate(package_name, did)
3. CLI shows challenge.instructions to user
4. User completes the step (publishes, adds DNS record, etc.)
5. User presses Enter / CLI polls
6. proof = verifier.verify(package_name, did, challenge)
7. sign_verified_namespace_claim(proof) → SignedEntry with proof attached
8. POST /v1/log/entries → sequencer validates proof server-side
```

New SDK types:

```rust
pub struct VerifiedClaimCommand {
    pub ecosystem: Ecosystem,
    pub package_name: PackageName,
    pub controller_did: CanonicalDid,
    pub proof: NamespaceOwnershipProof,
    pub registry_url: Url,
}
```

## How the CLI Presents

`auths namespace claim --ecosystem npm --package-name react`:

```
Verifying ownership of npm/react...

To prove you control this package, do the following:

  Add this field to your package.json:
    "auths": { "verification": "auths-verify-a7b3c9d2" }

  Then publish:
    npm publish

Press Enter when done, or Ctrl+C to cancel...

Checking... ✓ Verified!

Claiming namespace npm/react...
Enter passphrase for key 'main' to sign:
✓ Namespace npm/react claimed
  Log sequence: 42
```

The CLI doesn't need to know anything about npm internals. It calls the SDK, which calls the adapter, which talks to npm.

## Adapter Registry

A simple map in the SDK that contributors register adapters into:

```rust
// auths-sdk/src/namespace_registry.rs
pub struct NamespaceVerifierRegistry {
    verifiers: HashMap<Ecosystem, Arc<dyn NamespaceVerifier>>,
}

impl NamespaceVerifierRegistry {
    pub fn new() -> Self {
        Self { verifiers: HashMap::new() }
    }

    pub fn register(&mut self, verifier: Arc<dyn NamespaceVerifier>) {
        self.verifiers.insert(verifier.ecosystem(), verifier);
    }

    pub fn get(&self, ecosystem: Ecosystem) -> Option<&Arc<dyn NamespaceVerifier>> {
        self.verifiers.get(&ecosystem)
    }

    /// Returns an error listing supported ecosystems if not found.
    pub fn require(&self, ecosystem: Ecosystem) -> Result<&Arc<dyn NamespaceVerifier>, NamespaceVerifyError> {
        self.get(ecosystem).ok_or_else(|| {
            NamespaceVerifyError::UnsupportedEcosystem(ecosystem.as_str().to_string())
        })
    }

    /// Built-in verifiers for all supported ecosystems.
    pub fn with_defaults() -> Self {
        let mut reg = Self::new();
        reg.register(Arc::new(NpmVerifier::new()));
        reg.register(Arc::new(PypiVerifier::new()));
        reg.register(Arc::new(CargoVerifier::new()));
        reg.register(Arc::new(DockerVerifier::new()));
        reg.register(Arc::new(GoVerifier::new()));
        reg
    }
}
```

## Server-Side Validation

The registry server re-verifies before accepting. The `claim_namespace` handler in `auths-registry-server/src/routes/namespace.rs` changes to:

1. Receive `SignedEntry` with `NamespaceOwnershipProof` attached
2. Validate actor signature (existing)
3. Check `proof.verified_at` is within the **proof validity window** (default: 5 minutes). Reject stale proofs.
4. Call the appropriate `NamespaceVerifier` server-side to confirm the proof is still valid
5. If valid → append to sequencer
6. If invalid → 422 with reason

This prevents someone from forging a proof client-side.

**TOCTOU note:** There is an inherent time-of-check/time-of-use gap between when the
client verifies ownership and when the server re-verifies. Package ownership can change
in between (e.g. npm `npm owner rm`). Server-side re-verification is best-effort — it
catches most forgery attempts but is not a cryptographic guarantee. The proof validity
window (5 minutes) limits the exposure. If tighter guarantees are needed in the future,
the server could perform the _only_ verification (client just submits the challenge
response, server does the upstream check directly).

```rust
/// Maximum age of a proof before the server rejects it.
const PROOF_VALIDITY_WINDOW: Duration = Duration::from_secs(5 * 60);

fn validate_proof_freshness(proof: &NamespaceOwnershipProof) -> Result<(), NamespaceVerifyError> {
    let age = Utc::now() - proof.verified_at;
    if age > chrono::Duration::from_std(PROOF_VALIDITY_WINDOW).unwrap() {
        return Err(NamespaceVerifyError::Expired);
    }
    Ok(())
}
```

## Ownership Transfers

Since claims require proof of upstream ownership, transfers happen naturally:

1. Old owner transfers package on the upstream registry (e.g. `npm owner add new-owner`)
2. New owner runs `auths namespace claim` — proves they own the package now
3. The old claim's proof fails server-side re-verification
4. New claim supersedes the old one in the transparency log

No explicit revocation mechanism needed. The upstream registry is the source of truth.

## Adding a New Ecosystem (Contributor Guide)

To add support for a new ecosystem (e.g. Maven):

1. Create `auths-infra-http/src/namespace/maven_verifier.rs`
2. Implement `NamespaceVerifier` trait
3. Register it in `NamespaceVerifierRegistry::with_defaults()`
4. Add tests in `auths-infra-http/tests/namespace/maven.rs`

That's it. No changes to the CLI, SDK workflows, or registry server needed.

### File template:

```rust
// auths-infra-http/src/namespace/maven_verifier.rs

use async_trait::async_trait;
use auths_core::ports::namespace::*;
use auths_verifier::CanonicalDid;

pub struct MavenVerifier {
    client: reqwest::Client,
}

impl MavenVerifier {
    pub fn new() -> Self {
        Self { client: reqwest::Client::new() }
    }
}

#[async_trait]
impl NamespaceVerifier for MavenVerifier {
    fn ecosystem(&self) -> Ecosystem { Ecosystem::Maven }

    async fn initiate(
        &self,
        package_name: &PackageName,
        did: &CanonicalDid,
    ) -> Result<VerificationChallenge, NamespaceVerifyError> {
        // 1. Check package exists on Maven Central
        // 2. Generate verification token
        // 3. Return instructions
        todo!()
    }

    async fn verify(
        &self,
        package_name: &PackageName,
        did: &CanonicalDid,
        challenge: &VerificationChallenge,
    ) -> Result<NamespaceOwnershipProof, NamespaceVerifyError> {
        // 1. Check the proof artifact exists
        // 2. Validate token matches
        // 3. Return proof
        todo!()
    }
}
```

## Implementation Order

1. **Port definition** — `auths-core/src/ports/namespace.rs` (the trait + types)
2. **Cargo adapter** — easiest since it piggybacks on GitHub verification
3. **SDK workflow** — update `sign_namespace_claim` to require proof
4. **CLI flow** — interactive challenge/verify loop
5. **Registry validation** — server-side re-verification
6. **npm adapter**
7. **PyPI adapter**
8. **Docker adapter**
9. **Go adapter**

## Existing Code to Modify

| File | Change |
|------|--------|
| `auths-core/src/ports/mod.rs` | Add `pub mod namespace;` |
| `auths-core/src/ports/namespace.rs` | New file — trait + types |
| `auths-sdk/src/workflows/namespace.rs` | Add verification step before signing |
| `auths-sdk/src/namespace_registry.rs` | New file — adapter registry |
| `auths-cli/src/commands/namespace.rs` | Interactive challenge UI |
| `auths-infra-http/src/namespace/mod.rs` | New module — adapter implementations |
| `auths-infra-http/src/namespace/cargo_verifier.rs` | First adapter |
| `auths-registry-server/src/routes/namespace.rs` | Server-side re-verification |
| `auths-transparency/src/entry.rs` | Change `ecosystem: String` → `Ecosystem`, `package_name: String` → `PackageName`, add proof field to `NamespaceClaim` body |
| `auths-registry-server/src/sequencer/` | Add proof freshness check + server-side re-verification before append |

## Reference: How GitHub Claims Work Today

The existing GitHub platform claim flow is the template:

1. `auths id claim github` → CLI
2. SDK calls `OAuthDeviceFlowProvider::request_device_code()` → user gets code
3. User authorizes on github.com
4. SDK calls `poll_for_token()` → gets access token
5. SDK calls `fetch_user_profile()` → gets GitHub username
6. SDK calls `PlatformProofPublisher::publish_proof()` → creates Gist with signed claim
7. SDK calls `RegistryClaimClient::submit_claim()` → registry fetches Gist, verifies signature
8. Registry records the verified platform claim

The namespace flow follows the same pattern: challenge → user proves ownership → verify → record.
