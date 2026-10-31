'use client'

import { useTheme } from 'next-themes'
import type { AtmosphereActivity } from '../lib/atmosphere-feed'
import BskyPostCard from './Bluesky/bsky-post-card'

export default function AtmosphereSection({ activities }: { activities: AtmosphereActivity[] }) {
  const { systemTheme, theme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme
  const fillColor = currentTheme === 'dark' ? 'white' : 'black'

  return (
    <section className="mx-1" aria-labelledby="atmosphere-heading">
      <h2 id="atmosphere-heading" className="my-8 text-center text-3xl font-bold">
        Latest from the Atmosphere
      </h2>
      {activities.length > 0 ? (
        <div className="columns-1 gap-6 mb-32 sm:columns-2">
          {activities.map((activity) => {
            if (activity.type === 'bluesky') {
              return (
                <BskyPostCard
                  key={activity.id}
                  post={activity.post}
                  reposted={activity.reposted}
                  fillColor={fillColor}
                />
              )
            }

            return <ActivityCard key={activity.id} activity={activity} />
          })}
        </div>
      ) : (
        <p className="mb-32 text-center text-daccent-1/70 dark:text-accent-1/70">
          Recent activity is temporarily unavailable.
        </p>
      )}
    </section>
  )
}

function ActivityCard({
  activity,
}: {
  activity: Exclude<AtmosphereActivity, { type: 'bluesky' }>
}) {
  const source =
    activity.type === 'book' ? 'BookHive' : activity.type === 'repository' ? 'Tangled' : 'Sifa'

  return (
    <article className="break-inside mb-5 h-fit rounded-2xl bg-sg-multicolour shadow-small transition-shadow duration-200 hover:shadow-medium">
      <div className="rounded-2xl border border-accent-1/20 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-daccent-2 px-3 py-1 text-xs font-semibold text-accent-1">
            {source}
          </span>
          <time
            className="text-sm text-daccent-1/70 dark:text-accent-1/70"
            dateTime={activity.date}
          >
            {activity.type === 'position'
              ? `Since ${formatActivityDate(activity.date, true)}`
              : formatActivityDate(activity.date)}
          </time>
        </div>

        {activity.type === 'book' ? (
          <>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-daccent-1/70 dark:text-accent-1/70">
              Finished reading
            </p>
            <h3 className="text-xl font-bold">{activity.title}</h3>
            {activity.authors && <p className="mt-1 text-sm">by {activity.authors}</p>}
            {activity.stars && (
              <p className="mt-2 text-sm" aria-label={`${activity.stars} out of 5 stars`}>
                {'★'.repeat(Math.max(0, Math.min(5, Math.round(activity.stars))))}
              </p>
            )}
            <ActivityLink href={activity.href}>View book on BookHive</ActivityLink>
          </>
        ) : activity.type === 'repository' ? (
          <>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-daccent-1/70 dark:text-accent-1/70">
              New repository
            </p>
            <h3 className="text-xl font-bold">{activity.name}</h3>
            {activity.description && <p className="mt-2 line-clamp-4">{activity.description}</p>}
            <ActivityLink href={activity.href}>View repository on Tangled</ActivityLink>
          </>
        ) : (
          <>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-daccent-1/70 dark:text-accent-1/70">
              Current role
            </p>
            <h3 className="text-xl font-bold">{activity.title}</h3>
            {activity.company && <p className="mt-1">at {activity.company}</p>}
            <ActivityLink href={activity.href}>View profile on Sifa</ActivityLink>
          </>
        )}
      </div>
    </article>
  )
}

function ActivityLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="mt-5 block rounded-lg bg-brand px-4 py-2 text-center font-bold text-white hover:shadow-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
    >
      {children}
    </a>
  )
}

function formatActivityDate(value: string, monthOnly = false) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('en-CA', {
    month: monthOnly ? 'long' : 'short',
    day: monthOnly ? undefined : 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}
