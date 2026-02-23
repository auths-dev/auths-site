/* tslint:disable */
/* eslint-disable */

/**
 * Verifies an attestation provided as a JSON string against an explicit issuer public key hex string.
 * Returns Ok(()) on success, Err(JsValue(error_message)) on failure.
 */
export function verifyAttestationJson(attestation_json_str: string, issuer_pk_hex: string): void;

/**
 * Verifies an attestation and returns a JSON result object.
 * Returns JSON: {"valid": true} or {"valid": false, "error": "..."}
 */
export function verifyAttestationWithResult(attestation_json_str: string, issuer_pk_hex: string): string;

/**
 * Verifies a chain of attestations and returns a VerificationReport as JSON.
 * attestations_json_array: JSON array of attestation objects
 * root_pk_hex: Root public key in hex
 */
export function verifyChainJson(attestations_json_array: string, root_pk_hex: string): string;

/**
 * Verifies a chain of attestations with witness quorum checking.
 *
 * # Arguments
 * * `chain_json` - JSON array of attestation objects
 * * `root_pk_hex` - Root public key in hex
 * * `receipts_json` - JSON array of WitnessReceipt objects
 * * `witness_keys_json` - JSON array of `{ "did": "...", "pk_hex": "..." }`
 * * `threshold` - Minimum valid witness receipts required
 *
 * # Returns
 * JSON string of VerificationReport (including witness_quorum field)
 */
export function verifyChainWithWitnesses(chain_json: string, root_pk_hex: string, receipts_json: string, witness_keys_json: string, threshold: number): string;
