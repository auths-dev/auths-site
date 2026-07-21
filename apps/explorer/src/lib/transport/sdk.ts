/**
 * The Auths SDK addon — the explorer's TRANSPORT, never a verdict source.
 *
 * The server uses exactly two SDK entry points, both byte-movers:
 *  - `fetchRegistry(url, dest)` — mirror a witness's `refs/auths/*` into a cache
 *    dir, fully in-process (libgit2 + vendored HTTPS; no `git` binary needed).
 *  - `readKelJson(dir, prefix)` — read a member's KEL events + per-event CESR
 *    attachments (+ tip) out of that mirror as JSON. It does NOT verify: the
 *    bytes are handed to the browser, which recomputes every SAID and signature
 *    through the WASM verifier before anything renders as valid.
 *
 * `readKelJson` ships in `@auths-dev/sdk@0.1.16`. Older builds simply omit the
 * export; callers feature-detect it and degrade honestly (never fake a result).
 *
 * Loading goes through `process.getBuiltinModule` so the bundler cannot see or
 * rewrite the require: a native addon must be loaded by the Node runtime, not
 * traced into a bundle. Mirrors apps/market's proven loader.
 */

export interface SdkModule {
  /** SDK semver, e.g. "0.1.16" — used to report the transport's capability. */
  version?(): string;
  /**
   * Mirror a public identity registry into `dest` fully in-process. Throws on
   * failure. Present on SDK ≥ 0.1.12.
   */
  fetchRegistry?(url: string, dest: string): void;
  /**
   * Read a member's KEL out of a fetched registry dir as JSON:
   * `{ prefix, events: [...], attachments: [...], tip, source }`. The exact
   * shape is defined by the SDK; the explorer forwards it verbatim to the
   * browser verifier. Present on SDK ≥ 0.1.16.
   */
  readKelJson?(registryDir: string, prefix: string): string;
}

let cached: SdkModule | null | undefined;

export function loadSdk(): SdkModule | null {
  if (cached !== undefined) return cached;
  const specifier = process.env.AUTHS_SDK_PATH ?? '@auths-dev/sdk';
  try {
    const nodeModule = process.getBuiltinModule?.('node:module');
    if (!nodeModule) throw new Error('Node builtin loader unavailable in this runtime');
    let mod: SdkModule;
    const requireFromCwd = nodeModule.createRequire(`${process.cwd()}/package.json`);
    if (process.env.AUTHS_SDK_PATH) {
      // Dev override: an explicit checkout build, loaded from the working dir —
      // this is how the readKelJson loop is exercised before 0.1.16 is on npm.
      mod = requireFromCwd(specifier) as SdkModule;
    } else {
      // The VENDORED addon: plain project files (see scripts/ensure-sdk-binding.mjs),
      // required at runtime by absolute path — no bundler, no external shim.
      // Falls back to the npm package for local dev servers started without a build.
      const { existsSync } = nodeModule.createRequire(import.meta.url)('node:fs') as typeof import('node:fs');
      const candidates = [
        `${process.cwd()}/vendor/auths-sdk/node_modules/@auths-dev/sdk`,
        `${process.cwd()}/apps/explorer/vendor/auths-sdk/node_modules/@auths-dev/sdk`,
      ];
      const vendored = candidates.find((dir) => existsSync(`${dir}/package.json`));
      mod = requireFromCwd(vendored ?? '@auths-dev/sdk') as SdkModule;
    }
    cached = typeof mod.fetchRegistry === 'function' ? mod : null;
    if (!cached) console.error(`explorer/sdk: ${specifier} loaded but exports no fetchRegistry`);
  } catch (err) {
    console.error(`explorer/sdk: could not load ${specifier}:`, err);
    cached = null;
  }
  return cached;
}

/** Whether the loaded SDK can serve the git-object KEL read path (≥ 0.1.16). */
export function sdkCanReadKel(mod: SdkModule | null): mod is SdkModule & {
  fetchRegistry: NonNullable<SdkModule['fetchRegistry']>;
  readKelJson: NonNullable<SdkModule['readKelJson']>;
} {
  return !!mod && typeof mod.fetchRegistry === 'function' && typeof mod.readKelJson === 'function';
}
