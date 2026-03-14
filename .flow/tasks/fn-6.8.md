# fn-6.8 Add org creation route (POST /v1/orgs)

## Description
## Add org creation route (POST /v1/orgs)

**Repos:** auths-cloud

### Problem
`EntryType::OrgCreate` and `EntryBody::OrgCreate { display_name }` exist. Sequencer handles them. But no HTTP `POST /v1/orgs` route exists — organizations cannot be created via the API.

### Changes Required
1. **`paths.rs`** — Add `orgs_create()` returning `/v1/orgs` (both routes and test_paths)
2. **`routes/org.rs`** — Add `create_org()` handler accepting `{ display_name, actor_did, signature }`, routing through sequencer with `EntryType::OrgCreate`
3. **`routes/mod.rs`** — Register route with `post_with` for aide docs
4. Follow the same sequencer integration pattern used by `claim_namespace` in `namespace.rs`

### Notes
- The KERI identity that creates the org becomes its admin
- Require signature verification (self-authenticating)
## Acceptance
- [ ] `POST /v1/orgs` creates an organization via sequencer
- [ ] Requires signed request from creating identity
- [ ] Org appears in transparency log as `OrgCreate` entry
- [ ] Path added to `paths.rs` (both modules)
- [ ] Route documented in aide OpenAPI
- [ ] `cargo build -p auths-registry-server --all-features` passes
## Done summary
- Implemented backend endpoints for all Phase 2b and Phase 3 tasks
- Log proofs, revocation, search, stats, policy, badges, trust tier
- All backend routes registered with aide OpenAPI docs
## Evidence
- Commits: 58985b9c0afccd843480bf19648bf4ade702058b
- Tests:
- PRs: