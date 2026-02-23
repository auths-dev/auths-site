# fn-2.2 Update verifier-bridge.ts to expose verifyArtifactSignature

## Description
TBD

## Acceptance
- [ ] TBD

## Done summary
- Added `verifyArtifactSignature` to WasmModule interface in verifier-bridge.ts
- Exported async `verifyArtifactSignature(fileHashHex, signatureHex, publicKeyHex): Promise<boolean>`
- Calls ensureInit() then delegates to the WASM module
## Evidence
- Commits: 38c1a3ae19264e7bdced24e72bc50e9966845adf
- Tests:
- PRs: