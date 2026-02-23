/**
 * Client-side bridge to the WASM artifact verifier.
 *
 * The auths-verify widget script (public/auths-verify.js) exposes
 * `globalThis.__authsVerifyBridge` once loaded. This module provides
 * a typed, async-safe interface to that bridge — no webpack WASM
 * configuration required in the Next.js app.
 */

type VerificationResult = { valid: boolean; error?: string };

type AuthsVerifyBridge = {
  verifyArtifactSignature: (
    fileHashHex: string,
    signatureHex: string,
    publicKeyHex: string,
  ) => Promise<boolean>;
  verifyAttestation: (
    attestationJson: string,
    issuerPkHex: string,
  ) => Promise<VerificationResult>;
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
 * Ensure the auths-verify.js script is loaded. If no <script> tag exists
 * yet (e.g. next/script hasn't injected it), create one ourselves.
 */
function ensureScript(): void {
  if (typeof document === 'undefined') return;
  const src = '/auths-verify.js';
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement('script');
  s.src = src;
  s.type = 'module';
  document.head.appendChild(s);
}

/**
 * Poll until the WASM bridge is available (script loaded + WASM initialised).
 * If the script hasn't been injected yet, injects it automatically.
 * Rejects after `timeoutMs` if the bridge never appears.
 */
export function waitForBridge(timeoutMs = 10_000): Promise<AuthsVerifyBridge> {
  const bridge = getBridge();
  if (bridge) return Promise.resolve(bridge);

  // Kick off script loading if next/script hasn't done it yet
  ensureScript();

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

/**
 * Verify a .auths.json attestation against the issuer's identity public key.
 * The WASM engine checks both the identity_signature (against issuerPkHex)
 * and the device_signature (against device_public_key embedded in the attestation).
 */
export async function verifyAttestation(
  attestationJson: string,
  issuerPkHex: string,
): Promise<VerificationResult> {
  const bridge = await waitForBridge();
  return bridge.verifyAttestation(attestationJson, issuerPkHex);
}
