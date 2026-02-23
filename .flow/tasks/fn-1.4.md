# fn-1.4 Identity Explorer (/explorer) with KEL timeline

## Description
## Identity Explorer (/explorer) with KEL Timeline

Build the `/explorer` page — a clean, unambiguous view into the Key Event Log (KEL) for any GitHub/Gitea repository identity, powered by the widget's resolver via TanStack Query.

### Context

- Depends on: fn-1.3 (resolver imports verified, QueryClient ready)
- The "KEL" is mapped from `IdentityBundle.attestation_chain: object[]` returned by `resolveFromRepo()`
- Each item in `attestation_chain` is treated as a KEL event with `seq`, `timestamp`, and event data
- Resolver calls run **client-side** via TanStack Query (browser directly pings GitHub/Gitea API)
- Explorer results should be URL-shareable: `/explorer?repo=github.com/org/repo`

### Steps

1. **Create `apps/web/src/app/explorer/page.tsx`** (Server Component):
   - Parse `searchParams.repo` (a Promise in Next.js 15 — must `await`)
   - If `repo` is present, wrap the client component in `HydrationBoundary` with prefetched data
   - If no `repo`, render empty state
   - `generateMetadata` returns title `"Identity Explorer | Auths"`

2. **Create `apps/web/src/app/explorer/explorer-client.tsx`** (Client Component `'use client'`):
   - Search input: bound to `router.push('/explorer?repo=...')` on submit
   - Uses `useQuery({ queryKey: ['kel', repo], queryFn: () => resolveFromRepo(repo) })`
   - Renders:
     - **Loading state**: animated skeleton timeline
     - **Error state**: monospace error message with red border, repo URL echoed back
     - **Empty state** (no repo): prompt text in center
     - **No identity found** (404/null bundle): "No Auths identity found for this repository"
     - **Success state**: identity header + `<KelTimeline>` component

3. **Identity header** (above timeline):
   ```
   IDENTITY              STATUS       LAST EVENT
   did:keri:EX4z...      ● Active     2026-02-22 14:00 UTC
   ```
   - DID truncated with monospace font, full DID in tooltip on hover
   - Status `● Active` shown in `#10b981` green
   - If status is unknown, show gray dot

4. **`<KelTimeline>` component** (`apps/web/src/components/kel-timeline.tsx`):
   - Maps `attestation_chain` array → vertical timeline
   - Each event: circle node (● for inception, ○ for subsequent), sequence number, timestamp, event type
   - Connect events with a vertical line
   - Inception event highlighted with slightly brighter styling
   - Use `motion/react` `AnimatePresence` to animate events in sequentially (stagger 50ms)
   - Each event expands to show raw data on click

5. **URL state management**:
   - Search input reads initial value from `useSearchParams().get('repo')`
   - On submit, `router.push('/explorer?repo=' + encodeURIComponent(value))`
   - Back button works correctly (URL is the source of truth)

### ASCII Wireframe Reference

```
┌─────────────────────────────────────────────────────────────────┐
│  Identity Explorer                                              │
│  [ did:keri:EX4z9...a2b or github.com/user/repo     ] [ 🔍 ]   │
│                                                                 │
│  ─────────────────────────────────────────────────────────     │
│  IDENTITY              STATUS            LAST EVENT            │
│  did:keri:EX4z...      ● Active          2026-02-22 14:00 UTC  │
│                                                                 │
│  Cryptographic Timeline                                         │
│                                                                 │
│  ● Inception                              Seq: 0               │
│  │ 2026-01-10 09:00 UTC                                        │
│  │ Root Key: pub_8f92a1b...                                    │
│  │                                                             │
│  ○ Interaction                            Seq: 1               │
│  │ 2026-02-15 14:22 UTC                                        │
│  │ Device Paired: dev_1a2b...                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Files to Create

- `apps/web/src/app/explorer/page.tsx`
- `apps/web/src/app/explorer/explorer-client.tsx`
- `apps/web/src/components/kel-timeline.tsx`
## Acceptance
## Acceptance Criteria

- [ ] `GET /explorer` renders search input and empty state prompt
- [ ] `GET /explorer?repo=github.com/some/repo` triggers resolver fetch via TanStack Query
- [ ] Loading state: skeleton timeline renders while query is in-flight
- [ ] Success state: identity header shows DID, status, last event timestamp
- [ ] Success state: `<KelTimeline>` renders at least one event per item in `attestation_chain`
- [ ] Error state: graceful error message, no unhandled promise rejections
- [ ] Empty/not-found state: "No Auths identity found" message shown
- [ ] Timeline events animate in with stagger using `motion/react`
- [ ] URL state: navigating to `/explorer?repo=...` directly loads the correct identity
- [ ] URL state: browser back button returns to previous URL state
- [ ] DID rendered in monospace font
- [ ] Active status shown in `#10b981` (Verified Green)
- [ ] `searchParams` is awaited (Next.js 15 requirement — must not cause type error)
- [ ] `pnpm --filter @auths/web build` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
