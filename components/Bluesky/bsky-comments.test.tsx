// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommentSection } from './bsky-comments'

vi.mock('@atproto/api', () => ({
  AppBskyFeedDefs: { isThreadViewPost: () => true },
  AppBskyFeedPost: { isRecord: () => true },
}))

const postUri = 'at://did:plc:example/app.bsky.feed.post/post-key'
const fetchMock = vi.fn()

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
