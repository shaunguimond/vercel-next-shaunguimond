import { useCallback, useEffect, useRef, useState } from 'react'
import PostPreview from './post-preview'
import type { PaginatedPostConnection, PostEdge } from '../lib/types'

export default function SearchPostList({
  initialResults,
  search,
}: {
  initialResults: PaginatedPostConnection
  search: string
}) {
  const [posts, setPosts] = useState(initialResults.edges)
  const [pageInfo, setPageInfo] = useState(initialResults.pageInfo)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [observerAvailable, setObserverAvailable] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef(initialResults.pageInfo.endCursor)
  const loadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (!pageInfo.hasNextPage || loadingRef.current) return

    const after = cursorRef.current
    if (!after) {
      setError('More results could not be loaded. Please try again later.')
      setPageInfo((current) => ({ ...current, hasNextPage: false }))
      return
    }

    loadingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const query = new URLSearchParams({ q: search, after })
      const response = await fetch(`/api/search?${query}`)
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`)

      const nextPage = (await response.json()) as PaginatedPostConnection
      if (
        !Array.isArray(nextPage.edges) ||
        typeof nextPage.pageInfo?.hasNextPage !== 'boolean' ||
        (nextPage.pageInfo.hasNextPage &&
          (!nextPage.pageInfo.endCursor || nextPage.pageInfo.endCursor === after))
      ) {
        throw new Error('The search response did not include a valid next page')
      }

      setPosts((current) => {
        const existingSlugs = new Set(current.map(({ node }) => node.slug))
        const newPosts = nextPage.edges.filter(({ node }) => !existingSlugs.has(node.slug))
        return [...current, ...newPosts]
      })
      cursorRef.current = nextPage.pageInfo.endCursor
      setPageInfo(nextPage.pageInfo)
    } catch {
      setError('More results could not be loaded. Please try again.')
    } finally {
      loadingRef.current = false
      setIsLoading(false)
    }
  }, [pageInfo.hasNextPage, search])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !pageInfo.hasNextPage || error) return

    if (!('IntersectionObserver' in window)) {
      setObserverAvailable(false)
      return
    }

    setObserverAvailable(true)
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore()
      },
      { rootMargin: '700px 0px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [error, loadMore, pageInfo.hasNextPage])

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-32 gap-y-20 md:gap-y-32 mb-20">
        {posts.map(({ node }: PostEdge) => (
          <PostPreview
            key={node.slug}
            title={node.title}
            coverImage={node.featuredImage}
            date={node.date}
            author={node.author}
            slug={node.slug}
            excerpt={node.excerpt}
          />
        ))}
      </div>

      {pageInfo.hasNextPage && (
        <div className="mb-12 text-center">
          {error && <p role="alert">{error}</p>}
          {isLoading && (
            <p role="status" aria-live="polite">
              Loading more results…
            </p>
          )}
          {(!observerAvailable || error) && (
            <button
              type="button"
              className="mt-4 rounded-lg border px-5 py-3 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
              onClick={() => void loadMore()}
              disabled={isLoading}
            >
              {isLoading ? 'Loading…' : error ? 'Retry loading results' : 'Load more results'}
            </button>
          )}
          <div ref={sentinelRef} aria-hidden="true" className="h-1" />
        </div>
      )}
    </>
  )
}
