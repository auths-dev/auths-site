/**
 * Live reads for the /network page — strictly through public surfaces: each
 * witness's `/health`, and the market's public watcher feed. No private
 * channel exists between the apps; this page sees exactly what any stranger
 * sees. Every read is short-timeout and never throws: an unreachable network
 * renders as unreachable, it does not take the page down.
 */

import type { WitnessEntry } from './witnesses';

export type WitnessLiveness =
  | { state: 'up'; roles: string[] }
  | { state: 'unreachable' }
  | { state: 'standing-up' };

export interface ProbedWitness extends WitnessEntry {
  liveness: WitnessLiveness;
}

/** One row of the market's watcher feed (its own witnessing observations). */
export interface MarketObservation {
  listing: string;
  name: string;
  observed_at: string;
  head: string;
  count: number;
  cumulative_cents: number;
  as_of: string;
  anchor_tier: string;
  anchor_threshold: number | null;
  anchor_witnesses: number | null;
}

export interface WatcherFeed {
  watcher: string;
  totals: { listings_watched: number; observations: number };
  observations: MarketObservation[];
}

/** Where the market's public API lives; overridable so local dev can point at :3002. */
export function marketApiBase(): string {
  return (process.env.MARKET_API_URL ?? 'https://market.auths.dev').replace(/\/$/, '');
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

/** The market's public watcher feed, or null when it cannot be reached. */
export async function fetchWatcherFeed(limit = 12): Promise<WatcherFeed | null> {
  try {
    const res = await fetch(`${marketApiBase()}/api/v1/network/observations?limit=${limit}`, {
      signal: AbortSignal.timeout(4_000),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as WatcherFeed;
    if (!Array.isArray(body.observations)) return null;
    return body;
  } catch {
    return null;
  }
}
