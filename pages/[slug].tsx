import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import Head from 'next/head'
import { GetStaticPaths, GetStaticProps } from 'next'
import Container from '../components/container'
import Header from '../components/header'
import Layout from '../components/layout'
import { getPageAndMorePages, getAllPagesWithUri } from '../lib/api'
import { CMS_NAME } from '../lib/constants'

export default function Post({ page, preview }) {
  const router = useRouter()

  if (!router.isFallback && !page?.uri) {
    return <ErrorPage statusCode={404} />
  }

  return (
    <Layout preview={preview}>
      <Container>
        <Header />
        {router.isFallback ? (
          <title>Loading…</title>
        ) : (
          <>
          <article>
            <title>
              {`${page.title} | Next.js Blog Example with ${CMS_NAME}`}
            </title>
          </article>
          </>
        )}
      </Container>
    </Layout>
  )
}


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

