import type { ForgeAdapter } from './adapter';
import type { ForgeConfig, RefEntry, ResolveResult } from './types';

/**
 * GitLab stub — GitLab does not expose custom Git refs via its REST API.
 *
 * GitLab's Refs API only returns branches and tags, not arbitrary refs
 * like refs/auths/*. Real support would require either a proxy service
 * or an in-repo file convention (future work).
 */
export const gitlabAdapter: ForgeAdapter = {
  async listAuthsRefs(_config: ForgeConfig): Promise<RefEntry[]> {
    return [];
  },

  async readBlob(_config: ForgeConfig, _sha: string): Promise<string> {
    throw new Error('GitLab adapter does not support blob reads');
  },

  async resolve(_config: ForgeConfig, _identityFilter?: string): Promise<ResolveResult> {
    return {
      bundle: null,
      error:
        'GitLab does not expose custom Git refs via its REST API. ' +
        'Provide attestation data manually using the attestation and public-key attributes.',
    };
  },
};
