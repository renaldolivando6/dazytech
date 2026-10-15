import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  // tsconfig memakai jsx: "preserve" (untuk Next). Test butuh JSX ditransform
  // (mis. src/lib/komisi/pdf.tsx).
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
