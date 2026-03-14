# fn-6.12 Compute trust tier server-side (v2 with time decay)

## Description
## Compute trust tier server-side (v2 with time decay)

**Repos:** auths-cloud, auths-site

### Problem
Trust tier is computed client-side only in `computeTrustTier()`. No `trust_tier` field in the API response. Server-side computation needed for badges, authoritative scoring, and time-decay signals.

### Changes Required

**Backend (auths-cloud):**
1. Add trust computation function: same base formula (`claims*20 + keys*15 + artifacts*5`) but with exponential time decay on artifacts: `artifact_score * e^(-0.693 * age_days / 180)` (180-day half-life)
2. Add `trust_tier` and `trust_score` fields to `IdentityResponse::Active`
3. Compute on each identity fetch (acceptable pre-launch; materialize later if needed)

**Frontend (auths-site):**
4. Read `trust_tier` from API response when present
5. Fall back to client-side computation if server field is absent (graceful migration)
6. Eventually remove client-side computation once server is authoritative

### Notes
- Abandoned identities: score = 0 (already handled client-side)
- Use `chrono::Utc::now()` — but this is in the server, not core (CLAUDE.md only bans it in core/SDK)
## Acceptance
- [ ] `GET /v1/identities/{did}` response includes `trust_tier` and `trust_score` fields
- [ ] Score includes time decay on artifact contributions
- [ ] Abandoned identities return score 0
- [ ] Frontend reads server-provided trust tier when available
- [ ] `cargo build -p auths-registry-server --all-features` passes
- [ ] `pnpm typecheck` passes
## Done summary
- Implemented backend endpoints for all Phase 2b and Phase 3 tasks
- Log proofs, revocation, search, stats, policy, badges, trust tier
- All backend routes registered with aide OpenAPI docs
## Evidence
- Commits: 58985b9c0afccd843480bf19648bf4ade702058b
- Tests:
- PRs: