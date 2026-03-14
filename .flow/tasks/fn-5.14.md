# fn-5.14 Add WebSocket subscription filters

## Description
## Add WebSocket subscription filters

**Repo:** auths-cloud + auths-site
**Depends on:** fn-5.6 (ping keepalives)

### Problem

Every WebSocket client receives every event. For registries with thousands of events/day, this wastes bandwidth for clients only interested in specific packages or identities.

### Changes Required

**Backend (`routes/ws.rs`):**
1. After connection, accept a JSON subscribe message: `{ "action": "subscribe", "filters": { "entry_types": ["attest", "identity_inception"], "actor_did": "did:keri:...", "package": "npm:react" } }`
2. Filter events in the send loop before calling `sender.send()` — only forward events matching the client's filters
3. Support an "unsubscribe" action to clear filters
4. Default (no subscribe message sent): all events (backward compatible)

**Backend (`events.rs`):**
- Add a `matches_filter(filter: &SubscriptionFilter) -> bool` method to `FeedEntryEvent`

**Frontend (`hooks/use-activity-websocket.ts`):**
- After connection opens, send subscribe message if filters are provided
- Add optional `filters` parameter to the hook

### Notes
- Keep backward compatible: if client never sends subscribe, they get everything (current behavior)
- Filter matching is per-client in the send loop, not per-channel
- Don't create separate broadcast channels per topic (too complex for now)
## Acceptance
- [ ] WebSocket accepts JSON subscribe message after connection
- [ ] Events filtered per-client based on subscription filters
- [ ] Supports filtering by entry_type, actor_did, and package
- [ ] Unsubscribe action clears filters
- [ ] Default behavior (no subscribe) sends all events (backward compatible)
- [ ] Frontend hook accepts optional filters parameter
- [ ] Frontend sends subscribe message on connection if filters provided
- [ ] `cargo clippy --workspace` and `cargo nextest run --workspace` pass
- [ ] `pnpm typecheck` and `pnpm build` pass
## Done summary
- Backend WS handler supports subscribe/unsubscribe actions
- SubscriptionFilter matches entry_type, actor_did, package
- Default sends all events (backward compatible)
- Frontend hook accepts optional filters param
## Evidence
- Commits: 9dea3bac8f4d9f3c5b6d5308463cdd5561bc2df2
- Tests:
- PRs: