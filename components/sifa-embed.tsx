import { useEffect, useRef } from 'react'

interface SifaEmbedProps {
  handle: string
  className?: string
}

// Renders the Sifa profile embed (https://sifa.id) inside this component's
// container element.
//
// We deliberately avoid `next/script` here: in the pages router, `next/script`
// renders nothing at the JSX position — after hydration it appends the
// <script> element to document.body, and Next keeps loaded scripts in the DOM
// across navigations. Sifa's embed.js inserts its card right after the
// <script> tag, so with `next/script` the card renders below the footer — and
// keeps showing on every page visited afterwards.
//
// Instead, we create the <script> element ourselves inside a container that
// only exists while this component is mounted. When the page unmounts, React
// detaches the container (script tag and Sifa's card with it), so the embed
// only appears on the page that renders it.
//
// No cleanup is needed: on unmount the container is detached from the
// document, taking the script with it. If Sifa's profile fetch is still
// in-flight, it resolves into the detached container — invisible and
// harmless. (Removing the script ourselves instead would make that fetch
// throw on a null parentNode.)
export default function SifaEmbed({ handle, className }: SifaEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const script = document.createElement('script')
    script.src = 'https://sifa.id/embed.js'
    script.setAttribute('data-handle', handle)
    container.appendChild(script)
  }, [handle])

  return <div ref={containerRef} className={className} />
}
