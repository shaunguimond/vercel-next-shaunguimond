import { describe, expect, it } from 'vitest'
import { sanitizeWpContent, sanitizeWpText } from './sanitize'

describe('WordPress content sanitization', () => {
  it('keeps common post markup while removing scripts and event handlers', () => {
    const result = sanitizeWpContent(
      '<p onclick="alert(1)">Hello <strong>world</strong><script>alert(1)</script></p>'
    )

    expect(result).toContain('<p>Hello <strong>world</strong></p>')
    expect(result).not.toContain('<script')
    expect(result).not.toContain('onclick')
  })

  it('removes unsafe URL schemes from links and media', () => {
    const result = sanitizeWpContent(
      '<a href="javascript:alert(1)">unsafe</a><img src="data:text/html,evil">'
    )

    expect(result).not.toContain('javascript:')
    expect(result).not.toContain('data:text/html')
    expect(result).toContain('unsafe')
  })

  it('keeps titles and excerpts limited to safe inline text markup', () => {
    const result = sanitizeWpText(
      '<div class="hidden"><strong>Welcome</strong><script>alert(1)</script></div>'
    )

    expect(result).toContain('<strong>Welcome</strong>')
    expect(result).not.toContain('<div')
    expect(result).not.toContain('<script')
  })
})
