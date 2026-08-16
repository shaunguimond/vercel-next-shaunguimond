import Avatar from './avatar'
import Date from './date'
import CoverImage from './cover-image'
import Link from 'next/link'
import { sanitizeWpText } from '../lib/sanitize'
import type { AuthorEdge, FeaturedImage } from '../lib/types'

export default function PostPreview({
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
  return (
    <article className='shadow-small rounded-2xl h-fit 
    bg-sg-multicolour hover:shadow-medium transition-shadow duration-200'>
      <div className='mb-0'>
        {coverImage && (
          <CoverImage title={title} coverImage={coverImage} slug={slug} />
        )}
      </div>
      <div className="p-5 backdrop-blur-xl rounded-2xl">
        <h2 className="text-3xl mb-3 leading-snug">
          <Link
            href={`/posts/${slug}`}
            className="hover:underline"
            dangerouslySetInnerHTML={{ __html: sanitizeWpText(title) }}
          ></Link>
        </h2>
        <div
          className="text-lg leading-relaxed mb-4 post-excerpt"
          dangerouslySetInnerHTML={{ __html: sanitizeWpText(excerpt) }}
        />
        <div className="flex flex-row items-center gap-10">
          <Avatar author={author} />
          <Date dateString={date} />
        </div>
      </div>
    </article>
  )
}
