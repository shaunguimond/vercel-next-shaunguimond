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
