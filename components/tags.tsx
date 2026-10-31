import type { TermEdge } from '../lib/types'

export default function Tags({ tags }: { tags: { edges: TermEdge[] } }) {
  return (
    <section
      aria-labelledby="post-tags-heading"
      className="mx-auto mt-10 max-w-2xl border-t border-daccent-2 pt-5"
    >
      <h2
        id="post-tags-heading"
        className="mb-3 text-sm font-semibold uppercase tracking-wider text-daccent-1/70 dark:text-accent-1/70"
      >
        Tagged
      </h2>
      <ul aria-label="Post tags" className="flex flex-wrap gap-2">
        {tags.edges.map((tag, index) => (
          <li
            key={`${tag.node.slug ?? tag.node.name}-${index}`}
            className="rounded-full border border-daccent-2 bg-laccent-2 px-3 py-1 text-sm font-medium text-daccent-1 dark:bg-daccent-2 dark:text-accent-1"
          >
            {tag.node.name}
          </li>
        ))}
      </ul>
    </section>
  )
}
