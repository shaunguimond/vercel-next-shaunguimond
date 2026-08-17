import type {
  CategoryWithPosts,
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

// Function to fetch data from WPGraphQL API
async function fetchAPI(
  query = '',
  { variables, useAuth = false }: Record<string, any> = {}
) {
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

  const json = await res.json()
  if (json.errors) {
    console.error(json.errors)
    throw new Error('Failed to fetch API')
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
  const data = await fetchAPI(
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
  const data = await fetchAPI(`
    {
      posts(first: 10000) {
        edges {
          node {
            slug
          }
        }
      }
    }
  `)
  return data?.posts
}

// function call to GraphQL API to get 20 posts for the home page. 
export async function getAllPostsForHome(preview?: boolean): Promise<PostConnection> {
  const data = await fetchAPI(
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
): Promise<{ post: PostNode; posts: PostConnection }> {
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
  const data = await fetchAPI(
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
  if (isDraft) (data.post as { slug: string | number }).slug = postPreview?.id
  // Apply a revision (changes in a published post)
  if (isRevision && data.post.revisions) {
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
  const data = await fetchAPI(`
  query getAllCategoriesWithSlug {
    categories(first: 10) {
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
  `)

  return data?.categories
}


// Function call to GraphQL API to get all posts based on category.
export async function getAllPostsByCategory(
  slug?: string
): Promise<CategoryWithPosts | null> {

  const data = await fetchAPI(
    `
    query PostsByCategory($id: ID!) {
      category(id: $id, idType: SLUG) {
        name
        slug
        databaseId
        posts(first: 20) {
          edges {
            node {
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
            }
          }
        }
      }
    }
  `,
    {
      variables: {
        id: slug,
      },
    }
  )

  return data?.category
}
