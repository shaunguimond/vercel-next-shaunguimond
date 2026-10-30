import type { NextApiRequest, NextApiResponse } from 'next'
import { getSearchPosts } from '../../lib/api'
import type { PaginatedPostConnection } from '../../lib/types'

type ApiResponse = PaginatedPostConnection | { error: string }

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const search = req.query.q
  const after = req.query.after

  if (
    typeof search !== 'string' ||
    search.trim().length === 0 ||
    search.length > 100 ||
    typeof after !== 'string' ||
    after.length === 0 ||
    after.length > 4096
  ) {
    return res.status(400).json({ error: 'Invalid search query or pagination cursor' })
  }

  try {
    const posts = await getSearchPosts(search.trim(), after)

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return res.status(200).json(posts)
  } catch (error) {
    console.error('Failed to load more search results:', error)
    return res.status(502).json({ error: 'Unable to load more results right now' })
  }
}
