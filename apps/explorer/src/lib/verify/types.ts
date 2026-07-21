/**
 * Client-safe types for the browser verifier surface. These mirror the exact
 * shapes the `auths-verifier` WASM produces/consumes (traced from the crate) —
 * a wrong field name here reads back `undefined`, so they are kept faithful.
 */

/** A KERI event body — the fields the KEL timeline renders. */
export interface KelEvent {
  /** Version string, e.g. `KERI10JSON000123_`. */
  v: string;
  /** Event type. */
  t: 'icp' | 'rot' | 'ixn' | 'dip' | 'drt';
  /** SAID (self-addressing digest) of this event. */
  d: string;
  /** Controller prefix (AID). */
  i: string;
  /** Sequence number — a LOWERCASE-HEX string (e.g. "0", "a"). */
  s: string;
  /** Prior event SAID (rotation/interaction/delegated). */
  p?: string;
  /** Current signing keys (establishment events). */
  k?: string[];
  /** Signing threshold (hex string or weighted array-of-arrays). */
  kt?: string | string[][];
  /** Next-key digests. */
  n?: string[];
  nt?: string | string[][];
  /** Witness backers (inception). */
  b?: string[];
  /** Witnesses removed / added (rotation). */
  br?: string[];
  ba?: string[];
  /** Anchored seals. */
  a?: unknown[];
  /** Delegator prefix (delegated events). */
  di?: string;
}

/** The key state the verifier computes by replaying a KEL. snake_case, verbatim. */
export interface KeyState {
  prefix: string;
  current_keys: string[];
  next_commitment: string[];
  sequence: number;
  last_event_said: string;
  is_abandoned: boolean;
  threshold: string | string[][];
  next_threshold: string | string[][];
  backers: string[];
  backer_threshold: string | string[][];
  config_traits: string[];
  is_non_transferable: boolean;
  delegator: string | null;
  last_establishment_sequence: number;
}

/**
 * What the server KEL-read route returns — the raw bytes the browser verifies.
 * Matches the SDK `readKelJson` shape: events + per-event HEX CESR attachments,
 * strictly same order and equal length (a mismatch fails validation closed).
 */
export interface KelReadResult {
  prefix: string;
  events: KelEvent[];
  /** Per-event CESR attachment, hex-encoded, one per event in `events` order. */
  attachments: string[];
  tip: { sequence: number; said: string } | null;
  /** Which registry backend served the bytes (`per-prefix` | `packed`). */
  source: string;
}

/** Parse a lowercase-hex KERI sequence string to a number for display/sorting. */
export function seqToNumber(s: string): number {
  const n = parseInt(s, 16);
  return Number.isFinite(n) ? n : 0;
}
