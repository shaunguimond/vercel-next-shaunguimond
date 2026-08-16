import type { TermEdge } from '../lib/types'

export default function Categories({
  categories,
}: {
  categories?: { edges: TermEdge[] } | null
}) {
  const edges = categories?.edges

  // A post can have no categories — nothing to render in that case.
  if (!Array.isArray(edges) || edges.length === 0) {
    return null
  }

  return (
    <span className="ml-1">
      under
      {edges.map((category, index) => (
        <span key={index} className="ml-1">
          {category.node.name}
        </span>
      ))}
    </span>
  )
}
