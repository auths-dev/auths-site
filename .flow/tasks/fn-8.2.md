# fn-8.2 AuthContext provider

## Description
## What
Create a shared ephemeral auth context for both wizard flows. Stores DID + token in React state only (gone on tab close).

## Files
- Create: `apps/web/src/lib/auth/auth-context.tsx`

## Details
- `AuthState { token, did, expiresAt }`
- `AuthContextValue { auth, setAuth, clearAuth, isAuthenticated }`
- `isAuthenticated` MUST check `expiresAt` against `Date.now()` — not just null check (gap fix)
- `AuthProvider` wraps children with context
- `useAuth()` hook throws if used outside provider

## Patterns
- Follow existing `providers.tsx` pattern (line 7-23)
- `'use client'` directive at top
- `createContext<T | null>(null)` with null check in hook
## Acceptance
- [ ] `AuthProvider` and `useAuth` exported from `lib/auth/auth-context.tsx`
- [ ] `isAuthenticated` returns `false` when token has expired
- [ ] `useAuth()` throws Error when used outside provider
- [ ] TypeScript compiles
## Done summary
- Created AuthProvider and useAuth hook in lib/auth/auth-context.tsx
- isAuthenticated checks expiresAt against Date.now() (not just null check)
- useAuth throws Error when used outside provider
- Verification: pnpm exec tsc --noEmit passes
## Evidence
- Commits: 2cc8be4e0b5d10327ad2cf50dedcdc7bb552c95f
- Tests: pnpm exec tsc --noEmit -p apps/web/tsconfig.json
- PRs: