import type {
  CategoryWithPosts,
  PaginatedPostConnection,
  PostConnection,
  PostNode,
  PreviewPost,
} from './types'

// Validated at build/startup by next.config.js (which throws if it is
// missing or not a valid URL).
const API_URL = process.env.WORDPRESS_API_URL as string

// Timeout so a slow/hung WPGraphQL API can't stall page regeneration
// (each stalled fetch pins a serverless function instance).
const API_TIMEOUT_MS = 15_000

interface GraphQLError {
  message?: string
}

interface GraphQLResponse<TData> {
  data?: TData
  errors?: GraphQLError[]
}

interface FetchApiOptions {
  variables?: Record<string, unknown>
  useAuth?: boolean
}

// Function to fetch data from WPGraphQL API
async function fetchAPI<TData>(
  query = '',
  { variables, useAuth = false }: FetchApiOptions = {}
): Promise<TData> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  // The auth header is only sent for preview/draft fetches. Build-time
  // fetches of published content must not depend on the JWT: an expired
  // token makes WPGraphQL fail every query with a generic
  // "Internal server error", which fails the whole build.
  if (useAuth && process.env.WORDPRESS_AUTH_REFRESH_TOKEN) {
    headers[
      'Authorization'
    ] = `Bearer ${process.env.WORDPRESS_AUTH_REFRESH_TOKEN}`
  }

  // WPGraphQL Plugin must be enabled
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(API_URL, {
      headers,
      method: 'POST',
      body: JSON.stringify({
        query,
        variables,
      }),
      signal: controller.signal,
    })
  } catch (err) {
    // Re-throw with context; callers already treat failures as "data
    // unavailable" (preview returns null, ISR serves the stale copy).
    throw new Error(
      `Failed to fetch from ${API_URL}: ${
        err instanceof Error ? err.message : String(err)
      }`
    )
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    throw new Error(`WordPress GraphQL request failed with HTTP ${res.status}`)
  }

  let json: GraphQLResponse<TData>
  try {
    json = await res.json()
  } catch {
    throw new Error('WordPress GraphQL returned invalid JSON')
  }

  if (json.errors?.length) {
    console.error('WordPress GraphQL errors:', json.errors)
    const messages = json.errors
      .map((error) => error.message)
      .filter((message): message is string => Boolean(message))
    throw new Error(
      messages.length
        ? `WordPress GraphQL query failed: ${messages.join('; ')}`
        : 'WordPress GraphQL query failed'
    )
  }

  if (json.data === undefined || json.data === null) {
    throw new Error('WordPress GraphQL response did not include data')
  }

  return json.data
}

// function call to GraphQL API to get a preview post.
export async function getPreviewPost(
  id: string | number,
  idType: 'DATABASE_ID' | 'SLUG' = 'DATABASE_ID'
): Promise<
  | { databaseId: number; slug?: string | null; status?: string | null }
  | null
> {
  const data = await fetchAPI<{
    post: { databaseId: number; slug?: string | null; status?: string | null } | null
  }>(
    `
    query PreviewPost($id: ID!, $idType: PostIdType!) {
      post(id: $id, idType: $idType) {
        databaseId
        slug
        status
      }
    }`,
    {
      variables: { id, idType },
      useAuth: true,
    }
  )
  return data.post
}

// function call to GraphQL API to get all post's slug
export async function getAllPostsWithSlug(): Promise<
  { edges: { node: { slug: string } }[] }
> {
  const edges: { node: { slug: string } }[] = []
  let after: string | null = null
  let hasNextPage: boolean

  do {
    const data: {
      posts: {
        pageInfo: { endCursor: string | null; hasNextPage: boolean }
        edges: { node: { slug: string } }[]
      }
    } = await fetchAPI(`
      query AllPostSlugs($after: String) {
        posts(first: 100, after: $after) {
          pageInfo {
            endCursor
            hasNextPage
          }
          edges {
            node {
              slug
            }
          }
        }
      }
    `, { variables: { after } })

    const page = data.posts
    edges.push(...page.edges)
    hasNextPage = page.pageInfo.hasNextPage
    const nextAfter = page.pageInfo.endCursor

    if (hasNextPage && (!nextAfter || nextAfter === after)) {
      throw new Error('WordPress post pagination returned no advancing cursor')
    }
    after = nextAfter
  } while (hasNextPage)

  return { edges }
}

// function call to GraphQL API to get 20 posts for the home page. 
export async function getAllPostsForHome(preview?: boolean): Promise<PostConnection> {
  const data = await fetchAPI<{ posts: PostConnection }>(
    `
    query AllPosts {
      posts(first: 20, where: { orderby: { field: DATE, order: DESC } }) {
        edges {
          node {
            title
            excerpt
            slug
            date
            featuredImage {
              node {
                sourceUrl
              }
            }
            author {
              node {
                name
                firstName
                lastName
                avatar {
                  url
                }
              }
            }
          }
        }
      }
    }
  `,
    { useAuth: !!preview }
  )

  return data?.posts
}

// Function call to GraphQL API to get a post and get related posts (3 other posts).
export async function getPostAndMorePosts(
  slug: string | null,
  preview?: boolean,
  previewData?: { post?: PreviewPost }
): Promise<{ post: PostNode | null; posts: PostConnection }> {
  const postPreview: PreviewPost | null = preview
    ? (previewData?.post ?? null)
    : null
  // The slug may be the id of an unpublished post
  const isId = Number.isInteger(Number(slug))
  const isSamePost = isId
    ? Number(slug) === postPreview?.id
    : slug === postPreview?.slug
  const isDraft = isSamePost && postPreview?.status === 'draft'
  const isRevision = isSamePost && postPreview?.status === 'publish'
  const data = await fetchAPI<{
    post: (PostNode & {
      revisions?: { edges: { node: Partial<PostNode> }[] } | null
    }) | null
    posts: PostConnection
  }>(
    `
    fragment AuthorFields on User {
      name
      firstName
      lastName
      avatar {
        url
      }
    }
    fragment PostFields on Post {
      title
      excerpt
      slug
      date
      featuredImage {
        node {
          sourceUrl
        }
      }
      author {
        node {
          ...AuthorFields
        }
      }
      categories {
        edges {
          node {
            name
          }
        }
      }
      tags {
        edges {
          node {
            name
          }
        }
      }
    }
    query PostBySlug($id: ID!, $idType: PostIdType!) {
      post(id: $id, idType: $idType) {
        ...PostFields
        extraPostInfo {
          blueskyPostUrl
        }
        content
        ${
          // Only some of the fields of a revision are considered as there are some inconsistencies
          isRevision
            ? `
        revisions(first: 1, where: { orderby: { field: MODIFIED, order: DESC } }) {
          edges {
            node {
              title
              excerpt
              content
              author {
                node {
                  ...AuthorFields
                }
              }
            }
          }
        }
        `
            : ''
        }
      }
      posts(first: 3, where: { orderby: { field: DATE, order: DESC } }) {
        edges {
          node {
            ...PostFields
          }
        }
      }
    }
  `,
    {
      variables: {
        id: isDraft ? postPreview.id : slug,
        idType: isDraft ? 'DATABASE_ID' : 'SLUG',
      },
      useAuth: !!preview,
    }
  )

  // Draft posts may not have an slug. Store the database id in the slug
  // field so the post can be found again during preview.
  if (isDraft && data.post) {
    (data.post as { slug: string | number }).slug = postPreview?.id
  }
  // Apply a revision (changes in a published post)
  if (isRevision && data.post?.revisions) {
    const revision = data.post.revisions.edges[0]?.node

    if (revision) Object.assign(data.post, revision)
    delete data.post.revisions
  }

  // Filter out the main post
  data.posts.edges = data.posts.edges.filter(
    ({ node }: { node: { slug: string } }) => node.slug !== slug
  )
  // If there are still 3 posts, remove the last one
  if (data.posts.edges.length > 2) data.posts.edges.pop()

  return data
}


