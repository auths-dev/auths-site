import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    globals: true,
  },
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
