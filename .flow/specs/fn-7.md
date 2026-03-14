# Frontend: Wire Backend Capabilities into UI

## Overview

The backend has new endpoints (from fn-5 and fn-6) that the frontend doesn't consume yet. The fetch functions and TypeScript types exist in `registry.ts`, and query keys exist in `registryKeys`, but no hooks or components actually use them. This epic wires everything up.

**Repo:** auths-site only (frontend). All backend endpoints already exist.

## Scope

1. Add network stats widget to the registry dashboard
2. Switch `useRegistrySearch` identity queries from `fetchPubkeys` to `fetchIdentitySearch`
3. Create namespace browse page (`/registry/browse/[ecosystem]`)
4. Read server-provided trust tier instead of computing client-side
5. Add badge embed section to package pages
6. Add org policy management UI (read-only to start)
7. Add fixture support for new fetch functions

## Approach

### What Already Exists (DO NOT recreate)
- `fetchIdentitySearch()` at `registry.ts:515`
- `fetchNamespaceList()` at `registry.ts:541`
- `fetchNetworkStats()` at `registry.ts:561`
- `registryKeys.identitySearch`, `.namespaceBrowse`, `.networkStats` — all defined
- `TrustTierBadge`, `CopyButton`, `TerminalBlock` — reusable components

### Key Conventions
- `registryFetch()` for all API calls
- `registryKeys` factory for all query keys
- `USE_FIXTURES` check before API calls
- Tailwind dark theme (zinc-950 bg, emerald accents)
- `'use client'` for all interactive components

## Quick Commands

```bash
pnpm typecheck
```

## Acceptance Criteria

- Dashboard shows live network stats
- `@username` searches use server-side identity search
- Ecosystem grid links to browse pages
- Identity/org pages read `trust_tier` from server
- Package pages show badge embed snippets
- Org pages show current policy
- All new API consumers have fixture fallbacks
- `pnpm typecheck` passes
