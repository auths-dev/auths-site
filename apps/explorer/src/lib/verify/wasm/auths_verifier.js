/* @ts-self-types="./auths_verifier.d.ts" */

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
 * @param {string} kel_json
 * @param {string} attachments_json
 * @returns {Promise<string>}
 */
export function validateKelJson(kel_json, attachments_json) {
    const ptr0 = passStringToWasm0(kel_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(attachments_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.validateKelJson(ptr0, len0, ptr1, len1);
    return ret;
}

/**
 * Verifies a detached signature over a file hash (all inputs hex-encoded).
 *
 * Args:
 * * `file_hash_hex`: Hex-encoded file hash.
 * * `signature_hex`: Hex-encoded signature.
 * * `public_key_hex`: Hex-encoded public key.
 * * `curve`: Curve name ("ed25519" or "p256"). Defaults to P-256.
 * @param {string} file_hash_hex
 * @param {string} signature_hex
 * @param {string} public_key_hex
 * @param {string | null} [curve]
 * @returns {Promise<boolean>}
 */
export function verifyArtifactSignature(file_hash_hex, signature_hex, public_key_hex, curve) {
    const ptr0 = passStringToWasm0(file_hash_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(signature_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(public_key_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    var ptr3 = isLikeNone(curve) ? 0 : passStringToWasm0(curve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len3 = WASM_VECTOR_LEN;
    const ret = wasm.verifyArtifactSignature(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
    return ret;
}

/**
 * Verifies an attestation provided as a JSON string against an explicit issuer public key hex string.
 * @param {string} attestation_json_str
 * @param {string} issuer_pk_hex
 * @param {string | null} [issuer_pk_curve]
 * @returns {Promise<void>}
 */
export function verifyAttestationJson(attestation_json_str, issuer_pk_hex, issuer_pk_curve) {
    const ptr0 = passStringToWasm0(attestation_json_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(issuer_pk_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    var ptr2 = isLikeNone(issuer_pk_curve) ? 0 : passStringToWasm0(issuer_pk_curve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len2 = WASM_VECTOR_LEN;
    const ret = wasm.verifyAttestationJson(ptr0, len0, ptr1, len1, ptr2, len2);
    return ret;
}

/**
 * Verifies an attestation and returns a JSON result object.
 * @param {string} attestation_json_str
 * @param {string} issuer_pk_hex
 * @param {string | null} [issuer_pk_curve]
 * @returns {Promise<string>}
 */
export function verifyAttestationWithResult(attestation_json_str, issuer_pk_hex, issuer_pk_curve) {
    const ptr0 = passStringToWasm0(attestation_json_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(issuer_pk_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    var ptr2 = isLikeNone(issuer_pk_curve) ? 0 : passStringToWasm0(issuer_pk_curve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len2 = WASM_VECTOR_LEN;
    const ret = wasm.verifyAttestationWithResult(ptr0, len0, ptr1, len1, ptr2, len2);
    return ret;
}

/**
 * Verifies a chain of attestations and returns a VerificationReport as JSON.
 * @param {string} attestations_json_array
 * @param {string} root_pk_hex
 * @param {string | null} [root_pk_curve]
 * @returns {Promise<string>}
 */
export function verifyChainJson(attestations_json_array, root_pk_hex, root_pk_curve) {
    const ptr0 = passStringToWasm0(attestations_json_array, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(root_pk_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    var ptr2 = isLikeNone(root_pk_curve) ? 0 : passStringToWasm0(root_pk_curve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len2 = WASM_VECTOR_LEN;
    const ret = wasm.verifyChainJson(ptr0, len0, ptr1, len1, ptr2, len2);
    return ret;
}

/**
 * Verifies a chain of attestations with witness quorum checking.
 * @param {string} chain_json
 * @param {string} root_pk_hex
 * @param {string | null | undefined} root_pk_curve
 * @param {string} receipts_json
 * @param {string} witness_keys_json
 * @param {number} threshold
 * @returns {Promise<string>}
 */
export function verifyChainWithWitnesses(chain_json, root_pk_hex, root_pk_curve, receipts_json, witness_keys_json, threshold) {
    const ptr0 = passStringToWasm0(chain_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(root_pk_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    var ptr2 = isLikeNone(root_pk_curve) ? 0 : passStringToWasm0(root_pk_curve, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len2 = WASM_VECTOR_LEN;
    const ptr3 = passStringToWasm0(receipts_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len3 = WASM_VECTOR_LEN;
    const ptr4 = passStringToWasm0(witness_keys_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len4 = WASM_VECTOR_LEN;
    const ret = wasm.verifyChainWithWitnesses(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, threshold);
    return ret;
}

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
 * @param {string} commit_text
 * @param {string} bundle_json
 * @param {string} pinned_roots_json
 * @returns {Promise<string>}
 */
export function verifyCommitJson(commit_text, bundle_json, pinned_roots_json) {
    const ptr0 = passStringToWasm0(commit_text, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(bundle_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(pinned_roots_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.verifyCommitJson(ptr0, len0, ptr1, len1, ptr2, len2);
    return ret;
}

/**
 * Verify an issued **credential** from a bundled JSON request (the fn-153.3 contract),
 * returning the tagged discriminated-union verdict as a JSON string. Same synchronous,
 * executor-free, CESR-tagged-key contract as [`wasm_verify_presentation_json`].
 *
 * Args:
 * * `bundle_json`: A `VerifyCredentialRequest` JSON document (see `contract` module docs).
 * @param {string} bundle_json
 * @returns {string}
 */
export function verifyCredentialJson(bundle_json) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(bundle_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.verifyCredentialJson(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

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
 * @param {string} kel_json
 * @param {string} attachments_json
 * @param {string} attestation_json
 * @param {string} device_did
 * @returns {Promise<string>}
 */
export function verifyDeviceLink(kel_json, attachments_json, attestation_json, device_did) {
    const ptr0 = passStringToWasm0(kel_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(attachments_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(attestation_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passStringToWasm0(device_did, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len3 = WASM_VECTOR_LEN;
    const ret = wasm.verifyDeviceLink(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
    return ret;
}

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
 * @param {string} pack_json
 * @param {string} pinned_roots_json
 * @param {string | null} [pinned_log_key_hex]
 * @returns {string}
 */
export function verifyEvidencePackOffline(pack_json, pinned_roots_json, pinned_log_key_hex) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(pack_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(pinned_roots_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        var ptr2 = isLikeNone(pinned_log_key_hex) ? 0 : passStringToWasm0(pinned_log_key_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len2 = WASM_VECTOR_LEN;
        const ret = wasm.verifyEvidencePackOffline(ptr0, len0, ptr1, len1, ptr2, len2);
        deferred4_0 = ret[0];
        deferred4_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

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
 * @param {string} bundle_json
 * @param {string} pinned_roots_json
 * @param {string | null} [member_did]
 * @param {string | null} [signed_at]
 * @returns {string}
 */
export function verifyOrgBundle(bundle_json, pinned_roots_json, member_did, signed_at) {
    let deferred5_0;
    let deferred5_1;
    try {
        const ptr0 = passStringToWasm0(bundle_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(pinned_roots_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        var ptr2 = isLikeNone(member_did) ? 0 : passStringToWasm0(member_did, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len2 = WASM_VECTOR_LEN;
        var ptr3 = isLikeNone(signed_at) ? 0 : passStringToWasm0(signed_at, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len3 = WASM_VECTOR_LEN;
        const ret = wasm.verifyOrgBundle(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
        deferred5_0 = ret[0];
        deferred5_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
}

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
 * @param {string} bundle_json
 * @returns {string}
 */
export function verifyPresentationJson(bundle_json) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(bundle_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.verifyPresentationJson(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_boolean_get_6ea149f0a8dcc5ff: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_ab4b34d23d6778bd: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_is_function_3baa9db1a987f47d: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_undefined_29a43b4d42920abd: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_throw_6b64449b9b9ed33c: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg__wbg_cb_unref_b46c9b5a9f08ec37: function(arg0) {
            arg0._wbg_cb_unref();
        },
        __wbg_call_a24592a6f349a97e: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_getTime_da7c55f52b71e8c6: function(arg0) {
            const ret = arg0.getTime();
            return ret;
        },
        __wbg_get_6011fa3a58f61074: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_importKey_e7bd08f819606b82: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
            const ret = arg0.importKey(getStringFromWasm0(arg1, arg2), arg3, getStringFromWasm0(arg4, arg5), arg6 !== 0, arg7);
            return ret;
        }, arguments); },
        __wbg_instanceof_Crypto_c186eb838c7f8f24: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Crypto;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_log_460fa1ae7e6bb846: function(arg0, arg1) {
            console.log(getStringFromWasm0(arg0, arg1));
        },
        __wbg_new_0_4d657201ced14de3: function() {
            const ret = new Date();
            return ret;
        },
        __wbg_new_from_slice_b5ea43e23f6008c0: function(arg0, arg1) {
            const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_typed_323f37fd55ab048d: function(arg0, arg1) {
            try {
                var state0 = {a: arg0, b: arg1};
                var cb0 = (arg0, arg1) => {
                    const a = state0.a;
                    state0.a = 0;
                    try {
                        return wasm_bindgen__convert__closures_____invoke__h4a43072c2650a897(a, state0.b, arg0, arg1);
                    } finally {
                        state0.a = a;
                    }
                };
                const ret = new Promise(cb0);
                return ret;
            } finally {
                state0.a = 0;
            }
        },
        __wbg_of_07054ba808010e4f: function(arg0) {
            const ret = Array.of(arg0);
            return ret;
        },
        __wbg_queueMicrotask_5d15a957e6aa920e: function(arg0) {
            queueMicrotask(arg0);
        },
        __wbg_queueMicrotask_f8819e5ffc402f36: function(arg0) {
            const ret = arg0.queueMicrotask;
            return ret;
        },
        __wbg_resolve_e6c466bc1052f16c: function(arg0) {
            const ret = Promise.resolve(arg0);
            return ret;
        },
        __wbg_static_accessor_GLOBAL_8cfadc87a297ca02: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_602256ae5c8f42cf: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_e445c1c7484aecc3: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_f20e8576ef1e0f17: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_subtle_ea8e61b438274a03: function(arg0) {
            const ret = arg0.subtle;
            return ret;
        },
        __wbg_then_792e0c862b060889: function(arg0, arg1, arg2) {
            const ret = arg0.then(arg1, arg2);
            return ret;
        },
        __wbg_then_8e16ee11f05e4827: function(arg0, arg1) {
            const ret = arg0.then(arg1);
            return ret;
        },
        __wbg_verify_42c12b220fa73ea5: function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
            const ret = arg0.verify(getStringFromWasm0(arg1, arg2), arg3, getArrayU8FromWasm0(arg4, arg5), getArrayU8FromWasm0(arg6, arg7));
            return ret;
        }, arguments); },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Closure(Closure { owned: true, function: Function { arguments: [Externref], shim_idx: 1306, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
            const ret = makeMutClosure(arg0, arg1, wasm_bindgen__convert__closures_____invoke__haecb9016827fe50d);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./auths_verifier_bg.js": import0,
    };
}

function wasm_bindgen__convert__closures_____invoke__haecb9016827fe50d(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen__convert__closures_____invoke__haecb9016827fe50d(arg0, arg1, arg2);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function wasm_bindgen__convert__closures_____invoke__h4a43072c2650a897(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures_____invoke__h4a43072c2650a897(arg0, arg1, arg2, arg3);
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => wasm.__wbindgen_destroy_closure(state.a, state.b));

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function makeMutClosure(arg0, arg1, f) {
    const state = { a: arg0, b: arg1, cnt: 1 };
    const real = (...args) => {

        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            wasm.__wbindgen_destroy_closure(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('auths_verifier_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
