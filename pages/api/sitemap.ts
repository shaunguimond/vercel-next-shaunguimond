import type { NextApiHandler } from 'next'
import { getAllCategoriesWithSlug, getAllPostsForSitemap } from '../../lib/api'
import { buildSitemapXml, type SitemapEntryInput } from '../../lib/sitemap'
import {
  STATIC_SITEMAP_PATHS,
  absoluteUrl,
  isoDateString,
} from '../../lib/seo'

/**
 * `GET /sitemap.xml` (rewritten here from `/sitemap.xml`).
 *
 * Posts carry `<lastmod>` from the WordPress `modified` timestamp; static pages
 * and category listings have no meaningful modification date, so they omit it
 * rather than publishing a date that never changes.
 */
const XML_CONTENT_TYPE = 'application/xml; charset=utf-8'

const handler: NextApiHandler = async (_req, res) => {
  const emptySitemap = buildSitemapXml([])

  res.setHeader('Content-Type', XML_CONTENT_TYPE)

  try {
    const [posts, categories] = await Promise.all([
      getAllPostsForSitemap(),
      getAllCategoriesWithSlug(),
    ])

    const entries: SitemapEntryInput[] = [
      ...STATIC_SITEMAP_PATHS.map((path) => ({ loc: absoluteUrl(path) })),
      ...categories.edges.map(({ node }) => ({
        loc: absoluteUrl(`/category/${node.slug}`),
      })),
      ...posts.map((post) => ({
        loc: absoluteUrl(`/posts/${post.slug}`),
        lastmod: isoDateString(post.modified),
      })),
    ]

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    )
    res.status(200).send(buildSitemapXml(entries))
  } catch (err) {
    console.error('Sitemap generation failed:', err)
    // An empty but well-formed urlset keeps crawlers from treating the sitemap
    // as gone while WordPress is unreachable.
    res.status(503).send(emptySitemap)
  }
}

export default handler
