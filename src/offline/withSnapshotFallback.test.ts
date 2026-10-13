import { describe, it, expect, vi } from 'vitest'
import { withSnapshotFallback } from './withSnapshotFallback'

describe('withSnapshotFallback', () => {
  it('returns the network result when it succeeds', async () => {
    const result = await withSnapshotFallback(
      async () => 'online',
      async () => 'offline',
    )
    expect(result).toBe('online')
  })

  it('returns local data when the network fails', async () => {
    const result = await withSnapshotFallback(
      async () => {
        throw new Error('network')
      },
      async () => 'cached',
    )
    expect(result).toBe('cached')
  })

  it.each([401, 403])('never exposes cached data after an HTTP %s refusal', async (status) => {
    const local = vi.fn(async () => 'cached')
    const refusal = { response: { status } }

    await expect(
      withSnapshotFallback(
        async () => {
          throw refusal
        },
        local,
      ),
    ).rejects.toBe(refusal)
    expect(local).not.toHaveBeenCalled()
  })

  it('rethrows when network fails and local is empty', async () => {
    await expect(
      withSnapshotFallback(
        async () => {
          throw new Error('network')
        },
        async () => undefined,
      ),
    ).rejects.toThrow('network')
  })

  it('reads local first when the browser is offline', async () => {
    const previous = navigator.onLine
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    try {
      const network = async () => 'online'
      const result = await withSnapshotFallback(network, async () => 'cached')
      expect(result).toBe('cached')
    } finally {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: previous })
    }
  })
})
