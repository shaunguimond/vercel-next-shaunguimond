import type { NextApiRequest, NextApiResponse } from 'next'
import { describe, expect, it, vi } from 'vitest'
import { getAllCategoriesWithSlug, getAllPostsForSitemap } from '../../lib/api'
import sitemap from '../../pages/api/sitemap'

vi.mock('../../lib/api', () => ({
  getAllCategoriesWithSlug: vi.fn(),
  getAllPostsForSitemap: vi.fn(),
}))

function makeResponse() {
  return {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  }
}

async function callSitemap() {
  const res = makeResponse()
  await sitemap({} as NextApiRequest, res as unknown as NextApiResponse)
  return res
}

describe('GET /sitemap.xml', () => {
  it('lists the static pages, the categories, and posts with their modified date', async () => {
    vi.mocked(getAllPostsForSitemap).mockResolvedValue([
      { slug: 'quieter-web', modified: '2026-01-06T10:00:00+00:00' },
    ])
    vi.mocked(getAllCategoriesWithSlug).mockResolvedValue({
      edges: [{ node: { slug: 'essays', id: '1', name: 'Essays', uri: 'https://x/essays' } }],
    })

    const res = await callSitemap()

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/xml; charset=utf-8'
    )
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      expect.stringContaining('s-maxage=3600')
    )

    const xml = res.send.mock.calls[0][0] as string
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    // `absoluteUrl` drops trailing slashes, so the homepage is the bare origin.
    expect(xml).toContain('<loc>https://shaunguimond.com</loc>')
    expect(xml).toContain('<loc>https://shaunguimond.com/category/essays</loc>')
    expect(xml).toMatch(
      /<loc>https:\/\/shaunguimond\.com\/posts\/quieter-web<\/loc>\s*<lastmod>2026-01-06<\/lastmod>/
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('keeps the sitemap well formed while WordPress is unreachable', async () => {
    vi.mocked(getAllPostsForSitemap).mockRejectedValue(new Error('WordPress is unreachable'))
    vi.mocked(getAllCategoriesWithSlug).mockRejectedValue(new Error('WordPress is unreachable'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await callSitemap()

    // A 404 here reads as "the sitemap is gone" to a crawler that polls it.
    expect(res.status).toHaveBeenCalledWith(503)
    const xml = res.send.mock.calls[0][0] as string
    expect(xml).toContain('<urlset')
    expect(xml).not.toContain('<url>')
    error.mockRestore()
  })
})
