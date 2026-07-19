/**
 * Ensure the @auths-dev/sdk native platform binding is installed.
 *
 * bun's installer can skip napi platform packages declared as
 * optionalDependencies (the classic npm/cli#4828 family of bugs), which leaves
 * `require('@auths-dev/sdk')` unable to find a binding — on the Vercel builder
 * AND in the deployed functions. This script makes the binding's presence a
 * build invariant: if the platform package is missing, fetch the exact pinned
 * version from the npm registry and unpack it into node_modules.
 */

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = '0.1.9';
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '..', 'package.json'));

const platform = `${process.platform}-${process.arch}${
  process.platform === 'linux' ? '-gnu' : ''
}`;
const pkg = `@auths-dev/sdk-${platform}`;

try {
  require.resolve(pkg);
  console.log(`ensure-sdk-binding: ${pkg} present`);
  process.exit(0);
} catch {
  console.log(`ensure-sdk-binding: ${pkg} missing — fetching ${VERSION} from npm`);
}

// Install into EVERY location a resolver may walk:
//  1. beside @auths-dev/sdk in the store (plain-node resolution from the sdk);
//  2. the app's own node_modules (Turbopack inlines the sdk loader into
//     .next/server/chunks, so its require walks chunks → app node_modules →
//     repo root — the store is never on that path).
const sdkDir = dirname(require.resolve('@auths-dev/sdk/package.json'));
const storeTarget = join(dirname(sdkDir), `sdk-${platform}`);
const appTarget = join(here, '..', 'node_modules', '@auths-dev', `sdk-${platform}`);

const tarball = `https://registry.npmjs.org/${pkg}/-/sdk-${platform}-${VERSION}.tgz`;
const work = join(here, `.sdk-${platform}.tmp`);
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
execFileSync('sh', ['-c', `curl -fsSL "${tarball}" | tar -xz -C "${work}"`], {
  stdio: 'inherit',
});
for (const targetDir of [storeTarget, appTarget]) {
  rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(dirname(targetDir), { recursive: true });
  execFileSync('cp', ['-R', join(work, 'package'), targetDir]);
  if (!existsSync(join(targetDir, 'package.json'))) {
    console.error(`ensure-sdk-binding: unpack of ${pkg} into ${targetDir} failed`);
    process.exit(1);
  }
  console.log(`ensure-sdk-binding: installed ${pkg}@${VERSION} → ${targetDir}`);
}
rmSync(work, { recursive: true, force: true });
