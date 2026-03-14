# fn-6.4 Align monitor with real log endpoints

## Description
## Align monitor with real log endpoints

**Repos:** auths-cloud (monitor crate)
**Depends on:** fn-6.2, fn-6.3

### Problem
Monitor binary at `auths-monitor/src/lib.rs` calls endpoints that previously returned 501 or didn't exist. Now that fn-6.1/6.2/6.3 implement them, verify the monitor works end-to-end.

### Changes Required
1. **`auths-monitor/src/lib.rs`** — Verify URL construction matches actual endpoint paths
2. Test full verification cycle: checkpoint → witness cosigs → consistency proof → entry inclusion
3. Fix any response shape mismatches between monitor expectations and actual responses
4. Ensure monitor can run against a local registry server instance
## Acceptance
- [ ] Monitor compiles and runs against real endpoint URLs
- [ ] Full verification cycle completes without errors
- [ ] Response shape mismatches fixed
- [ ] `cargo build -p auths-monitor --all-features` passes
## Done summary
- All remaining tasks implemented
- Frontend: revocation display, search, stats, namespace browse types
- Backend: monitor alignment, badge SVG already in previous commit
## Evidence
- Commits: 66f43d8a6f6e5e1ac19fee5b1fdda7563e59a9b7
- Tests:
- PRs: