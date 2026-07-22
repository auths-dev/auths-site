/**
 * Registry mirroring — the git-object transport (plan X1.3). Mirror a witness's
 * `refs/auths/*` into a per-witness cache dir with a short TTL, then let the SDK
 * read a member's KEL out of it. Bytes only: no verdict is computed or cached
 * here; the browser re-verifies whatever this returns.
 *
 * The cache is best-effort: serverless /tmp is per-instance and ephemeral, which
 * is fine — a cold instance just re-mirrors. The TTL keeps a warm instance from
 * re-fetching the whole registry on every request.
 */

import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { SdkModule } from './sdk';

const TTL_MS = 30_000;

interface Mirror {
  dir: string;
  fetchedAt: number;
}

const cache = new Map<string, Mirror>();

/**
 * Ensure a fresh-enough local mirror of `url`'s registry. Throws if the fetch
 * fails (caller maps to a 502). `mod.fetchRegistry` must exist.
 */
export function mirrorWitness(
  mod: SdkModule & { fetchRegistry: NonNullable<SdkModule['fetchRegistry']> },
  url: string,
): Mirror {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && existsSync(cached.dir) && now - cached.fetchedAt < TTL_MS) {
    return cached;
  }

  const dir = mkdtempSync(join(tmpdir(), 'auths-explorer-'));
  mod.fetchRegistry(url, dir);
  const entry: Mirror = { dir, fetchedAt: Date.now() };

  // Evict the previous mirror for this witness so /tmp doesn't grow unbounded.
  if (cached && existsSync(cached.dir)) {
    try {
      rmSync(cached.dir, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  }
  cache.set(url, entry);
  return entry;
}
