// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommentSection } from './bsky-comments'

const postUri = 'at://did:plc:example/app.bsky.feed.post/post-key'
const fetchMock = vi.fn()

const threadPost = (uri: string, text: string, likeCount = 0) => ({
  $type: 'app.bsky.feed.defs#postView',
  uri,
  cid: 'cid',
  indexedAt: '2026-02-01T00:00:00.000Z',
  author: { did: 'did:plc:reply', handle: 'reply.bsky.social', displayName: 'Reply Author' },
  record: { $type: 'app.bsky.feed.post', text, createdAt: '2026-02-01T00:00:00.000Z' },
  likeCount,
})

const threadViewPost = (uri: string, text: string, likeCount = 0, replies: unknown[] = []) => ({
  $type: 'app.bsky.feed.defs#threadViewPost',
  post: threadPost(uri, text, likeCount),
  replies,
})

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Bluesky comment entry point', () => {
  it('offers a reply link when the linked post has no replies yet', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        thread: {
          $type: 'app.bsky.feed.defs#threadViewPost',
          post: { uri: postUri, likeCount: 0, repostCount: 0, replyCount: 0 },
          replies: [],
        },
      }),
    })

    render(<CommentSection uri={postUri} />)

    const replyLink = screen.getByRole('link', { name: 'Join the conversation on Bluesky' })
    expect(replyLink.getAttribute('href')).toBe(
      'https://bsky.app/profile/did:plc:example/post/post-key',
    )
    expect(await screen.findByText('No replies yet. Start the conversation on Bluesky.')).toBeTruthy()
  })

  it('shows the replies the API returns, highest like count first', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        thread: {
          $type: 'app.bsky.feed.defs#threadViewPost',
          post: threadPost(postUri, 'the article'),
          replies: [
            threadViewPost('at://did:plc:reply/app.bsky.feed.post/few', 'two likes', 2),
            // A reply can be a blocked or deleted post instead of a thread.
            { $type: 'app.bsky.feed.defs#blockedPost', uri: 'at://did:plc:blocked/app.bsky.feed.post/hidden' },
            threadViewPost('at://did:plc:reply/app.bsky.feed.post/many', 'five likes', 5),
          ],
        },
      }),
    })

    render(<CommentSection uri={postUri} />)

    // Blocked posts are skipped, and what is left is ordered by like count.
    expect(await screen.findAllByText('Reply Author')).toHaveLength(2)
    expect(screen.getAllByText(/^(five|two) likes$/).map((node) => node.textContent)).toEqual([
      'five likes',
      'two likes',
    ])
  })

  it('keeps the reply link available if loading the conversation fails', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, text: async () => 'Unavailable' })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<CommentSection uri={postUri} />)

    expect(screen.getByRole('link', { name: 'Join the conversation on Bluesky' })).toBeTruthy()
    expect(await screen.findByRole('alert')).toBeTruthy()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
  })

  it('does not show a comment entry point when the article has no linked Bluesky post', () => {
    render(<CommentSection />)

    expect(screen.queryByRole('link', { name: 'Join the conversation on Bluesky' })).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
