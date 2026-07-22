/* tslint:disable */
/* eslint-disable */

/**
 * Authenticates a KERI Key Event Log and returns the resulting key state as JSON.
 *
 * Every event must carry a valid CESR signature from its controlling key-state:
 * `kel_json` is the JSON array of events and `attachments_json` a parallel JSON
 * array of hex-encoded CESR signature attachments (one per event). The KEL is
 * replayed through [`validate_signed_kel`](auths_keri::validate_signed_kel), so a
 * forged or unsigned KEL fails closed (RT-002) — the structural-only
 * `validate_kel` is deliberately NOT exposed across this untrusted boundary. A
 * delegated (`dip`/`drt`) KEL also fails closed here, because a single-KEL
 * entrypoint cannot supply the delegator's anchoring seals; resolve those through
 * the bundle/org path that carries the delegator KEL alongside it.
 *
 * Args:
 * * `kel_json`: JSON array of KEL events (inception, rotation, interaction).
 * * `attachments_json`: JSON array of hex CESR signature attachments, one per event.
 *
 * Usage:
 * ```ignore
 * let key_state_json = validateKelJson(kelJson, attachmentsJson).await?;
 * ```
 */
export function validateKelJson(kel_json: string, attachments_json: string): Promise<string>;

/**
 * Verifies a detached signature over a file hash (all inputs hex-encoded).
 *
 * Args:
 * * `file_hash_hex`: Hex-encoded file hash.
 * * `signature_hex`: Hex-encoded signature.
 * * `public_key_hex`: Hex-encoded public key.
 * * `curve`: Curve name ("ed25519" or "p256"). Defaults to P-256.
 */
export function verifyArtifactSignature(file_hash_hex: string, signature_hex: string, public_key_hex: string, curve?: string | null): Promise<boolean>;

/**
 * Verifies an attestation provided as a JSON string against an explicit issuer public key hex string.
 */
export function verifyAttestationJson(attestation_json_str: string, issuer_pk_hex: string, issuer_pk_curve?: string | null): Promise<void>;

/**
 * Verifies an attestation and returns a JSON result object.
 */
export function verifyAttestationWithResult(attestation_json_str: string, issuer_pk_hex: string, issuer_pk_curve?: string | null): Promise<string>;

/**
 * Verifies a chain of attestations and returns a VerificationReport as JSON.
 */
export function verifyChainJson(attestations_json_array: string, root_pk_hex: string, root_pk_curve?: string | null): Promise<string>;

/**
 * Verifies a chain of attestations with witness quorum checking.
 */
export function verifyChainWithWitnesses(chain_json: string, root_pk_hex: string, root_pk_curve: string | null | undefined, receipts_json: string, witness_keys_json: string, threshold: number): Promise<string>;

/**
 * Verify a raw git commit object against an identity bundle, fully stateless,
 * returning the tagged JSON envelope (`kind`: `"verdict"` | `"error"`).
 *
 * This is the "commit ← maintainer" leg in the browser: the bundle's KEL is
 * freshness-checked, self-certification-checked (RT-005), and
 * signature-authenticated (RT-002), the bundle root must already be in
 * `pinned_roots_json` (evidence-only), and the commit's SSH signature is
 * verified in-process against the replayed KEL — the same
 * [`verify_commit_against_kel`](crate::verify_commit_against_kel) verdict the
 * native CLI computes, with no git and no identity store.
 *
 * Args:
 * * `commit_text`: The raw commit object (`git cat-file commit <sha>` bytes).
 * * `bundle_json`: The identity bundle JSON (`auths id export-bundle`).
 * * `pinned_roots_json`: JSON array of independently pinned `did:keri:` roots.
 *
 * Usage (TypeScript):
 * ```ignore
 * const verdict = JSON.parse(await verifyCommitJson(commit, bundle, '["did:keri:E…"]'));
 * const commitLegHolds = verdict.kind === "verdict" && verdict.valid;
 * ```
 */
export function verifyCommitJson(commit_text: string, bundle_json: string, pinned_roots_json: string): Promise<string>;

/**
 * Verify an issued **credential** from a bundled JSON request (the fn-153.3 contract),
 * returning the tagged discriminated-union verdict as a JSON string. Same synchronous,
 * executor-free, CESR-tagged-key contract as [`wasm_verify_presentation_json`].
 *
 * Args:
 * * `bundle_json`: A `VerifyCredentialRequest` JSON document (see `contract` module docs).
 */
export function verifyCredentialJson(bundle_json: string): string;

/**
 * Verifies that a device is cryptographically linked to a KERI identity.
 *
 * Composes KEL verification, attestation signature verification, device DID matching,
 * and seal anchoring. Returns a JSON result (never throws for verification failures).
 *
 * Args:
 * * `kel_json`: JSON array of KEL events.
 * * `attachments_json`: JSON array of hex CESR signature attachments, one per event —
 *   the KEL authenticates via `validate_signed_kel` before the link check (RT-002).
 * * `attestation_json`: JSON attestation linking identity to device.
 * * `device_did`: Expected device DID string (e.g. `"did:key:z6Mk..."`).
 *
 * Usage:
 * ```ignore
 * let result = verifyDeviceLink(kelJson, attachmentsJson, attestationJson, "did:key:z6Mk...").await;
 * // result: {"valid": true, "key_state": {...}, "seal_sequence": 2}
 * // or:     {"valid": false, "error": "..."}
 * ```
 */
