# fn-2.3 Expose WASM bridge on window from widget IIFE bundle

## Description
TBD

## Acceptance
- [ ] TBD

## Done summary
- Imported verifyArtifactSignature in auths-verify.ts entry point
- Exposed `globalThis.__authsVerifyBridge = { verifyArtifactSignature }` after custom element registration
- Fixed tsconfig.json: added paths alias for auths-verifier-wasm + removed wasm from exclude
- Fixed verifier-bridge.ts import cast to suppress vite-plugin-dts type inference issue
- Rebuilt widget (no TS errors), copied to apps/web/public/auths-verify.js
## Evidence
- Commits: e6800705d42af8d7410a72f45d443eaa73c496d6
- Tests: pnpm --filter auths-verify build (clean, no TS errors)
- PRs: