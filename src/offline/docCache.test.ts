import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resetOfflineDbForTests } from './offlineDb'

const stores: Record<string, Map<string, unknown>> = {
  blobs: new Map(),
  'doc-cache': new Map(),
}

vi.mock('idb', () => ({
  openDB: vi.fn((_, __, opts?: { upgrade?: (db: unknown) => void }) => {
    const db = {
      objectStoreNames: { contains: (name: string) => name in stores },
      createObjectStore: vi.fn((name: string) => {
        stores[name] = new Map()
      }),
      getAll: vi.fn((store: string) => Promise.resolve([...(stores[store]?.values() ?? [])])),
      get: vi.fn((store: string, id: string) => Promise.resolve(stores[store]?.get(id))),
      put: vi.fn((store: string, item: { url?: string; id?: string }) => {
        const key = item.url ?? item.id
        if (key != null) stores[store].set(String(key), item)
        return Promise.resolve()
      }),
      delete: vi.fn((store: string, id: string) => {
        stores[store]?.delete(id)
        return Promise.resolve()
      }),
      clear: vi.fn((store: string) => {
        stores[store]?.clear()
        return Promise.resolve()
      }),
    }
    opts?.upgrade?.(db)
    return Promise.resolve(db)
  }),
}))

beforeEach(() => {
  stores.blobs = new Map()
  stores['doc-cache'] = new Map()
  resetOfflineDbForTests()
})

describe('docCache', () => {
  it('stores a downloaded document by URL and reads it back', async () => {
    const { putCachedDocument, getCachedDocument } = await import('./docCache')
    const blob = new Blob(['pdf-bytes'], { type: 'application/pdf' })
    const url = '/api/permits-travail/p1/documents/d1/download'

    await putCachedDocument(url, blob, 'scan.pdf')

    const cached = await getCachedDocument(url)
    expect(cached?.filename).toBe('scan.pdf')
    expect(cached?.mimeType).toBe('application/pdf')
    expect(await cached?.blob.text()).toBe('pdf-bytes')
  })

  it('returns undefined for an unknown URL', async () => {
    const { getCachedDocument } = await import('./docCache')
    await expect(getCachedDocument('/api/missing')).resolves.toBeUndefined()
  })
})

describe('withCachedDocumentBlob', () => {
  it('saves the network blob then serves it when offline', async () => {
    const { withCachedDocumentBlob, getCachedDocument } = await import('./docCache')
    const url = '/api/plans-prevention/pl1/documents/d2/download'
    const networkBlob = new Blob(['plan'], { type: 'application/pdf' })

    const online = await withCachedDocumentBlob(url, async () => networkBlob, {
      filename: 'plan.pdf',
    })
    expect(await online.text()).toBe('plan')
    expect((await getCachedDocument(url))?.filename).toBe('plan.pdf')

    const previous = navigator.onLine
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    try {
      const offline = await withCachedDocumentBlob(url, async () => {
        throw new Error('network')
      })
      expect(await offline.text()).toBe('plan')
    } finally {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: previous })
    }
  })

  it('rethrows when offline and nothing is cached', async () => {
    const { withCachedDocumentBlob } = await import('./docCache')
    const previous = navigator.onLine
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    try {
      await expect(
        withCachedDocumentBlob('/api/none', async () => {
          throw new Error('network')
        }),
      ).rejects.toThrow('network')
    } finally {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: previous })
    }
  })

  it('falls back to the Workbox cache when IndexedDB is empty', async () => {
    const { withCachedDocumentBlob } = await import('./docCache')
    const swBlob = new Blob(['from-sw'], { type: 'application/pdf' })
    const match = { ok: true, blob: async () => swBlob }
    const open = vi.fn(async () => ({
      match: vi.fn(async () => match),
    }))
    vi.stubGlobal('caches', { open })

    const previous = navigator.onLine
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    try {
      const blob = await withCachedDocumentBlob('/api/permits-travail/p1/documents/d1/download', async () => {
        throw new Error('network')
      })
      expect(await blob.text()).toBe('from-sw')
    } finally {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: previous })
      vi.unstubAllGlobals()
    }
  })

  it('derives the status of a generated PDF from the local copy (offline « Télécharger » instead of « Générer »)', async () => {
    const { putCachedDocument, cachedPdfStatus } = await import('./docCache')
    const url = '/api/permits-travail/pt1/pdf/download'

    expect(await cachedPdfStatus(url)).toBeUndefined()

    await putCachedDocument(url, new Blob(['%PDF-1.4'], { type: 'application/pdf' }), 'permit_travail.pdf')

    expect(await cachedPdfStatus(url)).toMatchObject({ statut: 'GENERE', tailleFichier: 8 })
  })
})
