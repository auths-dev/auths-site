import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * The verifier fence: the explorer's server is transport, never a verdict
 * source. Nothing outside `src/lib/verify` (the browser WASM bridge) may
 * import the WASM verifier glue directly — every "valid" state renders from a
 * value that came back through the bridge's client-side recompute, so keeping
 * the import in one directory keeps that invariant auditable.
 *
 * Server code that reaches a witness lives in `src/lib/transport`; it fetches
 * bytes only. If it ever imports the WASM verifier, that would be a server-side
 * verdict — exactly what this fence forbids.
 */
export default defineConfig([
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/verify/**'],
    languageOptions: { parser: tseslint.parser },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*/verify/wasm/*', '@/lib/verify/wasm/*', '@auths-dev/verifier'],
              message:
                'The WASM verifier is browser-only and loads through the bridge in src/lib/verify. Import the useVerifiedKel hook / verify helpers there, never the WASM glue directly.',
            },
          ],
        },
      ],
    },
  },
]);
