# fn-4.1 Shared infrastructure: extract utilities, centralize icons, install deps, fix nav

## Description
## Shared infrastructure: extract utilities, centralize icons, install deps, fix nav

### What
Prepare the shared foundation that both detail pages depend on:

1. **Extract duplicate utilities** to `src/lib/format.ts`:
   - `formatRelativeTime(iso: string): string` — currently in `artifact-results.tsx:11-26` AND `recent-activity-feed.tsx:24-39`
   - `truncateMiddle(str: string, maxLen?: number): string` — currently in `trust-graph.tsx:43-47` AND `recent-activity-feed.tsx:41-44`
   - Update all existing consumers to import from `@/lib/format`

2. **Extract TerminalBlock** to `src/components/terminal-block.tsx`:
   - Currently a private function in `claim-identity-cta.tsx:12-86`
   - Contains macOS window chrome, copy-to-clipboard with DOMException fallback, aria-live
   - Export it, update `claim-identity-cta.tsx` to import from the new file

3. **Centralize ecosystem/platform icons** in `src/components/icons/`:
   - `ecosystem-icon.tsx` — React component mapping ecosystem names (npm, pypi, cargo, docker, go, maven, nuget) to `@icons-pack/react-simple-icons` components
   - `platform-icon.tsx` — React component mapping platform names (github, gitlab, gitea, radicle) to SVG icons (extract from existing inline SVGs in `lib/verification/github.ts:33`, `lib/verification/npm.ts:6`, `lib/verification/docker.ts:6`, `site-nav.tsx:56-63`)
   - `radicle.tsx` — custom Radicle SVG component (not in Simple Icons)

4. **Install new dependencies**:
   - `boring-avatars` — deterministic identicon generation from DID strings
   - `qrcode.react` — QR code SVG rendering
   - `@icons-pack/react-simple-icons` — tree-shakable brand logos

5. **Fix nav active state** for sub-routes:
   - `site-nav.tsx:39` uses `pathname === link.href` (exact match)
   - Use strict matching to avoid overlap with hypothetical routes like `/registry-settings`:
     `pathname === link.href || pathname.startsWith(link.href + '/')`
   - For the root `/` link, keep exact match only to avoid highlighting on every page

6. **Verify boring-avatars hydration**: After installing, render a test `<Avatar name="did:keri:test" variant="beam" />` in dev mode and confirm no hydration mismatch warnings. Since the DID string is deterministic (not random), SSR and CSR should produce identical SVGs, but verify explicitly.

### Files to Create
- `src/lib/format.ts`
- `src/components/terminal-block.tsx`
- `src/components/icons/ecosystem-icon.tsx`
- `src/components/icons/platform-icon.tsx`
- `src/components/icons/radicle.tsx`

### Files to Modify
- `src/components/artifact-results.tsx` — import formatRelativeTime from @/lib/format
- `src/components/recent-activity-feed.tsx` — import formatRelativeTime + truncateMiddle from @/lib/format
- `src/components/trust-graph.tsx` — import truncateMiddle from @/lib/format
- `src/components/claim-identity-cta.tsx` — import TerminalBlock from @/components/terminal-block
- `src/components/site-nav.tsx` — fix active state logic (strict matching)
- `package.json` — add boring-avatars, qrcode.react, @icons-pack/react-simple-icons

### Conventions
- kebab-case filenames, PascalCase exports
- JSDoc on every exported component/function with @param and @example
- `'use client'` at line 1 for components using React hooks
- Import alias: `@/*` maps to `./src/*`
## Shared infrastructure: extract utilities, centralize icons, install deps, fix nav

### What
Prepare the shared foundation that both detail pages depend on:

1. **Extract duplicate utilities** to `src/lib/format.ts`:
   - `formatRelativeTime(iso: string): string` — currently in `artifact-results.tsx:11-26` AND `recent-activity-feed.tsx:24-39`
   - `truncateMiddle(str: string, maxLen?: number): string` — currently in `trust-graph.tsx:43-47` AND `recent-activity-feed.tsx:41-44`
   - Update all existing consumers to import from `@/lib/format`

2. **Extract TerminalBlock** to `src/components/terminal-block.tsx`:
   - Currently a private function in `claim-identity-cta.tsx:12-86`
   - Contains macOS window chrome, copy-to-clipboard with DOMException fallback, aria-live
   - Export it, update `claim-identity-cta.tsx` to import from the new file

