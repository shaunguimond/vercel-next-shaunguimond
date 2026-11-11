// Everything the site publishes as an absolute URL, and the metadata helpers
// that turn WordPress HTML into search/social summaries, lives here so the
// canonical origin is defined once.

/**
 * Origin used for `rel=canonical`, Open Graph URLs, sitemap entries and feed
 * permalinks. Preview deployments (`*.vercel.app`) deliberately keep the
 * production default so their canonical tag points at the real document
 * instead of creating a duplicate indexable copy.
 */
const DEFAULT_SITE_URL = 'https://shaunguimond.com'

function normalizeOrigin(value: string | undefined): string {
  const trimmed = (value ?? '').trim().replace(/\/+$/, '')
  if (!trimmed) return DEFAULT_SITE_URL
  // Only http(s) origins are usable: a protocol-less or relative value would
  // silently produce malformed canonical/feed URLs.
  if (!/^https?:\/\//i.test(trimmed)) return DEFAULT_SITE_URL
  return trimmed
}

export const SITE_URL = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL)

export const SITE_NAME = 'Shaun Guimond'

export const SITE_DESCRIPTION =
  'Essays on technology, business, travel, and personal projects by Shaun Guimond.'

/**
 * Fallback social card. Pages and posts without a featured image inherit it, so
 * a share never falls back to a blank card.
 */
export const SITE_OG_IMAGE_URL = `${SITE_URL}/og/shaunguimond.png`

/**
 * The author's own Bluesky identity, which is also the account the Atmosphere
 * feed and the comment threads come from. Declared as `sameAs` so search engines
 * can merge the profiles that represent the same person.
 */
export const AUTHOR_BLUESKY_HANDLE = 'shaunguimond.com'
export const AUTHOR_BLUESKY_URL = `https://bsky.app/profile/${AUTHOR_BLUESKY_HANDLE}`

/** Routes that carry content worth discovering, beyond posts and categories. */
export const STATIC_SITEMAP_PATHS = [
  '/',
  '/about-shaun',
  '/privacy-policy',
  '/project/5-character-puzzle',
]

/**
 * Resolves a root-relative path (or keeps an absolute URL) against the
 * canonical origin. Trailing slashes are dropped so `/posts/foo/` and
 * `/posts/foo` never look like two documents.
 */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`
  // A trailing slash is dropped and the root resolves to the bare origin, so
  // `https://shaunguimond.com` is the only spelling of the homepage.
  const normalized = withLeadingSlash.replace(/\/+$/, '')
  return `${SITE_URL}${normalized}`
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  quot: '"',
  lt: '<',
  gt: '>',
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
  deg: '°',
  trade: '™',
  reg: '®',
  copy: '©',
  bull: '•',
  middot: '·',
  times: '×',
  euro: '€',
  pound: '£',
}

function decodeEntity(match: string, body: string): string {
  if (body.startsWith('#')) {
    const hex = /^#[xX]([0-9a-f]+)$/i.exec(body)
    const codePoint = hex
      ? Number.parseInt(hex[1], 16)
      : Number.parseInt(body.slice(1), 10)
    if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
      return ' '
    }
    try {
      return String.fromCodePoint(codePoint)
    } catch {
      return ' '
    }
  }
  const named = NAMED_ENTITIES[body.toLowerCase()]
  // Unknown entities (including the bare `&` in query strings) stay literal, so
  // an author's "&friends" is not mangled.
  return named ?? match
}

/**
 * Reduces WordPress HTML (post `content`/`excerpt`, which are HTML fragments) to
 * readable plain text. Tags are removed before entities are decoded so escaped
 * markup such as `&lt;div&gt;` cannot become a tag.
 */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // Inline markup is deleted instead of blanked: swapping `<em>` for a space
    // would split words and push punctuation away from the sentence (`markup .`).
    .replace(INLINE_TAG_PATTERN, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x?[0-9a-f]+|[a-z0-9]+);/gi, decodeEntity)
    .replace(/\s+/g, ' ')
    .trim()
}

/** Tags that never introduce a break in the text flow. */
const INLINE_TAG_PATTERN =
  /<\/?\s*(?:a|abbr|b|bdi|bdo|cite|code|data|del|dfn|em|i|ins|kbd|mark|q|s|samp|small|span|strong|sub|sup|time|u|var)\b[^>]*>/gi

export const META_DESCRIPTION_MAX_LENGTH = 160

/**
 * A `meta description` for a document: plain text, capped, cut on a word
 * boundary. WordPress `excerpt` is used when present because authors write it,
 * otherwise the opening of the content.
 */
export function metaDescription(
  html: string | null | undefined,
  maxLength = META_DESCRIPTION_MAX_LENGTH
): string {
  const text = htmlToPlainText(html)
  if (text.length <= maxLength) return text
  const window = text.slice(0, maxLength + 1)
  const lastBoundary = Math.max(
    window.lastIndexOf(' '),
    window.lastIndexOf(';'),
    window.lastIndexOf(':')
  )
  const cut = lastBoundary > maxLength * 0.5 ? lastBoundary : maxLength
  return `${text.slice(0, cut).replace(/[\s,;:.-]+$/, '')}…`
}

export interface ArticleMetadata {
  headline: string
  description: string
  path: string
  date?: string | null
  modified?: string | null
  image?: string | null
  authorName?: string | null
  categories?: string[]
}

function isoDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

/**
 * `schema.org/BlogPosting`. Emitted as `<script type="application/ld+json">`,
 * which is how search engines read article metadata that is not visible in the
 * template (date modified, author, headline).
 */
export function blogPostingJsonLd(
  article: ArticleMetadata
): Record<string, unknown> {
  const published = isoDate(article.date)
  const modified = isoDate(article.modified) ?? published
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.headline,
    description: article.description,
    inLanguage: 'en',
    url: absoluteUrl(article.path),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(article.path),
    },
    ...(article.image ? { image: [article.image] } : {}),
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
    author: {
      '@type': 'Person',
      name: article.authorName || SITE_NAME,
      url: SITE_URL,
      sameAs: [AUTHOR_BLUESKY_URL],
    },
    publisher: {
      '@type': 'Person',
      name: SITE_NAME,
      url: SITE_URL,
      sameAs: [AUTHOR_BLUESKY_URL],
    },
    ...(article.categories?.length
      ? { articleSection: article.categories }
      : {}),
  }
}

/** `schema.org/WebSite` for the homepage, which carries the site name/brand. */
export function webSiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    sameAs: [AUTHOR_BLUESKY_URL],
  }
}

/** `schema.org/CollectionPage` for a category listing. */
export function collectionPageJsonLd(
  name: string,
  description: string,
  path: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${name} | ${SITE_NAME}`,
    description,
    url: absoluteUrl(path),
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
  }
}

/**
 * Escapes text for an XML text node or attribute. Feed and sitemap payloads are
 * built as strings, so unescaped `&` (common in post titles) or `<` would make
 * the whole document invalid and get the feed rejected.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Control characters are not legal XML 1.0 at all.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
}

/**
 * Wraps markup in a CDATA section for `content:encoded`. The terminator cannot
 * appear inside a CDATA section, so occurrences are split.
 */
export function xmlCdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

/** RFC-822 date for RSS `pubDate`/`lastBuildDate`. */
export function rfc822Date(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toUTCString()
}

/** ISO-8601 date-only value for sitemap `lastmod`. */
export function isoDateString(
  value: string | null | undefined
): string | undefined {
  const full = isoDate(value)
  return full ? full.slice(0, 10) : undefined
}
