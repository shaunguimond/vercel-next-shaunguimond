import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('Standard Site document lookup', () => {
  it('normalizes paths and follows PDS pagination', async () => {
    vi.stubEnv('PDS_URL', 'https://pds.example')
    vi.stubEnv('PDS_DID', 'did:plc:example')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          records: [
            { uri: 'at://did:plc:example/site.standard.document/one', value: { path: '/posts/hello/' } },
          ],
          cursor: 'next-page',
        })
      )
      .mockResolvedValueOnce(
        Response.json({
          records: [
            { uri: 'at://did:plc:example/site.standard.document/two', value: { path: 'posts/other' } },
          ],
        })
      )
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()

    const { getStandardDocumentUri } = await import('./pds')
    const uri = await getStandardDocumentUri('hello')

    expect(uri).toBe('at://did:plc:example/site.standard.document/one')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(new URL(fetchMock.mock.calls[1][0] as string).searchParams.get('cursor')).toBe(
      'next-page'
    )
  })

  it('does not return a partial mapping if a later page fails', async () => {
    vi.stubEnv('PDS_URL', 'https://pds.example')
    vi.stubEnv('PDS_DID', 'did:plc:example')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          records: [
            { uri: 'at://did:plc:example/site.standard.document/one', value: { path: 'posts/hello' } },
          ],
          cursor: 'next-page',
        })
      )
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)
    vi.resetModules()

    const { getStandardDocumentUri } = await import('./pds')
    expect(await getStandardDocumentUri('hello')).toBeNull()
  })
})
