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
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
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

// Resolve where @auths-dev/sdk itself lives; install the sibling beside it so
// its loader's require() finds the binding wherever the hoisting put things.
const sdkDir = dirname(require.resolve('@auths-dev/sdk/package.json'));
const scopeDir = dirname(sdkDir);
const targetDir = join(scopeDir, `sdk-${platform}`);

const tarball = `https://registry.npmjs.org/${pkg}/-/sdk-${platform}-${VERSION}.tgz`;
const work = join(scopeDir, `.sdk-${platform}.tmp`);
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
execFileSync('sh', ['-c', `curl -fsSL "${tarball}" | tar -xz -C "${work}"`], {
  stdio: 'inherit',
});
rmSync(targetDir, { recursive: true, force: true });
renameSync(join(work, 'package'), targetDir);
rmSync(work, { recursive: true, force: true });

if (!existsSync(join(targetDir, 'package.json'))) {
  console.error(`ensure-sdk-binding: unpack of ${pkg} failed`);
  process.exit(1);
}
console.log(`ensure-sdk-binding: installed ${pkg}@${VERSION} → ${targetDir}`);
