# fn-1.3 Widget resolver export cleanup & WASM client integration

## Description
## Widget Resolver Export Cleanup & WASM Client Integration

Ensure `packages/widget/src/resolvers/index.ts` cleanly exports all resolver functions and DID utilities for use by the Next.js app, and verify the WASM client-side loading integration works end-to-end.

### Context

- Depends on: fn-1.1 (widget migrated), fn-1.2 (Next.js app exists)
- The Next.js app needs to import resolvers *directly* for server components and TanStack Query hooks
- The WASM bridge must load correctly in the browser (client-side only) via the widget's pre-built dist

### Steps

1. **Audit `packages/widget/src/resolvers/index.ts`** — verify it exports:
   - `resolveFromRepo(repoUrl: string, config?: ForgeConfig): Promise<ResolveResult>`
   - `detectForge(url: string): ForgeType | null`
   - `githubAdapter` (or `createGithubAdapter()`)
   - `giteaAdapter` (or `createGiteaAdapter()`)
   - DID utilities: `decodeDid`, `didKeyToEd25519Hex` (from `did-utils.ts`)
   - All resolver types: `IdentityBundle`, `ResolveResult`, `ForgeConfig`, `RefEntry`, `ForgeType`

2. **If any export is missing**, add it to `resolvers/index.ts` (no logic changes, barrel-only).

3. **Verify `packages/widget/package.json` exports** — add a subpath export for resolvers if not present:
   ```json
   {
     "exports": {
       ".": { ... },
       "./slim": { ... },
       "./resolvers": {
         "types": "./dist/types/resolvers/index.d.ts",
         "import": "./dist/auths-verify.mjs"
       }
     }
   }
   ```
   Note: Since the resolver code is bundled into `auths-verify.mjs`, the import path for the bundle is the same; the `types` subpath enables TypeScript to resolve types correctly.

4. **Test resolver import in Next.js app**:
   Create `apps/web/src/lib/resolver.ts`:
   ```ts
   export { resolveFromRepo, detectForge } from 'auths-verify/resolvers';
   export type { IdentityBundle, ResolveResult } from 'auths-verify/resolvers';
   ```

5. **Verify WASM loads end-to-end** in the browser:
   - Start `pnpm --filter @auths/web dev`
   - Open browser DevTools Network tab
   - Navigate to `/` (landing page)
   - Confirm `auths_verifier_bg.wasm` (or inlined equivalent) loads without 404 or MIME type errors
   - Confirm no `WebAssembly` errors in Console

6. **Create `apps/web/src/lib/get-query-client.ts`**:
   ```ts
   import { QueryClient } from '@tanstack/react-query';
   import { cache } from 'react';
   
   const getQueryClient = cache(
     () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } })
   );
   export default getQueryClient;
   ```

### Key Files to Modify

- `packages/widget/src/resolvers/index.ts` (add any missing exports)
- `packages/widget/package.json` (add `./resolvers` subpath export if needed)

### Key Files to Create

- `apps/web/src/lib/resolver.ts`
- `apps/web/src/lib/get-query-client.ts`
## Acceptance
## Acceptance Criteria

- [ ] `packages/widget/src/resolvers/index.ts` exports `resolveFromRepo`, `detectForge`, `githubAdapter`, `giteaAdapter`, and all DID utilities
- [ ] `packages/widget/src/resolvers/index.ts` exports all TypeScript types: `IdentityBundle`, `ResolveResult`, `ForgeConfig`, `RefEntry`
- [ ] `apps/web/src/lib/resolver.ts` imports from `auths-verify/resolvers` without TypeScript errors
- [ ] `apps/web/src/lib/get-query-client.ts` exists with `React.cache()` singleton pattern
- [ ] `pnpm --filter @auths/web build` passes with resolver imports present (no missing module errors)
- [ ] In browser (dev mode): WASM loads without 404 or MIME type errors
- [ ] In browser (dev mode): no `WebAssembly` errors in DevTools Console
- [ ] `pnpm --filter auths-verify test` still passes after any resolver export changes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
