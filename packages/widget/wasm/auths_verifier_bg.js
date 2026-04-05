/**
 * Verifies a detached Ed25519 signature over a file hash (all inputs hex-encoded).
 * @param {string} file_hash_hex
 * @param {string} signature_hex
 * @param {string} public_key_hex
 * @returns {Promise<boolean>}
 */
export function verifyArtifactSignature(file_hash_hex, signature_hex, public_key_hex) {
    const ptr0 = passStringToWasm0(file_hash_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(signature_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(public_key_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.verifyArtifactSignature(ptr0, len0, ptr1, len1, ptr2, len2);
    return ret;
}

/**
 * Verifies an attestation provided as a JSON string against an explicit issuer public key hex string.
 * @param {string} attestation_json_str
 * @param {string} issuer_pk_hex
 * @returns {Promise<void>}
 */
export function verifyAttestationJson(attestation_json_str, issuer_pk_hex) {
    const ptr0 = passStringToWasm0(attestation_json_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(issuer_pk_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.verifyAttestationJson(ptr0, len0, ptr1, len1);
    return ret;
}

/**
 * Verifies an attestation and returns a JSON result object.
 * @param {string} attestation_json_str
 * @param {string} issuer_pk_hex
 * @returns {Promise<string>}
 */
export function verifyAttestationWithResult(attestation_json_str, issuer_pk_hex) {
    const ptr0 = passStringToWasm0(attestation_json_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(issuer_pk_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.verifyAttestationWithResult(ptr0, len0, ptr1, len1);
    return ret;
}

/**
 * Verifies a chain of attestations and returns a VerificationReport as JSON.
 * @param {string} attestations_json_array
 * @param {string} root_pk_hex
 * @returns {Promise<string>}
 */
export function verifyChainJson(attestations_json_array, root_pk_hex) {
    const ptr0 = passStringToWasm0(attestations_json_array, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(root_pk_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.verifyChainJson(ptr0, len0, ptr1, len1);
    return ret;
}

/**
 * Verifies a chain of attestations with witness quorum checking.
 * @param {string} chain_json
 * @param {string} root_pk_hex
 * @param {string} receipts_json
 * @param {string} witness_keys_json
 * @param {number} threshold
 * @returns {Promise<string>}
 */
export function verifyChainWithWitnesses(chain_json, root_pk_hex, receipts_json, witness_keys_json, threshold) {
    const ptr0 = passStringToWasm0(chain_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(root_pk_hex, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(receipts_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passStringToWasm0(witness_keys_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len3 = WASM_VECTOR_LEN;
    const ret = wasm.verifyChainWithWitnesses(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, threshold);
    return ret;
}

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
 * @param {string} kel_json
 * @param {string} attestation_json
 * @param {string} device_did
 * @returns {Promise<string>}
 */
export function verifyDeviceLink(kel_json, attestation_json, device_did) {
    const ptr0 = passStringToWasm0(kel_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(attestation_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(device_did, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.verifyDeviceLink(ptr0, len0, ptr1, len1, ptr2, len2);
    return ret;
}

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
 * @param {string} kel_json
 * @returns {Promise<string>}
 */
export function verifyKelJson(kel_json) {
    const ptr0 = passStringToWasm0(kel_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.verifyKelJson(ptr0, len0);
    return ret;
}
export function __wbg___wbindgen_boolean_get_c0f3f60bac5a78d1(arg0) {
    const v = arg0;
    const ret = typeof(v) === 'boolean' ? v : undefined;
    return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
}
export function __wbg___wbindgen_debug_string_5398f5bb970e0daa(arg0, arg1) {
    const ret = debugString(arg1);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}
export function __wbg___wbindgen_is_function_3c846841762788c1(arg0) {
    const ret = typeof(arg0) === 'function';
    return ret;
}
export function __wbg___wbindgen_is_undefined_52709e72fb9f179c(arg0) {
    const ret = arg0 === undefined;
    return ret;
}
export function __wbg___wbindgen_throw_6ddd609b62940d55(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
}
export function __wbg__wbg_cb_unref_6b5b6b8576d35cb1(arg0) {
    arg0._wbg_cb_unref();
}
export function __wbg_call_2d781c1f4d5c0ef8() { return handleError(function (arg0, arg1, arg2) {
    const ret = arg0.call(arg1, arg2);
    return ret;
}, arguments); }
export function __wbg_getTime_1dad7b5386ddd2d9(arg0) {
    const ret = arg0.getTime();
    return ret;
}
export function __wbg_get_3ef1eba1850ade27() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(arg0, arg1);
    return ret;
}, arguments); }
export function __wbg_importKey_d14401859467f6eb() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    const ret = arg0.importKey(getStringFromWasm0(arg1, arg2), arg3, getStringFromWasm0(arg4, arg5), arg6 !== 0, arg7);
    return ret;
}, arguments); }
export function __wbg_instanceof_Crypto_5c2a4c15287b0332(arg0) {
    let result;
    try {
        result = arg0 instanceof Crypto;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
}
export function __wbg_log_14452506cdb72e07(arg0, arg1) {
    console.log(getStringFromWasm0(arg0, arg1));
}
export function __wbg_new_0_1dcafdf5e786e876() {
    const ret = new Date();
    return ret;
}
export function __wbg_new_from_slice_22da9388ac046e50(arg0, arg1) {
    const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
    return ret;
}
export function __wbg_new_typed_aaaeaf29cf802876(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return wasm_bindgen__convert__closures_____invoke__h53272ce8e404a283(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        const ret = new Promise(cb0);
        return ret;
    } finally {
        state0.a = state0.b = 0;
    }
}
export function __wbg_of_8bf7ed3eca00ea43(arg0) {
    const ret = Array.of(arg0);
    return ret;
}
export function __wbg_queueMicrotask_0c399741342fb10f(arg0) {
    const ret = arg0.queueMicrotask;
    return ret;
}
export function __wbg_queueMicrotask_a082d78ce798393e(arg0) {
    queueMicrotask(arg0);
}
export function __wbg_resolve_ae8d83246e5bcc12(arg0) {
    const ret = Promise.resolve(arg0);
    return ret;
}
export function __wbg_static_accessor_GLOBAL_8adb955bd33fac2f() {
    const ret = typeof global === 'undefined' ? null : global;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
export function __wbg_static_accessor_GLOBAL_THIS_ad356e0db91c7913() {
    const ret = typeof globalThis === 'undefined' ? null : globalThis;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
export function __wbg_static_accessor_SELF_f207c857566db248() {
    const ret = typeof self === 'undefined' ? null : self;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
export function __wbg_static_accessor_WINDOW_bb9f1ba69d61b386() {
    const ret = typeof window === 'undefined' ? null : window;
    return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
}
export function __wbg_subtle_c060fa3eb5c6248d(arg0) {
    const ret = arg0.subtle;
    return ret;
}
export function __wbg_then_098abe61755d12f6(arg0, arg1) {
    const ret = arg0.then(arg1);
    return ret;
}
export function __wbg_then_9e335f6dd892bc11(arg0, arg1, arg2) {
    const ret = arg0.then(arg1, arg2);
    return ret;
}
export function __wbg_verify_5e60e39360e92205() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    const ret = arg0.verify(getStringFromWasm0(arg1, arg2), arg3, getArrayU8FromWasm0(arg4, arg5), getArrayU8FromWasm0(arg6, arg7));
    return ret;
}, arguments); }
export function __wbindgen_cast_0000000000000001(arg0, arg1) {
    // Cast intrinsic for `Closure(Closure { dtor_idx: 151, function: Function { arguments: [Externref], shim_idx: 152, ret: Result(Unit), inner_ret: Some(Result(Unit)) }, mutable: true }) -> Externref`.
    const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen__closure__destroy__h9f7e52c2f785707b, wasm_bindgen__convert__closures_____invoke__h1725af0d8be1c886);
    return ret;
}
export function __wbindgen_cast_0000000000000002(arg0, arg1) {
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
function wasm_bindgen__convert__closures_____invoke__h1725af0d8be1c886(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen__convert__closures_____invoke__h1725af0d8be1c886(arg0, arg1, arg2);
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

function wasm_bindgen__convert__closures_____invoke__h53272ce8e404a283(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures_____invoke__h53272ce8e404a283(arg0, arg1, arg2, arg3);
}

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => state.dtor(state.a, state.b));

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

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
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
            state.dtor(state.a, state.b);
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


let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}
