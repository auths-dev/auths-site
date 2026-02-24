# fn-4.2 API layer: types, fetch functions, and query hooks for detail pages

## Description
## API layer: types, fetch functions, and query hooks for detail pages

### What
Extend the existing API client and TanStack Query layer with types and fetch functions needed by both detail pages.

### New Types (add to `src/lib/api/registry.ts`)

```typescript
type TrustTier = 'seedling' | 'verified' | 'trusted' | 'sovereign';

interface IdentityProfile extends ActiveIdentity {
  trust_tier: TrustTier;
  trust_score: number; // 0-100, capped via Math.min(score, 100)
  total_signatures: number;
  github_username?: string; // extracted from platform_claims
}

type Ecosystem = 'npm' | 'pypi' | 'cargo' | 'docker' | 'go' | 'maven' | 'nuget';

interface PackageDetail {
  ecosystem: Ecosystem;
  package_name: string;
  verified: boolean;
  signers: PackageSigner[];
  releases: PackageRelease[];
}

interface PackageSigner {
  did: string;
  github_username?: string;
  verified: boolean;
  signature_count: number;
  last_signed: string;
}

interface PackageRelease {
  version?: string;
  digest_algorithm: string;
  digest_hex: string;
  signer_did: string;
  published_at: string;
  status: 'valid' | 'revoked'; // 'valid' for all currently
}

interface TrustChainNode {
  type: 'artifact' | 'signature' | 'device' | 'identity' | 'authority';
  label: string;
  detail: string;
  link_did?: string;
}
```

### New Fetch Functions (add to `src/lib/api/registry.ts`)

- `fetchPackageDetail(ecosystem, name, signal?)`: Composes `PackageDetail` from `fetchArtifacts`. **N+1 mitigation**: Signer enrichment is capped to the **top 10 most recent unique signers**. Identity lookups use `Promise.allSettled` in batches of 5 to prevent browser network exhaustion. Deduplicates DIDs before fetching.
- `computeTrustTier(identity: ActiveIdentity): { tier: TrustTier; score: number }`: Pure function. Score capped at 100 via `Math.min(score, 100)`. Tiers: Seedling (0-1 attestations), Verified (2-3), Trusted (4-5), Sovereign (6+).
- `buildTrustChain(release: PackageRelease, signerIdentity?: ActiveIdentity): TrustChainNode[]`: Pure function building 5-node chain.

### N+1 Query Mitigation (CRITICAL)
`fetchPackageDetail` must:
1. Fetch all artifacts for the package via `fetchArtifacts`
2. Extract unique `signer_did` values
3. **Cap to top 10 most recent signers** (sort by latest `published_at` per DID)
4. Batch identity lookups in groups of 5 using `Promise.allSettled`
5. Deduplicate DIDs before any fetch (a Map keyed by DID)
6. Gracefully handle partial failures (some identity lookups may 404)

### New Query Hooks (add to `src/lib/queries/registry.ts`)

Extend `registryKeys` factory:
```typescript
registryKeys.identityProfile: (did: string) => ['registry', 'identity-profile', did]
registryKeys.packageDetail: (ecosystem: string, name: string) => ['registry', 'package', ecosystem, name]
```

New hooks:
- `useIdentityProfile(did)`: Calls `fetchIdentity(did)`, enriches with computed trust tier/score and extracted github_username
- `usePackageDetail(ecosystem, name)`: Calls `fetchPackageDetail`, returns composed PackageDetail

### Files to Modify
- `src/lib/api/registry.ts` — add types, fetch functions, computeTrustTier, buildTrustChain
- `src/lib/queries/registry.ts` — extend registryKeys, add useIdentityProfile, usePackageDetail
- `src/lib/registry.ts` — add `Ecosystem` type if needed
## API layer: types, fetch functions, and query hooks for detail pages

### What
Extend the existing API client and TanStack Query layer with types and fetch functions needed by both detail pages.

### New Types (add to `src/lib/api/registry.ts`)

```typescript
// Trust tier computation (client-side)
type TrustTier = 'seedling' | 'verified' | 'trusted' | 'sovereign';

// Extended identity for profile page (extends existing ActiveIdentity)
interface IdentityProfile extends ActiveIdentity {
  // Computed client-side from existing data:
  trust_tier: TrustTier;
  trust_score: number; // 0-100
  total_signatures: number;
  github_username?: string; // extracted from platform_claims
}

// Ecosystem type (separate from Platform)
type Ecosystem = 'npm' | 'pypi' | 'cargo' | 'docker' | 'go' | 'maven' | 'nuget';

// Package detail (composed from artifact search + identity lookups)
interface PackageDetail {
  ecosystem: Ecosystem;
  package_name: string;
  verified: boolean;
  signers: PackageSigner[];
  releases: PackageRelease[];
}

interface PackageSigner {
  did: string;
  github_username?: string;
  verified: boolean;
  signature_count: number;
  last_signed: string;
}

interface PackageRelease {
  version?: string; // may not be available from current API
  digest_algorithm: string;
  digest_hex: string;
  signer_did: string;
  published_at: string;
  status: 'valid' | 'revoked'; // 'valid' for all currently, designed for future
}

// Chain of trust node for the animated timeline
interface TrustChainNode {
  type: 'artifact' | 'signature' | 'device' | 'identity' | 'authority';
  label: string;
  detail: string;
  link_did?: string; // clickable link to identity profile
}
```

### New Fetch Functions (add to `src/lib/api/registry.ts`)

- `fetchPackageDetail(ecosystem: string, name: string, signal?: AbortSignal)`: Composes a `PackageDetail` by calling `fetchArtifacts` with the package query and grouping results. For each unique `signer_did`, optionally fetch identity summary.
- `computeTrustTier(identity: ActiveIdentity): { tier: TrustTier; score: number }`: Pure function computing trust tier from platform_claims.length, public_keys.length, artifacts.length.
- `buildTrustChain(release: PackageRelease, signerIdentity?: ActiveIdentity): TrustChainNode[]`: Pure function building the 5-node chain from artifact → signature → device → identity → authority.

### New Query Hooks (add to `src/lib/queries/registry.ts`)

Extend `registryKeys` factory:
```typescript
registryKeys.identityProfile: (did: string) => ['registry', 'identity-profile', did]
registryKeys.packageDetail: (ecosystem: string, name: string) => ['registry', 'package', ecosystem, name]
```

New hooks:
- `useIdentityProfile(did: string)`: Calls `fetchIdentity(did)`, enriches with computed trust tier/score and extracted github_username
- `usePackageDetail(ecosystem: string, name: string)`: Calls `fetchPackageDetail`, returns composed PackageDetail with infinite pagination for releases

### Files to Modify
- `src/lib/api/registry.ts` — add types, fetch functions, computeTrustTier, buildTrustChain
- `src/lib/queries/registry.ts` — extend registryKeys, add useIdentityProfile, usePackageDetail
- `src/lib/registry.ts` — add `Ecosystem` type if not already compatible with existing `Platform`

### Conventions
- Follow existing `registryFetch<T>()` pattern for API calls
- AbortSignal forwarding on all fetch functions
- `staleTime: 120_000` on new queries (match existing)
- JSDoc on every exported type, function, and hook
## Acceptance
- [ ] All new types exported from `src/lib/api/registry.ts`
- [ ] `computeTrustTier` returns correct tier and score capped at 100
- [ ] `buildTrustChain` produces 5 nodes for a release
- [ ] `fetchPackageDetail` caps signer enrichment to top 10 most recent unique signers
- [ ] `fetchPackageDetail` batches identity lookups in groups of 5 via Promise.allSettled
- [ ] `fetchPackageDetail` deduplicates DIDs before fetching
- [ ] `fetchPackageDetail` gracefully handles partial identity lookup failures
- [ ] `useIdentityProfile` hook works with existing fetchIdentity endpoint
- [ ] `usePackageDetail` hook composes data from fetchArtifacts
- [ ] `registryKeys` factory extended with new key patterns
- [ ] Build passes
- [ ] No TypeScript errors
## Done summary
Added detail page types, computeTrustTier, buildTrustChain, fetchPackageDetail with N+1 mitigation, useIdentityProfile and usePackageDetail hooks
## Evidence
- Commits:
- Tests: next build
- PRs: