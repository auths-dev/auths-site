# fn-1.1 pnpm workspace init & widget migration

## Description
## pnpm Workspace Init & Widget Migration

Initialize `auths-site/` as a pnpm workspace monorepo and migrate the existing `auths-verify-widget` into `packages/widget/`.

### Context

- Source widget: `/Users/bordumb/workspace/repositories/auths-base/auths-verify-widget/`
- Target monorepo root: `/Users/bordumb/workspace/repositories/auths-base/auths-site/`
- `auths-site/` is currently empty (only `.git/` and `.flow/`)
- The Next.js app does not yet exist — it will be created in Task fn-1.2
- The sibling `../auths/` repo contains the `@auths/verifier` TypeScript package and the Rust WASM crate

### ⚠️ Risk: CI/CD Sibling Repo Problem

`"@auths/verifier": "file:../../auths/packages/auths-verifier-ts"` works locally but **breaks on Vercel and GitHub Actions** — CI pulls only `auths-site`, the sibling `auths/` directory is absent.

**Mitigation**: Replace the `file:` reference with a Git URL that targets the specific workspace directory:

```json
"@auths/verifier": "git+https://github.com/auths-dev/auths.git#workspace=auths-verifier-ts"
```

pnpm supports installing from specific workspace directories within a Git repo via the `#workspace=` fragment. This works in any CI environment without requiring the sibling repo to be checked out.

