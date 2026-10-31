import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import Layout from '../components/layout'

const topics = [
  {
    title: 'Technology',
    description: 'Programming, tools, and ideas I am learning about.',
    href: '/category/technology/',
  },
  {
    title: 'Projects',
    description: 'Things I have built and what the process taught me.',
    href: '/category/projects/',
  },
  {
    title: 'Travel',
    description: 'Stories and photos from the places we explore.',
    href: '/category/travels/',
  },
]

const careerSteps = [
  'Taxation, accounting, and auditing',
  'Digital marketing',
  'Web development',
  'Software engineering',
]

export default function AboutShaun() {
  const { systemTheme, theme } = useTheme()
  const sifaEmbedRef = useRef<HTMLIFrameElement>(null)
  const [sifaEmbedHeight, setSifaEmbedHeight] = useState(1)
  const currentTheme = theme === 'system' ? systemTheme : theme
  const sifaEmbedUrl = new URL('https://sifa.id/embed/shaunguimond.com')
  if (currentTheme === 'light' || currentTheme === 'dark') {
    sifaEmbedUrl.searchParams.set('theme', currentTheme)
  }

  useEffect(() => {
    const handleEmbedResize = (event: MessageEvent<unknown>) => {
      if (
        event.origin !== 'https://sifa.id' ||
        event.source !== sifaEmbedRef.current?.contentWindow ||
        typeof event.data !== 'object' ||
        event.data === null
      ) {
        return
      }

      const { height, type } = event.data as { height?: unknown; type?: unknown }
      if (
        type === 'sifa-embed-resize' &&
        typeof height === 'number' &&
        Number.isFinite(height) &&
        height > 0
      ) {
        setSifaEmbedHeight(Math.ceil(height))
      }
    }

    window.addEventListener('message', handleEmbedResize)
    return () => window.removeEventListener('message', handleEmbedResize)
  }, [])

  return (
    <Layout>
      <Head>
        <title>About Shaun | Shaun Guimond</title>
        <meta
          name="description"
          content="Meet Shaun Guimond: a software engineer in Vancouver writing about technology, projects, learning, and travel."
        />
      </Head>

      <div className="mx-auto max-w-6xl px-5 pb-20">
        <section className="grid gap-10 py-8 md:gap-14 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-14">
          <div>
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
              A little about me
            </p>
            <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Hi, I&apos;m Shaun.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-slate-700 dark:text-slate-200 sm:text-2xl">
              I&apos;m a software engineer in Vancouver who likes learning how things work and building useful things with what I learn.
            </p>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              I work at Shopify and studied computer science at the University of British Columbia. This site is where I share notes from that work, personal projects, and the places Caroline and I visit.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center rounded-full bg-daccent-2 px-6 py-3 font-semibold text-accent-1 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Browse the latest posts
              </Link>
              <a
                href="https://bsky.app/profile/shaunguimond.com"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-12 items-center rounded-full border border-slate-400 px-6 py-3 font-semibold hover:bg-slate-100 dark:border-slate-500 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Find me on Bluesky
              </a>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-2 gap-4 border-t border-slate-300 pt-6 dark:border-slate-700">
              <div>
                <dt className="text-sm text-slate-600 dark:text-slate-400">Based in</dt>
                <dd className="mt-1 font-semibold">Vancouver, BC</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600 dark:text-slate-400">Currently</dt>
                <dd className="mt-1 font-semibold">Software engineer at Shopify</dd>
              </div>
            </dl>
          </div>

          <figure className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-3 rotate-2 rounded-[2rem] bg-accent-3/70 dark:bg-sky-900/50" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[1.75rem] shadow-medium">
              <Image
                src="https://wp.shaunguimond.com/wp-content/uploads/2019/08/ShaunCarolineEngagement-0047-1536x1024.jpg"
                width={1536}
                height={1024}
                alt="Caroline and Shaun at the Bay of Fundy."
                preload
                sizes="(min-width: 1024px) 42vw, (min-width: 640px) 80vw, 100vw"
                className="aspect-[4/3] h-auto w-full object-cover"
              />
            </div>
            <figcaption className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
              Caroline and me at the Bay of Fundy.
            </figcaption>
          </figure>
        </section>

        <section className="mt-12 grid gap-8 border-t border-slate-300 py-12 dark:border-slate-700 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
              The path here
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
              A career with a few turns
            </h2>
          </div>
          <div>
            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              Software wasn&apos;t my first field. I&apos;ve worked across a few disciplines, and each one gave me a different way to approach a problem. I still enjoy the challenge of learning something new and putting it to use.
            </p>
            <ol className="mt-7 grid gap-3 sm:grid-cols-2">
              {careerSteps.map((step, index) => (
                <li
                  key={step}
                  className="flex items-center gap-3 rounded-xl bg-laccent-2 p-4 dark:bg-daccent-2"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-semibold text-sky-800 dark:bg-slate-900 dark:text-sky-300">
                    {index + 1}
                  </span>
                  <span className="font-medium">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-4 grid gap-6 rounded-[2rem] border border-slate-300 p-6 dark:border-slate-700 sm:p-9 md:grid-cols-[0.7fr_1.3fr] md:items-start md:gap-12" aria-labelledby="outside-work">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
              Away from work
            </p>
            <h2 id="outside-work" className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
              Life beyond the screen
            </h2>
          </div>
          <div className="space-y-4 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
            <p>
              I&apos;m married to Caroline, a private practice dietitian, recipe developer, and food photographer behind{' '}
              <a
                href="https://www.nourishedbycaroline.ca"
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-sky-800 underline underline-offset-4 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200"
              >
                Nourished by Caroline
              </a>
              .
            </p>
            <p>
              We love learning and exploring together. We&apos;ve travelled across much of Canada, the United States, and Europe, and are looking forward to discovering more.
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-[2rem] bg-laccent-2 p-6 dark:bg-daccent-2 sm:p-10" aria-labelledby="writing-topics">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-800 dark:text-sky-300">
              On this site
            </p>
            <h2 id="writing-topics" className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
              Things I&apos;m learning and doing
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              I write to make sense of what I&apos;m learning, and to keep a record of projects and trips worth remembering.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {topics.map((topic) => (
              <Link
                key={topic.title}
                href={topic.href}
                className="group rounded-2xl bg-white/80 p-6 shadow-small transition-transform hover:-translate-y-1 dark:bg-slate-950/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500"
              >
                <h3 className="text-xl font-bold group-hover:underline">{topic.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-700 dark:text-slate-300">
                  {topic.description}
                </p>
                <span className="mt-5 inline-block font-semibold text-sky-800 dark:text-sky-300">
                  Browse posts <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-8 border-t border-slate-300 pt-12 dark:border-slate-700 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16" aria-labelledby="around-web">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
              Say hello
            </p>
            <h2 id="around-web" className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
              Around the web
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              I share notes about technology, programming, and everyday life on Bluesky. You can also find my profile on Sifa.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
              <a
                href="https://bsky.app/profile/shaunguimond.com"
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-sky-800 underline underline-offset-4 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200"
              >
                Bluesky profile
              </a>
              <a
                href="https://sifa.id/shaunguimond.com"
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-sky-800 underline underline-offset-4 hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200"
              >
                Sifa profile
              </a>
            </div>
          </div>
          <iframe
            key={currentTheme ?? 'system'}
            ref={sifaEmbedRef}
            src={sifaEmbedUrl.toString()}
            title="Sifa ID profile card for Shaun Guimond"
            className="w-full rounded-2xl border border-slate-300 bg-transparent dark:border-slate-700"
            style={{ height: `${sifaEmbedHeight + 2}px`, backgroundColor: 'transparent' }}
            loading="lazy"
          />
        </section>
      </div>
    </Layout>
  )
}
