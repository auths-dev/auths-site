# fn-1.6 URL verification route with OpenGraph SSR

## Description
## URL Verification Route with OpenGraph SSR

Build the `/verify` Server Component route that generates dynamic OpenGraph metadata (✅/❌) for social link unfurling, and renders the verification result UI.

### Context

- Depends on: fn-1.3 (resolver available for server-side use)
- The `/verify` route stays a Server Component (no `'use client'`)
- `generateMetadata` is called server-side by Next.js before sending the page — this is what Slack/Twitter/iMessage reads
- Query parameters (Next.js 15): `searchParams` is a `Promise<{ repo?: string; commit?: string }>`
- Resolver runs server-side in `generateMetadata` and in the page component

### ⚠️ Risk: SSR Node.js Globals in Resolvers

`github.ts` and `gitea.ts` use `atob()` to decode base64 blobs from the forge API. These resolvers will run **server-side** in `generateMetadata`.

**Verdict: Safe.** `atob()` is natively available in Node.js 16+ as a global, and Next.js 15 requires Node 18+. No polyfill needed.

**Action required**: Audit `packages/widget/src/resolvers/github.ts` and `gitea.ts` for any **other** strictly browser-only globals:
- `window` — must not be referenced at module top level
- `document` — same
- `DOMParser` — same
- `localStorage` / `sessionStorage` — same
- `location` — same

If any are found, wrap them in `typeof window !== 'undefined'` guards or move them behind a browser-only code path. The resolver code must be safe to `import` in a Node.js server environment.

The in-memory TTL cache (`resolvers/cache.ts`) uses a module-level `Map` — this is fine for SSR but note that the cache resets on each Vercel serverless function cold start. This is acceptable for MVP.

### Query Parameter Schema

```
/verify?repo=github.com/org/repo&commit=abc123
```

- `repo`: required — a GitHub/Gitea repository URL (without `https://`). Fed into `resolveFromRepo()`.
- `commit`: optional — a git commit SHA shown in the UI for reference. Does not affect resolution.

### Steps

1. **Audit resolvers for browser-only globals** before writing the page:
   - Read `packages/widget/src/resolvers/github.ts` and `gitea.ts`
   - Search for `window`, `document`, `DOMParser`, `localStorage`, `location`
   - If found at module top-level, add `typeof window !== 'undefined'` guards
   - Confirm `atob()` calls remain as-is (Node 18+ safe)

2. **Create `apps/web/src/app/verify/page.tsx`** as a Server Component:

   ```tsx
   import { resolveFromRepo } from '@/lib/resolver';
   import type { Metadata } from 'next';

   type Props = {
     searchParams: Promise<{ repo?: string; commit?: string }>;
   };

   export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
     const { repo, commit } = await searchParams;

     if (!repo) {
       return { title: "Verify | Auths" };
     }

     const result = await resolveFromRepo(`https://${repo}`).catch(() => null);
     const valid = result?.bundle != null;
     const signer = result?.bundle?.identity_did ?? 'Unknown';

     return {
       title: valid ? "✅ Verified Identity | Auths" : "❌ Identity Not Found | Auths",
       description: valid
         ? `Identity ${signer} verified via decentralized KERI protocol`
         : `No cryptographic identity found for ${repo}`,
       openGraph: {
         title: valid ? "✅ Verified Identity" : "❌ Identity Not Found",
         description: valid
           ? `Signed by ${signer}${commit ? ` · commit ${commit.slice(0, 7)}` : ''}`
           : `The identity chain could not be verified for ${repo}.`,
         type: 'website',
       },
     };
   }

   export default async function VerifyPage({ searchParams }: Props) {
     // ... render verification UI
   }
   ```

3. **Verification result UI** (render in the page component):
   - If no `repo`: show "Enter a repository URL to verify" prompt
   - If valid: green checkmark, identity DID in monospace, attestation chain summary
   - If invalid/not-found: red/gray X, error message
   - `commit` SHA displayed in monospace if present
   - `motion/react` animation: result appears like a vault locking (scale + opacity)

4. **Error handling in `generateMetadata`**:
   - Wrap resolver in `.catch(() => null)`
   - On error: return fallback `"⚠️ Unable to Verify | Auths"`
   - Never throw — Next.js may swallow errors silently

5. **Bare `/verify`** (no params): render empty state with prompt.

### Key Files to Create

- `apps/web/src/app/verify/page.tsx`

### Key Files to Audit (Step 1)

- `packages/widget/src/resolvers/github.ts`
- `packages/widget/src/resolvers/gitea.ts`
- `packages/widget/src/resolvers/cache.ts`

### Gotchas

- `searchParams` is a Promise in Next.js 15 — always `await` it
- `generateMetadata` must not throw — wrap everything in try/catch or `.catch()`
- OG title must be under 60 chars for Slack unfurl
- `resolveFromRepo` expects a full URL — prepend `https://` to the `repo` param
- `atob()` is safe in Node 18+ — no polyfill needed
- No `window`, `document`, `DOMParser` in resolver code paths that run server-side
## URL Verification Route with OpenGraph SSR

Build the `/verify` Server Component route that generates dynamic OpenGraph metadata (✅/❌) for social link unfurling, and renders the verification result UI.

### Context

