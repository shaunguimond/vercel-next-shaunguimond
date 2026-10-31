import type { NextApiRequest, NextApiResponse } from 'next'
import { getCategoryPostsPage } from '../../../../lib/api'
import type { PaginatedPostConnection } from '../../../../lib/types'

type ApiResponse = PaginatedPostConnection | { error: string }

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const slug = req.query.slug
  const after = req.query.after
  const tag = req.query.tag
  const yearValue = req.query.year
  const year = typeof yearValue === 'string' ? Number(yearValue) : null

  if (
    typeof slug !== 'string' ||
    slug.length === 0 ||
    slug.length > 200 ||
    (after !== undefined &&
      (typeof after !== 'string' || after.length === 0 || after.length > 4096)) ||
    (tag !== undefined &&
      (typeof tag !== 'string' || tag.length === 0 || tag.length > 200)) ||
    (yearValue !== undefined &&
      (typeof yearValue !== 'string' || !/^\d{4}$/.test(yearValue) || !Number.isInteger(year)))
  ) {
    return res.status(400).json({ error: 'Invalid category or pagination cursor' })
  }

  try {
    const posts = await getCategoryPostsPage(
      slug,
      typeof after === 'string' ? after : null,
      typeof tag === 'string' ? tag : null,
      year
    )

    if (!posts) {
      return res.status(404).json({ error: 'Category not found' })
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return res.status(200).json(posts)
  } catch (error) {
    console.error('Failed to load more category posts:', error)
    return res.status(502).json({ error: 'Unable to load more posts right now' })
  }
}
