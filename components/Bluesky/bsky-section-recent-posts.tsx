'use client'

import { AppBskyFeedDefs, AppBskyFeedGetAuthorFeed } from '@atproto/api'
import { useEffect, useState } from 'react'
import { BSKY_AUTHOR_FEED } from '../../lib/constants'
import BskyPostCard from './bsky-post-card'
import { useTheme } from 'next-themes'

export default function BskySectionRecentPosts() {
  const [feedData, setFeedData] = useState<AppBskyFeedDefs.FeedViewPost[]>([])
  const [feedError, setFeedError] = useState(false)
  const { systemTheme, theme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme
  const fillColor = currentTheme === 'dark' ? 'white' : 'black'

  useEffect(() => {
    const controller = new AbortController()
    getAuthorFeed(controller.signal)
      .then((data) => setFeedData(data.feed))
      .catch(() => setFeedError(true))

    return () => controller.abort()
  }, [])

  return (
    <section className="mx-1">
      <h2 className="font-bold text-3xl my-8 text-center">Posts from Bluesky</h2>
      <div className="columns-1 sm:columns-2 gap-6 mb-32">
        {feedError && (
          <p className="text-center text-gray-500">
            Could not load posts from Bluesky.
          </p>
        )}
        {feedData.map((item) => (
          <BskyPostCard
            key={item.post.uri}
            post={item.post}
            reposted={
              item.reason?.$type === 'app.bsky.feed.defs#reasonRepost'
            }
            fillColor={fillColor}
          />
        ))}
      </div>
    </section>
  )
}

async function getAuthorFeed(signal: AbortSignal) {
  const response = await fetch(BSKY_AUTHOR_FEED, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal,
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch Bluesky author feed (HTTP ${response.status})`)
  }

  return (await response.json()) as AppBskyFeedGetAuthorFeed.OutputSchema
}
