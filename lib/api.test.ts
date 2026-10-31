import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('category archive filter options', () => {
  it('collects unique tags and years across every category cursor page', async () => {
    vi.stubEnv('WORDPRESS_API_URL', 'https://wordpress.example/graphql')
    const fetchMock = vi.fn()
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              category: {
                name: 'Projects',
                slug: 'projects',
                databaseId: 10,
                posts: {
                  pageInfo: { endCursor: 'cursor-20', hasNextPage: true },
                  edges: [
                    {
                      node: {
                        title: 'First post',
                        excerpt: '',
                        slug: 'first-post',
                        date: '2026-03-02',
                        tags: {
                          edges: [
                            { node: { name: 'Accessibility', slug: 'accessibility' } },
                            { node: { name: 'Web', slug: 'web' } },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              category: {
                posts: {
                  pageInfo: { endCursor: 'cursor-last', hasNextPage: false },
                  edges: [
                    {
                      node: {
                        date: '2024-08-10',
                        tags: {
                          edges: [
                            { node: { name: 'Web', slug: 'web' } },
                            { node: { name: 'WordPress', slug: 'wordpress' } },
                          ],
                        },
                      },
                    },
                  ],
                },
              },
            },
          }),
          { status: 200 },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()

    const { getAllPostsByCategory } = await import('./api')
    const category = await getAllPostsByCategory('projects')

    expect(category?.filterOptions).toEqual({
      tags: [
        { name: 'Accessibility', slug: 'accessibility' },
        { name: 'Web', slug: 'web' },
        { name: 'WordPress', slug: 'wordpress' },
      ],
      years: [2026, 2024],
    })
    expect(category?.posts.edges[0].node.tags).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const laterPageVariables = JSON.parse(fetchMock.mock.calls[1][1].body).variables
    expect(laterPageVariables).toEqual({ id: 'projects', after: 'cursor-20' })
  })
})