- Depends on: fn-1.3 (resolver available for server-side use)
- The `/verify` route stays a Server Component (no `'use client'`)
- `generateMetadata` is called server-side by Next.js before sending the page — this is what Slack/Twitter/iMessage reads
- Query parameters (Next.js 15): `searchParams` is a `Promise<{ repo?: string; commit?: string }>`
- Resolver runs server-side in `generateMetadata` and in the page component

### Query Parameter Schema

```
/verify?repo=github.com/org/repo&commit=abc123
```

- `repo`: required — a GitHub/Gitea repository URL (without `https://`). Fed into `resolveFromRepo()`.
- `commit`: optional — a git commit SHA shown in the UI for reference. Does not affect resolution.

### Steps

1. **Create `apps/web/src/app/verify/page.tsx`** as a Server Component:

   ```tsx
   import { resolveFromRepo } from '@/lib/resolver';
   import type { Metadata } from 'next';
   
   type Props = {
     searchParams: Promise<{ repo?: string; commit?: string }>;
   };
   
   export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
     const { repo, commit } = await searchParams;
     
     if (!repo) {
       return { title: "Verify | Auths" };
     }
     
     const result = await resolveFromRepo(`https://${repo}`).catch(() => null);
     const valid = result?.bundle != null;
     const signer = result?.bundle?.identity_did ?? 'Unknown';
     
     return {
       title: valid ? "✅ Verified Identity | Auths" : "❌ Identity Not Found | Auths",
       description: valid
         ? `Identity ${signer} verified via decentralized KERI protocol`
         : `No cryptographic identity found for ${repo}`,
       openGraph: {
         title: valid ? "✅ Verified Identity" : "❌ Identity Not Found",
         description: valid
           ? `Signed by ${signer}${commit ? ` · commit ${commit.slice(0, 7)}` : ''}`
           : `The identity chain could not be verified for ${repo}.`,
         type: 'website',
       },
     };
   }
   
   export default async function VerifyPage({ searchParams }: Props) {
     // ... render verification UI
   }
   ```

2. **Verification result UI** (render in the page component):
   - If no `repo`: show "Enter a repository URL to verify" prompt with input
   - If valid: green checkmark, identity DID in monospace, attestation chain summary
   - If invalid/not-found: red/gray X, error message
   - `commit` SHA displayed in monospace if present (for commit-context display)
   - Framer Motion: verification result animates in like a vault locking (scale + opacity)

3. **No `fetchPublicCommitVerification`** wrapper needed — call `resolveFromRepo` directly from `@/lib/resolver` in the Server Component.

4. **Error handling in `generateMetadata`**:
   - Wrap resolver call in `try/catch` (`.catch(() => null)`)
   - On error (network failure, GitHub rate limit): return fallback metadata `"⚠️ Unable to Verify | Auths"`
   - Never throw from `generateMetadata` — Next.js may swallow errors silently

5. **Redirect from bare `/verify`** (no query params): render the UI with empty state, suggest user paste a repo URL.

### Key Files to Create

- `apps/web/src/app/verify/page.tsx`

### Gotchas

- `searchParams` is a Promise in Next.js 15 — `await` it before accessing properties
- `generateMetadata` runs before the page renders — keep it fast (add reasonable timeout)
- OG title must be under 60 chars for Slack unfurl to show correctly
- `resolveFromRepo` expects a full URL (`https://...`) — prepend protocol to the `repo` param
## Acceptance
## Acceptance Criteria

- [ ] **Resolver audit**: `github.ts` and `gitea.ts` contain no top-level `window`, `document`, `DOMParser`, `localStorage`, or `location` references
- [ ] **`atob()` confirmed safe**: no polyfill added (Node 18+ native)
- [ ] `GET /verify` (no params) renders empty state with prompt
- [ ] `GET /verify?repo=github.com/org/repo` calls resolver server-side in `generateMetadata`
- [ ] Page source includes `<meta property="og:title">` set by `generateMetadata`
- [ ] Valid repo: `og:title` contains "✅ Verified Identity"
- [ ] Invalid/not-found repo: `og:title` contains "❌ Identity Not Found"
- [ ] Network/resolver error: `og:title` contains "⚠️ Unable to Verify" (graceful fallback, no throw)
- [ ] `commit` SHA shown in monospace in UI when `?commit=abc123` is present
- [ ] `searchParams` is properly awaited (no TypeScript Promise type errors)
- [ ] Verification result animates in using `motion/react`
- [ ] `pnpm --filter @auths/web build` passes
- [ ] No unhandled promise rejections in server logs during build
- [ ] OG title is under 60 characters
## Acceptance Criteria

- [ ] `GET /verify` (no params) renders empty state with prompt
- [ ] `GET /verify?repo=github.com/org/repo` calls resolver server-side
- [ ] Page source includes `<meta property="og:title">` set by `generateMetadata`
- [ ] Valid repo: `og:title` contains "✅ Verified Identity"
- [ ] Invalid/not-found repo: `og:title` contains "❌ Identity Not Found"
- [ ] Network/resolver error: `og:title` contains "⚠️ Unable to Verify" (graceful fallback)
- [ ] `commit` SHA shown in monospace in UI when `?commit=abc123` is present
- [ ] `searchParams` is properly awaited (no TypeScript Promise type errors)
- [ ] Verification result animates in using `motion/react`
- [ ] `pnpm --filter @auths/web build` passes
- [ ] No unhandled promise rejections in server logs during build
- [ ] OG title is under 60 characters
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
