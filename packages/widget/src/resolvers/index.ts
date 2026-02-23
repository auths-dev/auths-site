export { resolveFromRepo } from './resolver';
export { detectForge } from './detect';
export { didKeyToPublicKeyHex, sanitizeDidForRef } from './did-utils';
export { cacheClear } from './cache';
export { githubAdapter } from './github';
export { giteaAdapter } from './gitea';
export { fetchReleaseAttestations } from './github-releases';
export { fetchCommitSignature } from './github-commits';
export { extractSignerKeyFromSsh } from './ssh-signature';
export type {
  IdentityBundle,
  ResolveResult,
  ForgeType,
  ForgeConfig,
  RefEntry,
  ReleaseAttestation,
  CommitSignatureInfo,
} from './types';
export type { ForgeAdapter } from './adapter';
