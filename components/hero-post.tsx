import Avatar from './avatar'
import Date from './date'
import CoverImage from './cover-image'
import Link from 'next/link'

export default function HeroPost({
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
}) {
  return (
    <article className='shadow-small rounded-2xl container-card bg-laccent-2 
                        dark:bg-daccent-2 hover:shadow-medium transition-shadow duration-200'>

      <div className="mb-2 md:mb-4">
        {coverImage && (
          <CoverImage title={title} coverImage={coverImage} slug={slug} />
        )}
      </div>
      <div className="mb-20 md:mb-28 flex flex-col p-5">
        <div>
          <h3 className="mb-4 text-4xl lg:text-6xl leading-tight">
            <Link
              href={`/posts/${slug}`}
              className="hover:underline"
              dangerouslySetInnerHTML={{ __html: title }}
            ></Link>
          </h3>
          <div className="mb-4 md:mb-0 text-lg">
            
          </div>
        </div>
        <div>
          <div
            className="text-lg leading-relaxed mb-4 post-excerpt"
            dangerouslySetInnerHTML={{ __html: excerpt }}
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
