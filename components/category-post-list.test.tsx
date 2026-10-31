// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CategoryPostList from './category-post-list'
import type { CategoryWithPosts, PaginatedPostConnection } from '../lib/types'

vi.mock('./post-preview', () => ({
  default: ({ title }: { title: string }) => <article>{title}</article>,
}))

const observerCallbacks: IntersectionObserverCallback[] = []

class MockIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()

  constructor(private callback: IntersectionObserverCallback) {
    observerCallbacks.push(callback)
  }

  trigger() {
    this.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

function makeCategory(hasNextPage: boolean): CategoryWithPosts {
  return {
    name: 'Projects',
    slug: 'projects',
    databaseId: 1,
    posts: {
      edges: [
        {
          node: {
            title: 'First post',
            excerpt: '',
            slug: 'first-post',
            date: '2026-01-01',
          },
        },
      ],
      pageInfo: {
        endCursor: 'cursor-1',
        hasNextPage,
      },
    },
    filterOptions: {
      tags: [{ name: 'Accessibility', slug: 'accessibility' }],
      years: [2026, 2025],
    },
  }
}

function pageResponse(
  edges: PaginatedPostConnection['edges'],
  endCursor: string | null,
  hasNextPage: boolean,
) {
  return {
    ok: true,
    json: async () => ({ edges, pageInfo: { endCursor, hasNextPage } }),
  }
}

function post(title: string, slug: string): PaginatedPostConnection['edges'][number] {
  return {
    node: {
      title,
      excerpt: '',
      slug,
      date: '2026-01-02',
    },
  }
}

const fetchMock = vi.fn()

beforeEach(() => {
  observerCallbacks.length = 0
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('category post lazy loading', () => {
  it('does not fetch when the initial page has no next page', () => {
    render(<CategoryPostList category={makeCategory(false)} />)

    expect(screen.getByText('First post')).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(observerCallbacks).toHaveLength(0)
  })

  it('appends pages and stops after an empty final page', async () => {
    fetchMock
      .mockResolvedValueOnce(pageResponse([post('Second post', 'second-post')], 'cursor-2', true))
      .mockResolvedValueOnce(pageResponse([], null, false))
    render(<CategoryPostList category={makeCategory(true)} />)

    await act(async () =>
      observerCallbacks[0](
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    )
    expect(await screen.findByText('Second post')).toBeTruthy()

    await act(async () =>
      observerCallbacks[0](
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(screen.getByText('First post')).toBeTruthy()
    expect(screen.getByText('Second post')).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
  })

  it('offers a retry if loading a page fails', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 502 })
      .mockResolvedValueOnce(pageResponse([post('Second post', 'second-post')], null, false))
    render(<CategoryPostList category={makeCategory(true)} />)

    await act(async () =>
      observerCallbacks[0](
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    )
    expect(await screen.findByRole('alert')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Retry loading posts' }))
    expect(await screen.findByText('Second post')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('category archive filters', () => {
  it('shows the tag and year options supplied for the whole category', () => {
    render(<CategoryPostList category={makeCategory(false)} />)

    expect(screen.getByRole('option', { name: 'Accessibility' })).toBeTruthy()
    expect(screen.getByRole('option', { name: '2025' })).toBeTruthy()
  })

  it('restarts the fixed category feed for filter changes and keeps filters on later pages', async () => {
    fetchMock
      .mockResolvedValueOnce(pageResponse([post('Tagged posts', 'tagged-post')], 'tag-cursor', true))
      .mockResolvedValueOnce(pageResponse([post('Filtered posts', 'filtered-post')], 'filtered-cursor', true))
      .mockResolvedValueOnce(pageResponse([post('Next filtered page', 'next-filtered-post')], null, false))
    render(<CategoryPostList category={makeCategory(false)} />)

    fireEvent.change(screen.getByLabelText('Tag'), { target: { value: 'accessibility' } })
    expect(await screen.findByText('Tagged posts')).toBeTruthy()
    expect(screen.queryByText('First post')).toBeNull()

    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2025' } })
    expect(await screen.findByText('Filtered posts')).toBeTruthy()
    expect(screen.queryByText('Tagged posts')).toBeNull()

    await waitFor(() => expect(observerCallbacks.length).toBeGreaterThan(0))
    await act(async () =>
      observerCallbacks[observerCallbacks.length - 1](
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    )
    expect(await screen.findByText('Next filtered page')).toBeTruthy()

    const urls = fetchMock.mock.calls.map(([url]) => new URL(String(url), 'https://example.test'))
    expect(urls[0].pathname).toBe('/api/categories/projects/posts')
    expect(urls[0].searchParams.get('tag')).toBe('accessibility')
    expect(urls[0].searchParams.has('year')).toBe(false)
    expect(urls[1].pathname).toBe('/api/categories/projects/posts')
    expect(urls[1].searchParams.get('tag')).toBe('accessibility')
    expect(urls[1].searchParams.get('year')).toBe('2025')
    expect(urls[2].pathname).toBe('/api/categories/projects/posts')
    expect(urls[2].searchParams.get('after')).toBe('filtered-cursor')
    expect(urls[2].searchParams.get('tag')).toBe('accessibility')
    expect(urls[2].searchParams.get('year')).toBe('2025')
  })

  it('shows an empty state when no posts match selected filters', async () => {
    fetchMock.mockResolvedValueOnce(pageResponse([], null, false))
    render(<CategoryPostList category={makeCategory(false)} />)

    fireEvent.change(screen.getByLabelText('Tag'), { target: { value: 'accessibility' } })

    expect(await screen.findByText('No posts match these filters.')).toBeTruthy()
    expect(screen.queryByText('First post')).toBeNull()
  })

  it('ignores a previous lazy-load response after a filter changes', async () => {
    let resolvePreviousPage: ((response: ReturnType<typeof pageResponse>) => void) | undefined
    fetchMock
      .mockImplementationOnce(
        () => new Promise((resolve) => { resolvePreviousPage = resolve }),
      )
      .mockResolvedValueOnce(pageResponse([post('Filtered post', 'filtered-post')], null, false))
    render(<CategoryPostList category={makeCategory(true)} />)

    await act(async () =>
      observerCallbacks[0](
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    )
    fireEvent.change(screen.getByLabelText('Tag'), { target: { value: 'accessibility' } })
    expect(await screen.findByText('Filtered post')).toBeTruthy()

    await act(async () => {
      resolvePreviousPage?.(pageResponse([post('Stale post', 'stale-post')], 'old-cursor', true))
    })

    expect(screen.queryByText('Stale post')).toBeNull()
    expect(screen.getByText('Filtered post')).toBeTruthy()
  })
})
