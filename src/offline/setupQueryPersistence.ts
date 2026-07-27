import { dehydrate, hydrate } from '@tanstack/react-query'
import { openDB } from 'idb'
import type { QueryClient } from '@tanstack/react-query'

const DB_NAME   = 'toa-query-cache'
const DB_VER    = 1
const STORE     = 'rq-persist'
const KEY       = 'state'
const MAX_AGE   = 24 * 60 * 60 * 1000 // 24 h
const DEBOUNCE_MS = 1_000

function getDb() {
  return openDB(DB_NAME, DB_VER, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    },
  })
}

export async function restoreQueryCache(queryClient: QueryClient): Promise<void> {
  try {
    const db     = await getDb()
    const cached = await db.get(STORE, KEY)
    if (!cached) return
    if (Date.now() - cached.timestamp > MAX_AGE) {
      await db.delete(STORE, KEY)
      return
    }
    hydrate(queryClient, cached.state)
  } catch {
    // IDB unavailable or corrupted — proceed without cache
  }
}

export function setupQueryPersistence(queryClient: QueryClient): void {
  let timer: ReturnType<typeof setTimeout> | null = null

  queryClient.getQueryCache().subscribe(() => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      const state = dehydrate(queryClient)
      getDb()
        .then((db) => db.put(STORE, { timestamp: Date.now(), state }, KEY))
        .catch(() => {})
    }, DEBOUNCE_MS)
  })
}
