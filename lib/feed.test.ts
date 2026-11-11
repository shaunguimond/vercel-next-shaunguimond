// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import type { FeedPostNode } from './api'
import { FEED_LIMIT, buildRssXml, buildSiteFeed, feedPostsToItems } from './feed'
import { SITE_URL } from './seo'

function post(overrides: Partial<FeedPostNode> = {}): FeedPostNode {
  return {
    title: 'Tom & Jerry “rerecorded”',
    slug: 'tom-and-jerry',
    excerpt: '<p>An &amp; excerpt with <em>markup</em>.</p>',
    content:
      '<p>Body <a href="https://x.test/y">link</a> &amp; more</p><script>alert(1)</script>',
    date: '2024-05-06T10:00:00Z',
    author: { node: { name: 'Shaun Guimond' } },
    categories: { edges: [{ node: { name: 'Technology' } }] },
    ...overrides,
  }
}

/** A feed that fails to parse is worse than no feed: readers drop it. */
function parse(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  expect(doc.querySelector('parsererror')).toBeNull()
  return doc
}

function renderItem(postOverrides: Partial<FeedPostNode> = {}) {
  const xml = buildRssXml(buildSiteFeed(feedPostsToItems([post(postOverrides)])))
  return { xml, doc: parse(xml), item: parse(xml).querySelector('item')! }
}

describe('buildRssXml', () => {
  it('is well-formed even when titles carry markup characters', () => {
    const { item } = renderItem()
    expect(item.querySelector('title')?.textContent).toBe(
      'Tom & Jerry “rerecorded”'
    )
  })

  it('publishes channel metadata and a self link', () => {
    const { doc } = renderItem()
    const channel = doc.querySelector('channel')
    expect(channel?.querySelector('link')?.textContent).toBe(SITE_URL)
    const selfLink = doc.getElementsByTagName('atom:link')[0]
    expect(selfLink.getAttribute('href')).toBe(`${SITE_URL}/feed.xml`)
    expect(selfLink.getAttribute('rel')).toBe('self')
  })

  it('uses the permalink as both link and guid', () => {
    const { item } = renderItem()
    expect(item.querySelector('link')?.textContent).toBe(
      `${SITE_URL}/posts/tom-and-jerry`
    )
    const guid = item.querySelector('guid')
    expect(guid?.getAttribute('isPermaLink')).toBe('true')
    expect(guid?.textContent).toBe(`${SITE_URL}/posts/tom-and-jerry`)
  })

  it('keeps the author-written excerpt as the summary', () => {
    const { item } = renderItem()
    expect(item.querySelector('description')?.textContent).toBe('An & excerpt with markup.')
  })

  it('publishes the full body, without scripts, in content:encoded', () => {
    const { xml } = renderItem()
    expect(xml).toContain('<![CDATA[')
    expect(xml).toContain('href="https://x.test/y"')
    expect(xml).not.toContain('<script>alert(1)</script>')
  })

  it('lists the author and categories', () => {
    const { item } = renderItem()
    expect(item.textContent).toContain('Shaun Guimond')
    expect(item.textContent).toContain('Technology')
  })

  it('emits an RFC-822 pubDate', () => {
    const { item } = renderItem()
    expect(item.querySelector('pubDate')?.textContent).toBe(
      'Mon, 06 May 2024 10:00:00 GMT'
    )
  })

  it('round-trips the body through the CDATA section', () => {
    const { doc } = renderItem({ content: '<p>Tom &amp; <em>Jerry</em></p>' })
    const encoded = doc.getElementsByTagName('content:encoded')[0]
    expect(encoded.textContent).toContain('<em>Jerry</em>')
    expect(encoded.textContent).toContain('Tom &amp;')
  })

  it('stays valid with no items, which is what the route serves on API failure', () => {
    const doc = parse(buildRssXml(buildSiteFeed([])))
    expect(doc.querySelectorAll('item')).toHaveLength(0)
    expect(doc.querySelector('channel')).not.toBeNull()
  })
})

describe('feedPostsToItems', () => {
  it('skips posts without a slug, which have no URL to publish', () => {
    const items = feedPostsToItems([
      post(),
      post({ slug: '', title: 'Draft' }),
    ])
    expect(items).toHaveLength(1)
  })

  it('falls back to the content opening when there is no excerpt', () => {
    const items = feedPostsToItems([post({ excerpt: '' })])
    expect(items[0].summary).toContain('Body link & more')
  })

  it('is bounded by FEED_LIMIT in the route', () => {
    expect(FEED_LIMIT).toBeGreaterThan(0)
  })
})