// Function call to GraphQL API to get all posts categories. 
export async function getAllCategoriesWithSlug(): Promise<
  { edges: { node: { slug: string; id: string; name: string; uri: string } }[] }
> {
  const edges: { node: { slug: string; id: string; name: string; uri: string } }[] = []
  let after: string | null = null
  let hasNextPage: boolean

  do {
    const data: {
      categories: {
        pageInfo: { endCursor: string | null; hasNextPage: boolean }
        edges: { node: { slug: string; id: string; name: string; uri: string } }[]
      }
    } = await fetchAPI(`
      query AllCategoriesWithSlug($after: String) {
        categories(first: 100, after: $after) {
          pageInfo {
            endCursor
            hasNextPage
          }
          edges {
            node {
              slug
              id
              name
              uri
            }
          }
        }
      }
    `, { variables: { after } })

    const page = data.categories
    edges.push(...page.edges)
    hasNextPage = page.pageInfo.hasNextPage
    const nextAfter = page.pageInfo.endCursor

    if (hasNextPage && (!nextAfter || nextAfter === after)) {
      throw new Error('WordPress category pagination returned no advancing cursor')
    }
    after = nextAfter
  } while (hasNextPage)

  return { edges }
}


const CATEGORY_POST_FIELDS = `
  excerpt
  slug
  uri
  title
  featuredImage {
    node {
      sourceUrl
    }
  }
  date
  author {
    node {
      name
      firstName
      lastName
      avatar {
        url
      }
    }
  }
`

const CATEGORY_POST_FIELDS_WITH_TAGS = `
  ${CATEGORY_POST_FIELDS}
  tags {
    edges {
      node {
        name
        slug
      }
    }
  }
`

const CATEGORY_POSTS_PAGE = `
  pageInfo {
    endCursor
    hasNextPage
  }
  edges {
    node {
      ${CATEGORY_POST_FIELDS}
    }
  }
`

const CATEGORY_POSTS_PAGE_WITH_TAGS = `
  pageInfo {
    endCursor
    hasNextPage
  }
  edges {
    node {
      ${CATEGORY_POST_FIELDS_WITH_TAGS}
    }
  }
`

const CATEGORY_POST_PAGE_SIZE = 20
const CATEGORY_FACET_PAGE_SIZE = 100
const SEARCH_POST_PAGE_SIZE = 20

interface CategoryFilterOptions {
  tags: { name: string; slug: string }[]
  years: number[]
}

interface CategoryFacetPost {
  date: string
  tags?: { edges: { node: { name: string; slug?: string | null } }[] } | null
}

function addCategoryFacets(posts: CategoryFacetPost[], options: CategoryFilterOptions) {
  const tags = new Map(options.tags.map((tag) => [tag.slug, tag.name]))
  const years = new Set(options.years)

  for (const post of posts) {
    const year = Number(post.date.slice(0, 4))
    if (Number.isInteger(year)) years.add(year)
    for (const { node } of post.tags?.edges ?? []) {
      if (node.slug && node.name) tags.set(node.slug, node.name)
    }
  }

  options.tags = [...tags].map(([slug, name]) => ({ name, slug }))
  options.years = [...years].sort((a, b) => b - a)
}

async function getCategoryFilterOptions(
  slug: string,
  after: string | null,
  options: CategoryFilterOptions
): Promise<void> {
  let cursor = after
  let hasNextPage = true

  while (hasNextPage) {
    const data = await fetchAPI<{
      category: {
        posts: {
          pageInfo: { endCursor: string | null; hasNextPage: boolean }
          edges: { node: CategoryFacetPost }[]
        }
      } | null
    }>(
      `
    query CategoryFilterOptions($id: ID!, $after: String) {
      category(id: $id, idType: SLUG) {
        posts(first: ${CATEGORY_FACET_PAGE_SIZE}, after: $after, where: { orderby: { field: DATE, order: DESC } }) {
          pageInfo { endCursor hasNextPage }
          edges {
            node {
              date
              tags { edges { node { name slug } } }
            }
          }
        }
      }
    }
  `,
      { variables: { id: slug, after: cursor } }
    )

    const page = data.category?.posts
    if (!page) throw new Error(`Category not found while loading filters: ${slug}`)
    addCategoryFacets(page.edges.map(({ node }) => node), options)

    const nextAfter = page.pageInfo.endCursor
    hasNextPage = page.pageInfo.hasNextPage
    if (hasNextPage && (!nextAfter || nextAfter === cursor)) {
      throw new Error(`Category filter pagination returned no advancing cursor: ${slug}`)
    }
    cursor = nextAfter
  }
}

