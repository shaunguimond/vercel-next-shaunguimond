import { describe, expect, it } from 'vitest'
import {
  isExternalView,
  isImagesView,
  isLinkFacet,
  isPostRecord,
  isRecordView,
  isRecordWithMediaView,
  isThreadViewPost,
  isVideoView,
} from './bluesky-view'

// These guards replace the ones @atproto/api generates, so they have to agree
// with the wire format: an object is a view when its `$type` says so.
describe('AT Protocol view guards', () => {
  it('recognises each embed view by its $type', () => {
    expect(isImagesView({ $type: 'app.bsky.embed.images#view', images: [] })).toBe(true)
    expect(isVideoView({ $type: 'app.bsky.embed.video#view', playlist: 'https://cdn/playlist.m3u8' })).toBe(true)
    expect(isExternalView({ $type: 'app.bsky.embed.external#view', external: { uri: 'https://example.com', title: '', description: '' } })).toBe(true)
    expect(isRecordView({ $type: 'app.bsky.embed.record#view', record: { uri: 'at://x', cid: 'cid' } })).toBe(true)
    expect(isRecordWithMediaView({ $type: 'app.bsky.embed.recordWithMedia#view' })).toBe(true)
  })

  it('rejects objects that are not the view being asked about', () => {
    expect(isImagesView({ $type: 'app.bsky.embed.external#view' })).toBe(false)
    expect(isVideoView(undefined)).toBe(false)
    expect(isRecordView(null)).toBe(false)
    expect(isRecordWithMediaView({})).toBe(false)
  })

  it('tells posts and threads apart from the other things in a thread', () => {
    expect(isPostRecord({ $type: 'app.bsky.feed.post', text: 'hello' })).toBe(true)
    expect(isPostRecord({ $type: 'app.bsky.feed.repost' })).toBe(false)
    expect(isThreadViewPost({ $type: 'app.bsky.feed.defs#threadViewPost', post: {} })).toBe(true)
    // A reply can be a blocked or deleted post: those are not threads to render.
    expect(isThreadViewPost({ $type: 'app.bsky.feed.defs#blockedPost', uri: 'at://x' })).toBe(false)
  })

  it('finds link facets among the other facet features', () => {
    expect(isLinkFacet({ $type: 'app.bsky.richtext.facet#link', uri: 'https://example.com' })).toBe(true)
    expect(isLinkFacet({ $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:x' })).toBe(false)
  })
})
