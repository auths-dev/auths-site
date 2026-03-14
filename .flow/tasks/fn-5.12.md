# fn-5.12 Add SSE activity stream endpoint (backend)

## Description
## Add SSE activity stream endpoint (backend)

**Repo:** auths-cloud

### Problem

WebSocket requires upgrade handshake, doesn't work through all HTTP proxies/CDNs, and is overkill for one-directional event streaming. SSE is simpler for most read-only consumers (dashboards, monitoring tools).

### Changes Required

1. **`paths.rs`** — Add `activity_stream()` returning `/v1/activity/stream`
2. **`routes/activity.rs`** — Add `GET /v1/activity/stream` handler using `axum::response::sse::{Event, KeepAlive, Sse}`
3. **`routes/mod.rs`** — Register route (can be plain `.route()` since SSE doesn't need aide docs, or use `get_with` for documentation)

### Implementation

```rust
async fn activity_stream(
    State(state): State<Arc<ServerState>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let mut rx = state.subscribe_events();
    let stream = async_stream::stream! {
        while let Ok(event) = rx.recv().await {
            if let AuthsEvent::FeedEntry(entry) = event {
                let data = serde_json::to_string(&entry).unwrap_or_default();
                yield Ok(Event::default()
                    .event("feed_entry")
                    .id(entry.log_sequence.to_string())
                    .data(data));
            }
        }
    };
    Sse::new(stream).keep_alive(
        KeepAlive::new()
            .interval(Duration::from_secs(30))
            .text("ping")
    )
}
```

### Notes
- Use `event.log_sequence` as `Last-Event-ID` for reconnection support
- `KeepAlive` at 30s prevents proxy timeouts
- Set `Cache-Control: no-cache, no-transform` on SSE response
- Exempt from rate limiter (long-lived connection, like WebSocket)
- Handle `broadcast::error::RecvError::Lagged` — skip missed events, continue
## Acceptance
- [ ] `GET /v1/activity/stream` returns SSE event stream
- [ ] Events use `event: feed_entry` type and `id: {log_sequence}` for reconnection
- [ ] KeepAlive comments sent every 30 seconds
- [ ] Lagged broadcast errors handled gracefully (skip, don't crash)
- [ ] `Cache-Control: no-cache, no-transform` header set
- [ ] Path defined in `paths.rs`
- [ ] Exempt from rate limiter
- [ ] `cargo clippy --workspace` passes
- [ ] `cargo nextest run --workspace` passes
## Done summary
- Added GET /v1/activity/stream SSE endpoint
- Streams FeedEntry events with log_sequence as Last-Event-ID
- 30s keepalive, lagged events gracefully skipped
- async-stream dependency added
## Evidence
- Commits: a2944a7d20212841ba2fc80daf84dac49f3fecb7
- Tests:
- PRs: