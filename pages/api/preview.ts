import type { NextApiRequest, NextApiResponse } from 'next'
import { getPreviewPost } from '../../lib/api'
import { previewSecret } from '../../lib/preview-secret'

export default async function preview(req: NextApiRequest, res: NextApiResponse) {
  const { secret, id, slug } = req.query
  const configured = previewSecret()

  // Check the secret and next parameters
  // This secret should only be known by this API route
  if (!configured || secret !== configured || (!id && !slug)) {
    if (!configured) {
      // Worth a log line: this means the deployment kept the placeholder from
      // `.env`, so preview mode is off until a real secret is set.
      console.warn(
        'Preview mode is disabled: WORDPRESS_PREVIEW_SECRET is unset or still the example value.',
      )
    }
    return res.status(401).json({ message: 'Invalid token' })
  }

  // Fetch WordPress to check if the provided `id` or `slug` exists
  const post = await getPreviewPost(String(id || slug), id ? 'DATABASE_ID' : 'SLUG')

  // If the post doesn't exist prevent preview mode from being enabled
  if (!post) {
    return res.status(401).json({ message: 'Post not found' })
  }

  // Enable Preview Mode by setting the cookies
  res.setPreviewData({
    post: {
      id: post.databaseId,
      slug: post.slug,
      status: post.status,
    },
  })

  // Redirect to the path from the fetched post
  // We don't redirect to `req.query.slug` as that might lead to open redirect vulnerabilities
  res.writeHead(307, { Location: `/posts/${post.slug || post.databaseId}` })
  res.end()
}
