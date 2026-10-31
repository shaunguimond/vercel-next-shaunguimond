import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

export default function ShareOnBluesky({ title }: { title: string }) {
  const sharePost = () => {
    const text = `${title}\n${window.location.href}`
    const composeUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`
    window.open(composeUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={sharePost}
      className="inline-flex items-center gap-2 rounded-full border border-black/20 px-4 py-2 text-sm text-black transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/20 dark:text-accent-1 dark:hover:bg-white/10"
      aria-label={`Share ${title} on Bluesky`}
    >
      <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden="true" />
      Share on Bluesky
    </button>
  )
}
