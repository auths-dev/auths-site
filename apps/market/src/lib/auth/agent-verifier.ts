/**
 * The presentation verifier, loaded from the Auths SDK native addon.
 *
 * The addon (`@auths-dev/sdk`) is not a package.json dependency yet: the
 * attachment-enforcing verify contract ships in the next SDK release, so for
 * now the path comes from `AUTHS_SDK_PATH` (local dev points it at a checkout
 * build). Absent addon → agent sign-in is unavailable and every authenticated
 * request fails closed with 503 — never a bypass.
 *
 * Loading goes through `process.getBuiltinModule` so the bundler cannot see or
 * rewrite the require: a native addon must be loaded by the Node runtime, not
 * traced into a bundle.
 */

export interface PresentationReport {
  status: string;
  issuer?: string;
  subject?: string;
  caps?: string[];
  message?: string;
  field?: string;
}

interface SdkModule {
  verifyPresentation(requestJson: string): PresentationReport;
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
    cached = typeof mod.verifyPresentation === 'function' ? mod : null;
    if (!cached) console.error(`agent-verifier: ${specifier} loaded but exports no verifyPresentation`);
  } catch (err) {
    console.error(`agent-verifier: could not load ${specifier}:`, err);
    cached = null;
  }
  return cached;
}
