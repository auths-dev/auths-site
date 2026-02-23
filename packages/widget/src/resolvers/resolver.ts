import type { ResolveResult } from './types';
import { detectForge } from './detect';
import { cacheGet, cacheSet } from './cache';
import { githubAdapter } from './github';
import { giteaAdapter } from './gitea';
import { gitlabAdapter } from './gitlab';
import type { ForgeAdapter } from './adapter';

const adapters: Record<string, ForgeAdapter> = {
  github: githubAdapter,
  gitea: giteaAdapter,
  gitlab: gitlabAdapter,
};

/**
 * Resolve identity + attestation data from a repository URL.
 *
 * Orchestrates: detect forge → pick adapter → check cache → resolve → cache result.
 */
export async function resolveFromRepo(
  repoUrl: string,
  forgeHint?: string,
  identityFilter?: string,
): Promise<ResolveResult> {
  const config = detectForge(repoUrl, forgeHint);
  if (!config) {
    return { bundle: null, error: `Could not parse repository URL: ${repoUrl}` };
  }

  // Check cache
  const cacheKey = `${repoUrl}|${identityFilter ?? ''}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  // Pick adapter
  const adapter = adapters[config.type];
  if (!adapter) {
    return { bundle: null, error: `No adapter for forge type: ${config.type}` };
  }

  // Resolve
  const result = await adapter.resolve(config, identityFilter);

  // Cache the result (even errors, to avoid hammering on failures)
  cacheSet(cacheKey, result);

  return result;
}
