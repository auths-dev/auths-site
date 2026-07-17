import { defineConfig } from 'eslint/config';

/**
 * The auth fence: nothing outside src/lib/auth and src/lib/supabase may
 * import a concrete auth/data SDK — the AuthPort (src/lib/auth/port.ts)
 * is the only seam, so the Auths-native adapter can land in one directory.
 */
export default defineConfig([
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/auth/**', 'src/lib/supabase/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@supabase/*'],
              message:
                'Import through the AuthPort (src/lib/auth) or the data helpers (src/lib/supabase) — see src/lib/auth/port.ts.',
            },
          ],
        },
      ],
    },
  },
]);