3. **Centralize ecosystem/platform icons** in `src/components/icons/`:
   - `ecosystem-icon.tsx` — React component mapping ecosystem names (npm, pypi, cargo, docker, go, maven, nuget) to `@icons-pack/react-simple-icons` components
   - `platform-icon.tsx` — React component mapping platform names (github, gitlab, gitea, radicle) to SVG icons (extract from existing inline SVGs in `lib/verification/github.ts:33`, `lib/verification/npm.ts:6`, `lib/verification/docker.ts:6`, `site-nav.tsx:56-63`)
   - `radicle.tsx` — custom Radicle SVG component (not in Simple Icons)

4. **Install new dependencies**:
   - `boring-avatars` — deterministic identicon generation from DID strings
   - `qrcode.react` — QR code SVG rendering
   - `@icons-pack/react-simple-icons` — tree-shakable brand logos

5. **Fix nav active state** for sub-routes:
   - `site-nav.tsx:39` uses `pathname === link.href` (exact match)
   - Change to `pathname === link.href || pathname.startsWith(link.href + '/')` for the registry link
   - This ensures `/registry/identity/...` and `/registry/package/...` highlight "Public Registry"

### Files to Create
- `src/lib/format.ts`
- `src/components/terminal-block.tsx`
- `src/components/icons/ecosystem-icon.tsx`
- `src/components/icons/platform-icon.tsx`
- `src/components/icons/radicle.tsx`

### Files to Modify
- `src/components/artifact-results.tsx` — import formatRelativeTime from @/lib/format
- `src/components/recent-activity-feed.tsx` — import formatRelativeTime + truncateMiddle from @/lib/format
- `src/components/trust-graph.tsx` — import truncateMiddle from @/lib/format
- `src/components/claim-identity-cta.tsx` — import TerminalBlock from @/components/terminal-block
- `src/components/site-nav.tsx` — fix active state logic
- `package.json` — add boring-avatars, qrcode.react, @icons-pack/react-simple-icons

### Conventions
- kebab-case filenames, PascalCase exports
- JSDoc on every exported component/function with @param and @example
- `'use client'` at line 1 for components using React hooks
- Import alias: `@/*` maps to `./src/*`
## Acceptance
- [ ] `src/lib/format.ts` exports `formatRelativeTime` and `truncateMiddle`
- [ ] No duplicate definitions of formatRelativeTime or truncateMiddle in any component file
- [ ] `src/components/terminal-block.tsx` exports TerminalBlock with copy-to-clipboard
- [ ] `claim-identity-cta.tsx` imports TerminalBlock from the new file (no local definition)
- [ ] `src/components/icons/ecosystem-icon.tsx` renders correct icons for npm, pypi, cargo, docker
- [ ] `src/components/icons/platform-icon.tsx` renders correct icons for github, gitlab, gitea, radicle
- [ ] `boring-avatars`, `qrcode.react`, `@icons-pack/react-simple-icons` in package.json
- [ ] Nav "Public Registry" highlights on `/registry`, `/registry/identity/...`, `/registry/package/...`
- [ ] Nav does NOT highlight "Public Registry" on hypothetical `/registry-settings` (strict match)
- [ ] Root `/` link only highlights on exact `/` pathname
- [ ] boring-avatars renders deterministic SVG with no hydration mismatch in dev mode
- [ ] Build passes: `PATH="..." npx next build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
## Done summary
- Extracted `formatRelativeTime` and `truncateMiddle` to `src/lib/format.ts`, updated 3 consumer files
- Extracted `TerminalBlock` to `src/components/terminal-block.tsx`, updated `claim-identity-cta.tsx`
- Created centralized icon system: `ecosystem-icon.tsx` (7 ecosystems via Simple Icons), `platform-icon.tsx` (5 platforms with inline SVGs), `radicle.tsx` (custom SVG)
- Installed `boring-avatars`, `qrcode.react`, `@icons-pack/react-simple-icons`
- Fixed nav active state: strict `startsWith(href + '/')` with `href !== '/'` guard
- Verification: `next build` passes
## Evidence
- Commits:
- Tests: next build
- PRs: