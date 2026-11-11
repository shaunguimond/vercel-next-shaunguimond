// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { buildSitemapXml } from './sitemap'

function parse(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  expect(doc.querySelector('parsererror')).toBeNull()
  return doc
}

describe('buildSitemapXml', () => {
  it('declares the sitemap namespace so Google accepts the file', () => {
    const doc = parse(buildSitemapXml([{ loc: 'https://shaunguimond.com/' }]))
    expect(doc.documentElement.getAttribute('xmlns')).toBe(
      'http://www.sitemaps.org/schemas/sitemap/0.9'
    )
  })

  it('writes one <url> per entry with its lastmod', () => {
    const doc = parse(
      buildSitemapXml([
        { loc: 'https://shaunguimond.com/', lastmod: null },
        {
          loc: 'https://shaunguimond.com/posts/hello',
          lastmod: '2024-05-06',
        },
      ])
    )
    const urls = doc.querySelectorAll('url')
    expect(urls).toHaveLength(2)
    expect(urls[0].querySelector('lastmod')).toBeNull()
    expect(urls[1].querySelector('lastmod')?.textContent).toBe('2024-05-06')
  })

  it('escapes query strings and encoded characters in URLs', () => {
    const xml = buildSitemapXml([
      { loc: 'https://shaunguimond.com/search?a=1&b=2' },
    ])
    expect(xml).toContain('<loc>https://shaunguimond.com/search?a=1&amp;b=2</loc>')
    expect(parse(xml).querySelector('loc')?.textContent).toBe(
      'https://shaunguimond.com/search?a=1&b=2'
    )
  })

  it('is valid with no entries, which is what the route serves on API failure', () => {
    const doc = parse(buildSitemapXml([]))
    expect(doc.querySelectorAll('url')).toHaveLength(0)
  })
})
