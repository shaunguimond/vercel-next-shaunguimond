import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import Head from 'next/head'
import { GetStaticPaths, GetStaticProps } from 'next'
import PostBody from '../../components/post-body'
import MoreStories from '../../components/more-stories'
import PostHeader from '../../components/post-header'
import SectionSeparator from '../../components/section-separator'
import Layout from '../../components/layout'
import PostTitle from '../../components/post-title'
import Tags from '../../components/tags'
import { getAllPostsWithSlug, getPostAndMorePosts } from '../../lib/api'
import { getStandardDocumentUri } from '../../lib/pds'
import { CommentSection } from '../../components/Bluesky/bsky-comments'

// Used to generate `/posts/[slug]` posts from the Wordpress backend.
export default function Post({ post, posts, preview, standardDocumentUri }) {
  const router = useRouter()
  const morePosts = posts?.edges ?? []
  // A post may not have tags or a linked Bluesky post.
  const tags = post?.tags?.edges ?? []
  const blueskyPostUrl = post?.extraPostInfo?.blueskyPostUrl ?? null

  if (!router.isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />
  }

  return (
    <Layout preview={preview}>
      {router.isFallback ? (
        <PostTitle>Loading…</PostTitle>
      ) : (
        <>
          <article className="mx-auto max-w-3xl px-5">
            <Head>
              <title>
                {`${post.title} | Next.js Blog with WordPress`}
              </title>
              <meta
                property="og:image"
                content={post.featuredImage?.node.sourceUrl}
              />
              {standardDocumentUri && (
                <>
                  <link rel="alternate" href={standardDocumentUri} />
                  <link
                    rel="site.standard.document"
                    href={standardDocumentUri}
                  />
                </>
              )}
            </Head>
            <PostHeader
              title={post.title}
              date={post.date}
              author={post.author}
              categories={post.categories}
            />
            <PostBody content={post.content} />
            <footer className="mx-3">
              {tags.length > 0 && <Tags tags={{ edges: tags }} />}
            </footer>
          </article>

          <SectionSeparator />
          {morePosts.length > 0 && <MoreStories posts={morePosts} />}

          <SectionSeparator />

          <CommentSection uri={blueskyPostUrl} />
        </>
      )}
    </Layout>
  )
}

// Used for Static Site Generation (SSG) to pre-render pages at build time.
export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const postSlug = typeof params?.slug === 'string' ? params.slug : null
  const data = await getPostAndMorePosts(postSlug, preview, previewData)
  const standardDocumentUri = postSlug
    ? await getStandardDocumentUri(postSlug)
    : null

  return {
    props: {
      preview,
      post: data.post,
      posts: data.posts,
      standardDocumentUri,
    },
    //  For Incremental Static Regeneration (ISR), set the revalidate option to 10 seconds.
    revalidate: 10,
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allPosts = await getAllPostsWithSlug()

  return {
    paths: allPosts.edges.map(({ node }) => `/posts/${node.slug}`) || [],
    fallback: true,
  }
}
