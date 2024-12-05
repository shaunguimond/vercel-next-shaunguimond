import Avatar from './avatar'
import Date from './date'
import CoverImage from './cover-image'
import Link from 'next/link'
import sanitizeHtml from 'sanitize-html'

export default function HeroPost({
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
}) {
  const sanitizedContent = sanitizeHtml(excerpt, { allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'li', 'a'] });
  // Remove <a> tags using regular expressions 
  const finalContent = sanitizedContent.replace(/<a[^>]*>.*?<\/a>/gi, '...');

  return (
    <article className='shadow-small rounded-2xl bg-sg-multicolour hover:shadow-medium transition-shadow duration-200'>

      <div className="mb-0">
        {coverImage && (
          <CoverImage title={title} coverImage={coverImage} slug={slug} />
        )}
      </div>
      <div className="mb-20 md:mb-28 flex flex-col p-5 backdrop-blur-xl rounded-2xl">
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
