import { describe, it, expect, vi } from 'vitest'
import { collectExtrasPdfs, collectSnapshotDocuments } from './collectSnapshotDocuments'

describe('collectSnapshotDocuments', () => {
  it('collects plan, permit and suivi document download URLs', () => {
    const refs = collectSnapshotDocuments({
      generatedAt: '2026-01-01T00:00:00Z',
      userId: 1,
      plansPrevention: [
        {
          id: 'pl1',
          documents: [{ id: 'd1', type: 'PV', mimeType: 'application/pdf' }],
        },
      ],
      permitsTravail: [
        {
          id: 'pt1',
          documents: [{ id: 'd2', type: 'ATTESTATION', mimeType: 'image/jpeg' }],
        },
      ],
      interventions: [
        {
          id: 'i1',
          suivisJournaliers: [
            {
              id: 's1',
              documents: [{ id: 'd3', nom: 'photo.jpg', mimeType: 'image/jpeg' }],
            },
          ],
        },
      ],
    })

    expect(refs).toEqual(
      expect.arrayContaining([
        {
          url: '/api/plans-prevention/pl1/documents/d1/download',
          filename: 'PV.pdf',
        },
        {
          url: '/api/permits-travail/pt1/documents/d2/download',
          filename: 'ATTESTATION.jpg',
        },
        {
          url: '/api/suivis-journaliers/s1/documents/d3/download',
          filename: 'photo.jpg',
        },
      ]),
    )
    expect(refs).toHaveLength(3)
  })

  it('dedupes by URL and reads suivis under alternate key', () => {
    const refs = collectSnapshotDocuments({
      generatedAt: '2026-01-01T00:00:00Z',
      userId: 1,
      interventions: [
        {
          id: 'i1',
          suivis: [
            {
              id: 's1',
              documents: [
                { id: 'd3', nom: 'a.jpg', mimeType: 'image/jpeg' },
                { id: 'd3', nom: 'a.jpg', mimeType: 'image/jpeg' },
              ],
            },
          ],
        },
      ],
    })

    expect(refs).toEqual([
      {
        url: '/api/suivis-journaliers/s1/documents/d3/download',
        filename: 'a.jpg',
      },
    ])
  })

  it('includes companion permit group documents', () => {
    const refs = collectSnapshotDocuments({
      generatedAt: '2026-01-01T00:00:00Z',
      userId: 1,
      permitsTravail: [
        {
          id: 'pt1',
          documents: [],
          permitsGroupe: [
            {
              id: 'pt2',
              documents: [{ id: 'd9', type: 'PLAN', mimeType: 'application/pdf' }],
            },
          ],
        },
      ],
    })

    expect(refs).toEqual([
      {
        url: '/api/permits-travail/pt2/documents/d9/download',
        filename: 'PLAN.pdf',
      },
    ])
  })
})

describe('prefetchSnapshotDocuments', () => {
  it('downloads each document and stores it in the doc cache', async () => {
    const put = vi.fn().mockResolvedValue(true)
    const fetchBlob = vi.fn(async (url: string) => new Blob([url], { type: 'application/pdf' }))
    const onProgress = vi.fn()

    const { prefetchSnapshotDocuments } = await import('./prefetchSnapshotDocuments')

    const result = await prefetchSnapshotDocuments(
      [
        { url: '/api/a/download', filename: 'a.pdf' },
        { url: '/api/b/download', filename: 'b.pdf' },
      ],
      { fetchBlob, putCachedDocument: put, onProgress, concurrency: 2 },
    )

    expect(fetchBlob).toHaveBeenCalledTimes(2)
    expect(put).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ total: 2, cached: 2, skipped: 0, failed: 0 })
    expect(onProgress).toHaveBeenCalledWith(
      expect.objectContaining({ phase: 'documents', loaded: 2, total: 2 }),
    )
  })

  it('continues when one download fails', async () => {
    const put = vi.fn().mockResolvedValue(true)
    const fetchBlob = vi.fn(async (url: string) => {
      if (url.includes('/a/')) throw new Error('404')
      return new Blob(['ok'])
    })

    const { prefetchSnapshotDocuments } = await import('./prefetchSnapshotDocuments')
    const result = await prefetchSnapshotDocuments(
      [
        { url: '/api/a/download', filename: 'a.pdf' },
        { url: '/api/b/download', filename: 'b.pdf' },
      ],
      { fetchBlob, putCachedDocument: put, concurrency: 1 },
    )

    expect(result).toEqual({ total: 2, cached: 1, skipped: 0, failed: 1 })
  })

  it('skips « non applicable » markers (no file to download)', () => {
    const refs = collectSnapshotDocuments({
      generatedAt: '2026-01-01T00:00:00Z',
      userId: 1,
      plansPrevention: [
        {
          id: 'pl1',
          documents: [
            { id: 'd1', type: 'FDS', filePath: 'plans/fds.pdf', mimeType: 'application/pdf' },
            { id: 'd2', type: 'LISTE_VEHICULES', filePath: '', mimeType: '', nonApplicable: true },
          ],
        },
      ],
    })

    expect(refs.map((r) => r.url)).toEqual(['/api/plans-prevention/pl1/documents/d1/download'])
  })

  it('turns the generated PDFs of the extras into documents to prefetch', () => {
    expect(collectExtrasPdfs(undefined)).toEqual([])
    expect(
      collectExtrasPdfs({
        generatedAt: 't',
        permitsDocumentsRequis: [],
        planificationsDisponibles: [],
        generatedPdfs: [{ downloadPath: '/api/permits-travail/pt1/pdf/download', nom: 'permit_travail.pdf' }],
      }),
    ).toEqual([{ url: '/api/permits-travail/pt1/pdf/download', filename: 'permit_travail.pdf' }])
  })
})
