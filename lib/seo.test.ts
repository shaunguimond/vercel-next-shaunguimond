import { describe, expect, it } from 'vitest'
import {
  SITE_OG_IMAGE_URL,
  SITE_URL,
  absoluteUrl,
  blogPostingJsonLd,
  escapeXml,
  htmlToPlainText,
  isoDateString,
  metaDescription,
  rfc822Date,
  xmlCdata,
} from './seo'

describe('absoluteUrl', () => {
  it('resolves paths against the canonical production origin', () => {
    expect(absoluteUrl('/')).toBe(SITE_URL)
    expect(absoluteUrl('/about-shaun')).toBe(`${SITE_URL}/about-shaun`)
    expect(absoluteUrl('posts/hello')).toBe(`${SITE_URL}/posts/hello`)
  })

  it('drops trailing slashes so a page is never two URLs', () => {
    expect(absoluteUrl('/category/technology/')).toBe(
      `${SITE_URL}/category/technology`
    )
  })

  it('leaves absolute URLs alone', () => {
    expect(absoluteUrl('https://wp.shaunguimond.com/x.png')).toBe(
      'https://wp.shaunguimond.com/x.png'
    )
  })

  it('defaults to the site card image', () => {
    expect(SITE_OG_IMAGE_URL).toBe(`${SITE_URL}/og/shaunguimond.png`)
  })
})

describe('htmlToPlainText', () => {
  it('removes markup and collapses whitespace', () => {
    expect(htmlToPlainText('<p>Hello   <strong>world</strong></p>\n<p>again</p>')).toBe(
      'Hello world again'
    )
  })

  it('decodes numeric, hex, and named entities', () => {
    expect(htmlToPlainText('Caf&#233; &amp; Cr&#232;me &#8212; ok')).toBe(
      'Café & Crème — ok'
    )
    expect(htmlToPlainText('It&#8217;s&nbsp;here')).toBe('It’s here')
  })

  it('keeps an ampersand that is not an entity', () => {
    expect(htmlToPlainText('Tom & Jerry')).toBe('Tom & Jerry')
  })

  it('never turns escaped markup into a tag', () => {
    // Tags are removed before entities are decoded, so `&lt;b&gt;` is text.
    expect(htmlToPlainText('&lt;b&gt;bold&lt;/b&gt;')).toBe('<b>bold</b>')
  })

  it('drops script and style bodies entirely', () => {
    expect(
      htmlToPlainText('before<script>alert("x")</script><style>a{}</style>after')
    ).toBe('before after')
  })

  it('handles missing content', () => {
    expect(htmlToPlainText(null)).toBe('')
    expect(htmlToPlainText('')).toBe('')
  })
})

describe('metaDescription', () => {
  it('returns short text untouched', () => {
    expect(metaDescription('<p>Short copy.</p>')).toBe('Short copy.')
  })

  it('stays within the limit and cuts on a word boundary', () => {
    const result = metaDescription(`<p>${'word '.repeat(80)}</p>`)
    expect(result.length).toBeLessThanOrEqual(160)
    expect(result.endsWith('…')).toBe(true)
    expect(result.trimEnd()).not.toMatch(/\s$/)
  })

  it('strips markup and entities before measuring', () => {
    const result = metaDescription(`<p>${'<em>Don’t </em>'.repeat(60)}</p>`)
    expect(result).not.toContain('<')
    expect(result).toContain('Don’t')
    expect(result.length).toBeLessThanOrEqual(160)
  })

  it('returns an empty string for an empty excerpt', () => {
    expect(metaDescription('')).toBe('')
  })
})

describe('blogPostingJsonLd', () => {
  const base = {
    headline: 'Valve’s Steam Deck',
    description: 'A handheld PC.',
    path: '/posts/steam-deck',
    date: '2022-03-01T15:00:00+00:00',
  }

  it('publishes absolute URLs and the article dates', () => {
    const json = blogPostingJsonLd(base)
    expect(json['@type']).toBe('BlogPosting')
    expect(json.url).toBe(`${SITE_URL}/posts/steam-deck`)
    expect(json.datePublished).toBe('2022-03-01T15:00:00.000Z')
  })

  it('falls back to the publish date for dateModified', () => {
    const json = blogPostingJsonLd(base)
    expect(json.dateModified).toBe(json.datePublished)
  })

  it('omits dates it cannot parse instead of emitting null', () => {
    const json = blogPostingJsonLd({
      ...base,
      date: 'not-a-date',
      modified: null,
    })
    expect(json).not.toHaveProperty('datePublished')
    expect(json).not.toHaveProperty('dateModified')
  })

  it('omits an image an author never uploaded', () => {
    expect(blogPostingJsonLd(base)).not.toHaveProperty('image')
    expect(blogPostingJsonLd({ ...base, image: 'https://x/y.png' }).image).toEqual([
      'https://x/y.png',
    ])
  })

  it('keeps the author and publisher identity', () => {
    const json = blogPostingJsonLd({ ...base, authorName: 'Shaun Guimond' })
    expect(json.author).toMatchObject({
      '@type': 'Person',
      name: 'Shaun Guimond',
    })
    expect(json.publisher).toMatchObject({ '@type': 'Person' })
  })
})

describe('XML escaping', () => {
  it('escapes the characters that would break a document', () => {
    expect(escapeXml(`Tom & Jerry <b>"x"</b>`)).toBe(
      'Tom &amp; Jerry &lt;b&gt;&quot;x&quot;&lt;/b&gt;'
    )
  })

  it('removes control characters that are illegal in XML 1.0', () => {
    expect(escapeXml('a\u0000b\u0007c\u001fd')).toBe('abcd')
  })

  it('never leaves a CDATA terminator inside a CDATA section', () => {
    // The terminator can only appear as the end of one section, so a document
    // with a payload terminator is re-serialized as two adjacent sections.
    expect(xmlCdata('payload ]]> more')).toBe(
      '<![CDATA[payload ]]]]><![CDATA[> more]]>'
    )
  })

  it('produces parseable dates, or nothing', () => {
    expect(rfc822Date('2024-01-02T03:04:05Z')).toBe('Tue, 02 Jan 2024 03:04:05 GMT')
    expect(rfc822Date('nonsense')).toBeUndefined()
    expect(rfc822Date(null)).toBeUndefined()
    expect(isoDateString('2024-01-02T03:04:05Z')).toBe('2024-01-02')
    expect(isoDateString(undefined)).toBeUndefined()
  })
})
