/**
 * Verifies a detached Ed25519 signature over a file hash (all inputs hex-encoded).
 * Returns true if valid, false on any error or invalid signature.
 * Designed for browser-side artifact verification without sending the file to any server.
 * @param {string} file_hash_hex
 * @param {string} signature_hex
 * @param {string} public_key_hex
 * @returns {boolean}
 */
export function verifyArtifactSignature(file_hash_hex, signature_hex, public_key_hex) {
    const ptr0 = passStringToWasm0(file_hash_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(signature_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(public_key_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.verifyArtifactSignature(ptr0, len0, ptr1, len1, ptr2, len2);
    return ret !== 0;
}

/**
 * Verifies an attestation provided as a JSON string against an explicit issuer public key hex string.
 * Returns Ok(()) on success, Err(JsValue(error_message)) on failure.
 * @param {string} attestation_json_str
 * @param {string} issuer_pk_hex
 */
export function verifyAttestationJson(attestation_json_str, issuer_pk_hex) {
    const ptr0 = passStringToWasm0(attestation_json_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(issuer_pk_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.verifyAttestationJson(ptr0, len0, ptr1, len1);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * Verifies an attestation and returns a JSON result object.
 * Returns JSON: {"valid": true} or {"valid": false, "error": "..."}
 * @param {string} attestation_json_str
 * @param {string} issuer_pk_hex
 * @returns {string}
 */
export function verifyAttestationWithResult(attestation_json_str, issuer_pk_hex) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(attestation_json_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(issuer_pk_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.verifyAttestationWithResult(ptr0, len0, ptr1, len1);
        deferred3_0 = ret[0];
        deferred3_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Verifies a chain of attestations and returns a VerificationReport as JSON.
 * attestations_json_array: JSON array of attestation objects
 * root_pk_hex: Root public key in hex
 * @param {string} attestations_json_array
 * @param {string} root_pk_hex
 * @returns {string}
 */
export function verifyChainJson(attestations_json_array, root_pk_hex) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(attestations_json_array, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(root_pk_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.verifyChainJson(ptr0, len0, ptr1, len1);
        deferred3_0 = ret[0];
        deferred3_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

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
 * @param {string} chain_json
 * @param {string} root_pk_hex
 * @param {string} receipts_json
 * @param {string} witness_keys_json
 * @param {number} threshold
 * @returns {string}
 */
export function verifyChainWithWitnesses(chain_json, root_pk_hex, receipts_json, witness_keys_json, threshold) {
    let deferred5_0;
    let deferred5_1;
    try {
        const ptr0 = passStringToWasm0(chain_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(root_pk_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passStringToWasm0(receipts_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passStringToWasm0(witness_keys_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len3 = WASM_VECTOR_LEN;
        const ret = wasm.verifyChainWithWitnesses(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, threshold);
        deferred5_0 = ret[0];
        deferred5_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred5_0, deferred5_1, 1);
    }
}
export function __wbg___wbindgen_throw_be289d5034ed271b(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
}
export function __wbg_getTime_1e3cd1391c5c3995(arg0) {
    const ret = arg0.getTime();
    return ret;
}
export function __wbg_log_48ede529c99735e0(arg0, arg1) {
    console.log(getStringFromWasm0(arg0, arg1));
}
export function __wbg_new_0_73afc35eb544e539() {
    const ret = new Date();
    return ret;
}
export function __wbindgen_cast_0000000000000001(arg0, arg1) {
    // Cast intrinsic for `Ref(String) -> Externref`.
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
}
export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_externrefs;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
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


let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}
