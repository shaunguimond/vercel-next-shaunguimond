import { defineConfig } from 'vitest/config'

// Vitest's default include pattern walks the whole repository, which means the
// compiled Next.js output is picked up as soon as `next build` has run. The
// `.next/server` bundles of an API route re-export the route handler, so Vitest
// loads them as test files and fails with
// "Page /api/preview.test does not export a default function".
//
// Build output is never a source of tests, so both the include and the exclude
// lists are pinned to source directories.
export default defineConfig({
  test: {
    include: [
      'app/**/*.test.{ts,tsx}',
      'components/**/*.test.{ts,tsx}',
      'lib/**/*.test.{ts,tsx}',
      'tests/**/*.test.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '.next/**',
      'out/**',
      'coverage/**',
      '.vercel/**',
    ],
  },
})
