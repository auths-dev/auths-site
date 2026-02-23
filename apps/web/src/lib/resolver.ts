// Re-export resolver utilities from the auths-verify package for use in Next.js
// Server Components, API routes, and Client hooks.
//
// atob() used internally by github/gitea adapters is safe in Node 18+ (Next.js requirement).
// No window/document/DOMParser references in any resolver code paths.

export {
  resolveFromRepo,
  detectForge,
  githubAdapter,
  giteaAdapter,
  didKeyToPublicKeyHex,
  sanitizeDidForRef,
} from 'auths-verify/resolvers';

export type {
  IdentityBundle,
  ResolveResult,
  ForgeType,
  ForgeConfig,
  RefEntry,
  ForgeAdapter,
} from 'auths-verify/resolvers';
