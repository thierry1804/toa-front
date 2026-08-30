import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MAX_FILE_BYTES, ingestFormData, rebuildFormData } from './blobStore'
import { resetOfflineDbForTests } from './offlineDb'

const stores: Record<string, Map<string, unknown>> = {
  blobs: new Map(),
}

vi.mock('idb', () => ({
  openDB: vi.fn((_, __, opts?: { upgrade?: (db: unknown) => void }) => {
    const db = {
      objectStoreNames: { contains: (name: string) => name in stores },
      createObjectStore: vi.fn((name: string) => {
        stores[name] = new Map()
      }),
      add: vi.fn(),
      getAll: vi.fn((store: string) => Promise.resolve([...stores[store].values()])),
      get: vi.fn((store: string, id: string) => Promise.resolve(stores[store].get(id))),
      put: vi.fn((store: string, item: { id: string }) => {
        stores[store].set(item.id, item)
        return Promise.resolve()
      }),
      delete: vi.fn((store: string, id: string) => {
        stores[store].delete(id)
        return Promise.resolve()
      }),
      clear: vi.fn((store: string) => {
        stores[store].clear()
        return Promise.resolve()
      }),
    }
    opts?.upgrade?.(db)
    return Promise.resolve(db)
  }),
}))

beforeEach(() => {
  stores.blobs = new Map()
  resetOfflineDbForTests()
})

describe('ingestFormData', () => {
  it('stores file parts and keeps text fields', async () => {
    const form = new FormData()
    form.append('type', 'PV')
    form.append('file', new File(['hello'], 'scan.jpg', { type: 'image/jpeg' }))

    const result = await ingestFormData(form)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.formParts).toEqual(
      expect.arrayContaining([
        { name: 'type', kind: 'text', value: 'PV' },
        expect.objectContaining({
          name: 'file',
          kind: 'file',
          filename: 'scan.jpg',
          mimeType: 'image/jpeg',
        }),
      ]),
    )

    const rebuilt = await rebuildFormData(result.formParts)
    expect(rebuilt.get('type')).toBe('PV')
    const file = rebuilt.get('file')
    expect(file).toBeInstanceOf(Blob)
  })

  it('rejects a file over the per-file quota', async () => {
    const file = new File(['x'], 'huge.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: MAX_FILE_BYTES + 1 })
    const form = new FormData()
    form.append('file', file)

    const result = await ingestFormData(form)

    expect(result).toEqual({ ok: false, reason: 'quota' })
    expect(stores.blobs.size).toBe(0)
  })
})
