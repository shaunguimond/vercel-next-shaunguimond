// Data shapes returned by the WPGraphQL API. These mirror the fields of
// the GraphQL queries in lib/api.ts, not the full WPGraphQL schema.

export interface AuthorNode {
  name: string
  firstName?: string | null
  lastName?: string | null
  avatar?: { url?: string | null } | null
}

export interface AuthorEdge {
  node?: AuthorNode | null
}

export interface TermNode {
  name: string
}

export interface TermEdge {
  node: TermNode
}

export interface FeaturedImage {
  node?: { sourceUrl?: string | null } | null
}

export interface PostNode {
  title: string
  excerpt: string
  slug: string
  date: string
  featuredImage?: FeaturedImage | null
  author?: AuthorEdge | null
  categories?: { edges: TermEdge[] } | null
  tags?: { edges: TermEdge[] } | null
  content?: string | null
  databaseId?: number
  extraPostInfo?: { blueskyPostUrl?: string | null } | null
}

export interface PostEdge {
  node: PostNode
}

export interface PostConnection {
  edges: PostEdge[]
}

export interface PostPageInfo {
  endCursor: string | null
  hasNextPage: boolean
}

export interface PaginatedPostConnection extends PostConnection {
  pageInfo: PostPageInfo
}

export interface CategoryWithPosts {
  name: string
  slug: string
  databaseId: number
  posts: PaginatedPostConnection
}

// Shape of the preview cookie set by pages/api/preview.ts.
export interface PreviewPost {
  id: number
  slug?: string | null
  status?: string | null
}
