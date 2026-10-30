const PDS_URL = process.env.PDS_URL
const PDS_DID = process.env.PDS_DID

// Keep a hung PDS from stalling ISR regeneration.
const PDS_TIMEOUT_MS = 10_000
const CACHE_TTL_MS = 5 * 60_000
const FAILURE_RETRY_MS = 30_000

interface StandardDocument {
  uri: string
  value: {
    path: string
    [key: string]: unknown
  }
}

interface PdsListRecordsResponse {
  records?: StandardDocument[]
  cursor?: string
  error?: string
  message?: string
}

interface CachedDocumentMap {
  value: Map<string, string>
  expiresAt: number
}

let cachedDocumentMap: CachedDocumentMap | null = null
let refreshPromise: Promise<Map<string, string> | null> | null = null

// Fetch every site.standard.document record. Return null on an incomplete
// response so a partial result is never mistaken for a complete cache.
async function fetchStandardDocuments(): Promise<StandardDocument[] | null> {
  if (!PDS_URL || !PDS_DID) {
    return []
  }

  const allRecords: StandardDocument[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  while (true) {
    const params = new URLSearchParams({
      repo: PDS_DID,
      collection: 'site.standard.document',
      limit: '100',
    })
    if (cursor) params.set('cursor', cursor)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PDS_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(
        `${PDS_URL}/xrpc/com.atproto.repo.listRecords?${params}`,
        { signal: controller.signal }
      )
    } catch {
      return null
    } finally {
      clearTimeout(timeout)
    }

    if (!res.ok) return null

    let data: PdsListRecordsResponse
    try {
      data = await res.json()
    } catch {
      return null
    }

    if (data.error || !Array.isArray(data.records)) return null
    allRecords.push(...data.records)

    if (!data.cursor) break
    if (seenCursors.has(data.cursor)) return null
    seenCursors.add(data.cursor)
    cursor = data.cursor
  }

  return allRecords
}

// Build a map of normalized post path to AT URI. A null result means the
// refresh failed and callers should keep using any stale cache they have.
async function buildStandardDocumentMap(): Promise<Map<string, string> | null> {
  const records = await fetchStandardDocuments()
  if (!records) return null

  const map = new Map<string, string>()
  for (const record of records) {
    const normalizedPath = record.value.path
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')
    map.set(normalizedPath, record.uri)
  }

  return map
}

async function getStandardDocumentMap(): Promise<Map<string, string>> {
  if (cachedDocumentMap && cachedDocumentMap.expiresAt > Date.now()) {
    return cachedDocumentMap.value
  }

  if (!refreshPromise) {
    refreshPromise = buildStandardDocumentMap()
  }

  try {
    const refreshed = await refreshPromise
    if (refreshed) {
      cachedDocumentMap = {
        value: refreshed,
        expiresAt: Date.now() + CACHE_TTL_MS,
      }
    } else if (!cachedDocumentMap) {
      // Avoid retrying on every request during an initial PDS outage.
      cachedDocumentMap = {
        value: new Map(),
        expiresAt: Date.now() + FAILURE_RETRY_MS,
      }
    }
  } finally {
    refreshPromise = null
  }

  return cachedDocumentMap?.value ?? new Map()
}

// Get the standard document AT URI for a given post slug. The map refreshes
// periodically, and failed refreshes leave the last known good map in place.
export async function getStandardDocumentUri(
  slug: string
): Promise<string | null> {
  const cache = await getStandardDocumentMap()
  return cache.get(`posts/${slug}`) ?? null
}
