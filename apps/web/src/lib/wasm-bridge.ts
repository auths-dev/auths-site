/**
 * Client-side bridge to the WASM artifact verifier.
 *
 * The auths-verify widget script (public/auths-verify.js) exposes
 * `globalThis.__authsVerifyBridge` once loaded. This module provides
 * a typed, async-safe interface to that bridge — no webpack WASM
 * configuration required in the Next.js app.
 */

type AuthsVerifyBridge = {
  verifyArtifactSignature: (
    fileHashHex: string,
    signatureHex: string,
    publicKeyHex: string,
  ) => Promise<boolean>;
};

declare global {
  interface Window {
    __authsVerifyBridge?: AuthsVerifyBridge;
  }
}

function getBridge(): AuthsVerifyBridge | null {
  if (typeof window === 'undefined') return null;
  return window.__authsVerifyBridge ?? null;
}

/**
 * Poll until the WASM bridge is available (script loaded + WASM initialised).
 * Rejects after `timeoutMs` if the bridge never appears.
 */
export function waitForBridge(timeoutMs = 10_000): Promise<AuthsVerifyBridge> {
  const bridge = getBridge();
  if (bridge) return Promise.resolve(bridge);

  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const b = getBridge();
      if (b) {
        clearInterval(interval);
        resolve(b);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error('WASM verifier not ready — auths-verify.js may not have loaded'));
      }
    }, 100);
  });
}

/**
 * Verify a detached Ed25519 signature over a locally-computed file hash.
 * Waits for the bridge to be ready before calling into WASM.
 */
export async function verifyArtifact(
  fileHashHex: string,
  signatureHex: string,
  publicKeyHex: string,
): Promise<boolean> {
  const bridge = await waitForBridge();
  return bridge.verifyArtifactSignature(fileHashHex, signatureHex, publicKeyHex);
}
