import Head from 'next/head'
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OG_IMAGE_URL,
  absoluteUrl,
} from '../lib/seo'

export interface SeoProps {
  /** Full document title, including the site name suffix. */
  title: string
  description?: string
  /** Root-relative path of this page; it becomes the canonical URL. */
  path: string
  /** Absolute image URL. Falls back to the site card. */
  image?: string | null
  ogType?: 'website' | 'article' | 'profile'
  /** For pages that exist only as utilities (search results). */
  noindex?: boolean
}

/**
 * Per-document title, `description`, canonical URL and social card.
 *
 * `rel=canonical` always points at the production origin, so a preview
 * deployment or a filtered/paged view tells search engines which copy is the
 * document instead of competing with it.
 *
 * `Meta` (site chrome) stays responsible for the constants that never change
 * between pages; nothing here overlaps with what `Meta` emits, because Next's
 * `Head` de-duplicates `<meta>` by `name`/`property` and keeps only one.
 */
export default function Seo({
  title,
  description = SITE_DESCRIPTION,
  path,
  image,
  ogType = 'website',
  noindex = false,
}: SeoProps) {
  const canonical = absoluteUrl(path)
  const ogImage = image || SITE_OG_IMAGE_URL

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, follow" />}
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={title} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  )
}

/**
 * JSON-LD is rendered in the document body rather than `Head`: Google accepts
 * structured data anywhere in the document, and Next's `Head` has no reliable
 * de-duplication key for `<script>`, so a head-level script would accumulate one
 * copy per client-side navigation.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // `JSON.stringify` escapes quotes and `<`/`>` are escaped below so a
      // value containing `</script>` cannot break out of the element.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(
          /[<>&\u2028\u2029]/g,
          (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
        ),
      }}
    />
  )
}
