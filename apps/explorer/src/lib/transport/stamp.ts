/**
 * The freshness stamp every transport response carries (plan X3.2 — caching
 * honesty). The explorer server is a mirror; a mirror must say when it last
 * touched the origin so a stale copy renders as stale, never silently.
 *
 * No verdict is ever cached here — only bytes and the time they were fetched.
 * Verification always runs client-side on whatever bytes came back.
 */
export interface FetchStamp {
  /** Display name of the witness the bytes came from. */
  witness: string;
  /** The witness base URL the bytes came from. */
  url: string;
  /** Epoch-ms when the explorer server last fetched from the origin. */
  fetchedAt: number;
  /** How the bytes were obtained. */
  source: 'proxy' | 'git-mirror' | 'browser-direct';
}
