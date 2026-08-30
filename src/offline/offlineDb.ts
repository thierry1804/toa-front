import { openDB, type IDBPDatabase } from 'idb'

export const OFFLINE_DB = 'toa-offline'
export const OFFLINE_DB_VER = 3
export const QUEUE_STORE = 'sync-queue'
export const FAILED_STORE = 'sync-failed'
export const BLOB_STORE = 'blobs'

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
      },
    })
  }
  return dbPromise
}

export function resetOfflineDbForTests(): void {
  dbPromise = null
}
