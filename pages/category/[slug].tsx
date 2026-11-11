
import { GetStaticPaths, GetStaticProps } from 'next'
import Layout from '../../components/layout'
import { getAllPostsByCategory, getAllCategoriesWithSlug } from '../../lib/api'
import CategoryPostList from '../../components/category-post-list'
import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import Container from '../../components/container'
import Head from 'next/head'
import Seo, { JsonLd } from '../../components/seo'
import { SITE_NAME, collectionPageJsonLd } from '../../lib/seo'
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
      {category ? (
        <>
          <Seo
            title={`${category.name} | ${SITE_NAME}`}
            description={`Posts filed under ${category.name} on shaunguimond.com.`}
            path={`/category/${category.slug}`}
          />
          <JsonLd
            data={collectionPageJsonLd(
              category.name,
              `Posts filed under ${category.name} on shaunguimond.com.`,
              `/category/${category.slug}`
            )}
          />
        </>
      ) : (
        // Reachable only when WordPress returned no category for the slug: the
        // document has no content, so it must not be indexed under any URL.
        <Head>
          <meta name="robots" content="noindex, follow" />
          <title>Loading… | {SITE_NAME}</title>
        </Head>
      )}
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


