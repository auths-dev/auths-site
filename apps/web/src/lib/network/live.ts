/**
 * Live reads for the /network page — strictly through public surfaces: each
 * witness's `/health`. This page sees exactly what any stranger sees. Every
 * read is short-timeout and never throws: an unreachable witness renders as
 * unreachable, it does not take the page down.
 */

import type { WitnessEntry } from './witnesses';

export type WitnessLiveness =
  | { state: 'up'; roles: string[] }
  | { state: 'unreachable' }
  | { state: 'standing-up' };

export interface ProbedWitness extends WitnessEntry {
  liveness: WitnessLiveness;
}

/**
 * Probe one witness's public health surface. The node answers `/health` in one
 * of two shapes depending on which role owns the route: the anchor role's
 * `{up: true, roles: […]}` or the KEL role's `{status: "ok", …}` — both count.
 */
export async function probeWitness(entry: WitnessEntry): Promise<ProbedWitness> {
  if (!entry.url) return { ...entry, liveness: { state: 'standing-up' } };
  try {
    const res = await fetch(`${entry.url}/health`, {
      signal: AbortSignal.timeout(2_500),
      next: { revalidate: 30 },
    });
    if (!res.ok) return { ...entry, liveness: { state: 'unreachable' } };
    const body = (await res.json()) as { up?: boolean; status?: string; roles?: string[] };
    if (body.up !== true && body.status !== 'ok') {
      return { ...entry, liveness: { state: 'unreachable' } };
    }
    return {
      ...entry,
      liveness: { state: 'up', roles: Array.isArray(body.roles) ? body.roles : [...entry.roles] },
    };
  } catch {
    return { ...entry, liveness: { state: 'unreachable' } };
  }
}
