/**
 * The witness directory now lives in the shared `@auths/witnesses` package, so
 * auths.dev's `/network` page and the explorer read one source. This module is
 * a thin re-export kept so existing `@/lib/network/witnesses` imports don't move.
 */
export { witnessDirectory, witnessByName, type WitnessEntry } from '@auths/witnesses';
