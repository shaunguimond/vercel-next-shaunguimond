import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const PAGES_DIR = join(process.cwd(), 'pages')
const TEST_FILE = /\.(test|spec)\.[jt]sx?$/

function collectFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? collectFiles(path) : [path]
  })
}

describe('Pages Router source tree', () => {
  // Every file in `pages/` becomes a public route, so a colocated test file is
  // deployed to production (`/api/preview.test`) and 500s because a test module
  // has no default page export. Keep route tests under `tests/` instead.
  it('contains no test files, which Next.js would deploy as routes', () => {
    const offenders = collectFiles(PAGES_DIR)
      .filter((file) => TEST_FILE.test(file))
      .map((file) => relative(process.cwd(), file))

    expect(offenders).toEqual([])
  })
})
