# fn-2.5 Build interactive drag-and-drop hero verification component

## Description
TBD

## Acceptance
- [ ] TBD

## Done summary
- Replaced static drop zone with a stateful 6-phase verification UX (idle→hashing→awaiting_inputs→verifying→verified→failed)
- Artifact drag-and-drop hashes file locally via Web Crypto, never sends bytes over network
- Signature sub-drop-zone accepts .sig files (binary or hex text) and text paste
- DID input supports both did:key:z… (direct pubkey extraction) and raw 64-char hex
- Each terminal log line animates in with Framer Motion stagger
- Terminal border transitions to emerald glow on success, red on failure
- Animated chrome dot turns green/red to match result state
- "verify another artifact" reset link appears after result
- Repo attestation widget kept at bottom behind a divider (loads auths-verify.js script)
- Both pnpm --filter @auths/web typecheck and pnpm --filter auths-verify typecheck: exit 0
## Evidence
- Commits: 4092813b2953525b376621aa56b0570247d49404
- Tests: pnpm --filter @auths/web typecheck: exit 0, pnpm --filter auths-verify typecheck: exit 0
- PRs: