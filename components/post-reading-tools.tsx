import { useEffect, useState, type CSSProperties } from 'react'

function BlueskyIcon() {
  return (
    <svg
      viewBox="0 0 600 530"
      className="h-4 w-4 min-[800px]:h-6 min-[800px]:w-6"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M134.6 45.1c62.4 46.9 129.5 142 154.4 193.2 24.9-51.2 92-146.3 154.4-193.2C488.4 11.3 561.3-15 561.3 68.3c0 16.7-9.5 139.7-15.1 159.6-19.4 69-90.2 86.6-153.2 75.9 110.2 18.7 138.3 80.5 77.7 142.3-115.1 117.3-165.5-29.4-178.5-67-2.4-6.9-3.5-10.1-3.2-7.4.3-2.7-.8.5-3.2 7.4-13 37.6-63.4 184.3-178.5 67-60.6-61.8-32.5-123.6 77.7-142.3-63 10.7-133.8-6.9-153.2-75.9C26.2 208 16.7 85 16.7 68.3 16.7-15 89.6 11.3 134.6 45.1Z"
      />
    </svg>
  )
}

export default function PostReadingTools({ title }: { title: string }) {
  const [progress, setProgress] = useState(0)
  const [isMobileFixed, setIsMobileFixed] = useState(false)
  const [mobileStickyTop, setMobileStickyTop] = useState(82)

  useEffect(() => {
    const article = document.querySelector<HTMLElement>('[data-reading-article]')
    const slot = document.querySelector<HTMLElement>('[data-reading-tools-slot]')
    if (!article || !slot) return

    const updateProgress = () => {
      const articleTop = article.getBoundingClientRect().top + window.scrollY
      const articleHeight = article.offsetHeight
      const readableHeight = Math.max(articleHeight - window.innerHeight, 1)
      const value = Math.min(
        100,
        Math.max(0, ((window.scrollY - articleTop) / readableHeight) * 100),
      )
      setProgress(Math.round(value))

      if (window.innerWidth >= 800) {
        setIsMobileFixed(false)
        return
      }

      const slotTop = slot.getBoundingClientRect().top + window.scrollY
      const articleBottom = articleTop + articleHeight
      const navBottom =
        document.querySelector<HTMLElement>('.nav-fixed')?.getBoundingClientRect().bottom ?? 80
      const stickyTop = Math.ceil(navBottom + 2)
      setMobileStickyTop(stickyTop)
      setIsMobileFixed(
        window.scrollY > slotTop - stickyTop && window.scrollY < articleBottom - stickyTop,
      )
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  const sharePost = () => {
    const text = `${title}\n${window.location.href}`
    const composeUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`
    window.open(composeUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div data-reading-tools-slot className="min-h-14 min-[800px]:min-h-0">
      <aside
        aria-label="Post tools"
        className={`${isMobileFixed ? 'fixed inset-x-5 top-[var(--mobile-sticky-top)] z-20 w-auto' : 'sticky top-[var(--mobile-sticky-top)] z-10 w-full'} mb-4 flex items-center justify-between rounded-xl bg-daccent-2/90 p-1.5 text-accent-1 shadow-sm backdrop-blur min-[800px]:sticky min-[800px]:top-28 min-[800px]:z-10 min-[800px]:mb-0 min-[800px]:h-[calc(100vh-9rem)] min-[800px]:min-h-80 min-[800px]:w-14 min-[800px]:flex-col min-[800px]:justify-start min-[800px]:gap-6 min-[800px]:rounded-2xl min-[800px]:p-3`}
        style={{ '--mobile-sticky-top': `${mobileStickyTop}px` } as CSSProperties}
      >
        <button
          type="button"
          onClick={sharePost}
          aria-label={`Share ${title} on Bluesky`}
          title="Share on Bluesky"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sky-500 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 min-[800px]:h-10 min-[800px]:w-10"
        >
          <BlueskyIcon />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3 min-[800px]:w-full min-[800px]:flex-1 min-[800px]:flex-col min-[800px]:gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-accent-1/20 min-[800px]:h-auto min-[800px]:min-h-0 min-[800px]:w-1.5 min-[800px]:flex-1">
            <div
              className="h-full w-[var(--reading-progress)] rounded-full bg-sky-500 transition-[width,height] duration-150 min-[800px]:h-[var(--reading-progress)] min-[800px]:w-full"
              style={{ '--reading-progress': `${progress}%` } as CSSProperties}
            />
          </div>
          <span
            className="w-10 text-right text-xs tabular-nums min-[800px]:w-auto"
            aria-hidden="true"
          >
            {progress}%
          </span>
          <span
            className="sr-only"
            role="progressbar"
            aria-label="Article reading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          />
        </div>
      </aside>
    </div>
  )
}
