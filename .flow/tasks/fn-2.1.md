# fn-2.1 Add verify_artifact_signature to Rust WASM and rebuild

## Description
TBD

## Acceptance
- [ ] TBD

## Done summary
- Added `verify_artifact_signature(file_hash_hex, signature_hex, public_key_hex) -> bool` to `wasm.rs` using ring Ed25519 verification
- Rebuilt WASM with wasm-pack, copied new artifacts to `packages/widget/wasm/`
- Fixed `build:wasm` script path (was pointing to old `auths-verify-widget` location)
- New function exported as `verifyArtifactSignature` in generated `.d.ts` bindings
## Evidence
- Commits: a73d789813cc91066e5c8f7930b252d18f33a18f
- Tests: wasm-pack build --target bundler --features wasm
- PRs: