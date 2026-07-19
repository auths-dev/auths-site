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

console.log(`ensure-sdk-binding: ensuring ${pkg}@${VERSION} beside every sdk copy`);

// Install into EVERY location a resolver may walk: beside EACH copy of
// @auths-dev/sdk anywhere under the workspace's node_modules trees (bun keeps
// several store layouts), plus the app's own node_modules (Turbopack resolves
// externals by walking up from .next/server/chunks).
const repoRoot = join(here, '..', '..', '..');
const sdkCopies = execFileSync('sh', ['-c',
  `find "${repoRoot}/node_modules" "${join(here, '..', 'node_modules')}" -type d -name sdk -path '*@auths-dev/sdk' 2>/dev/null || true`,
]).toString().split('\n').filter(Boolean);
const targets = new Set(sdkCopies.map((copy) => join(dirname(copy), `sdk-${platform}`)));
targets.add(join(here, '..', 'node_modules', '@auths-dev', `sdk-${platform}`));
console.log(`ensure-sdk-binding: ${sdkCopies.length} sdk cop(ies) found`);

const tarball = `https://registry.npmjs.org/${pkg}/-/sdk-${platform}-${VERSION}.tgz`;
const work = join(here, `.sdk-${platform}.tmp`);
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
execFileSync('sh', ['-c', `curl -fsSL "${tarball}" | tar -xz -C "${work}"`], {
  stdio: 'inherit',
});
for (const targetDir of targets) {
  rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(dirname(targetDir), { recursive: true });
  execFileSync('cp', ['-R', join(work, 'package'), targetDir]);
  if (!existsSync(join(targetDir, 'package.json'))) {
    console.error(`ensure-sdk-binding: unpack of ${pkg} into ${targetDir} failed`);
    process.exit(1);
  }
  console.log(`ensure-sdk-binding: installed ${pkg}@${VERSION} → ${targetDir}`);
  if (process.platform === 'linux') {
    // Belt and braces: the napi loader's musl probe misfires under bun (no
    // glibc field in process.report), sending it down the musl-only branch.
    // Vercel is glibc, so the SAME ELF satisfies both names — mirror the
    // package under the musl name so either branch resolves.
    const muslDir = targetDir.replace('-gnu', '-musl');
    rmSync(muslDir, { recursive: true, force: true });
    execFileSync('cp', ['-R', targetDir, muslDir]);
    const muslPkgPath = join(muslDir, 'package.json');
    const muslPkg = JSON.parse(execFileSync('cat', [muslPkgPath]).toString());
    muslPkg.name = muslPkg.name.replace('-gnu', '-musl');
    if (muslPkg.main) {
      const gnuMain = muslPkg.main;
      muslPkg.main = gnuMain.replace('-gnu', '-musl');
      execFileSync('cp', [join(muslDir, gnuMain), join(muslDir, muslPkg.main)]);
    }
    execFileSync('sh', ['-c', `cat > "${muslPkgPath}" <<'PKGEOF'
${JSON.stringify(muslPkg, null, 2)}
PKGEOF`]);
    console.log(`ensure-sdk-binding: mirrored → ${muslDir}`);
  }
}
rmSync(work, { recursive: true, force: true });
