import Avatar from './avatar'
import Date from './date'
import PostTitle from './post-title'
import Categories from './categories'
import type { AuthorEdge, TermEdge } from '../lib/types'

export default function PostHeader({
  title,
  date,
  author,
  categories,
}: {
  title: string
  date: string
  author?: AuthorEdge | null
  categories?: { edges: TermEdge[] } | null
}) {
  return (
    <>
      <PostTitle>{title}</PostTitle>
      <div className="hidden md:block md:mb-12 max-w-3xl rounded-2xl mx-auto bg-daccent-2 p-5 text-accent-1">
        <Avatar author={author} />
          Posted <Date dateString={date} />
          <Categories categories={categories} />
      </div>
      <div className="max-w-2xl mx-auto ">
        <div className="block md:hidden mb-6 bg-daccent-2 rounded-2xl p-5 text-accent-1">
          <Avatar author={author} />
          Posted <Date dateString={date} />
          <Categories categories={categories} />
        </div>
        <div className="mb-6 text-lg">
        </div>
      </div>
    </>
  )
}
