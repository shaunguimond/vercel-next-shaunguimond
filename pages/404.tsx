import Link from 'next/link'
import Container from '../components/container'
import Layout from '../components/layout'
import Seo from '../components/seo'
import { SITE_NAME } from '../lib/seo'

/**
 * Shown for any path Next.js cannot match, with status 404.
 *
 * The page exists so a dead link from an old article, a renamed post slug, or a
 * truncated URL still lands somewhere useful: the routes the site actually
 * offers. It asks not to be indexed, so a mistyped link that gets crawled cannot
 * become a page of its own.
 */
const DESTINATIONS = [
  { href: '/', label: 'Home', description: 'The newest posts' },
  { href: '/search', label: 'Search', description: 'Find a post by keyword' },
  { href: '/about-shaun', label: 'About', description: 'Who writes here' },
]

export default function NotFound() {
  return (
    <Layout>
      <Seo
        title={`Page not found | ${SITE_NAME}`}
        description="That page is not here."
        path="/404"
        noindex
      />
      <Container>
        <div className="mx-auto max-w-2xl py-10 text-center">
          <p className="font-serif text-7xl font-bold leading-none sm:text-8xl">404</p>
          <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            There is nothing at this address
          </h1>
          <p className="mt-4 text-lg">
            The page may have been renamed or removed. Everything published here is
            reachable from the links below.
          </p>
          <ul className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {DESTINATIONS.map((destination) => (
              <li key={destination.href} className="flex-1">
                <Link
                  href={destination.href}
                  className="block h-full rounded-2xl bg-laccent-2 px-4 py-3 font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:bg-daccent-2"
                >
                  {destination.label}
                  <span className="mt-1 block text-sm font-normal opacity-80">
                    {destination.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Layout>
  )
}
