/**
 * The slice of the AT Protocol lexicon this site renders, typed by hand.
 *
 * `@atproto/api` generates one module per lexicon, and every module imports the
 * generated lexicon registry and `multiformats` so its validators can run. The
 * validators themselves only compare `$type`, but importing one of them from a
 * component put 830 KB of raw JavaScript — more than the rest of a page
 * together — into the bundle of every page that shows a Bluesky post or the
 * comment thread.
 *
 * The XRPC responses are plain JSON, and `$type` is the wire-format discriminant
 * defined by the published lexicons, so the client needs the shapes and these
 * discriminant checks and nothing else. `@atproto/api` stays a type-only import
 * for the server-side feed fetch.
 *
 * Only the fields this site reads are declared; the index signatures keep the
 * rest of the response accessible.
 * @see https://docs.bsky.app/docs/advanced-guides/lexicon
 */

/** Narrow an XRPC `$type` discriminant, the same check the SDK's guards make. */
function hasType<T extends object>(value: unknown, type: string): value is T {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { $type?: unknown }).$type === type
  )
}

// ---------------------------------------------------------------- profiles

export interface ProfileViewBasic {
  did: string
  handle: string
  displayName?: string
  avatar?: string
  [key: string]: unknown
}

// ---------------------------------------------------------------- records

export interface FacetFeature {
  $type: string
  uri?: string
  did?: string
  handle?: string
  tag?: string
  [key: string]: unknown
}

export interface Facet {
  index: { byteStart: number; byteEnd: number }
  features: FacetFeature[]
}

/** A link facet: the text between `index.byteStart` and `byteEnd` points at `uri`. */
export interface LinkFacetFeature extends FacetFeature {
  uri: string
}

export function isLinkFacet(feature: FacetFeature): feature is LinkFacetFeature {
  return feature.$type === 'app.bsky.richtext.facet#link'
}

/** `app.bsky.feed.post`, the record behind a post or a reply. */
export interface PostRecord {
  $type?: 'app.bsky.feed.post'
  text?: string
  createdAt?: string
  facets?: Facet[]
  [key: string]: unknown
}

export function isPostRecord(value: unknown): value is PostRecord {
  return hasType<PostRecord>(value, 'app.bsky.feed.post')
}

// ---------------------------------------------------------------- embeds

export interface ImagesView {
  $type: 'app.bsky.embed.images#view'
  images: {
    thumb: string
    fullsize: string
    alt: string
    aspectRatio?: { width: number; height: number }
  }[]
}

export interface VideoView {
  $type: 'app.bsky.embed.video#view'
  playlist: string
  thumbnail?: string
  alt?: string
  aspectRatio?: { width: number; height: number }
}

/** A multi-embed. Nothing renders it specially yet; it is part of the union. */
export interface GalleryView {
  $type: 'app.bsky.embed.gallery#view'
  [key: string]: unknown
}

export interface ExternalView {
  $type: 'app.bsky.embed.external#view'
  external: {
    uri: string
    title: string
    description: string
    thumb?: string
    [key: string]: unknown
  }
}

export interface RecordView {
  $type: 'app.bsky.embed.record#view'
  record: EmbeddedRecordView
}

/** `app.bsky.embed.record#viewRecord` — a post quoted inside another post. */
export interface EmbeddedRecordView {
  $type?: 'app.bsky.embed.record#viewRecord'
  uri: string
  cid: string
  author?: ProfileViewBasic
  value?: PostRecord | null
  embeds?: EmbedView[]
  notFound?: boolean
  [key: string]: unknown
}

export interface RecordWithMediaView {
  $type: 'app.bsky.embed.recordWithMedia#view'
  record: { record: RecordView }
  media: EmbedView
}

export type EmbedView =
  | ImagesView
  | VideoView
  | GalleryView
  | ExternalView
  | RecordView
  | RecordWithMediaView
  | { $type: string }

export function isImagesView(view: unknown): view is ImagesView {
  return hasType<ImagesView>(view, 'app.bsky.embed.images#view')
}

export function isVideoView(view: unknown): view is VideoView {
  return hasType<VideoView>(view, 'app.bsky.embed.video#view')
}

export function isExternalView(view: unknown): view is ExternalView {
  return hasType<ExternalView>(view, 'app.bsky.embed.external#view')
}

export function isRecordView(view: unknown): view is RecordView {
  return hasType<RecordView>(view, 'app.bsky.embed.record#view')
}

export function isRecordWithMediaView(view: unknown): view is RecordWithMediaView {
  return hasType<RecordWithMediaView>(view, 'app.bsky.embed.recordWithMedia#view')
}

// ---------------------------------------------------------------- feed

export interface PostView {
  $type?: 'app.bsky.feed.defs#postView'
  uri: string
  cid: string
  author: ProfileViewBasic
  record: Record<string, unknown>
  embed?: EmbedView
  replyCount?: number
  repostCount?: number
  likeCount?: number
  quoteCount?: number
  indexedAt?: string
  [key: string]: unknown
}

export interface ThreadViewPost {
  $type?: 'app.bsky.feed.defs#threadViewPost'
  post: PostView
  parent?: unknown
  replies?: unknown[]
}

export function isThreadViewPost(value: unknown): value is ThreadViewPost {
  return hasType<ThreadViewPost>(value, 'app.bsky.feed.defs#threadViewPost')
}

/** The `getPostThread` response, narrowed to the part the comment section reads. */
export interface PostThreadResponse {
  thread?: unknown
}
