import type { NextApiRequest, NextApiResponse } from 'next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCategoryPostsPage } from '../../../../lib/api'
import posts from './posts'

vi.mock('../../../../lib/api', () => ({
  getCategoryPostsPage: vi.fn(),
}))

function makeResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
  }
}

describe('category posts route filters', () => {
  beforeEach(() => {
    vi.mocked(getCategoryPostsPage).mockReset()
  })

  it('loads the first page with tag and year filters for the route category', async () => {
    vi.mocked(getCategoryPostsPage).mockResolvedValue({
      edges: [],
      pageInfo: { endCursor: null, hasNextPage: false },
    })
    const res = makeResponse()

    await posts(
      {
        method: 'GET',
        query: { slug: 'projects', tag: 'accessibility', year: '2025' },
      } as unknown as NextApiRequest,
      res as unknown as NextApiResponse,
    )

    expect(getCategoryPostsPage).toHaveBeenCalledWith('projects', null, 'accessibility', 2025)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300',
    )
  })

  it('rejects malformed filter parameters before querying WordPress', async () => {
    const res = makeResponse()

    await posts(
      {
        method: 'GET',
        query: { slug: 'projects', tag: ['accessibility', 'wordpress'], year: '20xx' },
      } as unknown as NextApiRequest,
      res as unknown as NextApiResponse,
    )

    expect(res.status).toHaveBeenCalledWith(400)
    expect(getCategoryPostsPage).not.toHaveBeenCalled()
  })
})
