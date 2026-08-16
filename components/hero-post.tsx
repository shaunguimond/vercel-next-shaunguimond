import Avatar from './avatar'
import Date from './date'
import CoverImage from './cover-image'
import Link from 'next/link'
import { sanitizeWpText } from '../lib/sanitize'
import type { AuthorEdge, FeaturedImage } from '../lib/types'

export default function HeroPost({
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
}: {
  title: string
  coverImage?: FeaturedImage | null
  date: string
  excerpt: string
  author?: AuthorEdge | null
  slug: string
}) {
  // Remove <a> tags using regular expressions (display choice: hero
  // excerpts show "..." where the excerpt text contains a link).
  const finalContent = sanitizeWpText(excerpt).replace(/<a[^>]*>.*?<\/a>/gi, '...');

  return (
    <article className='shadow-small rounded-2xl bg-sg-multicolour hover:shadow-medium transition-shadow duration-200'>

      <div className="mb-0">
        {coverImage && (
          <CoverImage title={title} coverImage={coverImage} slug={slug} />
        )}
      </div>
      <div className="mb-20 md:mb-28 flex flex-col p-5 backdrop-blur-xl rounded-2xl">
        <div>
          <h2 className="mb-4 text-4xl leading-tight">
            <Link
              href={`/posts/${slug}`}
              className="hover:underline"
              dangerouslySetInnerHTML={{ __html: sanitizeWpText(title) }}
            ></Link>
          </h2>
          <div className="mb-4 md:mb-0 text-lg">

          </div>
        </div>
        <div>
          <div
            className="text-lg leading-relaxed mb-4 post-excerpt"
            dangerouslySetInnerHTML={{ __html: finalContent }}
          />
          <div className="flex flex-row items-center gap-10">
            <Avatar author={author} />
            <Date dateString={date} />
          </div>
        </div>
      </div>
    </article>
  )
}
