import type { FeedPostNode } from './api'
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  escapeXml,
  htmlToPlainText,
  metaDescription,
  rfc822Date,
  xmlCdata,
} from './seo'
import { sanitizeWpContent } from './sanitize'

export interface FeedItemInput {
  title: string
  /** Absolute URL of the post. */
  url: string
  /** Plain-text summary for `<description>`. */
  summary: string
  /** HTML body for `content:encoded`; sanitized when the feed is rendered. */
  html?: string | null
  /** RFC-822 publish date. */
  date?: string
  authorName?: string
  categories?: string[]
}

export interface FeedInput {
  title: string
  /** Absolute URL of the site. */
  url: string
  /** Absolute URL of this feed, used for the `atom:link rel=self` element. */
  feedUrl: string
  description: string
  language?: string
  items: FeedItemInput[]
}

/** How many posts `/feed.xml` carries. */
export const FEED_LIMIT = 20

/**
 * Renders an RSS 2.0 document.
 *
 * Two representations of the body are published on purpose: `<description>`
 * carries the plain-text summary for readers that only show a summary, while
 * `content:encoded` carries the full HTML for readers that support it. `guid` is
 * the permalink, so subscriber read state survives an edit.
 */
export function buildRssXml(feed: FeedInput): string {
  const items = feed.items
    .map((item) => {
      const categories = (item.categories ?? [])
        .map((category) => `    <category>${escapeXml(category)}</category>`)
        .join('\n')
      const body = item.html ? sanitizeWpContent(item.html) : ''
      return [
        '  <item>',
        `    <title>${escapeXml(item.title)}</title>`,
        `    <link>${escapeXml(item.url)}</link>`,
        `    <guid isPermaLink="true">${escapeXml(item.url)}</guid>`,
        item.date ? `    <pubDate>${escapeXml(item.date)}</pubDate>` : null,
        item.authorName
          ? `    <dc:creator>${escapeXml(item.authorName)}</dc:creator>`
          : null,
        `    <description>${escapeXml(item.summary)}</description>`,
        categories || null,
        body ? `    <content:encoded>${xmlCdata(body)}</content:encoded>` : null,
        '  </item>',
      ]
        .filter((line): line is string => line !== null)
        .join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"',
    '     xmlns:atom="http://www.w3.org/2005/Atom"',
    '     xmlns:content="http://purl.org/rss/1.0/modules/content/"',
    '     xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    `    <title>${escapeXml(feed.title)}</title>`,
    `    <link>${escapeXml(feed.url)}</link>`,
    `    <description>${escapeXml(feed.description)}</description>`,
    `    <language>${escapeXml(feed.language ?? 'en')}</language>`,
    `    <atom:link href="${escapeXml(feed.feedUrl)}" rel="self" type="application/rss+xml"/>`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}

/**
 * Maps WordPress post nodes to feed items. `excerpt` wins over the content
 * opening for the summary, because it is what the author wrote; the body is
 * always the full content, so subscribers do not have to visit the site to read
 * a post.
 */
export function feedPostsToItems(posts: FeedPostNode[]): FeedItemInput[] {
  return posts
    .filter((post) => Boolean(post.slug))
    .map((post) => ({
      // Titles arrive HTML-escaped by WordPress, and escaping happens once, in
      // buildRssXml.
      title: htmlToPlainText(post.title),
      url: absoluteUrl(`/posts/${post.slug}`),
      summary: metaDescription(post.excerpt || post.content),
      html: post.content,
      date: rfc822Date(post.date ?? post.modified),
      authorName: post.author?.node?.name ?? undefined,
      categories: (post.categories?.edges ?? []).map(({ node }) => node.name),
    }))
}

/** Channel metadata shared by the feed route and its tests. */
export function buildSiteFeed(items: FeedItemInput[]): FeedInput {
  return {
    title: SITE_NAME,
    url: SITE_URL,
    feedUrl: absoluteUrl('/feed.xml'),
    description: SITE_DESCRIPTION,
    language: 'en',
    items,
  }
}
