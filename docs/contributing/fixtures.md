# Fixtures

## Enable / Disable

```bash
# In apps/web/.env.local
NEXT_PUBLIC_USE_FIXTURES=true   # mock data, no real API calls
NEXT_PUBLIC_USE_FIXTURES=false  # hit the live registry at public.auths.dev
```

Create the file if it doesn't exist. Changes take effect on the next `next dev` restart.

When enabled, every fetch function (`fetchIdentity`, `fetchArtifacts`, `fetchPackageDetail`, `fetchRecentActivity`) checks for a matching fixture first. If found it returns mock data with a short simulated delay (200-500ms) so skeleton states are visible. If no fixture matches, the call falls through to the real API.

Source: `apps/web/src/lib/api/fixtures.ts`

## Personas

### 1. The Sovereign Maintainer

Tests the fully maxed-out happy path.

| Field | Value |
|---|---|
| DID | `did:keri:EKVn0mis9eWGpL2p_qbcMDpXBdH2EOwzNbtV97JdQR0u` |
| GitHub | @torvalds |
| Trust tier | Sovereign (99/100) |
| Platforms | GitHub, GitLab, Radicle (all verified) |
| Keys | 3 (Laptop, YubiKey, Backup) |
| Artifacts | 8 across npm, cargo, pypi, docker |

**What it tests:** Avatar from GitHub, all three platform passport cards verified, two ghost cards (Gitea + npm), three key cards with "Copy Full Key", artifact portfolio with the 6-card cap and "View All" button, gamification CTA.

```
/registry/identity/did:keri:EKVn0mis9eWGpL2p_qbcMDpXBdH2EOwzNbtV97JdQR0u
```

### 2. The Autonomous Agent

Tests non-human identity rendering and the empty-platform-claims state.

| Field | Value |
|---|---|
| DID | `did:keri:EAgent_PR_Bot_99_Delegated_By_Sovereign_0001` |
| GitHub | (none) |
| Trust tier | Seedling |
| Platforms | (none -- all ghost cards) |
| Keys | 1 |
| Artifacts | 2 |

**What it tests:** Boring-avatars deterministic identicon (no GitHub avatar), all five platform ghost cards with CLI attest commands on hover, Seedling tier badge in neutral zinc, minimal artifact grid.

```
/registry/identity/did:keri:EAgent_PR_Bot_99_Delegated_By_Sovereign_0001
```

### 3. The Ghost (Unclaimed)

Tests the conversion funnel for unregistered identities.

| Field | Value |
|---|---|
| DID | `did:keri:EUnclaimed_Developer_Ghost_No_Keys_404_000` |
| Status | Unclaimed |

**What it tests:** Ghosted header at `opacity-40`, "Unregistered" badge, boring-avatars identicon, full `ClaimIdentityCTA` with `auths id create` / `auths id register` terminal block. Any DID containing the word "unclaimed" also triggers this state.

```
/registry/identity/did:keri:EUnclaimed_Developer_Ghost_No_Keys_404_000
```

### 4. The XZ Utils Backdoor (Supply Chain Crisis)

Tests the provenance ledger revocation UI using the real-world 2024 xz-utils incident as narrative.

| Field | Value |
|---|---|
| Package | `cargo:xz-utils` |
| Signers | Larhzu (original maintainer, verified) + JiaT75 (malicious, verified) |
| Releases | 5.4.0, 5.4.1, 5.4.2 = Valid; **5.6.0, 5.6.1 = Revoked** |

**What it tests:** "Cryptographically Verified" badge, two signer cards (one legitimate, one compromised), provenance ledger with green "Valid" dots on clean versions and red "Revoked" dots on backdoored versions, chain of trust timeline for the latest release, mobile accordion cards for the ledger.

```
/registry/package/cargo/xz-utils
```

The two signer DIDs are also navigable as identity profiles:
- `/registry/identity/did:keri:ELasse_Collin_Original_XZ_Maintainer_0001` (Larhzu)
- `/registry/identity/did:keri:EJia_Tan_Backdoor_Compromised_Key_Revoked` (JiaT75)

### 5. Happy Package (npm:auths-cli)

Tests the standard verified package with multiple signers.

| Field | Value |
|---|---|
| Package | `npm:auths-cli` |
| Signers | torvalds (verified) + agent bot (unverified) |
| Releases | 1.0.0 through 1.2.1, all Valid |

**What it tests:** Ecosystem icon (npm), side-by-side install + verify terminal blocks, invite CTA with "Copy Link", clean provenance ledger with no revocations.

```
/registry/package/npm/auths-cli
```

## Adding New Fixtures

1. Define the mock data constants in `apps/web/src/lib/api/fixtures.ts`
2. Add the identity to `IDENTITY_FIXTURES` (keyed by DID) or the package to `PACKAGE_FIXTURES` (keyed by `ecosystem:name`)
3. Restart dev server
