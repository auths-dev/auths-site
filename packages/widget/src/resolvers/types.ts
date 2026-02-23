/** Identity bundle resolved from a forge — matches Rust IdentityBundle shape */
export interface IdentityBundle {
  identity_did: string;
  public_key_hex: string;
  attestation_chain: object[];
}

/** Result of a resolve attempt */
export interface ResolveResult {
  bundle: IdentityBundle | null;
  error?: string;
}

/** Supported forge types */
export type ForgeType = 'github' | 'gitea' | 'gitlab';

/** Parsed forge configuration from a repo URL */
export interface ForgeConfig {
  type: ForgeType;
  baseUrl: string;
  owner: string;
  repo: string;
}

/** A single Git ref entry from the forge API */
export interface RefEntry {
  ref: string;
  sha: string;
}
