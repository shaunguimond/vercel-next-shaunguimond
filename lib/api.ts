import type {
  CategoryWithPosts,
  PageConnection,
  PageNode,
  PostConnection,
  PostNode,
  PreviewPage,
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

// Function call to GraphQL API to get a preview page.
export async function getPreviewPage(
  id: string | number,
  idType: 'DATABASE_ID' | 'URI' = 'DATABASE_ID'
): Promise<
  | { databaseId: number; uri?: string | null; status?: string | null }
  | null
> {
  const data = await fetchAPI(
    `
    query PreviewPage($id: ID!, $idType: PageIdType!) {
      post(id: $id, idType: $idType) {
        databaseId
        uri
        status
      }
    }`,
    {
      variables: { id, idType },
      useAuth: true,
    }
  )
  return data.page
}

// function call to GraphQL API to get all pages's uri
export async function getAllPagesWithUri(): Promise<
  { edges: { node: { uri: string } }[] }
> {
  const data = await fetchAPI(`
    {
      pages(first: 100) {
        edges {
          node {
            uri
          }
        }
      }
    }
  `)
  return data?.pages
}

// function call to GraphQL API to get a page and more pages to be displayed if desired. 
export async function getPageAndMorePages(
  uri: string | undefined,
  preview?: boolean,
  previewData?: { page?: PreviewPage }
): Promise<{ page: PageNode; pages: PageConnection }> {
  const pagePreview: PreviewPage | null = preview
    ? (previewData?.page ?? null)
    : null
  // The slug may be the id of an unpublished page
  const isIdPage = Number.isInteger(Number(uri))
  const isSamePage = isIdPage
    ? Number(uri) === pagePreview?.id
    : uri === pagePreview?.uri
  const isDraftPage = isSamePage && pagePreview?.status === 'draft'
  const isRevisionPage = isSamePage && pagePreview?.status === 'publish'
  const datapage = await fetchAPI(
    `
    fragment PageAuthorFields on User {
      name
      firstName
      lastName
      avatar {
        url
      }
    }
    fragment PageFields on Page {
      title
      uri
      date
      featuredImage {
        node {
          sourceUrl
        }
      }
      author {
        node {
          ...PageAuthorFields
        }
      }
    }
    query PageBySlug($pageid: ID!, $pageidType: PageIdType!) {
      page(id: $pageid, idType: $pageidType) {
        ...PageFields
        content
        ${
          // Only some of the fields of a revision are considered as there are some inconsistencies
          isRevisionPage
            ? `
        revisions(first: 1, where: { orderby: { field: MODIFIED, order: DESC } }) {
          edges {
            node {
              title
              content
              author {
                node {
                  ...PageAuthorFields
                }
              }
            }
          }
        }
        `
            : ''
        }
      }
      pages(first: 10, where: { orderby: { field: DATE, order: DESC } }) {
        edges {
          node {
            ...PageFields
          }
        }
      }
    }
  `,
    {
      variables: {
        pageid: isDraftPage ? pagePreview.id : uri,
        pageidType: isDraftPage ? 'DATABASE_ID' : 'URI',
      },
      useAuth: !!preview,
    }
  )

  // Draft pages may not have an slug. Store the database id in the uri
  // field so the page can be found again during preview.
  if (isDraftPage) (datapage.page as { uri: string | number }).uri = pagePreview?.id
  // Apply a revision (changes in a published page)
  if (isRevisionPage && datapage.page.revisions) {
    const revisionpage = datapage.page.revisions.edges[0]?.node

    if (revisionpage) Object.assign(datapage.page, revisionpage)
    delete datapage.page.revisions
  }

  // Filter out the main page
  datapage.pages.edges = datapage.pages.edges.filter(
    ({ node }: { node: { uri: string } }) => node.uri !== uri
  )
  // If there are still 3 pages, remove the last one
  if (datapage.pages.edges.length > 2) datapage.pages.edges.pop()

  return datapage
}
