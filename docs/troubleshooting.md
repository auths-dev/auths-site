# Frontend Troubleshooting

Issues encountered and resolved during local development setup.

---

## 1. Wrong Node.js version (system Node instead of nvm)

**Symptom**
```
You are using Node.js 19.2.0. For Next.js, Node.js version ">=20.9.0" is required.
```

**Cause**
The shell was using the system-installed Node instead of the nvm-managed Node 20.

**Fix**
Switch to Node 20 for the current session:
```bash
nvm use 20
```

To verify: `node --version` should print `v20.x.x`.

---

## 2. nvm conflicts with tea (`npm_config_prefix`)

**Symptom**
```
nvm is not compatible with the "npm_config_prefix" environment variable: currently set to "/Users/<you>/.tea/npmjs.com/v9.1.3"
Run `unset npm_config_prefix` to unset it.
```

**Cause**
`tea` sets `npm_config_prefix` via a `chpwd` hook in `.zshrc`, which runs on every directory change. This fires after nvm loads, breaking nvm.

**Fix (permanent)**
Add `unset npm_config_prefix` in `~/.zshrc` directly before the nvm block:

```zsh
# tea hook is above this line and sets npm_config_prefix

unset npm_config_prefix        # <-- add this line
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

Reload: `source ~/.zshrc`

---

## 3. Stray `package-lock.json` files cause Turbopack to crawl home directory

**Symptom**
- Dev server hangs at `○ Compiling / ...` indefinitely
- Warning in Next.js output:
  ```
  We detected multiple lockfiles and selected the directory of /Users/<you>/package-lock.json as the root directory.
  ```

**Cause**
`npm install` was accidentally run in `~` and/or `~/workspace` at some point, creating orphaned lockfiles. Next.js/Turbopack walks up from the project looking for a workspace root and picks up these files, then attempts to watch/index your entire home directory.

**Fix**
Delete the stray lockfiles:
```bash
rm /Users/<you>/package-lock.json
rm /Users/<you>/workspace/package-lock.json
```

Check they're orphans first (`head -3` should show `"name": "<dirname>"`, not a real project name).

---

## 4. Stray `pnpm-lock.yaml` inside `apps/web/`

**Symptom**
Same multi-lockfile warning as above, but listing `apps/web/pnpm-lock.yaml`.

**Cause**
`pnpm install` was run from inside `apps/web/` instead of the monorepo root. This creates a second lockfile and confuses workspace root detection.

**Fix**
```bash
rm apps/web/pnpm-lock.yaml
```

Always run `pnpm install` from `auths-site/` (the monorepo root).

---

## 5. Turbopack + webpack config conflict (Next.js 16)

**Symptom**
```
ERROR: This build is using Turbopack, with a `webpack` config and no `turbopack` config.
```

**Cause**
Next.js 16 enables Turbopack by default. Any `webpack()` function in `next.config.ts` triggers a fatal error unless a `turbopack` key is also present.

**Fix**
Replace the webpack function with `turbopack: {}` in `next.config.ts`:

```ts
// Before
const nextConfig: NextConfig = {
  webpack: (config) => {
    config.experiments = { asyncWebAssembly: true, layers: true };
    return config;
  },
};

// After
const nextConfig: NextConfig = {
  turbopack: {},
};
```

Note: the `asyncWebAssembly` experiment was needed for webpack. The widget's WASM is now served as a static file (see issue 7 below) so this config is no longer required.

**What does NOT work**
Setting `turbopack: { root: "../../" }` to fix the lockfile warning breaks module resolution:
```
Turbopack build failed: We couldn't find the Next.js package (next/package.json)
from the project directory: .../apps/web/src/app
```
Don't set `turbopack.root` unless you have a specific reason — `turbopack: {}` is sufficient.

---

## 6. `@tailwindcss/oxide` native binding missing (darwin-arm64)

**Symptom**
```
Error: Cannot find native binding.
Caused by: Error: Cannot find module '@tailwindcss/oxide-darwin-arm64'
```

**Cause**
The initial `pnpm install` ran under the wrong Node.js version (system Node 19). The platform-specific optional package `@tailwindcss/oxide-darwin-arm64` was not resolved for `darwin-arm64`.

**Fix**
Switch to the correct Node version and reinstall cleanly:
```bash
nvm use 20
rm -rf node_modules
pnpm install
```

---

## 7. Tailwind CSS v4 native binding not hoisted by pnpm

**Symptom**
After a clean install, the same `@tailwindcss/oxide` error persists. Checking `node_modules/` reveals `tailwindcss` is only inside `.pnpm/` but there is no `node_modules/tailwindcss` symlink.

**Cause**
pnpm's strict isolation means `@tailwindcss/postcss` can't find `tailwindcss` via `require('tailwindcss')` unless the package is hoisted to the top-level `node_modules/`.

**Fix**
Create `.npmrc` at the monorepo root:
```
public-hoist-pattern[]=*tailwindcss*
public-hoist-pattern[]=*@tailwindcss*
```

Then reinstall:
```bash
pnpm install
```

---

## 8. Dev server hangs compiling `/` — WASM-inlined widget bundle

**Symptom**
Server starts and prints `○ Compiling / ...` but never finishes.

**Cause**
The `auths-verify` widget is built with `INLINE_WASM=true`, producing a ~492KB `.mjs` file with the WASM binary base64-encoded inside it. When `transpilePackages: ["auths-verify"]` is set, Turbopack reprocesses this entire bundle on every compile, hanging on the large blob.

Even after removing `auths-verify` from `transpilePackages`, a `import('auths-verify')` anywhere in the component tree causes Turbopack to include the 492KB file in its module graph.

**Fix**
Serve the widget as a static file so Turbopack never touches it:

1. Copy the built widget to `public/`:
   ```bash
   cp packages/widget/dist/auths-verify apps/web/public/auths-verify.js
   ```

2. Load it via `next/script` instead of a dynamic import:
   ```tsx
   // Before
   useEffect(() => { import('auths-verify') }, []);

   // After
   import Script from 'next/script';
   // ...
   <Script src="/auths-verify.js" strategy="lazyOnload" />
   ```

3. The root `package.json` has a `copy-widget` script that keeps `public/auths-verify.js` in sync with the built dist. `pnpm dev` runs it automatically:
   ```json
   "copy-widget": "cp packages/widget/dist/auths-verify apps/web/public/auths-verify.js",
   "dev": "pnpm copy-widget && pnpm --filter @auths/web dev"
   ```

If you rebuild the widget (`pnpm --filter auths-verify build`), restart the dev server so the new bundle is copied to `public/`.
