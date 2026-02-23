import type { ForgeConfig, ResolveResult, RefEntry } from './types';

/** Forge-specific adapter for resolving auths identity data via Git refs */
export interface ForgeAdapter {
  resolve(config: ForgeConfig, identityFilter?: string): Promise<ResolveResult>;
  listAuthsRefs(config: ForgeConfig): Promise<RefEntry[]>;
  readBlob(config: ForgeConfig, sha: string): Promise<string>;
}
