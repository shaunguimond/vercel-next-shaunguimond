import { ShareIcon } from '@heroicons/react/24/outline'
import { useEffect, useRef, useState, type CSSProperties } from 'react'

export default function PostReadingTools({ title }: { title: string }) {
  const [progress, setProgress] = useState(0)
  const [isMobileFixed, setIsMobileFixed] = useState(false)
  const [mobileStickyTop, setMobileStickyTop] = useState(82)
  const [shareStatus, setShareStatus] = useState('')
  const shareStatusTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    return () => {
      if (shareStatusTimeout.current) clearTimeout(shareStatusTimeout.current)
    }
  }, [])

  const announceShareStatus = (message: string) => {
    setShareStatus(message)
    if (shareStatusTimeout.current) clearTimeout(shareStatusTimeout.current)
    shareStatusTimeout.current = setTimeout(() => setShareStatus(''), 2500)
  }

  const copyArticleLink = async (url: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard access unavailable')
      await navigator.clipboard.writeText(url)
      announceShareStatus('Link copied')
    } catch {
      window.prompt('Copy this link to share the article', url)
    }
  }

  const sharePost = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    await copyArticleLink(url)
  }

  return (
    <div
      data-reading-tools-slot
      className="min-h-14 min-[800px]:sticky min-[800px]:top-28 min-[800px]:z-10 min-[800px]:min-h-0 min-[800px]:self-start"
    >
      <aside
        aria-label="Post tools"
        className={`${isMobileFixed ? 'fixed inset-x-5 top-[var(--mobile-sticky-top)] z-20 w-auto' : 'sticky top-[var(--mobile-sticky-top)] z-10 w-full'} mb-4 flex items-center justify-between rounded-xl bg-daccent-2/90 p-1.5 text-accent-1 shadow-sm backdrop-blur min-[800px]:static min-[800px]:mb-0 min-[800px]:h-[calc(100vh-9rem)] min-[800px]:min-h-80 min-[800px]:w-14 min-[800px]:flex-col min-[800px]:justify-start min-[800px]:gap-6 min-[800px]:rounded-2xl min-[800px]:p-3`}
        style={{ '--mobile-sticky-top': `${mobileStickyTop}px` } as CSSProperties}
      >
        <button
          type="button"
          onClick={sharePost}
          aria-label={shareStatus || `Share ${title}`}
          title={shareStatus || 'Share'}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-accent-1 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 min-[800px]:h-10 min-[800px]:w-10"
        >
          <ShareIcon className="h-4 w-4 min-[800px]:h-6 min-[800px]:w-6" aria-hidden="true" />
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {shareStatus}
        </span>

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
