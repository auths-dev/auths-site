# fn-6.15 Add monitor webhook/notification integration

## Description
## Add monitor webhook/notification integration

**Repos:** auths-cloud (monitor crate)
**Depends on:** fn-6.4 (monitor alignment)

### Problem
Monitor alerts are `tracing::error` only. `VerificationReport` struct at `lib.rs:61-73` is ready for notification sinks but none are wired.

### Changes Required
1. **Create `auths-monitor/src/notify.rs`** — Define `NotificationSink` trait:
   - `async fn send(&self, report: &VerificationReport) -> Result<(), NotifyError>`
2. **Implement `WebhookSink`** — POST the report as JSON to a configurable URL with HMAC-SHA256 signature
3. **`auths-monitor/src/lib.rs`** — After `run_verification_cycle()`, if report has errors, dispatch to configured sinks
4. **`auths-monitor/src/main.rs`** — Add env config: `WEBHOOK_URL`, `WEBHOOK_SECRET`
5. Exponential backoff on failed webhook delivery (max 3 retries)

### Notes
- Start with generic webhook. Slack/PagerDuty can be added later as additional sink implementations.
- Sign payload with HMAC-SHA256 using per-subscriber secret
## Acceptance
- [ ] Monitor dispatches verification reports to configured webhook URL
- [ ] Webhook payload signed with HMAC-SHA256
- [ ] Retries with exponential backoff on failure
- [ ] Configurable via `WEBHOOK_URL` and `WEBHOOK_SECRET` env vars
- [ ] `cargo build -p auths-monitor --all-features` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