**If the Git URL approach fails** (e.g. the auths repo is private and tokens aren't set up for CI), use the fallback: copy the relevant type declarations from `@auths/verifier` directly into `packages/widget/src/types.ts` for the MVP. The widget only uses `@auths/verifier` for type re-exports, not runtime logic.

Update all four files that reference the `../auths/` path:
- `packages/widget/package.json` → change `@auths/verifier` dep to Git URL
- `packages/widget/tsconfig.json` → if using Git URL, remove the path alias (pnpm will install to node_modules); if using copied types, update the alias to local
- `packages/widget/vite.config.ts` → same as tsconfig
- `packages/widget/vitest.config.ts` → same as tsconfig

### Steps

1. **Create `pnpm-workspace.yaml`** at `auths-site/` root:
   ```yaml
   packages:
     - "apps/*"
     - "packages/*"
   ```

2. **Create root `package.json`** with shared tooling:
   ```json
   {
     "name": "auths-site",
     "private": true,
     "engines": { "node": ">=18", "pnpm": ">=9" },
     "scripts": {
       "dev": "pnpm --filter @auths/web dev",
       "build": "pnpm --filter auths-verify build && pnpm --filter @auths/web build",
       "test": "pnpm -r test",
       "typecheck": "pnpm -r typecheck",
       "lint": "eslint ."
     },
     "devDependencies": {
       "typescript": "^5.7.0",
       "eslint": "^9"
     }
   }
   ```

3. **Create `packages/widget/` directory** and copy all files from `auths-verify-widget/`:
   - Copy `src/`, `wasm/`, `tests/`, `examples/`, `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `justfile`, `.gitignore`
   - **Remove `wasm/` from `.gitignore`** — in the monorepo, the WASM binary is committed

4. **Fix `@auths/verifier` dependency** for CI compatibility:
   - Update `packages/widget/package.json`: change `"@auths/verifier": "file:../../auths/..."` to `"git+https://github.com/auths-dev/auths.git#workspace=auths-verifier-ts"`
   - Update `packages/widget/tsconfig.json`: remove the path alias for `@auths/verifier` (pnpm will install it to `node_modules`)
   - Update `packages/widget/vite.config.ts`: remove the resolve alias for `@auths/verifier`
   - Update `packages/widget/vitest.config.ts`: remove the alias

5. **Update `build:wasm` script path** in `packages/widget/package.json`:
   - The wasm-pack invocation references the Rust crate — update path from `../auths/...` to `../../auths/...`
   - Note: `build:wasm` is NOT run in this task (WASM binary is already committed); just update the path for future use

6. **Create `apps/` directory** placeholder.

7. **Run `pnpm install`** from monorepo root — verify it succeeds.

8. **Verify widget builds**: `pnpm --filter auths-verify build` → `packages/widget/dist/auths-verify.mjs`

9. **Verify widget tests**: `pnpm --filter auths-verify test` passes.

### Key Files to Modify

- `packages/widget/package.json` (name stays `auths-verify`; update `@auths/verifier` dep + wasm script path)
- `packages/widget/tsconfig.json` (remove `@auths/verifier` path alias)
- `packages/widget/vite.config.ts` (remove `@auths/verifier` resolve alias)
- `packages/widget/vitest.config.ts` (remove alias)
- `packages/widget/.gitignore` (remove `wasm/` gitignore entry)

### Do NOT Modify

- `packages/widget/src/` source files (no logic changes in this task)
- `packages/widget/wasm/` binary files
## pnpm Workspace Init & Widget Migration

Initialize `auths-site/` as a pnpm workspace monorepo and migrate the existing `auths-verify-widget` into `packages/widget/`.

### Context

- Source widget: `/Users/bordumb/workspace/repositories/auths-base/auths-verify-widget/`
- Target monorepo root: `/Users/bordumb/workspace/repositories/auths-base/auths-site/`
- `auths-site/` is currently empty (only `.git/` and `.flow/`)
- The Next.js app does not yet exist — it will be created in Task fn-1.2
- The sibling `../auths/` repo contains the `@auths/verifier` TypeScript package and the Rust WASM crate

### Steps

1. **Create `pnpm-workspace.yaml`** at `auths-site/` root:
   ```yaml
   packages:
     - "apps/*"
     - "packages/*"
   ```

2. **Create root `package.json`** with shared tooling (ESLint, Prettier, TypeScript):
   ```json
   {
     "name": "auths-site",
     "private": true,
     "engines": { "node": ">=18", "pnpm": ">=9" },
     "scripts": {
       "dev": "pnpm --filter @auths/web dev",
       "build": "pnpm --filter auths-verify build && pnpm --filter @auths/web build",
       "test": "pnpm -r test",
       "typecheck": "pnpm -r typecheck",
       "lint": "eslint ."
     },
     "devDependencies": {
       "typescript": "^5.7.0",
       "eslint": "^9"
     }
   }
   ```

3. **Create `packages/widget/` directory** and copy all files from `auths-verify-widget/`:
   - Copy `src/`, `wasm/`, `tests/`, `examples/`, `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `justfile`, `.gitignore`
   - **Remove `wasm/` from `.gitignore`** (the `*` entry in `auths-verify-widget/.gitignore` for `wasm/`) — in the monorepo, the WASM binary is committed

4. **Update path references** — the widget moves one level deeper (`packages/widget/` vs root `auths-verify-widget/`), so all `../auths/` paths become `../../auths/`:
   - `packages/widget/package.json` line 57: `"@auths/verifier": "file:../../auths/packages/auths-verifier-ts"`
   - `packages/widget/tsconfig.json` paths aliases: `../../auths/packages/auths-verifier-ts/src`
   - `packages/widget/vite.config.ts` resolve alias: `../../auths/packages/auths-verifier-ts/src`
   - `packages/widget/vitest.config.ts` alias: `../../auths/packages/auths-verifier-ts/src`
   - `packages/widget/package.json` build:wasm script: `cd ../../auths/crates/auths-verifier && wasm-pack build ...`

5. **Create `apps/` directory** (empty placeholder; Next.js app created in Task fn-1.2):
   ```
   mkdir -p apps
   ```

6. **Run `pnpm install`** from monorepo root and verify it succeeds.

7. **Verify widget builds**: `pnpm --filter auths-verify build` should produce `packages/widget/dist/auths-verify.mjs`

8. **Verify widget tests**: `pnpm --filter auths-verify test` should pass

### Key Files to Modify

- `packages/widget/package.json` (name stays `auths-verify`, update paths)
- `packages/widget/tsconfig.json` (update path aliases)
- `packages/widget/vite.config.ts` (update resolve alias)
- `packages/widget/vitest.config.ts` (update alias)
- `packages/widget/.gitignore` (remove `wasm/` gitignore entry)

### Do NOT Modify

- `packages/widget/src/` source files (no logic changes in this task)
- `packages/widget/wasm/` binary files
## Acceptance
## Acceptance Criteria

- [ ] `auths-site/pnpm-workspace.yaml` exists and defines `apps/*` and `packages/*`
- [ ] `auths-site/package.json` exists with root scripts (`dev`, `build`, `test`, `typecheck`)
- [ ] `auths-site/packages/widget/` contains all source files from `auths-verify-widget/`
- [ ] `auths-site/packages/widget/package.json` has `"name": "auths-verify"`
- [ ] `auths-site/packages/widget/wasm/auths_verifier_bg.wasm` exists (committed, not gitignored)
- [ ] `packages/widget/.gitignore` does NOT gitignore `wasm/`
- [ ] **CI-safe**: `@auths/verifier` dependency uses Git URL (not `file:` path) in `packages/widget/package.json`
- [ ] **CI-safe**: No `../auths/` path aliases remain in `tsconfig.json`, `vite.config.ts`, or `vitest.config.ts`
- [ ] `pnpm install` succeeds from `auths-site/` root with no errors
- [ ] `pnpm --filter auths-verify build` succeeds, producing `packages/widget/dist/auths-verify.mjs`
- [ ] `pnpm --filter auths-verify test` passes (all existing tests green)
- [ ] `pnpm --filter auths-verify typecheck` passes
## Acceptance Criteria

- [ ] `auths-site/pnpm-workspace.yaml` exists and defines `apps/*` and `packages/*`
- [ ] `auths-site/package.json` exists with root scripts (`dev`, `build`, `test`, `typecheck`)
- [ ] `auths-site/packages/widget/` contains all source files from `auths-verify-widget/`
- [ ] `auths-site/packages/widget/package.json` has `"name": "auths-verify"`
- [ ] `auths-site/packages/widget/wasm/auths_verifier_bg.wasm` exists (committed, not gitignored)
- [ ] `packages/widget/.gitignore` does NOT gitignore `wasm/`
- [ ] All four `../auths/` path references updated to `../../auths/` in package.json, tsconfig.json, vite.config.ts, vitest.config.ts
- [ ] `pnpm install` succeeds from `auths-site/` root with no errors
- [ ] `pnpm --filter auths-verify build` succeeds, producing `packages/widget/dist/auths-verify.mjs`
- [ ] `pnpm --filter auths-verify test` passes (all existing tests green)
- [ ] `pnpm --filter auths-verify typecheck` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
