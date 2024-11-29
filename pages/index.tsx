import Head from 'next/head'
import { GetStaticProps } from 'next'
import Container from '../components/container'
import MoreStories from '../components/more-stories'
import HeroPost from '../components/hero-post'
import Layout from '../components/layout'
import { getAllPostsForHome } from '../lib/api'
import { CMS_NAME } from '../lib/constants'
import BskySectionRecentPosts from '../components/Bluesky/bsky-section-recent-posts'

export default function Index({ allPosts: { edges }, preview }) {
  // Gets the first post from the allPosts data. The first post is the hero post.
  const heroPost = edges[0]?.node
  // Gets the rest of the posts data.
  const morePosts = edges.slice(1)

  return (
    <Layout preview={preview}>
      <Head>
        <title>{`Next.js Blog with WordPress`}</title>
      </Head>
      <Container>
        {heroPost && (
          <HeroPost
            title={heroPost.title}
            coverImage={heroPost.featuredImage}
            date={heroPost.date}
            author={heroPost.author}
            slug={heroPost.slug}
            excerpt={heroPost.excerpt}
          />
        )}
        {morePosts.length > 0 && <MoreStories posts={morePosts} />}

        <BskySectionRecentPosts />

      </Container>

    </Layout>
  )
}

// Used for Static Site Generation (SSG) to pre-render pages at build time.
export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
  const allPosts = await getAllPostsForHome(preview);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return { props: { allPosts, preview }, revalidate: 10, };
};