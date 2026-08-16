import sanitizeHtml from 'sanitize-html'

// WordPress HTML is author-controlled, but a compromised WordPress account
// or a bad plugin could inject scripts. Run all WordPress HTML through
// sanitize-html before it reaches dangerouslySetInnerHTML.
//
// Trade-off: inline `style` attributes are kept because WordPress generates
// them for block spacing and image sizing, and the post-body layout breaks
// without them. CSS is not executable code; scripts, event handlers, and
// non-http(s) URLs are.

// Tags allowed in full post/page bodies. Derived from the selectors in
// components/post-body.module.css, the WP block rules in styles/index.css,
// and the tags present in live content. Structural wrappers (div, section,
// ...) are kept because WordPress uses them for block layout and inline
// spacing styles.
const WP_CONTENT_ALLOWED_TAGS = [
  // Inline text
  'a', 'b', 'i', 'em', 'strong', 'u', 's', 'sup', 'sub',
  'kbd', 'samp', 'var', 'del', 'ins', 'mark', 'span', 'time',
  // Block text
  'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'cite',
  'code', 'pre',
  // Structural wrappers
  'div', 'section', 'article', 'footer', 'header',
  // Media and figures
  'figure', 'figcaption', 'img',
  'audio', 'video', 'source', 'track',
  // Tables
  'table', 'caption', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
]

// Classes kept on content elements. These are the WP block classes that
// styles/index.css styles. Anything else (including WordPress hash classes
// like wp-container-core-...) is dropped.
const WP_CONTENT_ALLOWED_CLASSES = [
  'wp-block-image', 'wp-block-cover', 'wp-block-embed', 'wp-block-embed__wrapper',
  'wp-block-gallery', 'wp-block-group', 'wp-block-group__inner-container',
  'wp-block-columns', 'wp-block-columns-is-layout-flex', 'wp-block-column',
  'wp-block-column-is-layout-flow',
  'wp-block-buttons', 'wp-block-buttons-is-layout-flex', 'wp-block-button',
  'wp-block-button__link', 'wp-block-table', 'wp-block-heading',
  'wp-block-quote', 'wp-block-separator', 'wp-block-verse', 'wp-block-code',
  'wp-block-pullquote',
  'aligncenter', 'alignleft', 'alignright', 'alignwide', 'alignfull',
  'is-resized', 'is-style-outline', 'is-style-solid-color',
  'is-layout-flex', 'is-layout-flow', 'is-content-justification-center',
  'is-content-justification-left', 'is-content-justification-right',
  'is-content-justification-space-between',
  'wide', 'big',
]

// Tags allowed in titles and excerpts (plain inline content).
const WP_TEXT_ALLOWED_TAGS = [
  'a', 'b', 'i', 'em', 'strong', 'u', 's', 'p', 'br', 'ul', 'ol', 'li',
]

const WP_ALLOWED_SCHEMES = ['http', 'https']

export function sanitizeWpContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: WP_CONTENT_ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'rel', 'target'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'srcset', 'sizes'],
      video: ['src', 'controls', 'loop', 'preload', 'poster', 'width', 'height'],
      audio: ['src', 'controls', 'loop', 'preload'],
      source: ['src', 'srcset', 'type'],
      time: ['datetime', 'title'],
      '*': ['style'],
    },
    allowedSchemes: WP_ALLOWED_SCHEMES,
    allowedClasses: {
      '*': WP_CONTENT_ALLOWED_CLASSES,
    },
  })
}

export function sanitizeWpText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: WP_TEXT_ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'rel', 'target'],
    },
    allowedSchemes: WP_ALLOWED_SCHEMES,
  })
}
