const PDS_URL = process.env.PDS_URL
const PDS_DID = process.env.PDS_DID

interface StandardDocument {
  uri: string
  value: {
    path: string
    [key: string]: unknown
  }
}

interface PdsListRecordsResponse {
  records: StandardDocument[]
  cursor?: string
  error?: string
  message?: string
}

// Promise that resolves to the cached map of normalized post path to AT URI.
// Set once and reused for the lifetime of the Node process.
let standardDocumentPromise: Promise<Map<string, string>> | null = null

// Fetch all site.standard.document records from the PDS.
async function fetchStandardDocuments(): Promise<StandardDocument[]> {
  if (!PDS_URL || !PDS_DID) {
    return []
  }

  const allRecords: StandardDocument[] = []
  let cursor: string | undefined

  // Paginate through all records.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const params = new URLSearchParams({
      repo: PDS_DID,
      collection: 'site.standard.document',
      limit: '100',
    })
    if (cursor) params.set('cursor', cursor)

    const res = await fetch(
      `${PDS_URL}/xrpc/com.atproto.repo.listRecords?${params}`
    )

    if (!res.ok) {
      return allRecords
    }

    const data: PdsListRecordsResponse = await res.json()

    if (data.error) {
      return allRecords
    }

    allRecords.push(...data.records)

    if (data.cursor) {
      cursor = data.cursor
    } else {
      break
    }
  }

  return allRecords
}

// Build a map of normalized post path to AT URI.
async function buildStandardDocumentMap(): Promise<Map<string, string>> {
  const records = await fetchStandardDocuments()
  const map = new Map<string, string>()

  for (const record of records) {
    // Normalize the path: strip leading/trailing slashes.
    // E.g., "/posts/test-standard-site/" -> "posts/test-standard-site"
    const normalizedPath = record.value.path
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')

    map.set(normalizedPath, record.uri)
  }

  return map
}

// Get the standard document AT URI for a given post slug.
// Fetches from the PDS once and caches the result for subsequent calls.
// Parallel callers share the same promise, so only one fetch runs.
export async function getStandardDocumentUri(
  slug: string
): Promise<string | null> {
  if (standardDocumentPromise === null) {
    standardDocumentPromise = buildStandardDocumentMap()
  }
  const cache = await standardDocumentPromise
  return cache.get(`posts/${slug}`) ?? null
}
