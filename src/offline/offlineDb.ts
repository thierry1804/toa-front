import { openDB, type IDBPDatabase } from 'idb'

export const OFFLINE_DB = 'toa-offline'
export const OFFLINE_DB_VER = 4
export const QUEUE_STORE = 'sync-queue'
export const FAILED_STORE = 'sync-failed'
export const BLOB_STORE = 'blobs'
export const DOC_CACHE_STORE = 'doc-cache'

let dbPromise: Promise<IDBPDatabase> | null = null

export function getOfflineDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(OFFLINE_DB, OFFLINE_DB_VER, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(FAILED_STORE)) {
          db.createObjectStore(FAILED_STORE, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(BLOB_STORE)) {
          db.createObjectStore(BLOB_STORE, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(DOC_CACHE_STORE)) {
          db.createObjectStore(DOC_CACHE_STORE, { keyPath: 'url' })
        }
      },
    })
  }
  return dbPromise
}

export function resetOfflineDbForTests(): void {
  dbPromise = null
}
