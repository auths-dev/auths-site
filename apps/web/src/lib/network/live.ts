/**
 * The witness liveness probe now lives in the shared `@auths/witnesses` package,
 * so auths.dev's `/network` page and the explorer probe `/health` the same way.
 * This module is a thin re-export kept so existing `@/lib/network/live` imports
 * don't move.
 */
export { probeWitness, type ProbedWitness, type WitnessLiveness } from '@auths/witnesses';
