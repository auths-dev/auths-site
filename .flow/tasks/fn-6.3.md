# fn-6.3 Wire tile persistence + tile serving endpoint

## Description
## Wire tile persistence + tile serving endpoint

**Repos:** auths-cloud, auths (transparency crate)
**Depends on:** fn-6.1

### Problem
`get_tile()` at `routes/log.rs` returns 501. `TileStore` trait with `FsTileStore`/`S3TileStore` exists in auths-transparency but the sequencer doesn't persist tiles.

### Changes Required
1. **Sequencer** — After appending entries, persist tiles via `TileStore::write_tile()`
2. **`routes/log.rs`** — Implement `get_tile()` to read from `TileStore::read_tile()`
3. Tiles are immutable once full — return `Cache-Control: public, max-age=86400, immutable` (already set by our cache middleware)
4. Configure `FsTileStore` or `S3TileStore` based on server config

### Notes
- Tiles are height-8 (256 hashes per tile, ~8 KiB with SHA-256)
- Full tiles are immutable; partial tiles have short cache
## Acceptance
- [ ] `GET /v1/log/tile/{level}/{index}` returns tile data (not 501)
- [ ] Sequencer persists tiles on append
- [ ] Full tiles served with immutable cache headers
- [ ] `cargo build -p auths-registry-server --all-features` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
