import type { AppBskyFeedDefs, AppBskyFeedGetAuthorFeed } from '@atproto/api'
import { BSKY_AUTHOR_FEED } from './constants'

const PDS_URL = process.env.PDS_URL
const PDS_DID = process.env.PDS_DID
const FETCH_TIMEOUT_MS = 8_000
const PDS_PAGE_SIZE = 100
const PDS_MAX_PAGES = 20
const MAX_ACTIVITY_ITEMS = 12

type PdsRecord = {
  uri: string
  value: Record<string, unknown>
}

type ActivityBase = {
  id: string
  date: string
}

export type AtmosphereActivity =
  | (ActivityBase & {
      type: 'bluesky'
      post: AppBskyFeedDefs.PostView
      reposted: boolean
    })
  | (ActivityBase & {
      type: 'book'
      title: string
      authors?: string
      stars?: number
      href: string
    })
  | (ActivityBase & {
      type: 'repository'
      name: string
      description?: string
      href: string
    })
  | (ActivityBase & {
      type: 'position'
      title: string
      company?: string
      href: string
    })

export async function getRecentBlueskyActivities(): Promise<AtmosphereActivity[]> {
  try {
    const response = await fetch(BSKY_AUTHOR_FEED, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!response.ok) return []

    const data = (await response.json()) as AppBskyFeedGetAuthorFeed.OutputSchema
    if (!Array.isArray(data.feed)) return []

    return data.feed.flatMap((item) => {
      const record = item.post.record as { createdAt?: unknown }
      const date = parseDate(record.createdAt) ?? parseDate(item.post.indexedAt)
      if (!date) return []

      return [
        {
          id: item.post.uri,
          type: 'bluesky' as const,
          date,
          post: item.post,
          reposted: item.reason?.$type === 'app.bsky.feed.defs#reasonRepost',
        },
      ]
    })
  } catch {
    return []
  }
}

export async function getPdsActivities(): Promise<AtmosphereActivity[]> {
  const [booksResult, tangledDeclarationsResult, tangledReposResult, positionsResult] =
    await Promise.allSettled([
      listAllRecords('buzz.bookhive.book'),
      listAllRecords('org.tangled.repo.declaration'),
      listAllRecords('sh.tangled.repo'),
      listAllRecords('id.sifa.profile.position'),
    ])

  const books = booksResult.status === 'fulfilled' ? booksResult.value : []
  const tangledDeclarations =
    tangledDeclarationsResult.status === 'fulfilled' ? tangledDeclarationsResult.value : []
  const tangledRepos = tangledReposResult.status === 'fulfilled' ? tangledReposResult.value : []
  const positions = positionsResult.status === 'fulfilled' ? positionsResult.value : []

  return [
    ...getFinishedBooks(books),
    ...getCreatedRepositories(tangledDeclarations, tangledRepos),
    ...getCurrentPosition(positions),
  ]
}

export function mergeAtmosphereActivities(
  ...sources: AtmosphereActivity[][]
): AtmosphereActivity[] {
  const allActivities = sources.flat().sort((a, b) => b.date.localeCompare(a.date))
  const includedIds = new Set<string>()
  const selected: AtmosphereActivity[] = []
  const selectedTypes = new Set<AtmosphereActivity['type']>()

  // Keep the newest entry from every source represented before filling the
  // remaining space with the newest activity overall.
  for (const activity of allActivities) {
    if (selectedTypes.has(activity.type)) continue
    selected.push(activity)
    selectedTypes.add(activity.type)
    includedIds.add(activity.id)
  }

  for (const activity of allActivities) {
    if (selected.length >= MAX_ACTIVITY_ITEMS) break
    if (includedIds.has(activity.id)) continue
    selected.push(activity)
    includedIds.add(activity.id)
  }

  return selected.sort((a, b) => b.date.localeCompare(a.date))
}

async function listAllRecords(collection: string): Promise<PdsRecord[]> {
  if (!PDS_URL || !PDS_DID) return []

  const records: PdsRecord[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  for (let page = 0; page < PDS_MAX_PAGES; page += 1) {
    const params = new URLSearchParams({
      repo: PDS_DID,
      collection,
      limit: String(PDS_PAGE_SIZE),
    })
    if (cursor) params.set('cursor', cursor)

    const response = await fetch(`${PDS_URL}/xrpc/com.atproto.repo.listRecords?${params}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`Failed to list ${collection} records`)

    const data = (await response.json()) as {
      records?: PdsRecord[]
      cursor?: string
      error?: string
    }
    if (data.error || !Array.isArray(data.records)) {
      throw new Error(`Invalid ${collection} records response`)
    }
    records.push(...data.records)

    if (!data.cursor) return records
    if (seenCursors.has(data.cursor)) throw new Error(`Repeated cursor for ${collection}`)
    seenCursors.add(data.cursor)
    cursor = data.cursor
  }

  throw new Error(`Too many ${collection} records pages`)
}

function getFinishedBooks(records: PdsRecord[]): AtmosphereActivity[] {
  return records.flatMap(({ uri, value }) => {
    if (value.status !== 'buzz.bookhive.defs#finished') return []
    const date = parseDate(value.finishedAt)
    const title = nonEmptyString(value.title)
    const hiveId = nonEmptyString(value.hiveId) ?? getHiveBookId(value.hiveBookUri)
    if (!date || !title || !hiveId) return []

    return [
      {
        id: uri,
        type: 'book' as const,
        date,
        title,
        ...(nonEmptyString(value.authors) ? { authors: nonEmptyString(value.authors) } : {}),
        ...(typeof value.stars === 'number' ? { stars: value.stars } : {}),
        href: `https://bookhive.buzz/books/${encodeURIComponent(hiveId)}`,
      },
    ]
  })
}

function getCreatedRepositories(
  declarations: PdsRecord[],
  repoDetails: PdsRecord[],
): AtmosphereActivity[] {
  const detailByName = new Map(
    repoDetails.map((record) => [record.uri.split('/').at(-1) ?? '', record]),
  )
  const repositories = new Map<string, PdsRecord>()

  for (const declaration of declarations) {
    const name = declaration.uri.split('/').at(-1) ?? ''
    const details = detailByName.get(name)
    repositories.set(name, {
      uri: declaration.uri,
      value: { ...details?.value, ...declaration.value },
    })
  }
  for (const details of repoDetails) {
    const name = details.uri.split('/').at(-1) ?? ''
    if (!repositories.has(name)) repositories.set(name, details)
  }

  return [...repositories.entries()].flatMap(([rkey, { uri, value }]) => {
    const date = parseDate(value.createdAt)
    if (!date || !rkey) return []
    const name = nonEmptyString(value.name) ?? rkey

    return [
      {
        id: uri,
        type: 'repository' as const,
        date,
        name,
        ...(nonEmptyString(value.description)
          ? { description: nonEmptyString(value.description) }
          : {}),
        href: `https://tangled.org/shaunguimond.com/${encodeURIComponent(rkey)}`,
      },
    ]
  })
}

function getCurrentPosition(records: PdsRecord[]): AtmosphereActivity[] {
  const positions = records
    .filter(({ value }) => !nonEmptyString(value.endedAt))
    .map(({ uri, value }) => ({
      uri,
      value,
      date: parseDate(value.startedAt),
    }))
    .filter((position): position is typeof position & { date: string } => Boolean(position.date))
    .sort((a, b) => b.date.localeCompare(a.date))

  const position = positions[0]
  const title = nonEmptyString(position?.value.title)
  if (!position || !title) return []

  return [
    {
      id: position.uri,
      type: 'position',
      date: position.date,
      title,
      ...(nonEmptyString(position.value.company)
        ? { company: nonEmptyString(position.value.company) }
        : {}),
      href: 'https://sifa.id/p/shaunguimond.com',
    },
  ]
}

function getHiveBookId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const match = value.match(/\/buzz\.bookhive\.catalogBook\/([^/]+)$/)
  return match?.[1]
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function parseDate(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}
