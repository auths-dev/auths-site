# fn-1.2 Next.js 15 scaffold, nav layout & hero section

## Description
## Next.js 15 Scaffold, Nav Layout & Hero Section

Scaffold the `apps/web/` Next.js 15 App Router application, configure it to consume the `auths-verify` workspace package, and build the site layout with navigation and the hero section featuring the live WASM widget.

### Context

- Depends on: fn-1.1 (workspace + widget must exist)
- `apps/web/` does not yet exist — create from scratch
- The `auths-verify` web component registers as `<auths-verify>` — must be rendered client-side only
- Design system: `#09090b` background, white text, `#10b981` accent green, Inter/Geist + JetBrains Mono

### Steps

1. **Scaffold Next.js 15 app** in `apps/web/`:
   ```bash
   cd apps
   pnpm dlx create-next-app@latest web \
     --typescript --tailwind --eslint \
     --app --src-dir --no-turbopack \
     --import-alias "@/*"
   ```
   Then run `pnpm dlx shadcn@latest init` with `new-york` style.

2. **Update `apps/web/package.json`**:
   - Add `"auths-verify": "workspace:*"` to `dependencies`
   - Name the package `@auths/web`

3. **Configure `apps/web/next.config.ts`**:
   ```ts
   const nextConfig: NextConfig = {
     transpilePackages: ["auths-verify"],
     webpack: (config) => {
       config.experiments = {
         ...config.experiments,
         asyncWebAssembly: true,
         layers: true,
       };
       config.output.webassemblyModuleFilename =
         "static/wasm/[modulehash].wasm";
       return config;
     },
   };
   ```

4. **Global CSS** (`apps/web/src/app/globals.css`):
   ```css
   @import "tailwindcss";
   @plugin "@tailwindcss/typography";
   
   :root {
     --background: #09090b;
     --foreground: #fafafa;
     --border: #27272a;
     --accent-verified: #10b981;
     --font-mono: "JetBrains Mono", "Geist Mono", monospace;
   }
   ```

5. **Root layout** (`apps/web/src/app/layout.tsx`):
   - Apply dark background globally
   - Include `<SiteNav>` component
   - Include `<QueryProvider>` client wrapper (TanStack Query setup)

6. **`<SiteNav>` component** (`apps/web/src/components/site-nav.tsx`):
   ```
   ❖ Auths   [spacer]   Overview | How Auths Works | Trust | Community | Blog | Docs | Status | [GitHub]
   ```
   - Fixed/sticky top nav
   - `❖ Auths` logo left-aligned, nav links right-aligned
   - GitHub icon links to `https://github.com/auths-base`
   - Active link indicator using `usePathname()`

7. **Hero section** (`apps/web/src/components/hero.tsx`):
   - Headline: `Cryptographic Trust, Decentralized.`
   - Subheadline: `Verify software supply chains instantly, without relying on centralized identity providers.`
   - Terminal-style demo block (dark, monospace, `● ● ●` window chrome):
     - Line 1: `~ $ auths verify artifact.tar.gz --signature artifact.sig`
     - Drop zone: "Drop an artifact here to verify instantly via WebAssembly"
     - Live `<auths-verify>` web component
   - "Trusted by" placeholder logos row
   - `motion/react` layout animation on the terminal block

8. **`<AuthsVerifyWidget>` client wrapper** (`apps/web/src/components/auths-verify-widget.tsx`):
   ```tsx
   'use client';
   import { useEffect } from 'react';
   
   export function AuthsVerifyWidget({ repo }: { repo?: string }) {
     useEffect(() => {
       import('auths-verify'); // registers <auths-verify> custom element
     }, []);
     return <auths-verify repo={repo} />;
   }
   ```
   Add TypeScript declaration for `<auths-verify>` in `auths-verify.d.ts`.

9. **Landing page** (`apps/web/src/app/page.tsx`):
   - Server Component importing `<Hero>`
   - `<Hero>` includes `<AuthsVerifyWidget>`

10. **TanStack Query provider** (`apps/web/src/app/providers.tsx`):
    - `'use client'` QueryClientProvider with `staleTime: 60_000`
    - Wrap children in root layout

### Key Files to Create

- `apps/web/next.config.ts`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/providers.tsx`
- `apps/web/src/components/site-nav.tsx`
- `apps/web/src/components/hero.tsx`
- `apps/web/src/components/auths-verify-widget.tsx`
- `apps/web/src/types/auths-verify.d.ts`
## Acceptance
## Acceptance Criteria

- [ ] `apps/web/package.json` has `"name": "@auths/web"` and `"auths-verify": "workspace:*"` in dependencies
- [ ] `apps/web/next.config.ts` has `transpilePackages: ["auths-verify"]` and `asyncWebAssembly: true` webpack experiment
- [ ] `pnpm --filter @auths/web dev` starts Next.js dev server without errors
- [ ] `http://localhost:3000` loads with dark background (`#09090b`)
- [ ] Navigation renders: `❖ Auths` left, all nav links right, GitHub icon present
- [ ] Hero section renders with headline "Cryptographic Trust, Decentralized."
- [ ] `<auths-verify>` custom element renders without JavaScript errors in browser console
- [ ] No SSR errors related to `customElements` or WebAssembly
- [ ] TypeScript type declaration for `<auths-verify>` JSX element exists (no `ts(2339)` errors)
- [ ] `pnpm --filter @auths/web build` succeeds (production build)
- [ ] `motion/react` (not `framer-motion`) is the animation import
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
