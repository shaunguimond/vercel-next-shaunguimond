import { GetStaticProps } from 'next'
import Head from 'next/head'
import AtmosphereSection from '../components/atmosphere-section'
import Container from '../components/container'
import HeroPost from '../components/hero-post'
import Layout from '../components/layout'
import MoreStories from '../components/more-stories'
import { getAllPostsForHome } from '../lib/api'
import {
  type AtmosphereActivity,
  getPdsActivities,
  getRecentBlueskyActivities,
  mergeAtmosphereActivities,
} from '../lib/atmosphere-feed'
import { HOME_OG_IMAGE_URL } from '../lib/constants'
import type { PostEdge } from '../lib/types'

export default function Index({
  allPosts: { edges },
  activities,
  preview,
}: {
  allPosts: { edges: PostEdge[] }
  activities: AtmosphereActivity[]
  preview?: boolean
}) {
  // Gets the first post from the allPosts data. The first post is the hero post.
  const heroPost = edges[0]?.node
  // Gets the rest of the posts data.
  const morePosts = edges.slice(1)

  return (
    <Layout preview={preview}>
      <Head>
        <title>Shaun Guimond</title>
        <meta property="og:image" content={HOME_OG_IMAGE_URL} />
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

        <AtmosphereSection activities={activities} />
      </Container>
    </Layout>
  )
}

// Used for Static Site Generation (SSG) to pre-render pages at build time.
export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
  const [allPosts, blueskyActivities, pdsActivities] = await Promise.all([
    getAllPostsForHome(preview),
    getRecentBlueskyActivities(),
    getPdsActivities(),
  ])
  const activities = mergeAtmosphereActivities(blueskyActivities, pdsActivities)

  return {
    props: { allPosts, activities, preview },
    revalidate: 60,
  }
}
