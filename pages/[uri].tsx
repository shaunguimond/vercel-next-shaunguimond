import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import PostBody from '../components/post-body'
import { GetStaticPaths, GetStaticProps } from 'next'
import Container from '../components/container'
import Layout from '../components/layout'
import { getPageAndMorePages, getAllPagesWithUri } from '../lib/api'
import type { PageNode, PreviewPage } from '../lib/types'

export default function Page({ page, preview }: { page: PageNode | null; preview?: boolean }) {
  const router = useRouter()

  if (!router.isFallback && !page?.uri) {
    return <ErrorPage statusCode={404} />
  }

  return (
    <Layout preview={preview}>
      <Container>
        {router.isFallback ? (
          <title>Loading…</title>
        ) : page ? (
          <>
            <article>
              <title>
                {`${page.title} | Next.js Blog with WordPress`}
              </title>
              <PostBody content={page.content} />
            </article>
          </>
        ) : (
          null
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
  const pageUri = typeof params?.uri === 'string' ? params.uri : undefined
  const data = await getPageAndMorePages(
    pageUri,
    preview,
    previewData as { page?: PreviewPage } | undefined
  )

  return {
    props: {
      preview,
      page: data.page,
    },
    //  For Incremental Static Regeneration (ISR), set the revalidate option to 60 seconds.
    revalidate: 60,
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allPages = await getAllPagesWithUri()

  return {
    paths: allPages.edges.map(({ node }) => `${node.uri}`) || [],
    fallback: true,
  }
}

