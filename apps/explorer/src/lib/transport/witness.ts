/**
 * Resolve the `[witness]` route segment to a base URL to fetch bytes from.
 *
 * The federation, not the node, is the product (plan X3.4): the explorer runs
 * against ANY conformant witness. Resolution order:
 *  1. a name in the checked-in directory (`@auths/witnesses`) → its public URL;
 *  2. a URL-encoded `https://…` in the segment itself, or a `?witness=` query
 *     override → that arbitrary conformant witness, verbatim.
 *
 * Server-only: the directory may read a local-dev env override that must never
 * reach the client bundle.
 */

import { witnessByName, witnessDirectory, type WitnessEntry } from '@auths/witnesses';

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
 * A bare hostname — `their-node.example`, `auths-network.fly.dev`, optional
 * `:port` — i.e. a node addressed by host in the path, no scheme. A dot is
 * required, which is what keeps directory names (`auths-network`) from matching.
 */
function looksLikeHost(s: string): boolean {
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:\d+)?$/i.test(s);
}

/**
 * @param segment the `[witness]` path segment (URL-decoded by Next already)
 * @param override an optional `?witness=` query value (arbitrary URL)
 */
export function resolveWitness(segment: string, override?: string | null): ResolvedWitness | null {
  // An explicit `?witness=` URL is authoritative for *where* to fetch: a node
  // knows its own current URL (its status page passes it) even if the checked-in
  // directory is stale or the node was renamed. If that URL matches a listed
  // witness, adopt its name and declared facts for display; otherwise fall back
  // to the host. This is what makes browsing rename-/move-proof: a node's own
  // link always resolves by its own URL, never a drifted directory entry.
  if (override) {
    const url = asHttpsUrl(override);
    if (url) {
      const known = witnessDirectory().find((w) => w.url?.replace(/\/$/, '') === url);
      return known
        ? { name: known.name, url, fromDirectory: true, entry: known }
        : { name: new URL(url).host, url, fromDirectory: false };
    }
  }

  // No override: resolve the segment as a checked-in directory name…
  const entry = witnessByName(segment);
  if (entry?.url) {
    return { name: entry.name, url: entry.url.replace(/\/$/, ''), fromDirectory: true, entry };
  }

  // …or as a bare host (`auths-network-2.fly.dev`, `their-node.example`) or a
  // full URL — an unlisted node addressed directly in the path. A host that
  // matches a listed node adopts its curated name + facts, so a node's own
  // host-based "browse me" link still resolves to its directory identity.
  const url = looksLikeHost(segment) ? asHttpsUrl(`https://${segment}`) : asHttpsUrl(segment);
  if (url) {
    const known = witnessDirectory().find((w) => w.url?.replace(/\/$/, '') === url);
    return known
      ? { name: known.name, url, fromDirectory: true, entry: known }
      : { name: new URL(url).host, url, fromDirectory: false };
  }

  return null;
}
