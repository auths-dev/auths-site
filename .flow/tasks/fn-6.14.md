# fn-6.14 Wire policy engine to HTTP (POST /v1/policies/evaluate)

## Description
## Wire policy engine to HTTP (POST /v1/policies/evaluate)

**Repos:** auths-cloud

### Problem
`auths-policy` crate is fully implemented (Expr, CompiledPolicy, EvalContext, Decision, QuorumPolicy) but has zero HTTP routes. Orgs can't set or evaluate signing policies via the API.

### Changes Required
1. **`paths.rs`** — Add `org_policy(org_did_param)` returning `/v1/orgs/{org_did}/policy` and `policies_evaluate()` returning `/v1/policies/evaluate`
2. **Create `routes/policy.rs`** with:
   - `GET /v1/orgs/{org_did}/policy` — retrieve current org policy (from Postgres)
   - `PUT /v1/orgs/{org_did}/policy` — set org signing policy (store policy Expr JSON in Postgres)
   - `POST /v1/policies/evaluate` — evaluate a policy against provided context: `{ policy_id, context: EvalContext }` → `Decision`
3. **Migration** — Create `org_policies` table: `org_did TEXT, policy_expr JSONB, created_at TIMESTAMPTZ, updated_by TEXT`
4. **`routes/mod.rs`** — Register routes with aide

### Notes
- Reuse `auths_policy::compile()` and `enforce_simple()` directly
- Policy evaluation is synchronous and I/O-free — fast to serve
- Store policy as serialized `Expr` JSON in Postgres
## Acceptance
- [ ] `GET /v1/orgs/{org_did}/policy` returns current policy
- [ ] `PUT /v1/orgs/{org_did}/policy` stores policy
- [ ] `POST /v1/policies/evaluate` evaluates policy and returns Decision
- [ ] Policy stored as Expr JSON in `org_policies` table
- [ ] Migration creates table
- [ ] `cargo build -p auths-registry-server --all-features` passes
## Done summary
- Implemented backend endpoints for all Phase 2b and Phase 3 tasks
- Log proofs, revocation, search, stats, policy, badges, trust tier
- All backend routes registered with aide OpenAPI docs
## Evidence
- Commits: 58985b9c0afccd843480bf19648bf4ade702058b
- Tests:
- PRs: