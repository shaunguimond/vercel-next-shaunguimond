
import { GetStaticPaths, GetStaticProps } from 'next'
import Layout from '../../components/layout'
import { getAllPostsByCategory, getAllCategoriesWithSlug } from '../../lib/api'
import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import PostPreview from '../../components/post-preview'
import Container from '../../components/container'



export default function PostsByCategory({ posts, preview }) {
    const router = useRouter()

    if (!router.isFallback && !posts?.slug) {
        return <ErrorPage statusCode={404} />
      }

    return(
        <Layout preview={preview}>
      <Container>
        <div>
            <h1 className="text-6xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight md:leading-none mb-12 text-center">
                {posts.name}
                
            </h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-16 lg:gap-x-32 gap-y-20 md:gap-y-32 mb-32">
        {posts.posts.edges.map(({ node }) => (
        <PostPreview
          key={node.databaseId}
          title={node.title}
          coverImage={node.featuredImage}
          date={node.date}
          author={node.author}
          slug={node.slug}
          excerpt={node.excerpt}
        />
      ))}
      </div>
      </Container>
    </Layout>
    )
}

export const getStaticProps: GetStaticProps = async ({ params, preview = false }) => {
    const data = await getAllPostsByCategory(params?.slug);

    
    return {
      props: {
        preview,
        posts: data || null,
      },
      revalidate: 10,
    };
  };

export const getStaticPaths: GetStaticPaths = async () => {
  const allcategories = await getAllCategoriesWithSlug()

  return {
    paths: allcategories.edges.map(({ node }) => `/category/${node.slug}`) || [],
    fallback: true,
  }
}


