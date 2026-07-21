/**
 * Live reads for the witness directory — strictly through public surfaces: each
 * witness's `/health`. This sees exactly what any stranger sees. Every read is
 * short-timeout and never throws: an unreachable witness renders as
 * unreachable, it does not take the page down.
 */

import type { WitnessEntry } from './witnesses';

export type WitnessLiveness =
  | { state: 'up'; roles: string[] }
  | { state: 'unreachable' }
  | { state: 'standing-up' };

export interface ProbedWitness extends WitnessEntry {
  liveness: WitnessLiveness;
  /**
   * The witness's member verifying key (`did:key:…`), read LIVE from the node's
   * `/health` (`witness_did`) — the value a seller passes to
   * `--witness <name>=<key>`. Never checked in: it is derived from the node's
   * seed, so the running node is the only honest source. `null` when the
   * witness is unreachable or doesn't report it.
   */
  memberKey: string | null;
}

/**
 * The Next-augmented fetch init. Declaring it locally keeps this package free of
 * a hard dependency on Next's global `RequestInit` augmentation — the field is
 * a no-op in a plain-fetch runtime and the ISR hint in a Next one.
 */
type NextFetchInit = RequestInit & { next?: { revalidate?: number } };

/**
 * Probe one witness's public health surface. The node answers `/health` in one
 * of two shapes depending on which role owns the route: the anchor role's
 * `{up: true, roles: […]}` or the KEL role's `{status: "ok", witness_did, …}` —
 * both count. When present, `witness_did` is surfaced as the live member key.
 */
export async function probeWitness(entry: WitnessEntry): Promise<ProbedWitness> {
  if (!entry.url) return { ...entry, liveness: { state: 'standing-up' }, memberKey: null };
  try {
    const init: NextFetchInit = {
      signal: AbortSignal.timeout(2_500),
      next: { revalidate: 30 },
    };
    const res = await fetch(`${entry.url}/health`, init);
    if (!res.ok) return { ...entry, liveness: { state: 'unreachable' }, memberKey: null };
    const body = (await res.json()) as {
      up?: boolean;
      status?: string;
      roles?: string[];
      witness_did?: string;
    };
    if (body.up !== true && body.status !== 'ok') {
      return { ...entry, liveness: { state: 'unreachable' }, memberKey: null };
    }
    return {
      ...entry,
      liveness: { state: 'up', roles: Array.isArray(body.roles) ? body.roles : [...entry.roles] },
      memberKey: typeof body.witness_did === 'string' ? body.witness_did : null,
    };
  } catch {
    return { ...entry, liveness: { state: 'unreachable' }, memberKey: null };
  }
}
