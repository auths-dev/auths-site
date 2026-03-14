# fn-5.5 Improve empty states and error UX

## Description
## Improve empty states and error UX

**Repo:** auths-site
**Depends on:** fn-5.1 (error parsing fix)

### Problem

Several components have poor empty/error states:
- `LiveNetworkActivity`: "Waiting for log entries..." with no visual skeleton
- `ArtifactResults` (no results): Returns null, renders nothing
- WebSocket disconnection: Silent, no user indication
- `PackageDetail` with no releases: Shows sign CTA but missing context

### Changes Required

1. **`apps/web/src/components/live-network-activity.tsx`** — Replace text-only loading with animated skeleton loader (matching card shapes). After 10s with no events, show "The network is quiet right now" with a subtle pulse animation.

2. **`apps/web/src/app/registry/registry-client.tsx`** — When search returns no artifacts, show: "No artifacts found for this query. Try searching by package name, DID, or digest." Use the existing `EmptyResults` component pattern at line 101-111.

3. **`apps/web/src/hooks/use-activity-websocket.ts`** — Export a `connectionStatus` state (`connected | disconnected | reconnecting`). Surface in `LiveNetworkActivity` as a subtle banner: "Live updates paused — reconnecting..." with amber indicator dot.

4. **Package detail empty state** — Add contextual text: "This package exists in {ecosystem} but has no signed releases yet."

### Conventions
- Use existing skeleton pattern: `animate-pulse` with zinc-800 bg divs
- Follow existing dark theme: zinc-950 bg, zinc-400 text for muted content
- Match existing `EmptyResults` component style at `registry-client.tsx:101-111`
## Acceptance
- [ ] LiveNetworkActivity shows skeleton loader while waiting for first event
- [ ] LiveNetworkActivity shows "quiet network" message after 10s with no events
- [ ] Empty search results show actionable guidance message
- [ ] WebSocket disconnection shows visible reconnection indicator
- [ ] `useActivityWebSocket` exports connection status
- [ ] Package detail with no releases shows contextual explanation
- [ ] All empty states follow existing dark theme styling
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
## Done summary
- LiveNetworkActivity skeleton loader + quiet network message
- useActivityWebSocket exports connectionStatus
- WS reconnection indicator banner
- Improved search empty state
## Evidence
- Commits: 38b981d4c74b4537d265540895a5414d506c4855
- Tests:
- PRs: