# fn-6.13 Add badge SVG endpoint (GET /v1/badges)

## Description
## Add badge SVG endpoint (GET /v1/badges)

**Repos:** auths-cloud
**Depends on:** fn-6.12 (server-side trust tier)

### Problem
No server-side SVG badge for embedding in GitHub READMEs. The `example-verify-badge` has a web component but no shields.io-style endpoint.

### Changes Required
1. **`paths.rs`** — Add `badge(eco_param, pkg_param)` returning `/v1/badges/{ecosystem}/{package}.svg`
2. **Create `routes/badges.rs`** — Handler that:
   - Fetches namespace info (owner DID)
   - Fetches owner identity + trust tier (from fn-6.12)
   - Renders SVG using string template (simple rect + text, like shields.io)
   - Returns `Content-Type: image/svg+xml`
   - Sets `Cache-Control: public, max-age=300` (5 min)
3. **`routes/mod.rs`** — Register route, tag "Public"
4. SVG colors: emerald for verified, zinc for unverified, amber for sovereign

### Design
- Format: `[Auths | Verified by @username]` or `[Auths | 3 signers]`
- Sanitize all user-provided text before embedding in SVG
## Acceptance
- [ ] `GET /v1/badges/{ecosystem}/{package}.svg` returns valid SVG
- [ ] SVG shows verification status and signer count
- [ ] Content-Type is `image/svg+xml`
- [ ] Cache-Control set to 5 min
- [ ] User input sanitized (no SVG injection)
- [ ] `cargo build -p auths-registry-server --all-features` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
