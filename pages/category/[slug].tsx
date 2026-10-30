
import { GetStaticPaths, GetStaticProps } from 'next'
import Layout from '../../components/layout'
import { getAllPostsByCategory, getAllCategoriesWithSlug } from '../../lib/api'
import CategoryPostList from '../../components/category-post-list'
import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import Container from '../../components/container'
import Head from 'next/head'
import type { CategoryWithPosts } from '../../lib/types'



export default function PostsByCategory({
    category,
    preview,
}: {
    category: CategoryWithPosts | null
    preview?: boolean
}) {
    const router = useRouter()

    if (!router.isFallback && !category?.slug) {
        return <ErrorPage statusCode={404} />
      }

    return(

    <Layout preview={preview}>
      <Head>
        <title>
          {router.isFallback
            ? 'Loading…'
            : `${category?.name ?? 'Category'} | Shaun Guimond`}
        </title>
      </Head>
      <Container>
        {category && (
        <>
        <div>
            <h1 className="text-6xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-tight md:leading-none mb-12 text-center">
                {category.name}

            </h1>
        </div>
        <CategoryPostList key={category.slug} category={category} />
        </>
        )}
      </Container>
    </Layout>
    )
}

export const getStaticProps: GetStaticProps = async ({ params}) => {
    const categorySlug = typeof params?.slug === 'string' ? params.slug : undefined
    const data = await getAllPostsByCategory(categorySlug);

    
    return {
      props: {
        category: data ?? null,
      },
      revalidate: 60,
    };
  };

export const getStaticPaths: GetStaticPaths = async () => {
  const allcategories = await getAllCategoriesWithSlug()

  return {
    paths: allcategories.edges.map(({ node }) => `/category/${node.slug}`) || [],
    fallback: false,
  }
}


