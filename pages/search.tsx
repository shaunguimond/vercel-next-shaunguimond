import Head from 'next/head'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import Container from '../components/container'
import Layout from '../components/layout'
import SearchPostList from '../components/search-post-list'
import { getAllCategoriesWithSlug, getSearchPosts } from '../lib/api'
import type { PaginatedPostConnection } from '../lib/types'

interface SearchPageProps {
  search: string
  results: PaginatedPostConnection | null
  matchingCategories: { name: string; slug: string }[]
}

export default function SearchPage({ search, results, matchingCategories }: SearchPageProps) {
  return (
    <Layout>
      <Head>
        <title>{search ? `Search: ${search} | Shaun Guimond` : 'Search | Shaun Guimond'}</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <Container>
        <section className="mx-auto mb-16 max-w-4xl">
          <h1 className="mb-8 text-center text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Search the archive
          </h1>
          <form
            action="/search"
            method="get"
            role="search"
            className="flex flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="search-query" className="sr-only">
              Search posts and categories
            </label>
            <input
              id="search-query"
              type="search"
              name="q"
              maxLength={100}
              defaultValue={search}
              placeholder="Search posts and categories"
              className="min-h-12 min-w-0 flex-1 rounded-lg border border-slate-400 bg-white px-4 py-3 text-slate-950 dark:border-slate-400 dark:bg-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="min-h-12 rounded-lg bg-accent-3 px-6 py-3 font-semibold text-slate-950 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-daccent-1 dark:text-accent-1"
            >
              Search
            </button>
          </form>
        </section>

        {!search && (
          <p className="mb-20 text-center text-lg">Enter a word or phrase to search the archive.</p>
        )}

        {search && (
          <>
            <h2 className="mb-8 text-3xl font-semibold">
              Results for <span className="break-words">“{search}”</span>
            </h2>

            {matchingCategories.length > 0 && (
              <section className="mb-12" aria-labelledby="matching-categories">
                <h3 id="matching-categories" className="mb-4 text-xl font-semibold">
                  Matching categories
                </h3>
                <ul className="flex flex-wrap gap-3">
                  {matchingCategories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={`/category/${encodeURIComponent(category.slug)}/`}
                        className="inline-block rounded-full border px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {results && results.edges.length > 0 ? (
              <>
                <h3 className="mb-6 text-xl font-semibold">Matching posts</h3>
                <SearchPostList key={search} initialResults={results} search={search} />
              </>
            ) : (
              <p className="mb-20 text-lg">
                {matchingCategories.length > 0
                  ? 'No posts matched that phrase. Try one of the matching categories above.'
                  : 'No posts or categories matched that phrase. Try a different search.'}
              </p>
            )}
          </>
        )}
      </Container>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<SearchPageProps> = async ({ query, res }) => {
  const search = typeof query.q === 'string' ? query.q.trim().slice(0, 100) : ''

  if (!search) {
    return { props: { search: '', results: null, matchingCategories: [] } }
  }

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

  const [results, categories] = await Promise.all([
    getSearchPosts(search),
    getAllCategoriesWithSlug(),
  ])
  const normalizedSearch = search.toLocaleLowerCase()
  const matchingCategories = categories.edges
    .map(({ node }) => ({ name: node.name, slug: node.slug }))
    .filter(({ name }) => name.toLocaleLowerCase().includes(normalizedSearch))

  return { props: { search, results, matchingCategories } }
}
