const API_URL = process.env.WORDPRESS_API_URL

async function fetchAPI(query = '', { variables }: Record<string, any> = {}) {
  const headers = { 'Content-Type': 'application/json' }

  if (process.env.WORDPRESS_AUTH_REFRESH_TOKEN) {
    headers[
      'Authorization'
    ] = `Bearer ${process.env.WORDPRESS_AUTH_REFRESH_TOKEN}`
  }

  // WPGraphQL Plugin must be enabled
  const res = await fetch(API_URL, {
    headers,
    method: 'POST',
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  const json = await res.json()
  if (json.errors) {
    console.error(json.errors)
    throw new Error('Failed to fetch API')
  }
  return json.data
}

export async function getPreviewPost(id, idType = 'DATABASE_ID') {
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
    }
  )
  return data.post
}

export async function getAllPostsWithSlug() {
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

export async function getAllPostsForHome(preview) {
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
    {
      variables: {
        onlyEnabled: !preview,
        preview,
      },
    }
  )

  return data?.posts
}

export async function getPostAndMorePosts(slug, preview, previewData) {
  const postPreview = preview && previewData?.post
  // The slug may be the id of an unpublished post
  const isId = Number.isInteger(Number(slug))
  const isSamePost = isId
    ? Number(slug) === postPreview.id
    : slug === postPreview.slug
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
    }
  )

  // Draft posts may not have an slug
  if (isDraft) data.post.slug = postPreview.id
  // Apply a revision (changes in a published post)
  if (isRevision && data.post.revisions) {
    const revision = data.post.revisions.edges[0]?.node

    if (revision) Object.assign(data.post, revision)
    delete data.post.revisions
  }

  // Filter out the main post
  data.posts.edges = data.posts.edges.filter(({ node }) => node.slug !== slug)
  // If there are still 3 posts, remove the last one
  if (data.posts.edges.length > 2) data.posts.edges.pop()

  return data
}

/*
export async function getAllPostsByCategory(preview) {
  const data = await fetchAPI(
    `
    query PostByCategory($id: ID = "") {
      category(id: $id, idType: NAME) {
        posts(first: 20) {
          edges {
            node {
              date
              slug
              title
              featuredImageId
              excerpt
              featuredImage {
                node
              }
            }
          }
        }
      }
    }
  `,
    {
      variables: {
        onlyEnabled: !preview,
        preview,
      },
    }
  )

  return data?.postsbycategory
}
*/

export async function getPreviewPage(id, idType = 'DATABASE_ID') {
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
    }
  )
  return data.page
}

export async function getAllPagesWithUri() {
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


export async function getPageAndMorePages(uri, preview, previewData) {
  const pagePreview = preview && previewData?.page
  // The slug may be the id of an unpublished page
  const isIdPage = Number.isInteger(Number(uri))
  const isSamePage = isIdPage
    ? Number(uri) === pagePreview.id
    : uri === pagePreview.uri
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
      pages(first: 3, where: { orderby: { field: DATE, order: DESC } }) {
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
    }
  )

  // Draft pages may not have an slug
  if (isDraftPage) datapage.page.uri = pagePreview.id
  // Apply a revision (changes in a published page)
  if (isRevisionPage && datapage.page.revisions) {
    const revisionpage = datapage.page.revisions.edges[0]?.node

    if (revisionpage) Object.assign(datapage.page, revisionpage)
    delete datapage.page.revisions
  }

  // Filter out the main page
  datapage.pages.edges = datapage.pages.edges.filter(({ node }) => node.uri !== uri)
  // If there are still 3 pages, remove the last one
  if (datapage.pages.edges.length > 2) datapage.pages.edges.pop()

  return datapage
}
