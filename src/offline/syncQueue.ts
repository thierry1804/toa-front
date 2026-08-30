import { getOfflineDb, QUEUE_STORE, FAILED_STORE } from './offlineDb'

export type FormPart = {
  name: string
  kind: 'file' | 'text'
  value?: string
  blobId?: string
  filename?: string
  mimeType?: string
}

export interface SyncItem {
  id: string
  url: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  contentType?: string
  formParts?: FormPart[]
  createdAt: number
  retries: number
}

type Listener = () => void
const listeners = new Set<Listener>()
function notify() {
  listeners.forEach((listener) => listener())
}

export const syncQueue = {
  async add(item: Omit<SyncItem, 'id' | 'createdAt' | 'retries'>): Promise<string> {
    const db = await getOfflineDb()
    const id = crypto.randomUUID()
    await db.add(QUEUE_STORE, {
      ...item,
      id,
      createdAt: Date.now(),
      retries: 0,
    })
    notify()
    return id
  },

  async getAll(): Promise<SyncItem[]> {
    const db = await getOfflineDb()
    const items = await db.getAll(QUEUE_STORE)
    return items.sort((a: SyncItem, b: SyncItem) => a.createdAt - b.createdAt)
  },

  async getFailed(): Promise<SyncItem[]> {
    const db = await getOfflineDb()
    return db.getAll(FAILED_STORE)
  },

  async remove(id: string) {
    const db = await getOfflineDb()
    await db.delete(QUEUE_STORE, id)
    notify()
  },

  async incrementRetries(id: string): Promise<number> {
    const db = await getOfflineDb()
    const item = await db.get(QUEUE_STORE, id)
    if (item) {
      item.retries += 1
      await db.put(QUEUE_STORE, item)
      return item.retries
    }
    return 0
  },

  async moveToFailed(id: string) {
    const db = await getOfflineDb()
    const item = await db.get(QUEUE_STORE, id)
    if (!item) return
    await db.put(FAILED_STORE, item)
    await db.delete(QUEUE_STORE, id)
    notify()
  },

  async requeueFailed(): Promise<number> {
    const db = await getOfflineDb()
    const failed = await db.getAll(FAILED_STORE)
    for (const item of failed) {
      await db.put(QUEUE_STORE, { ...item, retries: 0 })
      await db.delete(FAILED_STORE, item.id)
    }
    if (failed.length > 0) notify()
    return failed.length
  },

  async clear() {
    const db = await getOfflineDb()
    await db.clear(QUEUE_STORE)
    await db.clear(FAILED_STORE)
    notify()
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}
