import { openDB, type IDBPDatabase } from 'idb'

export interface SyncItem {
  id: string
  url: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  contentType?: string
  createdAt: number
  retries: number
}

const DB_NAME = 'toa-offline'
const STORE_NAME = 'sync-queue'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

export const syncQueue = {
  async add(item: Omit<SyncItem, 'id' | 'createdAt' | 'retries'>) {
    const db = await getDb()
    await db.add(STORE_NAME, {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      retries: 0,
    })
  },

  async getAll(): Promise<SyncItem[]> {
    const db = await getDb()
    return db.getAll(STORE_NAME)
  },

  async remove(id: string) {
    const db = await getDb()
    await db.delete(STORE_NAME, id)
  },

  async incrementRetries(id: string): Promise<number> {
    const db = await getDb()
    const item = await db.get(STORE_NAME, id)
    if (item) {
      item.retries += 1
      await db.put(STORE_NAME, item)
      return item.retries
    }
    return 0
  },

  async clear() {
    const db = await getDb()
    await db.clear(STORE_NAME)
  },
}
