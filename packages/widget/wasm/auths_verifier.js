/* @ts-self-types="./auths_verifier.d.ts" */

import * as wasm from "./auths_verifier_bg.wasm";
import { __wbg_set_wasm } from "./auths_verifier_bg.js";
__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    verifyAttestationJson, verifyAttestationWithResult, verifyChainJson, verifyChainWithWitnesses
} from "./auths_verifier_bg.js";
