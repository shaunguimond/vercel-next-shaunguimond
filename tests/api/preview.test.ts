import type { NextApiRequest, NextApiResponse } from 'next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPreviewPost } from '../../lib/api'
import preview from '../../pages/api/preview'

vi.mock('../../lib/api', () => ({
  getPreviewPost: vi.fn(),
}))

function makeResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setPreviewData: vi.fn(),
    writeHead: vi.fn().mockReturnThis(),
    end: vi.fn(),
  }
}

describe('WordPress preview route', () => {
  beforeEach(() => {
    vi.stubEnv('WORDPRESS_PREVIEW_SECRET', 'test-secret')
    vi.mocked(getPreviewPost).mockReset()
  })

  it('rejects an invalid secret without querying WordPress', async () => {
    const res = makeResponse()

    await preview(
      { query: { secret: 'wrong', id: '42' } } as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    )

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' })
    expect(getPreviewPost).not.toHaveBeenCalled()
  })

  it('stores the verified post and redirects using the CMS slug', async () => {
    vi.mocked(getPreviewPost).mockResolvedValue({
      databaseId: 42,
      slug: 'preview-post',
      status: 'draft',
    })
    const res = makeResponse()

    await preview(
      { query: { secret: 'test-secret', id: '42' } } as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    )

    expect(getPreviewPost).toHaveBeenCalledWith('42', 'DATABASE_ID')
    expect(res.setPreviewData).toHaveBeenCalledWith({
      post: { id: 42, slug: 'preview-post', status: 'draft' },
    })
    expect(res.writeHead).toHaveBeenCalledWith(307, {
      Location: '/posts/preview-post',
    })
    expect(res.end).toHaveBeenCalled()
  })

  it('treats the secret committed to this repository as no secret', async () => {
    // `.env` carries this value in git, so a visitor who presents it has proven
    // only that they read the repository.
    vi.stubEnv('WORDPRESS_PREVIEW_SECRET', 'a-strong-preview-secret-key-change-in-production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = makeResponse()

    await preview(
      {
        query: {
          secret: 'a-strong-preview-secret-key-change-in-production',
          id: '42',
        },
      } as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    )

    expect(res.status).toHaveBeenCalledWith(401)
    expect(getPreviewPost).not.toHaveBeenCalled()
    expect(res.setPreviewData).not.toHaveBeenCalled()
    // The log line is how a deployment finds out preview mode never turned on.
    expect(warn.mock.calls.map(([message]) => message).join('')).toContain(
      'Preview mode is disabled'
    )
    warn.mockRestore()
  })

  it('refuses every request while the deployment sets no secret', async () => {
    vi.stubEnv('WORDPRESS_PREVIEW_SECRET', '')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = makeResponse()

    await preview(
      { query: { secret: '', id: '42' } } as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    )

    expect(res.status).toHaveBeenCalledWith(401)
    expect(getPreviewPost).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