// Search published posts using WordPress's native WPGraphQL search argument.
// The cursor is used by the same-origin search API for subsequent pages.
export async function getSearchPosts(
  search: string,
  after: string | null = null,
): Promise<PaginatedPostConnection> {
  const data = await fetchAPI<{ posts: PaginatedPostConnection }>(
    `
    query SearchPosts($search: String!, $after: String) {
      posts(
        first: ${SEARCH_POST_PAGE_SIZE}
        after: $after
        where: { search: $search, orderby: { field: DATE, order: DESC } }
      ) {
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
          node {
            title
            excerpt
            slug
            date
            featuredImage {
              node {
                sourceUrl
              }
            }
            author {
              node {
                name
                firstName
                lastName
                avatar {
                  url
                }
              }
            }
            categories {
              edges {
                node {
                  name
                }
              }
            }
          }
        }
      }
    }
  `,
    { variables: { search, after } },
  )

  return data.posts
}

// Fetch the first category page during static generation so its posts are
// available in the initial HTML. Later pages are loaded by the category API.
export async function getAllPostsByCategory(
  slug?: string
): Promise<CategoryWithPosts | null> {
  if (!slug) return null

  const data = await fetchAPI<{
    category: Omit<CategoryWithPosts, 'filterOptions'> | null
  }>(
    `
    query PostsByCategory($id: ID!, $after: String) {
      category(id: $id, idType: SLUG) {
        name
        slug
        databaseId
        posts(
          first: ${CATEGORY_POST_PAGE_SIZE}
          after: $after
          where: { orderby: { field: DATE, order: DESC } }
        ) {
          ${CATEGORY_POSTS_PAGE_WITH_TAGS}
        }
      }
    }
  `,
    { variables: { id: slug, after: null } }
  )

  if (!data.category) return null

  const filterOptions: CategoryFilterOptions = { tags: [], years: [] }
  addCategoryFacets(data.category.posts.edges.map(({ node }) => node), filterOptions)
  for (const { node } of data.category.posts.edges) delete node.tags
  if (data.category.posts.pageInfo.hasNextPage) {
    const endCursor = data.category.posts.pageInfo.endCursor
    if (!endCursor) {
      throw new Error(`Category filter pagination returned no initial cursor: ${slug}`)
    }
    await getCategoryFilterOptions(
      slug,
      endCursor,
      filterOptions
    )
  }

  return { ...data.category, filterOptions }
}

// Fetch one additional page for the same-origin category posts API.
export async function getCategoryPostsPage(
  slug: string,
  after: string | null,
  tag: string | null = null,
  year: number | null = null
): Promise<PaginatedPostConnection | null> {
  const data = await fetchAPI<{
    category: { posts: PaginatedPostConnection } | null
  }>(
    `
    query CategoryPostsPage($id: ID!, $after: String, $tag: String, $year: Int) {
      category(id: $id, idType: SLUG) {
        posts(
          first: ${CATEGORY_POST_PAGE_SIZE}
          after: $after
          where: {
            tag: $tag
            dateQuery: { year: $year }
            orderby: { field: DATE, order: DESC }
          }
        ) {
          ${CATEGORY_POSTS_PAGE}
        }
      }
    }
  `,
    { variables: { id: slug, after, tag, year } }
  )

  return data.category?.posts ?? null
}
