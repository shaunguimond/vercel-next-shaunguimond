import Head from 'next/head'
import Image from 'next/image'
import Layout from '../components/layout'

// Custom About page, built in code instead of pulled from WordPress.
// Edit the text below to change the content.
export default function AboutShaun() {
  return (
    <Layout>
      <Head>
        <title>About Shaun | Shaun Guimond</title>
        <meta
          name="description"
          content="Software engineer at Shopify, computer science graduate from UBC, and the writer behind this blog. Say hello!"
        />
      </Head>

      <div className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tighter leading-tight text-center mb-12">
          About Shaun
        </h1>

        <div className="space-y-6 text-lg leading-relaxed text-black dark:text-accent-1">
          <p>Hello, my name is Shaun Guimond.</p>
          <p>
            I&apos;m a software engineer at Shopify and a recent computer
            science graduate from the University of British Columbia, based in
            Vancouver, BC. Before code, I&apos;ve worked in taxation, business
            auditing and accounting, digital marketing, and web development —
            and I relish every challenge as an opportunity for growth.
          </p>
          <p>
            I&apos;m happily married to an amazing woman who is a Private
            Practice Dietitian, recipe developer, and food photographer behind{' '}
            <a
              className="underline"
              href="https://www.nourishedbycaroline.ca"
              target="_blank"
              rel="noopener noreferrer"
            >
              Nourished by Caroline
            </a>
            . We love learning and exploring as much as possible. We&apos;ve
            travelled much of Canada, the United States, and Europe, with plans
            to explore new countries in the future.
          </p>
          <p>
            In this blog, I share all of my learning experiences — from
            programming to general technology. You&apos;ll also find me
            sharing all of our amazing travels. I hope you enjoy!
          </p>
        </div>

        <figure className="my-12">
          <Image
            src="https://wp.shaunguimond.com/wp-content/uploads/2019/08/ShaunCarolineEngagement-0047-1536x1024.jpg"
            width={1536}
            height={1024}
            alt="Caroline and Shaun at the Bay of Fundy."
            loading="lazy"
            className="w-full h-auto rounded-2xl shadow-medium"
          />
          <figcaption className="mt-3 text-center text-sm opacity-70 text-black dark:text-accent-1">
            Caroline and Shaun at the Bay of Fundy.
          </figcaption>
        </figure>

        <section className="mt-16" aria-label="My profile on Sifa">
          <h2 className="font-serif text-3xl font-bold tracking-tighter mb-4">
            Around the web
          </h2>
          <p className="text-lg leading-relaxed text-black dark:text-accent-1 mb-8">
            I post about technology, programming, and life on Bluesky. Follow
            along, or check out my full profile on Sifa:
          </p>
          <iframe
            src="https://sifa.id/embed/shaunguimond.com"
            title="Sifa ID profile card for Shaun Guimond"
            className="w-full rounded-xl"
            style={{ height: "356px" }}
            loading="lazy"
          />
        </section>
      </div>
    </Layout>
  )
}
