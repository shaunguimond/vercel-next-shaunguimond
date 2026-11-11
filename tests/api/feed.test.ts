import type { NextApiRequest, NextApiResponse } from 'next'
import { describe, expect, it, vi } from 'vitest'
import { getFeedPosts } from '../../lib/api'
import feed from '../../pages/api/feed'

vi.mock('../../lib/api', () => ({
  getFeedPosts: vi.fn(),
}))

function makeResponse() {
  return {
    setHeader: vi.fn(),
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  }
}

const POST = {
  title: 'Building a quieter web',
  slug: 'quieter-web',
  excerpt: '<p>A short summary.</p>',
  content: '<p>The body of the post.</p>',
  date: '2026-01-05T10:00:00+00:00',
  modified: '2026-01-06T10:00:00+00:00',
  author: { node: { name: 'Shaun Guimond' } },
  categories: { edges: [{ node: { name: 'Essays' } }] },
}

async function callFeed() {
  const res = makeResponse()
  await feed({} as NextApiRequest, res as unknown as NextApiResponse)
  return res
}

describe('GET /feed.xml', () => {
  it('serves RSS with a cache lifetime, so readers do not reach WordPress', async () => {
    vi.mocked(getFeedPosts).mockResolvedValue([POST])

    const res = await callFeed()

    expect(getFeedPosts).toHaveBeenCalledWith(20)
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/rss+xml; charset=utf-8'
    )
    // Feed readers poll constantly; the edge has to answer most of that.
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      expect.stringContaining('s-maxage=300')
    )

    const xml = res.send.mock.calls[0][0] as string
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<title>Building a quieter web</title>')
    expect(xml).toContain('<link>https://shaunguimond.com/posts/quieter-web</link>')
    // The summary is what most readers show, so it has to survive as plain text.
    expect(xml).toContain('A short summary.')
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('answers a feed reader with an empty channel instead of an error', async () => {
    // A subscriber that sees a server error can drop the feed for good, so a
    // temporarily empty channel is the safer answer while WordPress is down.
    vi.mocked(getFeedPosts).mockRejectedValue(new Error('WordPress is unreachable'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await callFeed()

    expect(res.status).toHaveBeenCalledWith(503)
    const xml = res.send.mock.calls[0][0] as string
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).not.toContain('<item>')
    error.mockRestore()
  })
})
