/**
 * Browser-direct mode (plan X3.3). Once witnesses ship the public-GET CORS
 * headers (node epic W0.2), the browser can query a witness's JSON endpoints
 * itself — no explorer proxy in the path. The git-object KEL read still goes
 * through the server (browsers can't speak git smart-HTTP), but small freshness
 * reads like `/witness/{prefix}/head` can go direct.
 *
 * Every failure mode client-side — a CORS block, a network error, a timeout — is
 * indistinguishable and all collapse to `blocked`. Callers degrade silently: a
 * browser-direct read that can't happen simply isn't shown, never faked.
 */

export type DirectHead =
  | { ok: true; latestSeq: number | null }
  | { ok: false; reason: 'blocked' };

/** Query a witness's current KEL head for a prefix, straight from the browser. */
export async function fetchHeadDirect(witnessUrl: string, prefix: string): Promise<DirectHead> {
  try {
    const res = await fetch(`${witnessUrl}/witness/${encodeURIComponent(prefix)}/head`, {
      signal: AbortSignal.timeout(4_000),
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return { ok: false, reason: 'blocked' };
    const body = (await res.json()) as { latest_seq?: number | null };
    return { ok: true, latestSeq: typeof body.latest_seq === 'number' ? body.latest_seq : null };
  } catch {
    return { ok: false, reason: 'blocked' };
  }
}
