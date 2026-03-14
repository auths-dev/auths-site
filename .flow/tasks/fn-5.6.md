# fn-5.6 Add WebSocket server-initiated ping keepalives

## Description
## Add WebSocket server-initiated ping keepalives

**Repo:** auths-cloud
**File:** `crates/auths-registry-server/src/routes/ws.rs`

### Problem

No server-initiated ping frames. Axum auto-responds to client pings with pongs, but stale connections (client disappears without close frame) accumulate indefinitely because the server never probes liveness.

### Changes Required

1. **`routes/ws.rs`** — Add a `tokio::time::interval(Duration::from_secs(30))` ping timer in the `tokio::select!` loop. On each tick, send `Message::Ping(vec![])`. If the send fails, break the loop (client is dead).

2. **Add pong timeout tracking** — After sending a ping, if no pong is received within 10s, close the connection. Use a `last_pong: Instant` variable updated when `Message::Pong` is received. Check `last_pong.elapsed() > Duration::from_secs(10)` on the next ping tick.

### Implementation Notes
- Axum 0.8 WS `Message::Ping` and `Message::Pong` variants are available
- The existing `tokio::select!` in ws.rs already handles recv + broadcast; add a third branch for the ping interval
- No changes needed to the frontend — browser WebSocket APIs automatically respond to server pings with pongs
- Follow CLAUDE.md: no `unwrap()`, use `?` or match
## Acceptance
- [ ] Server sends Ping frames every 30 seconds to each connected client
- [ ] Server closes connection if no Pong received within 10 seconds of a Ping
- [ ] Dead connections are cleaned up (no resource leak)
- [ ] Existing broadcast functionality unaffected
- [ ] No `unwrap()` or `expect()` in new code
- [ ] `cargo clippy --workspace` passes
- [ ] `cargo nextest run --workspace` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
