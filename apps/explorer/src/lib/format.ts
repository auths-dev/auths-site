/**
 * Small display helpers, shared across the explorer's views. Pure functions —
 * no verification, no I/O.
 */

/** A KERI prefix or `did:keri:` string, truncated head…tail for chips/labels. */
export function truncateId(id: string, head = 10, tail = 6): string {
  const bare = id.replace(/^did:keri:/, '');
  if (bare.length <= head + tail + 1) return bare;
  return `${bare.slice(0, head)}…${bare.slice(-tail)}`;
}

/** Normalize a search term to a bare prefix: strips `did:keri:` and whitespace. */
export function toBarePrefix(term: string): string {
  return term.trim().replace(/^did:keri:/, '');
}

/** A prefix is a base64url-ish SAID: 44 chars of the KERI alphabet, leading `E`/`D`/`B`. */
export function looksLikePrefix(term: string): boolean {
  const bare = toBarePrefix(term);
  return /^[A-Za-z0-9_-]{20,64}$/.test(bare);
}

/** A git commit SHA (short or full hex). */
export function looksLikeCommitSha(term: string): boolean {
  return /^[0-9a-f]{7,40}$/i.test(term.trim());
}

/** Human "3s ago" / "2m ago" from an epoch-ms stamp, relative to `now`. */
export function relativeAge(fetchedAtMs: number, nowMs: number): string {
  const secs = Math.max(0, Math.round((nowMs - fetchedAtMs) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
