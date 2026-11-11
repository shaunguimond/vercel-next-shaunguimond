import { describe, expect, it } from 'vitest'
import { type Facet, formatPostText } from './bluesky-format'

// Facets are written the way the AT Protocol sends them: `$type` discriminants.
function linkFacet(byteStart: number, byteEnd: number, uri: string): Facet {
  return {
    index: { byteStart, byteEnd },
    features: [{ $type: 'app.bsky.richtext.facet#link', uri }],
  }
}

describe('Bluesky rich-text formatting', () => {
  it('links facet text using UTF-8 byte offsets after emoji', () => {
    const result = formatPostText('See 🙂 blog', [
      linkFacet(9, 13, 'https://example.com'),
    ])

    expect(result).toContain(
      '<a class="underline" href="https://example.com" target="_blank" rel="noopener noreferrer">blog</a>'
    )
    expect(result).toContain('See 🙂 ')
  })

  it('escapes post HTML and ignores unsafe facet links', () => {
    const result = formatPostText('<img src=x onerror=alert(1)>', [
      linkFacet(0, 5, 'javascript:alert(1)'),
    ])

    expect(result).not.toContain('<img')
    expect(result).toContain('&lt;img')
    expect(result).not.toContain('javascript:')
  })
})
