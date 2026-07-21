/**
 * Ensure the @auths-dev/sdk native binding is present everywhere a resolver —
 * or our own runtime loader — will look.
 *
 * bun's installer skips napi platform optionalDependencies (npm/cli#4828
 * family), and Turbopack's external-module shim cannot resolve the binding no
 * matter where it is installed. So this script (1) installs the platform
 * package beside every sdk copy for plain-node resolution, and (2) vendors a
 * self-contained @auths-dev tree under vendor/auths-sdk that the app loads at
 * runtime BY ABSOLUTE PATH (see lib/auth/agent-verifier.ts) with the dir traced
 * as ordinary project files.
 */

import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep in lockstep with the `@auths-dev/sdk` pin in package.json. Bump both to
// 0.1.16 once the readKelJson-bearing SDK ships (see docs/plans/network).
const VERSION = '0.1.15';
const here = dirname(fileURLToPath(import.meta.url));
const appDir = join(here, '..');
const require = createRequire(join(appDir, 'package.json'));

const platform = `${process.platform}-${process.arch}${
  process.platform === 'linux' ? '-gnu' : ''
}`;
const pkg = `@auths-dev/sdk-${platform}`;
console.log(`ensure-sdk-binding: ensuring ${pkg}@${VERSION}`);

// 1. Download the platform package once.
const work = join(here, `.sdk-${platform}.tmp`);
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
const tarball = `https://registry.npmjs.org/${pkg}/-/sdk-${platform}-${VERSION}.tgz`;
execFileSync('sh', ['-c', `curl -fsSL "${tarball}" | tar -xz -C "${work}"`], {
  stdio: 'inherit',
});
const unpacked = join(work, 'package');
if (!existsSync(join(unpacked, 'package.json'))) {
  console.error(`ensure-sdk-binding: download/unpack of ${pkg} failed`);
  process.exit(1);
}

/** Mirror a -gnu binding dir under the musl name (same glibc ELF — the napi
 * loader's musl probe misfires under bun, and Vercel is glibc either way). */
function mirrorMusl(gnuDir) {
  if (process.platform !== 'linux') return;
  const muslDir = gnuDir.replace('-gnu', '-musl');
  rmSync(muslDir, { recursive: true, force: true });
  execFileSync('cp', ['-R', gnuDir, muslDir]);
  const pkgPath = join(muslDir, 'package.json');
  const meta = JSON.parse(readFileSync(pkgPath, 'utf8'));
  meta.name = meta.name.replace('-gnu', '-musl');
  if (meta.main) {
    const gnuMain = meta.main;
    meta.main = gnuMain.replace('-gnu', '-musl');
    execFileSync('cp', [join(muslDir, gnuMain), join(muslDir, meta.main)]);
  }
  writeFileSync(pkgPath, JSON.stringify(meta, null, 2));
  console.log(`ensure-sdk-binding: mirrored → ${muslDir}`);
}

// 2. Install beside every sdk copy under the workspace's node_modules trees,
//    plus the app's own node_modules.
const repoRoot = join(appDir, '..', '..');
const sdkCopies = execFileSync('sh', ['-c',
  `find "${join(repoRoot, 'node_modules')}" "${join(appDir, 'node_modules')}" -type d -name sdk -path '*@auths-dev/sdk' 2>/dev/null || true`,
]).toString().split('\n').filter(Boolean);
const targets = new Set(sdkCopies.map((copy) => join(dirname(copy), `sdk-${platform}`)));
targets.add(join(appDir, 'node_modules', '@auths-dev', `sdk-${platform}`));
for (const targetDir of targets) {
  rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(dirname(targetDir), { recursive: true });
  execFileSync('cp', ['-R', unpacked, targetDir]);
  console.log(`ensure-sdk-binding: installed → ${targetDir}`);
  mirrorMusl(targetDir);
}

// 3. Vendor the self-contained runtime tree the app loads by absolute path.
const vendorScope = join(appDir, 'vendor', 'auths-sdk', 'node_modules', '@auths-dev');
rmSync(join(appDir, 'vendor'), { recursive: true, force: true });
mkdirSync(vendorScope, { recursive: true });
execFileSync('cp', ['-RL', dirname(require.resolve('@auths-dev/sdk/package.json')), join(vendorScope, 'sdk')]);
execFileSync('cp', ['-R', unpacked, join(vendorScope, `sdk-${platform}`)]);
mirrorMusl(join(vendorScope, `sdk-${platform}`));
console.log(`ensure-sdk-binding: vendored → ${vendorScope}`);

rmSync(work, { recursive: true, force: true });
