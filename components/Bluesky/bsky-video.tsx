'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  src: string
  poster?: string
  postUrl: string
  author: string
}

export default function BskyVideo({ src, poster, postUrl, author }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let disposed = false
    let hls: import('hls.js').default | undefined

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      return () => {
        video.removeAttribute('src')
        video.load()
      }
    }

    import('hls.js')
      .then(({ default: Hls }) => {
        if (disposed) return
        if (!Hls.isSupported()) {
          setFallback(true)
          return
        }

        hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(video)
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!disposed && data.fatal) setFallback(true)
        })
      })
      .catch(() => {
        if (!disposed) setFallback(true)
      })

    return () => {
      disposed = true
      hls?.destroy()
      video.removeAttribute('src')
      video.load()
    }
  }, [src])

  return (
    <div className="relative mb-5 aspect-video overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        playsInline
        preload="metadata"
        poster={poster}
        aria-label={`Video by @${author}`}
      />
      {fallback && (
        <a
          href={postUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="absolute inset-0 flex items-center justify-center bg-black/60 px-4 text-center font-semibold text-white underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          This video can’t play here. Watch it on Bluesky.
        </a>
      )}
    </div>
  )
}
