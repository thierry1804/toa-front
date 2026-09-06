import type { OfflineSnapshot } from '@/types/offlineSnapshot'

export type SnapshotDocRef = {
  url: string
  filename: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
}

function entityId(value: unknown): string | undefined {
  const record = asRecord(value)
  if (!record) return undefined
  if (typeof record.id === 'string' || typeof record.id === 'number') return String(record.id)
  if (typeof record['@id'] === 'string') {
    const last = record['@id'].replace(/\/$/, '').split('/').pop()
    return last || undefined
  }
  return undefined
}

function extensionForMime(mimeType: unknown): string {
  if (typeof mimeType !== 'string') return 'bin'
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('png')) return 'png'
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg'
  if (mimeType.includes('webp')) return 'webp'
  return 'bin'
}

function filenameForDoc(doc: Record<string, unknown>, fallback: string): string {
  if (typeof doc.nom === 'string' && doc.nom.trim()) return doc.nom.trim()
  if (typeof doc.filename === 'string' && doc.filename.trim()) return doc.filename.trim()
  if (typeof doc.type === 'string' && doc.type.trim()) {
    return `${doc.type}.${extensionForMime(doc.mimeType)}`
  }
  return `${fallback}.${extensionForMime(doc.mimeType)}`
}

function pushDocs(
  out: Map<string, SnapshotDocRef>,
  parentId: string,
  basePath: string,
  documents: unknown,
) {
  if (!Array.isArray(documents)) return
  for (const raw of documents) {
    const doc = asRecord(raw)
    const docId = entityId(doc)
    if (!doc || !docId) continue
    const url = `${basePath}/${parentId}/documents/${docId}/download`
    if (out.has(url)) continue
    out.set(url, { url, filename: filenameForDoc(doc, docId) })
  }
}

function collectFromEntities(
  out: Map<string, SnapshotDocRef>,
  items: unknown[] | undefined,
  basePath: string,
) {
  if (!items) return
  for (const item of items) {
    const record = asRecord(item)
    const id = entityId(record)
    if (!record || !id) continue
    pushDocs(out, id, basePath, record.documents)

    if (Array.isArray(record.permitsGroupe)) {
      for (const companion of record.permitsGroupe) {
        const companionRecord = asRecord(companion)
        const companionId = entityId(companionRecord)
        if (!companionRecord || !companionId) continue
        pushDocs(out, companionId, basePath, companionRecord.documents)
      }
    }
  }
}

function collectFromInterventions(out: Map<string, SnapshotDocRef>, items: unknown[] | undefined) {
  if (!items) return
  for (const item of items) {
    const record = asRecord(item)
    if (!record) continue
    const suivis = Array.isArray(record.suivisJournaliers)
      ? record.suivisJournaliers
      : Array.isArray(record.suivis)
        ? record.suivis
        : []
    for (const suivi of suivis) {
      const suiviRecord = asRecord(suivi)
      const suiviId = entityId(suiviRecord)
      if (!suiviRecord || !suiviId) continue
      pushDocs(out, suiviId, '/api/suivis-journaliers', suiviRecord.documents)
    }
  }
}

export function collectSnapshotDocuments(snapshot: OfflineSnapshot): SnapshotDocRef[] {
  const out = new Map<string, SnapshotDocRef>()
  collectFromEntities(out, snapshot.plansPrevention, '/api/plans-prevention')
  collectFromEntities(out, snapshot.permitsTravail, '/api/permits-travail')
  collectFromInterventions(out, snapshot.interventions)
  return [...out.values()]
}
