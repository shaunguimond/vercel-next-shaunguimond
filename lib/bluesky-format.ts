import {
  AppBskyEmbedExternal,
  AppBskyEmbedGallery,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
  AppBskyRichtextFacet,
} from '@atproto/api'
import sanitizeHtml from 'sanitize-html'

export interface PostRecordFields {
  text?: string
  facets?: AppBskyRichtextFacet.Main[]
  createdAt?: string
}

export type EmbedView =
  | AppBskyEmbedImages.View
  | AppBskyEmbedVideo.View
  | AppBskyEmbedGallery.View
  | AppBskyEmbedExternal.View
  | AppBskyEmbedRecord.View
  | AppBskyEmbedRecordWithMedia.View

const BLUESKY_TEXT_SANITIZE_OPTIONS = {
  allowedTags: ['a', 'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'li'],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'class'],
  },
  allowedClasses: {
    a: ['underline'],
  },
  allowedSchemes: ['http', 'https'],
}

function isSafeLinkUri(uri: string): boolean {
  try {
    const url = new URL(uri)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Facet indices are UTF-8 byte offsets; JavaScript string indices use UTF-16.
function byteOffsetToCodeUnitIndex(text: string, byteOffset: number): number {
  let bytes = 0
  for (let i = 0; i < text.length; ) {
    const code = text.codePointAt(i) ?? 0
    const byteLength = code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4
    if (bytes + byteLength > byteOffset) return i
    bytes += byteLength
    i += code > 0xffff ? 2 : 1
  }
  return text.length
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapFacetLinks(text: string, facets?: AppBskyRichtextFacet.Main[]): string {
  const linkByIndex: (string | null)[] = new Array(text.length).fill(null)
  for (const facet of facets ?? []) {
    const link = facet.features.find(AppBskyRichtextFacet.isLink)
    if (!link || !isSafeLinkUri(link.uri)) continue
    const start = byteOffsetToCodeUnitIndex(text, facet.index.byteStart)
    const end = byteOffsetToCodeUnitIndex(text, facet.index.byteEnd)
    for (let i = start; i < end && i < text.length; i++) {
      linkByIndex[i] = link.uri
    }
  }

  let out = ''
  let currentUri: string | null = null
  for (let i = 0; i < text.length; i++) {
    const uri = linkByIndex[i]
    if (uri !== currentUri) {
      if (currentUri !== null) out += '</a>'
      if (uri !== null) {
        const safeUri = escapeHtml(uri)
        out += `<a class="underline" href="${safeUri}" target="_blank" rel="noopener noreferrer">`
      }
      currentUri = uri
    }
    out += escapeHtml(text[i])
  }
  if (currentUri !== null) out += '</a>'
  return out
}

export function formatPostText(
  text: string | undefined,
  facets?: AppBskyRichtextFacet.Main[]
): string {
  const withLinks = wrapFacetLinks(text ?? '', facets)
  const withLineBreaks = withLinks.replace(/\n/g, '<br>')
  return sanitizeHtml(withLineBreaks, BLUESKY_TEXT_SANITIZE_OPTIONS)
}

export function getFormattedText(post: AppBskyFeedDefs.PostView): string {
  const record = post.record as PostRecordFields
  return formatPostText(record?.text, record?.facets)
}

export function getFormattedTextForRecord(
  record: { value?: PostRecordFields | null }
): string {
  return formatPostText(record?.value?.text, record?.value?.facets)
}

export function getRenderTimeFromPost(date?: string): string {
  const timestamp = new Date(date ?? '').getTime()
  if (!Number.isFinite(timestamp)) return ''

  const minutesAgo = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
  if (minutesAgo < 60) return `${minutesAgo} minutes ago`

  const hoursAgo = Math.floor(minutesAgo / 60)
  if (hoursAgo < 24) return `${hoursAgo} hours ago`

  const daysAgo = Math.floor(hoursAgo / 24)
  if (daysAgo < 10) return `${daysAgo} days ago`
  if (daysAgo < 365) return `${Math.floor(daysAgo / 7)} weeks ago`
  return `${Math.floor(daysAgo / 365)} years ago`
}
