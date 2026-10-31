import { useCallback, useEffect, useRef, useState } from 'react'
import PostPreview from './post-preview'
import CategoryFilterSelect from './category-filter-select'
import type { CategoryWithPosts, PaginatedPostConnection, PostEdge } from '../lib/types'

export default function CategoryPostList({ category }: { category: CategoryWithPosts }) {
  const [posts, setPosts] = useState(category.posts.edges)
  const [pageInfo, setPageInfo] = useState(category.posts.pageInfo)
  const [selectedTag, setSelectedTag] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterError, setFilterError] = useState(false)
  const [filterRetry, setFilterRetry] = useState(0)
  const [observerAvailable, setObserverAvailable] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef(category.posts.pageInfo.endCursor)
  const loadingRef = useRef(false)
  const initialFiltersRef = useRef(true)
  const filterRequestRef = useRef(0)

  const loadMore = useCallback(async () => {
    if (!pageInfo.hasNextPage || loadingRef.current || isFiltering) return

    const after = cursorRef.current
    if (!after) {
      setError('More posts could not be loaded. Please try again later.')
      setPageInfo((current) => ({ ...current, hasNextPage: false }))
      return
    }

    loadingRef.current = true
    setIsLoading(true)
    setError(null)
    const requestId = filterRequestRef.current

    try {
      const query = new URLSearchParams({ after })
      if (selectedTag) query.set('tag', selectedTag)
      if (selectedYear) query.set('year', selectedYear)
      const response = await fetch(
        `/api/categories/${encodeURIComponent(category.slug)}/posts?${query}`,
      )

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const nextPage = (await response.json()) as PaginatedPostConnection
      if (
        !Array.isArray(nextPage.edges) ||
        typeof nextPage.pageInfo?.hasNextPage !== 'boolean' ||
        (nextPage.pageInfo.hasNextPage &&
          (!nextPage.pageInfo.endCursor || nextPage.pageInfo.endCursor === after))
      ) {
        throw new Error('The post response did not include a valid next page')
      }

      if (requestId !== filterRequestRef.current) return

      setPosts((current) => {
        const existingSlugs = new Set(current.map(({ node }) => node.slug))
        const newPosts = nextPage.edges.filter(({ node }) => !existingSlugs.has(node.slug))
        return [...current, ...newPosts]
      })
      cursorRef.current = nextPage.pageInfo.endCursor
      setPageInfo(nextPage.pageInfo)
    } catch {
      if (requestId === filterRequestRef.current) {
        setError('More posts could not be loaded. Please try again.')
      }
    } finally {
      if (requestId === filterRequestRef.current) {
        loadingRef.current = false
        setIsLoading(false)
      }
    }
  }, [category.slug, isFiltering, pageInfo.hasNextPage, selectedTag, selectedYear])

  useEffect(() => {
    if (initialFiltersRef.current) {
      initialFiltersRef.current = false
      return
    }

    const requestId = ++filterRequestRef.current
    const controller = new AbortController()
    const loadFilteredPosts = async () => {
      loadingRef.current = true
      setIsFiltering(true)
      setFilterError(false)
      setError(null)
      setPosts([])
      setPageInfo({ endCursor: null, hasNextPage: false })
      cursorRef.current = null

      try {
        const query = new URLSearchParams()
        if (selectedTag) query.set('tag', selectedTag)
        if (selectedYear) query.set('year', selectedYear)
        const response = await fetch(
          `/api/categories/${encodeURIComponent(category.slug)}/posts?${query}`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`)

        const firstPage = (await response.json()) as PaginatedPostConnection
        if (
          !Array.isArray(firstPage.edges) ||
          typeof firstPage.pageInfo?.hasNextPage !== 'boolean' ||
          (firstPage.pageInfo.hasNextPage &&
            (!firstPage.pageInfo.endCursor || firstPage.pageInfo.endCursor === cursorRef.current))
        ) {
          throw new Error('The post response did not include a valid first page')
        }

        if (requestId === filterRequestRef.current) {
          setPosts(firstPage.edges)
          cursorRef.current = firstPage.pageInfo.endCursor
          setPageInfo(firstPage.pageInfo)
        }
      } catch {
        if (!controller.signal.aborted && requestId === filterRequestRef.current) {
          setFilterError(true)
          setError('Filtered posts could not be loaded. Please try again.')
        }
      } finally {
        if (requestId === filterRequestRef.current) {
          loadingRef.current = false
          setIsFiltering(false)
        }
      }
    }

    void loadFilteredPosts()
    return () => controller.abort()
  }, [category.slug, filterRetry, selectedTag, selectedYear])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !pageInfo.hasNextPage || error || isFiltering) return

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
  }, [error, isFiltering, loadMore, pageInfo.hasNextPage])

  return (
    <>
      <fieldset className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <legend className="sr-only">Filter posts</legend>
        <div className="min-w-0">
          <CategoryFilterSelect
            label="Filter by tag"
            value={selectedTag}
            onChange={(value) => {
              filterRequestRef.current += 1
              setSelectedTag(value)
            }}
            options={[
              { label: 'All tags', value: '' },
              ...category.filterOptions.tags.map((tag) => ({ label: tag.name, value: tag.slug })),
            ]}
          />
        </div>
        <div className="min-w-0">
          <CategoryFilterSelect
            label="Filter by year"
            value={selectedYear}
            onChange={(value) => {
              filterRequestRef.current += 1
              setSelectedYear(value)
            }}
            options={[
              { label: 'All years', value: '' },
              ...category.filterOptions.years.map((year) => ({ label: String(year), value: String(year) })),
            ]}
          />
        </div>
      </fieldset>

      {isFiltering && (
        <p role="status" aria-live="polite" className="mb-8 text-center">
          Updating posts…
        </p>
      )}
      {filterError && (
        <div className="mb-8 text-center">
          <p role="alert">{error}</p>
          <button
            type="button"
            className="mt-3 rounded-lg border px-5 py-3 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setFilterRetry((current) => current + 1)}
          >
            Retry filters
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-16 lg:gap-x-32 gap-y-20 md:gap-y-32 mb-32">
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

      {!isFiltering && !filterError && posts.length === 0 && (
        <p className="mb-12 text-center">No posts match these filters.</p>
      )}

      {!filterError && pageInfo.hasNextPage && (
        <div className="mb-12 text-center">
          {error && <p role="alert">{error}</p>}
          {isLoading && (
            <p role="status" aria-live="polite">
              Loading more posts…
            </p>
          )}
          {(!observerAvailable || error) && (
            <button
              type="button"
              className="mt-4 rounded-lg border px-5 py-3 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
              onClick={() => void loadMore()}
              disabled={isLoading}
            >
              {isLoading ? 'Loading…' : error ? 'Retry loading posts' : 'Load more posts'}
            </button>
          )}
          <div ref={sentinelRef} aria-hidden="true" className="h-1" />
        </div>
      )}
      {error && !pageInfo.hasNextPage && <p role="alert">{error}</p>}
    </>
  )
}
