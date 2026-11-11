import { escapeXml } from './seo'

export interface SitemapEntryInput {
  /** Absolute URL. */
  loc: string
  /** ISO-8601 date (`YYYY-MM-DD`), omitted when unknown. */
  lastmod?: string | null
}

/**
 * Renders a sitemap index-free `urlset`. `<changefreq>` is intentionally not
 * emitted: Google states it ignores the value, and `<lastmod>` is only trusted
 * when it actually changes, which the WordPress `modified` timestamp gives us.
 */
export function buildSitemapXml(entries: SitemapEntryInput[]): string {
  const urls = entries
    .map((entry) =>
      [
        '  <url>',
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        entry.lastmod
          ? `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`
          : null,
        '  </url>',
      ]
        .filter((line): line is string => line !== null)
        .join('\n')
    )
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n')
}
