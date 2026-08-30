import { getOfflineDb, BLOB_STORE } from './offlineDb'
import type { FormPart } from './syncQueue'

export const MAX_FILE_BYTES = 15 * 1024 * 1024
export const MAX_TOTAL_BYTES = 80 * 1024 * 1024

export type StoredBlob = {
  id: string
  blob: Blob
  filename: string
  mimeType: string
  size: number
}

async function totalBytes(): Promise<number> {
  const db = await getOfflineDb()
  const all = (await db.getAll(BLOB_STORE)) as StoredBlob[]
  return all.reduce((sum, item) => sum + (item.size ?? 0), 0)
}

export async function putBlob(
  blob: Blob,
  filename: string,
  mimeType: string,
): Promise<string> {
  const db = await getOfflineDb()
  const id = crypto.randomUUID()
  const record: StoredBlob = {
    id,
    blob,
    filename,
    mimeType,
    size: blob.size,
  }
  await db.put(BLOB_STORE, record)
  return id
}

export async function getBlob(id: string): Promise<StoredBlob | undefined> {
  const db = await getOfflineDb()
  return db.get(BLOB_STORE, id)
}

export async function deleteBlob(id: string): Promise<void> {
  const db = await getOfflineDb()
  await db.delete(BLOB_STORE, id)
}

export async function deleteBlobsForParts(parts: FormPart[] | undefined): Promise<void> {
  if (!parts) return
  for (const part of parts) {
    if (part.kind === 'file' && part.blobId) {
      await deleteBlob(part.blobId)
    }
  }
}

export async function clearBlobs(): Promise<void> {
  const db = await getOfflineDb()
  await db.clear(BLOB_STORE)
}

export async function ingestFormData(
  form: FormData,
): Promise<{ ok: true; formParts: FormPart[] } | { ok: false; reason: 'quota' }> {
  const incoming: Array<{ name: string; file: File | Blob; filename: string; mimeType: string }> = []
  const texts: Array<{ name: string; value: string }> = []

  for (const [name, value] of form.entries()) {
    if (value instanceof Blob) {
      const filename = value instanceof File ? value.name : 'blob'
      const mimeType = value.type || 'application/octet-stream'
      incoming.push({ name, file: value, filename, mimeType })
    } else {
      texts.push({ name, value: String(value) })
    }
  }

  for (const item of incoming) {
    if (item.file.size > MAX_FILE_BYTES) {
      return { ok: false, reason: 'quota' }
    }
  }

  const extra = incoming.reduce((sum, item) => sum + item.file.size, 0)
  if ((await totalBytes()) + extra > MAX_TOTAL_BYTES) {
    return { ok: false, reason: 'quota' }
  }

  const formParts: FormPart[] = []
  for (const text of texts) {
    formParts.push({ name: text.name, kind: 'text', value: text.value })
  }
  for (const item of incoming) {
    const blobId = await putBlob(item.file, item.filename, item.mimeType)
    formParts.push({
      name: item.name,
      kind: 'file',
      blobId,
      filename: item.filename,
      mimeType: item.mimeType,
    })
  }

  return { ok: true, formParts }
}

export async function rebuildFormData(parts: FormPart[]): Promise<FormData> {
  const form = new FormData()
  for (const part of parts) {
    if (part.kind === 'text') {
      form.append(part.name, part.value ?? '')
      continue
    }
    if (!part.blobId) continue
    const stored = await getBlob(part.blobId)
    if (!stored) {
      throw new Error(`Missing offline blob ${part.blobId}`)
    }
    form.append(part.name, stored.blob, part.filename ?? stored.filename)
  }
  return form
}
