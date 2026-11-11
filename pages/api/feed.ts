import type { NextApiHandler } from 'next'
import { getFeedPosts } from '../../lib/api'
import { FEED_LIMIT, buildRssXml, buildSiteFeed, feedPostsToItems } from '../../lib/feed'

/**
 * `GET /feed.xml` (rewritten here from `/feed.xml`, `/feed` and `/rss.xml`).
 *
 * Served from an API route instead of a page because the payload is XML: a page
 * would be wrapped in the HTML document shell and `text/html` content type.
 */
const RSS_CONTENT_TYPE = 'application/rss+xml; charset=utf-8'

const handler: NextApiHandler = async (_req, res) => {
  const xml = (items: ReturnType<typeof feedPostsToItems>) =>
    buildRssXml(buildSiteFeed(items))

  res.setHeader('Content-Type', RSS_CONTENT_TYPE)

  try {
    const posts = await getFeedPosts(FEED_LIMIT)
    // Readers poll this constantly; five minutes at the edge keeps WordPress out
    // of the loop while a new post appears promptly.
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
    res.status(200).send(xml(feedPostsToItems(posts)))
  } catch (err) {
    console.error('Feed generation failed:', err)
    // A feed reader that sees a server error can drop the subscription, so a
    // temporarily empty channel (which still advertises the same URL) is the
    // safer answer while WordPress is unreachable.
    res.status(503).send(xml([]))
  }
}

export default handler
