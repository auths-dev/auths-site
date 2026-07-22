/**
 * The verdict manifest (contracts/v1) — the single source of truth for every
 * verdict code the explorer may name. Ships as `conformance/verdicts.json`
 * inside `@auths-dev/sdk` (0.1.15+ exports the subpath), generated from the
 * gateway source, so the codes the explorer shows are pinned to the exact
 * contract the installed SDK was built from.
 *
 * Same assertion pattern apps/web uses (src/lib/verdicts.ts): a renamed or
 * fossil verdict fails the build instead of shipping as a chip.
 */
import manifest from '@auths-dev/sdk/conformance/verdicts.json';

const FAMILIES = ['audit', 'call', 'commit', 'gate', 'log', 'paymode'] as const;

type Family = (typeof FAMILIES)[number];

export const VERDICTS: Record<Family, readonly string[]> = manifest.verdicts;

for (const family of FAMILIES) {
  if (!VERDICTS[family] || VERDICTS[family].length === 0) {
    throw new Error(`verdict manifest is missing the "${family}" family`);
  }
}

export const ALL_VERDICT_CODES: ReadonlySet<string> = new Set(Object.values(VERDICTS).flat());

/**
 * Throws if any hand-maintained verdict code has drifted from the manifest —
 * a renamed or fossil verdict fails the build instead of shipping as copy.
 */
export function assertKnownVerdicts(where: string, codes: Iterable<string>): void {
  for (const code of codes) {
    if (!ALL_VERDICT_CODES.has(code)) {
      throw new Error(
        `${where} names verdict "${code}", which the contracts/v1 manifest does not define`,
      );
    }
  }
}
