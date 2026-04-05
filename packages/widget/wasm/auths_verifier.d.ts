/* tslint:disable */
/* eslint-disable */

/**
 * Verifies a detached Ed25519 signature over a file hash (all inputs hex-encoded).
 */
export function verifyArtifactSignature(file_hash_hex: string, signature_hex: string, public_key_hex: string): Promise<boolean>;

/**
 * Verifies an attestation provided as a JSON string against an explicit issuer public key hex string.
 */
export function verifyAttestationJson(attestation_json_str: string, issuer_pk_hex: string): Promise<void>;

/**
 * Verifies an attestation and returns a JSON result object.
 */
export function verifyAttestationWithResult(attestation_json_str: string, issuer_pk_hex: string): Promise<string>;

/**
 * Verifies a chain of attestations and returns a VerificationReport as JSON.
 */
export function verifyChainJson(attestations_json_array: string, root_pk_hex: string): Promise<string>;

/**
 * Verifies a chain of attestations with witness quorum checking.
 */
export function verifyChainWithWitnesses(chain_json: string, root_pk_hex: string, receipts_json: string, witness_keys_json: string, threshold: number): Promise<string>;

/**
 * Verifies that a device is cryptographically linked to a KERI identity.
 *
 * Composes KEL verification, attestation signature verification, device DID matching,
 * and seal anchoring. Returns a JSON result (never throws for verification failures).
 *
 * Args:
 * * `kel_json`: JSON array of KEL events.
 * * `attestation_json`: JSON attestation linking identity to device.
 * * `device_did`: Expected device DID string (e.g. `"did:key:z6Mk..."`).
 *
 * Usage:
 * ```ignore
 * let result = verifyDeviceLink(kelJson, attestationJson, "did:key:z6Mk...").await;
 * // result: {"valid": true, "key_state": {...}, "seal_sequence": 2}
 * // or:     {"valid": false, "error": "..."}
 * ```
 */
export function verifyDeviceLink(kel_json: string, attestation_json: string, device_did: string): Promise<string>;

/**
 * Verifies a KERI Key Event Log and returns the resulting key state as JSON.
 *
 * Args:
 * * `kel_json`: JSON array of KEL events (inception, rotation, interaction).
 *
 * Usage:
 * ```ignore
 * let key_state_json = verifyKelJson("[{\"v\":\"KERI10JSON\",\"t\":\"icp\",...}]").await?;
 * ```
 */
export function verifyKelJson(kel_json: string): Promise<string>;
