import { describe, it, expect } from 'vitest'
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
})
