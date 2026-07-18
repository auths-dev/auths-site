/**
 * The Auths SDK addon, loaded for agent sign-in.
 *
 * The addon (`@auths-dev/sdk`) is not a package.json dependency yet: the
 * relying-party surface ships in the next SDK release, so for now the path
 * comes from `AUTHS_SDK_PATH` (local dev points it at a checkout build).
 * Absent addon → agent sign-in is unavailable and every authenticated
 * request fails closed with 503 — never a bypass.
 *
 * Loading goes through `process.getBuiltinModule` so the bundler cannot see or
 * rewrite the require: a native addon must be loaded by the Node runtime, not
 * traced into a bundle.
 */

export interface PresentationPeek {
  nonce: string;
  audience: string;
  credentialSaid: string;
}

export interface AgentAuthReport {
  authorized: boolean;
  /** `"ok"` when authorized; otherwise the kebab-case denial code. */
  code: string;
  subject?: string;
  /** The subject's proven root: its delegator when delegated, itself otherwise. */
  subjectRoot?: string;
  issuer?: string;
  caps?: string[];
  detail?: string;
}

interface SdkModule {
  /** Parse-only peek at an incoming header — burns no trust, enables nonce consumption. */
  presentationNonce(authorizationHeader: string): PresentationPeek;
  /** The full relying-party check, in Rust: wire, bindings, verification, denial mapping. */
  authenticatePresentation(
    authorizationHeader: string,
    evidenceJson: string,
    expectedAudience: string,
    expectedNonce: string,
    nowIso?: string | null,
  ): AgentAuthReport;
  /** Mint a single-use 32-byte base64url challenge nonce. */
  mintChallengeNonce(): string;
  /** Raw verifier entrypoint — used by the conformance-vector check, not the adapter. */
  verifyPresentation(requestJson: string): { status: string };
}

let cached: SdkModule | null | undefined;

export function loadVerifier(): SdkModule | null {
  if (cached !== undefined) return cached;
  const specifier = process.env.AUTHS_SDK_PATH ?? '@auths-dev/sdk';
  try {
    const nodeModule = process.getBuiltinModule?.('node:module');
    if (!nodeModule) throw new Error('Node builtin loader unavailable in this runtime');
    const requireFromCwd = nodeModule.createRequire(`${process.cwd()}/package.json`);
    const mod = requireFromCwd(specifier) as SdkModule;
    cached = typeof mod.authenticatePresentation === 'function' ? mod : null;
    if (!cached) console.error(`agent-verifier: ${specifier} loaded but exports no authenticatePresentation`);
  } catch (err) {
    console.error(`agent-verifier: could not load ${specifier}:`, err);
    cached = null;
  }
  return cached;
}
