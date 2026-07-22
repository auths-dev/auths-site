/**
 * The browser verifier bridge (plan X1.4) — the ONLY module that touches the
 * WASM glue. Everything the explorer renders as "valid" comes back through here,
 * which is why the eslint fence forbids importing the glue anywhere else.
 *
 * The WASM is wasm-bindgen `--target web` output with the binary co-located next
 * to the glue, so the bundler (Turbopack) emits `auths_verifier_bg.wasm` as a
 * hashed static asset and `init()` fetches it by its rewritten URL. Init is
 * coalesced — the first caller loads, the rest await the same promise.
 *
 * These wrappers are deliberately thin: string in, parsed JSON out. They do not
 * interpret verdict shapes — callers (the hooks and views) own that — so the
 * bridge stays a pure transport into the verifier, matching the server's role on
 * the other side.
 */

import init, {
  validateKelJson,
  verifyChainWithWitnesses,
  verifyPresentationJson,
  verifyEvidencePackOffline,
  verifyCommitJson,
} from './wasm/auths_verifier';

let initPromise: Promise<void> | null = null;

/** Ensure the WASM module is initialized exactly once. Browser-only. */
export async function ensureVerifier(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('the verifier runs in the browser only');
  }
  if (!initPromise) {
    // No argument: wasm-bindgen resolves the co-located binary via
    // `new URL('auths_verifier_bg.wasm', import.meta.url)`, which the bundler
    // rewrites to the emitted asset URL.
    initPromise = init()
      .then(() => undefined)
      .catch((err) => {
        initPromise = null; // allow retry on transient failure
        throw err;
      });
  }
  return initPromise;
}

function parse<T>(json: string): T {
  return JSON.parse(json) as T;
}

/**
 * Replay + validate a KEL, returning the resulting key state (verifier-computed).
 * `attachmentsJson` carries the per-event CESR needed to check controller and
 * witness signatures. Shapes are defined by the verifier crate; callers type the
 * result.
 */
export async function validateKel<T = unknown>(
  kelJson: string,
  attachmentsJson: string,
): Promise<T> {
  await ensureVerifier();
  return parse<T>(await validateKelJson(kelJson, attachmentsJson));
}

/** Verify a chain with witness-quorum checking → a report the caller types. */
export async function verifyQuorum<T = unknown>(
  chainJson: string,
  rootPkHex: string,
  rootPkCurve: string | null,
  receiptsJson: string,
  witnessKeysJson: string,
  threshold: number,
): Promise<T> {
  await ensureVerifier();
  return parse<T>(
    await verifyChainWithWitnesses(
      chainJson,
      rootPkHex,
      rootPkCurve,
      receiptsJson,
      witnessKeysJson,
      threshold,
    ),
  );
}

/** Verify a credential presentation bundle (synchronous verifier core). */
export async function verifyPresentation<T = unknown>(bundleJson: string): Promise<T> {
  await ensureVerifier();
  return parse<T>(verifyPresentationJson(bundleJson));
}

/** Verify a receipts/v1 evidence pack fully offline against pinned roots. */
export async function verifyEvidencePack<T = unknown>(
  packJson: string,
  pinnedRootsJson: string,
  pinnedLogKeyHex?: string | null,
): Promise<T> {
  await ensureVerifier();
  return parse<T>(verifyEvidencePackOffline(packJson, pinnedRootsJson, pinnedLogKeyHex ?? null));
}

/** Verify a git commit against its attestation bundle and pinned roots. */
export async function verifyCommit<T = unknown>(
  commitText: string,
  bundleJson: string,
  pinnedRootsJson: string,
): Promise<T> {
  await ensureVerifier();
  return parse<T>(await verifyCommitJson(commitText, bundleJson, pinnedRootsJson));
}
