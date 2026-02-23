# fn-2.4 Create hashing.ts and wasm-bridge.ts utilities in web app

## Description
TBD

## Acceptance
- [ ] TBD

## Done summary
- Created apps/web/src/lib/hashing.ts using Web Crypto API (SHA-256, browser-only)
- Created apps/web/src/lib/wasm-bridge.ts with typed AuthsVerifyBridge interface
- waitForBridge() polls window.__authsVerifyBridge until the script/WASM loads (10s timeout)
- verifyArtifact() is the primary export: wraps waitForBridge + calls WASM
## Evidence
- Commits: 0160299786f66263c1bede6605e5880cb99f25ff
- Tests:
- PRs: