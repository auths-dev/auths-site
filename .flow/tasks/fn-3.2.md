# fn-3.2 Create search types, parser, and CLI instruction utilities

## Description
## Create search types, parser, and CLI instruction utilities

### What
Create `apps/web/src/lib/registry.ts` containing TypeScript types for search queries, a robust parser composed of small DRY utility functions, and flexible CLI instruction generation that handles both platform-namespace and raw-DID scenarios.

### How
1. **Create** `apps/web/src/lib/registry.ts`:

   **Types (aligned with backend OpenAPI spec and multi-forge `platform_claims` model):**

   `ParsedSearchQuery` must be a **strict discriminated union** based on the `type` field, so TypeScript can safely narrow when `platform` and `namespace` are guaranteed present vs. optional:

   ```typescript
   type ParsedPackageQuery = { type: 'package'; raw: string; normalized: string }
   type ParsedRepoQuery = { type: 'repo'; raw: string; normalized: string; platform: Platform }
   type ParsedIdentityQuery = { type: 'identity'; raw: string; normalized: string; platform: Platform; namespace: string }
   type ParsedDidQuery = { type: 'did'; raw: string; normalized: string; platform?: Platform; namespace?: string }
   type ParsedUnknownQuery = { type: 'unknown'; raw: string; normalized: string }

   type ParsedSearchQuery = ParsedPackageQuery | ParsedRepoQuery | ParsedIdentityQuery | ParsedDidQuery | ParsedUnknownQuery
   ```

   This ensures that when the consumer checks `parsed.type === 'identity'`, TypeScript guarantees `parsed.platform` and `parsed.namespace` are present — no optional chaining needed.

   Additional types:
   - `Platform`: `'github' | 'gitlab' | 'gitea' | 'radicle'`
   - `ClaimIdentityProps`: `{ platform?: Platform; namespace?: string; did?: string }`
   - `RegistrySearchResult`: discriminated union mirroring backend JSON schemas

   **Parser — composed of small, DRY utility functions:**

   Each utility function must include a clear JSDoc description, defined arguments, and a sample usage block so other developers can easily extend the parser for new forges later:

   - `extractPlatformPrefix(input: string): { platform: Platform; remainder: string } | null`
     Detects `gitlab:`, `radicle:`, `github/` prefixes.
     ```
     extractPlatformPrefix('gitlab:torvalds') → { platform: 'gitlab', remainder: 'torvalds' }
     extractPlatformPrefix('hello world') → null
     ```

   - `detectUrl(input: string): { platform: Platform; path: string } | null`
     Detects full URLs like `https://github.com/org/repo`.
     ```
     detectUrl('https://gitlab.com/org/repo') → { platform: 'gitlab', path: 'org/repo' }
     ```

   - `detectDid(input: string): { didMethod: string; fullDid: string } | null`
     Detects `did:key:z6Mk...`, `did:keri:E8jsh...`.
     ```
     detectDid('did:key:z6MkTest') → { didMethod: 'key', fullDid: 'did:key:z6MkTest' }
     ```

   - `detectIdentityShorthand(input: string): { platform: Platform; namespace: string } | null`
     Detects `@username` (defaults to GitHub).
     ```
     detectIdentityShorthand('@torvalds') → { platform: 'github', namespace: 'torvalds' }
     ```

   - `detectRepoPattern(input: string): { platform: Platform; normalized: string } | null`
     Detects bare `owner/repo` pattern.
     ```
     detectRepoPattern('auths/auths') → { platform: 'github', normalized: 'https://github.com/auths/auths' }
     ```

   Main function `parseSearchQuery(input: string): ParsedSearchQuery`:
   - Trim whitespace, handle empty → `type: 'unknown'`
   - Check `npm:` prefix → `type: 'package'`
   - Call `extractPlatformPrefix` → route to identity or DID based on remainder
   - Call `detectUrl` → `type: 'repo'`
   - Call `detectDid` → `type: 'did'`
   - Call `detectIdentityShorthand` → `type: 'identity'`
   - Call `detectRepoPattern` → `type: 'repo'`
   - Fallback → `type: 'unknown'`

   **CLI instructions function** `generateCliInstructions(props: ClaimIdentityProps)`:
   - **Platform + namespace variant**: includes `auths id attest` step
   - **Raw DID variant** (no platform/namespace): omits `auths id attest`, only `auths id create` + `auths id register`
   - **Radicle DID variant**: uses `--did` flag in attest step

### Key references
- Existing resolver types: `packages/widget/src/resolvers/types.ts`
- detectForge for URL parsing: `packages/widget/src/resolvers/detect.ts`
- Explorer input handling: `apps/web/src/app/explorer/explorer-client.tsx`
- Backend OpenAPI spec: epic fn-15
## Create search types, parser, and CLI instruction utilities

### What
Create `apps/web/src/lib/registry.ts` containing TypeScript types for search queries, a robust parser composed of small DRY utility functions, and flexible CLI instruction generation that handles both platform-namespace and raw-DID scenarios.

### How
1. **Create** `apps/web/src/lib/registry.ts`:

   **Types (aligned with backend OpenAPI spec and multi-forge `platform_claims` model):**
   - `SearchQueryType`: `'package' | 'repo' | 'identity' | 'did' | 'unknown'`
   - `Platform`: `'github' | 'gitlab' | 'gitea' | 'radicle'`
   - `ParsedSearchQuery`: `{ type: SearchQueryType; raw: string; normalized: string; platform?: Platform; namespace?: string }`
   - `ClaimIdentityProps`: `{ platform?: Platform; namespace?: string; did?: string }` — supports both platform+namespace and raw DID scenarios
   - `RegistrySearchResult`: discriminated union that mirrors the backend JSON schemas

   **Parser — composed of small, DRY utility functions (NOT a monolithic if/else block):**

   Break the parser into focused helpers:
   - `extractPlatformPrefix(input: string): { platform: Platform; remainder: string } | null` — detects `gitlab:`, `radicle:`, `github/` prefixes
   - `detectUrl(input: string): { platform: Platform; path: string } | null` — detects full URLs like `https://github.com/org/repo`, `https://gitlab.com/org/repo`
   - `detectDid(input: string): { didMethod: string; fullDid: string } | null` — detects `did:key:z6Mk...`, `did:keri:E8jsh...`
   - `detectIdentityShorthand(input: string): { platform: Platform; namespace: string } | null` — detects `@username` (defaults to GitHub)
   - `detectRepoPattern(input: string): { platform: Platform; normalized: string } | null` — detects bare `owner/repo` pattern

   Main function `parseSearchQuery(input: string): ParsedSearchQuery`:
   - Trim whitespace, handle empty input → `type: 'unknown'`
   - Check `npm:` prefix → `type: 'package'`
   - Call `extractPlatformPrefix` → route to identity or DID based on remainder
   - Call `detectUrl` → `type: 'repo'`
   - Call `detectDid` → `type: 'did'`
   - Call `detectIdentityShorthand` → `type: 'identity'`
   - Call `detectRepoPattern` → `type: 'repo'`
   - Fallback → `type: 'unknown'`

   **CLI instructions function** `generateCliInstructions(props: ClaimIdentityProps)`:
   - **Platform + namespace variant** (e.g., `{ platform: 'github', namespace: 'torvalds' }`):
     ```
     auths id create
     auths id attest github --username torvalds
     auths id register --registry https://public.auths.dev
     ```
   - **Raw DID variant** (e.g., `{ did: 'did:keri:E8jsh...' }` with no platform/namespace):
     Omit the `auths id attest` step entirely. Output only:
     ```
     auths id create
     auths id register --registry https://public.auths.dev
     ```
   - **Radicle DID variant** (e.g., `{ platform: 'radicle', namespace: 'did:key:z6Mk...' }`):
     ```
     auths id create
     auths id attest radicle --did did:key:z6Mk...
     auths id register --registry https://public.auths.dev
     ```

### Key references
- Existing resolver types: `packages/widget/src/resolvers/types.ts` (IdentityBundle, ResolveResult, ForgeType)
- detectForge for URL parsing: `packages/widget/src/resolvers/detect.ts`
- Explorer input handling: `apps/web/src/app/explorer/explorer-client.tsx`
- Backend OpenAPI spec: epic fn-15 (RegistrySearchResult types must mirror these schemas)
## Create search types, parser, and CLI instruction utilities

### What
Create `apps/web/src/lib/registry.ts` containing TypeScript types for search queries, a robust parser that classifies omni-search input (with AND without prefixes), and flexible CLI instruction generation.

### How
1. **Create** `apps/web/src/lib/registry.ts`:

   **Types (aligned with backend OpenAPI spec fn-15):**
   - `SearchQueryType`: `'package' | 'repo' | 'identity' | 'did' | 'unknown'`
   - `ParsedSearchQuery`: `{ type: SearchQueryType; raw: string; normalized: string; platform?: Platform; namespace?: string }`
   - `Platform`: `'github' | 'gitlab' | 'gitea' | 'radicle'`
   - `ClaimIdentityProps`: `{ platform: Platform; namespace: string }` (renamed from `username` to `namespace` to support non-username identifiers like Radicle DIDs)
   - `RegistrySearchResult`: discriminated union that mirrors the backend JSON schemas so that swapping stubs for real API calls requires zero component changes — only the `queryFn` changes.

   **Parser function** `parseSearchQuery(input: string): ParsedSearchQuery`:
   Must classify input robustly **without requiring users to type prefixes manually**:

   Prefix-based detection:
   - `npm:...` → type `'package'`, normalized without prefix
   - `github/...` → type `'repo'`, platform `'github'`, normalized to full URL
   - `gitlab:username` → type `'identity'`, platform `'gitlab'`, namespace `'username'`
   - `radicle:did:key:...` → type `'did'`, platform `'radicle'`, namespace is the DID
   - `@username` → type `'identity'`, platform `'github'` (default for `@` shorthand), namespace `'username'`

   Raw input detection (no prefix):
   - Full URL `https://github.com/org/repo` → type `'repo'`, platform `'github'`, normalize
   - Full URL `https://gitlab.com/org/repo` → type `'repo'`, platform `'gitlab'`, normalize
   - Raw DID `did:key:z6Mk...` → type `'did'`, extract platform if identifiable
   - Raw DID `did:keri:E8jsh...` → type `'did'`
   - `owner/repo` pattern (no dots) → type `'repo'`, platform `'github'` (default), normalized to full URL
   - Trim whitespace, handle empty input → return `type: 'unknown'`

   **CLI instructions function** `generateCliInstructions(platform: Platform, namespace: string)`:
   - Dynamically handle namespaces that aren't traditional usernames (e.g., Radicle DIDs)
   - For github/gitlab/gitea: `auths id attest {platform} --username {namespace}`
   - For radicle: `auths id attest radicle --did {namespace}` (or appropriate CLI flag for DID-based attestation)
   - Returns multi-line CLI command string per spec

### Key references
- Existing resolver types: `packages/widget/src/resolvers/types.ts` (IdentityBundle, ResolveResult, ForgeType)
- detectForge for URL parsing: `packages/widget/src/resolvers/detect.ts`
- Explorer input handling: `apps/web/src/app/explorer/explorer-client.tsx`
- Backend OpenAPI spec: epic fn-15 (RegistrySearchResult types must mirror these schemas)
## Create search types, parser, and CLI instruction utilities

### What
Create `apps/web/src/lib/registry.ts` containing TypeScript types for search queries, a parser that classifies omni-search input by prefix, and the `generateCliInstructions` / `ClaimIdentityProps` from the spec.

### How
1. **Create** `apps/web/src/lib/registry.ts`:

   **Types:**
   - `SearchQueryType`: `'package' | 'repo' | 'identity' | 'did' | 'unknown'`
   - `ParsedSearchQuery`: `{ type: SearchQueryType; raw: string; normalized: string }`
   - `ClaimIdentityProps`: `{ platform: 'github' | 'gitlab' | 'gitea'; username: string }`

   **Parser function** `parseSearchQuery(input: string): ParsedSearchQuery`:
   - `npm:...` → type `'package'`, normalized without prefix
   - `github/...` or URL-like `github.com/...` → type `'repo'`, normalized to full URL
   - `@username` → type `'identity'`, normalized without `@`
   - `did:keri:...` or `did:key:...` → type `'did'`, normalized as-is
   - Otherwise → try to detect if it looks like `owner/repo` pattern, else `'unknown'`
   - Trim whitespace, handle empty input

   **CLI instructions function** `generateCliInstructions(platform, username)`:
   - Returns multi-line CLI command string per spec
   - Supports github, gitlab, gitea platforms

### Key references
- Existing resolver types: `packages/widget/src/resolvers/types.ts`
- detectForge for URL parsing: `packages/widget/src/resolvers/detect.ts`
- Explorer input handling: `apps/web/src/app/explorer/explorer-client.tsx`
## Acceptance
- [ ] `ParsedSearchQuery` is a strict discriminated union — checking `type === 'identity'` guarantees `platform` and `namespace` are present (no optional chaining)
- [ ] `ParsedRepoQuery` guarantees `platform` is present
- [ ] `ParsedDidQuery` has `platform` and `namespace` as optional
- [ ] Parser is composed of small DRY utility functions — NOT a monolithic if/else block
- [ ] Each utility function has JSDoc with description, arguments, and sample usage
- [ ] `parseSearchQuery('npm:auths-cli')` returns `{ type: 'package', normalized: 'auths-cli' }`
- [ ] `parseSearchQuery('https://github.com/auths/auths')` returns `{ type: 'repo', platform: 'github', ... }`
- [ ] `parseSearchQuery('https://gitlab.com/org/repo')` returns `{ type: 'repo', platform: 'gitlab', ... }`
- [ ] `parseSearchQuery('@bordumb')` returns `{ type: 'identity', platform: 'github', namespace: 'bordumb' }`
- [ ] `parseSearchQuery('gitlab:torvalds')` returns `{ type: 'identity', platform: 'gitlab', namespace: 'torvalds' }`
- [ ] `parseSearchQuery('radicle:did:key:z6Mk...')` returns `{ type: 'did', platform: 'radicle', namespace: 'did:key:z6Mk...' }`
- [ ] `parseSearchQuery('did:key:z6Mk...')` returns `{ type: 'did', ... }` (raw DID, no prefix)
- [ ] `parseSearchQuery('')` returns `{ type: 'unknown' }`
- [ ] `generateCliInstructions({ platform: 'github', namespace: 'torvalds' })` includes attest step
- [ ] `generateCliInstructions({ did: 'did:keri:E8jsh...' })` omits attest step
- [ ] `generateCliInstructions({ platform: 'radicle', namespace: 'did:key:z6Mk...' })` uses `--did` flag
- [ ] All types exported and importable from `@/lib/registry`
- [ ] `pnpm build` succeeds
## Done summary
- Created apps/web/src/lib/registry.ts with strict discriminated union types, DRY parser helpers, and CLI instruction generation
- ParsedSearchQuery is a strict union: checking `type === 'identity'` guarantees `platform` and `namespace` are present
- Parser composed of 5 focused utility functions (extractPlatformPrefix, detectUrl, detectDid, detectIdentityShorthand, detectRepoPattern) — each with JSDoc
- generateCliInstructions handles 3 variants: platform+namespace, raw DID (omits attest), radicle DID (--did flag)
- Supports raw URLs and DIDs without prefixes
- Why: foundational types and parsing logic for all downstream tasks
- Verification: `pnpm build` succeeds
## Evidence
- Commits: d6e800bd2184352606416d7bc87f68070cf815c9
- Tests: pnpm build
- PRs: