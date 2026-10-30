import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
} from '@atproto/api'
import Image from 'next/image'
import type { ReactNode } from 'react'
import {
  EmbedView,
  getFormattedText,
  getFormattedTextForRecord,
  getRenderTimeFromPost,
  PostRecordFields,
} from '../../lib/bluesky-format'
import { Comments, Likes, Reposted } from '../../lib/icons'

interface Props {
  post: AppBskyFeedDefs.PostView
  reposted: boolean
  fillColor: string
}

export default function BskyPostCard({ post, reposted, fillColor }: Props) {
  const record = post.record as PostRecordFields
  const postLink = `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/')[4]}`
  const handleLink = `https://bsky.app/profile/${post.author.handle}`

  return (
    <article className="break-inside mb-5 shadow-small rounded-2xl h-fit bg-sg-multicolour hover:shadow-medium transition-shadow duration-200">
      <div className="mb-0 backdrop-blur-xl rounded-2xl">
        <div className="pb-4" />
        {reposted && (
          <span className="flex flex-row ml-20 mt-0 items-center gap-2">
            <Reposted height="16px" width="16px" color={fillColor} />
            Reposted by me
          </span>
        )}
        <div className="flex flex-row justify-between">
          <div className="flex gap-4 gap-y-4 rounded-2xl">
            <a
              target="_blank"
              rel="noreferrer noopener"
              href={handleLink}
              aria-label={`View @${post.author.handle} on Bluesky`}
            >
              <div className="h-16 w-16 shrink-0 rounded-full bg-gray-300 ml-5 relative">
                {post.author.avatar && (
                  <Image src={post.author.avatar} alt="" fill className="rounded-full" />
                )}
              </div>
            </a>
            <p className="line-clamp-1 text-lg font-bold self-center flex flex-col">
              {post.author.displayName ?? post.author.handle}{' '}
              <a
                target="_blank"
                rel="noreferrer noopener"
                href={handleLink}
                className="text-gray-700 dark:text-gray-300 font-bold text-sm hover:underline"
              >
                @{post.author.handle}
              </a>
            </p>
          </div>
          <p className="self-center mr-5 text-sm">
            {getRenderTimeFromPost(record.createdAt)}
          </p>
        </div>

        <div className="py-3 px-5">
          <p
            className="text-lg mb-5"
            dangerouslySetInnerHTML={{ __html: getFormattedText(post) }}
          />
          <PostEmbeds post={post} />

          <div className="flex flex-row justify-between w-11/12 mx-auto pb-4">
            <PostMetric
              href={postLink}
              label={`${post.likeCount ?? 0} likes on Bluesky`}
              count={post.likeCount}
              icon={<Likes height="25px" width="25px" color={fillColor} />}
            />
            <PostMetric
              href={postLink}
              label={`${(post.repostCount ?? 0) + (post.quoteCount ?? 0)} reposts on Bluesky`}
              count={(post.repostCount ?? 0) + (post.quoteCount ?? 0)}
              icon={<Reposted height="25px" width="25px" color={fillColor} />}
            />
            <PostMetric
              href={postLink}
              label={`${post.replyCount ?? 0} replies on Bluesky`}
              count={post.replyCount}
              icon={<Comments height="25px" width="25px" color={fillColor} />}
            />
          </div>

          <div className="py-3 px-5 w-full">
            <a
              target="_blank"
              rel="noreferrer noopener"
              href={postLink}
              className="bg-brand block text-center hover:shadow-medium w-full transition-shadow duration-200 text-white font-bold text-lg py-2 px-4 rounded"
            >
              View post on Bluesky
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}

function PostMetric({
  href,
  label,
  count,
  icon,
}: {
  href: string
  label: string
  count?: number
  icon: ReactNode
}) {
  return (
    <a
      target="_blank"
      rel="noreferrer noopener"
      href={href}
      aria-label={label}
      className="flex flex-row hover:shadow-medium transition-shadow duration-200"
    >
      {icon}
      <span className="self-center ml-2">{count ?? 0}</span>
    </a>
  )
}

function PostEmbeds({ post }: { post: AppBskyFeedDefs.PostView }) {
  const embed = post.embed
  if (!embed) return null

  if (AppBskyEmbedRecordWithMedia.isView(embed)) {
    return AppBskyEmbedImages.isView(embed.media) ? (
      <>
        <ImageEmbed images={embed.media.images} />
        <ViewRecord record={embed.record.record} />
      </>
    ) : null
  }

  if (AppBskyEmbedRecord.isView(embed)) {
    return <ViewRecord record={embed.record} />
  }

  if (AppBskyEmbedImages.isView(embed)) {
    return <ImageEmbed images={embed.images} />
  }

  if (AppBskyEmbedExternal.isView(embed)) {
    return <ExternalView embed={embed} />
  }

  return null
}

function ImageEmbed({ images }: { images?: AppBskyEmbedImages.ViewImage[] }) {
  const safeImages = Array.isArray(images) ? images : []
  return (
    <div className={safeImages.length > 1 ? 'grid grid-cols-2 gap-2 mb-5' : 'mb-5'}>
      {safeImages.map((image, index) => (
        <div key={index} className="relative aspect-square">
          <Image
            src={image.thumb}
            alt={`image-${index}`}
            fill
            className="rounded-2xl object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
      ))}
    </div>
  )
}

function ExternalView({ embed }: { embed: AppBskyEmbedExternal.View }) {
  const hasThumbnail = embed.external.thumb
  return (
    <div className="rounded-2xl backdrop-blur-xl shadow-small h-fit hover:shadow-medium transition-shadow duration-200 my-5">
      <a
        target="_blank"
        rel="noreferrer noopener"
        href={embed.external.uri}
      >
        {/* External thumbnails can point to any host, so next/image cannot optimize them safely. */}
        {embed.external.thumb && (
          <img
            className="rounded-t-2xl"
            loading="lazy"
            src={embed.external.thumb}
            alt=""
          />
        )}
        <div className={hasThumbnail ? 'px-2 pb-3 border-x border-b rounded-b-2xl' : 'px-2 py-2 border-x border-y rounded-2xl'}>
          <p className="text-md font-bold">{embed.external.title}</p>
          <p className="text-sm pb-1">{embed.external.description}</p>
          <hr className="pb-1" />
          <p className="text-sm">{embed.external.uri.split('/')[2]}</p>
        </div>
      </a>
    </div>
  )
}

function ViewRecord({ record }: { record: unknown }) {
  const view = record as {
    value?: PostRecordFields | null
    author?: { handle: string; displayName?: string; avatar?: string } | null
    embeds?: EmbedView[] | null
    post?: { author?: { handle: string } } | null
  }

  if (!view?.value || !view.author) return null

  const firstEmbed = Array.isArray(view.embeds) ? view.embeds[0] : undefined
  const handleLink = `https://bsky.app/profile/${view.author.handle}`

  return (
    <div className="rounded-2xl backdrop-blur-xl shadow-small h-fit hover:shadow-medium transition-shadow duration-200 border mb-5">
      <div className="pb-4" />
      <div className="flex flex-row justify-between">
        <div className="flex gap-4 gap-y-4 rounded-2xl">
          <a
            target="_blank"
            rel="noreferrer noopener"
            href={handleLink}
            aria-label={`View @${view.author.handle} on Bluesky`}
          >
            <div className="h-16 w-16 shrink-0 rounded-full bg-gray-300 ml-5 relative">
              {view.author.avatar && (
                <Image src={view.author.avatar} alt="" fill className="rounded-full" />
              )}
            </div>
          </a>
          <p className="line-clamp-1 text-lg self-center flex flex-col">
            {view.author.displayName ?? view.post?.author?.handle}{' '}
            <a
              target="_blank"
              rel="noreferrer noopener"
              href={handleLink}
              className="text-gray-700 dark:text-gray-300 font-bold text-sm hover:underline"
            >
              @{view.author.handle}
            </a>
          </p>
        </div>
        <p className="self-center mr-5 text-sm">
          {getRenderTimeFromPost(view.value.createdAt)}
        </p>
      </div>
      <div className="py-3 px-5">
        <p
          className="text-lg"
          dangerouslySetInnerHTML={{ __html: getFormattedTextForRecord(view) }}
        />
        {firstEmbed?.$type === 'app.bsky.embed.images#view' && (
          <ImageEmbed images={firstEmbed.images} />
        )}
        {firstEmbed?.$type === 'app.bsky.embed.external#view' && (
          <ExternalView embed={firstEmbed} />
        )}
      </div>
    </div>
  )
}