export function verifyDeviceLink(kel_json: string, attachments_json: string, attestation_json: string, device_did: string): Promise<string>;

/**
 * Verify an **offline compliance evidence pack** with zero network, returning
 * the tagged verdict envelope (`kind`: `"verdicts"` | `"error"`) as a JSON
 * string — one verdict per evidence row.
 *
 * Synchronous, executor-free, and panic-free: the verify core
 * ([`crate::evidence_pack::verify_evidence_pack_offline`]) authenticates the
 * embedded org bundle, re-derives each row's authority-at-release from the
 * embedded KEL (tamper check), and checks each row's transparency-log
 * inclusion/consistency proof — so the dashboard computes the verdict live
 * instead of replaying a recorded native run. With a pinned log key, each
 * row's checkpoint signature is verified against that operator key too
 * (`checkpoint_attested` in the verdict); without one the verdict honestly
 * reports membership only.
 *
 * Args:
 * * `pack_json`: The `EvidencePack` JSON (the `.evidence` file).
 * * `pinned_roots_json`: JSON array of pinned `did:keri:` roots.
 * * `pinned_log_key_hex`: The pinned log operator key (64 hex chars,
 *   Ed25519), or `undefined` for a membership-only verdict.
 */
export function verifyEvidencePackOffline(pack_json: string, pinned_roots_json: string, pinned_log_key_hex?: string | null): string;

/**
 * Verify an **air-gapped org bundle** offline, returning the tagged verdict
 * envelope (`kind`: `"report"` | `"error"`) as a JSON string.
 *
 * Synchronous, executor-free, and panic-free: the verify core
 * ([`crate::org_bundle::verify_org_bundle`]) is a pure function of the
 * bundle's bytes — every event's SAID recomputed, every signature
 * authenticated against the controlling key-state (RT-002), duplicity
 * flagged, and authority classified by KEL position — so the browser
 * computes the same verdict the native CLI does, with zero network.
 *
 * Args:
 * * `bundle_json`: The `AirGappedOrgBundle` JSON (the `.auths-offline` file).
 * * `pinned_roots_json`: JSON array of pinned `did:keri:` roots.
 * * `member_did`: Optional member to classify (`did:keri:` or bare prefix).
 * * `signed_at`: Optional in-band signing KEL position, as a decimal string.
 */
export function verifyOrgBundle(bundle_json: string, pinned_roots_json: string, member_did?: string | null, signed_at?: string | null): string;

/**
 * Verify a credential **presentation** from a bundled JSON request (the fn-153.3 contract),
 * returning the tagged discriminated-union verdict as a JSON string.
 *
 * Synchronous by construction: the verify core (fn-153.1/.3) runs the pure-Rust
 * `software_verify` path, so there is no `block_on`/executor — which is mandatory in
 * single-threaded browser WASM. Keys travel CESR-tagged inside the request JSON; there is
 * no raw-pubkey argument and no byte-length curve dispatch (`pk_from_hex_wasm` is not used).
 *
 * Args:
 * * `bundle_json`: A `VerifyPresentationRequest` JSON document (see `contract` module docs).
 *
 * Usage (TypeScript):
 * ```ignore
 * import { verifyPresentationJson } from "auths-verifier";
 * import type { PresentationVerdictEnvelope } from "auths-verifier/ts/verdict";
 * const verdict = JSON.parse(verifyPresentationJson(bundle)) as PresentationVerdictEnvelope;
 * if (verdict.kind === "valid") {
 *   // verdict.subject and verdict.caps are now available, fully typed
 * }
 * ```
 */
export function verifyPresentationJson(bundle_json: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly validateKelJson: (a: number, b: number, c: number, d: number) => any;
    readonly verifyArtifactSignature: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => any;
    readonly verifyAttestationJson: (a: number, b: number, c: number, d: number, e: number, f: number) => any;
    readonly verifyAttestationWithResult: (a: number, b: number, c: number, d: number, e: number, f: number) => any;
    readonly verifyChainJson: (a: number, b: number, c: number, d: number, e: number, f: number) => any;
    readonly verifyChainWithWitnesses: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => any;
    readonly verifyCommitJson: (a: number, b: number, c: number, d: number, e: number, f: number) => any;
    readonly verifyCredentialJson: (a: number, b: number) => [number, number];
    readonly verifyDeviceLink: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => any;
    readonly verifyEvidencePackOffline: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
    readonly verifyOrgBundle: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number];
    readonly verifyPresentationJson: (a: number, b: number) => [number, number];
    readonly ring_core_0_17_14__bn_mul_mont: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly wasm_bindgen__convert__closures_____invoke__haecb9016827fe50d: (a: number, b: number, c: any) => [number, number];
    readonly wasm_bindgen__convert__closures_____invoke__h4a43072c2650a897: (a: number, b: number, c: any, d: any) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_destroy_closure: (a: number, b: number) => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
