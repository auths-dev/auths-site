# fn-8.1 Auth & org write API client functions

## Description
## What
Add auth challenge-response, org write, and invite API functions to the registry client. Also add `fetchArtifactsBySigner()` (gap fix: existing `fetchArtifacts` queries by package name, not signer DID).

## Files
- Modify: `apps/web/src/lib/api/registry.ts` (append after line 617)
- Modify: `apps/web/src/lib/queries/registry.ts` (add query keys for new endpoints)

## Details

### New types (append to registry.ts)
- `ChallengeResponse { nonce, expires_at }`
- `VerifyResponse { token, did, expires_at }`
- `CreateOrgResponse { org_did, name, created_at }`
- `InviteResponse { short_code, invite_url, expires_at }`
- `OrgStatusResponse { org_did, name, member_count, pending_invites, signing_policy_enabled }`
- `InviteDetailsResponse { org_name, role, expires_at, status }`

### New authenticated fetch wrapper
`registryFetchAuth<T>(path, options)` — supports `method`, `token` (Bearer header), `body` (JSON), `params`, `signal`. Reuses `RegistryApiError` for error handling. Follows `fetchBatchIdentities` POST pattern (line 430).

Add `USE_FIXTURES` support to all new functions so development works without backend.

### New functions
- `createChallenge()` — POST `/v1/auth/challenge`
- `verifyChallenge(nonce, signature)` — POST `/v1/auth/verify`
- `createOrg(name, token)` — POST `/v1/orgs`
- `createInvite(orgDid, role, expiresIn, token)` — POST `/v1/orgs/{did}/invite`
- `setOrgPolicy(orgDid, requireSigning, token)` — PUT `/v1/orgs/{did}/policy`
- `fetchOrgStatus(orgDid, token)` — GET `/v1/orgs/{did}/status`
- `fetchInviteDetails(code)` — GET `/v1/invites/{code}` (public)
- `fetchArtifactsBySigner(did, signal?)` — GET `/v1/artifacts?signer={did}` (FIX for gap analysis finding)

### New query keys (in queries/registry.ts)
- `registryKeys.challenge()`
- `registryKeys.orgStatus(orgDid)`
- `registryKeys.invite(code)`
- `registryKeys.artifactsBySigner(did)`

## Patterns to follow
- Existing `registryFetch()` at line 208 for error handling
- Existing `fetchBatchIdentities()` at line 420 for POST pattern
- `USE_FIXTURES` check at top of each function (see `fetchArtifacts` line 283)
- `registryKeys` factory at `lib/queries/registry.ts:35-65`

## Gotchas
- `registryFetch` is GET-only — the new `registryFetchAuth` handles all HTTP methods
- Always forward `signal?: AbortSignal` for cancellation
- Always use `encodeURIComponent()` for DIDs in URL paths
## Acceptance
- [ ] All 8 new API functions added to `registry.ts`
- [ ] `registryFetchAuth` wrapper supports GET/POST/PUT with Bearer token
- [ ] `fetchArtifactsBySigner` queries with `signer` param, not `package`
- [ ] All new functions have `USE_FIXTURES` support
- [ ] New query keys added to `registryKeys` factory
- [ ] `pnpm exec tsc --noEmit -p apps/web/tsconfig.json` passes
## Done summary
- Added 8 new API functions (createChallenge, verifyChallenge, createOrg, createInvite, setOrgPolicy, fetchOrgStatus, fetchInviteDetails, fetchArtifactsBySigner) to registry.ts
- Added registryFetchAuth wrapper supporting GET/POST/PUT with Bearer auth
- All functions have USE_FIXTURES support for development without backend
- Added 4 new query keys to registryKeys factory
- Verification: pnpm exec tsc --noEmit passes
## Evidence
- Commits: 2cc8be4e0b5d10327ad2cf50dedcdc7bb552c95f
- Tests: pnpm exec tsc --noEmit -p apps/web/tsconfig.json
- PRs: