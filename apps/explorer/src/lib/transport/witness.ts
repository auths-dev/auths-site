/**
 * Resolve the `[witness]` route segment to a base URL to fetch bytes from.
 *
 * The federation, not the node, is the product (plan X3.4): the explorer runs
 * against ANY conformant witness. Resolution order:
 *  1. a name in the checked-in directory (`@auths/witnesses`) → its public URL;
 *  2. a URL-encoded `https://…` in the segment itself, or a `?witness=` query
 *     override → that arbitrary conformant witness, verbatim.
 *
 * Server-only: `witnessByName` reads deployment env (AUTHS_W1_URL, …) that must
 * never reach the client bundle.
 */

import { witnessByName, type WitnessEntry } from '@auths/witnesses';

export interface ResolvedWitness {
  /** Display name — the directory name, or the host for a custom URL. */
  name: string;
  /** Base URL, no trailing slash. */
  url: string;
  /** True when this came from the checked-in directory (vs a `?witness=` URL). */
  fromDirectory: boolean;
  /** The directory entry, when resolved from the directory. */
  entry?: WitnessEntry;
}

function asHttpsUrl(candidate: string): string | null {
  try {
    const u = new URL(candidate);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    return `${u.origin}${u.pathname === '/' ? '' : u.pathname}`.replace(/\/$/, '');
  } catch {
    return null;
  }
}

/**
 * @param segment the `[witness]` path segment (URL-decoded by Next already)
 * @param override an optional `?witness=` query value (arbitrary URL)
 */
export function resolveWitness(segment: string, override?: string | null): ResolvedWitness | null {
  // Explicit override always wins — this is the "point it at a stranger's
  // witness" affordance the whole federation story rests on.
  if (override) {
    const url = asHttpsUrl(override);
    if (url) return { name: new URL(url).host, url, fromDirectory: false };
  }

  const entry = witnessByName(segment);
  if (entry?.url) {
    return { name: entry.name, url: entry.url.replace(/\/$/, ''), fromDirectory: true, entry };
  }

  // The segment itself may be a URL-encoded custom witness.
  const url = asHttpsUrl(segment);
  if (url) return { name: new URL(url).host, url, fromDirectory: false };

  return null;
}
