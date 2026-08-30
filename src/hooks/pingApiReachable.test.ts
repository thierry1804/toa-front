import { describe, it, expect, vi, afterEach } from 'vitest'
import { pingApiReachable } from './pingApiReachable'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('pingApiReachable', () => {
  it('returns true when fetch succeeds (including 401/404)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    )

    await expect(pingApiReachable()).resolves.toBe(true)
  })

  it('returns false on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(pingApiReachable()).resolves.toBe(false)
  })
})
