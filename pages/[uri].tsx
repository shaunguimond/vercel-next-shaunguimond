import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import PostBody from '../components/post-body'
import { GetStaticPaths, GetStaticProps } from 'next'
import Container from '../components/container'
import Layout from '../components/layout'
import { getPageAndMorePages, getAllPagesWithUri } from '../lib/api'
import { CMS_NAME } from '../lib/constants'

export default function Page({ page, preview }) {
  const router = useRouter()

  if (!router.isFallback && !page?.uri) {
    return <ErrorPage statusCode={404} />
  }

  return (
    <Layout preview={preview}>
      <Container>
        {router.isFallback ? (
          <title>Loading…</title>
        ) : (
          <>
            <article>
              <title>
                {`${page.title} | Next.js Blog with WordPress`}
              </title>
              <PostBody content={page.content} />
            </article>
          </>
        )}
      </Container>
    </Layout>
  )
}


// Used for Static Site Generation (SSG) to pre-render pages at build time.
export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const data = await getPageAndMorePages(params?.uri, preview, previewData)

  return {
    props: {
      preview,
      page: data.page,
      pages: data.pages,
    },
    //  For Incremental Static Regeneration (ISR), set the revalidate option to 10 seconds.
    revalidate: 10,
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allPages = await getAllPagesWithUri()

  return {
    paths: allPages.edges.map(({ node }) => `${node.uri}`) || [],
    fallback: true,
  }
}

