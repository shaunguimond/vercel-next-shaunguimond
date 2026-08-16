import cn from 'classnames'
import Image from "next/image"
import Link from 'next/link'

interface Props {
  title: string
  coverImage?: {
    node?: { sourceUrl?: string | null } | null
  } | null
  slug?: string
}

export default function CoverImage({ title, coverImage, slug }: Props) {
  // A post can have no featured image. next/image requires a URL, so
  // render nothing in that case.
  const src = coverImage?.node?.sourceUrl
  if (!src) return null

  const image = (
    <Image
      width={2000}
      height={1000}
      alt={`Cover Image for ${title}`}
      loading="eager"
      src={src}
      className={cn('shadow-small rounded-tr-2xl rounded-tl-2xl aspect-video object-cover bg-white', {
        'hover:shadow-medium transition-shadow duration-200': slug,
      })}
      style={{
        maxWidth: "100%",
        height: "auto"
      }} />
  )
  return (
    <div className="sm:mx-0">
      {slug ? (
        <Link href={`/posts/${slug}`} aria-label={title}>
          {image}
        </Link>
      ) : (
        image
      )}
    </div>
  )
}
