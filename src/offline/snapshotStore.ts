import { openDB, type IDBPDatabase } from 'idb'
import { currentUserId } from '@/utils/jwt'
import type {
  OfflineSnapshot,
  OfflineSnapshotMeta,
  OfflineSnapshotModule,
  OfflineSnapshotTombstones,
} from '@/types/offlineSnapshot'

export const SNAPSHOT_DB = 'toa-snapshot'
export const SNAPSHOT_DB_VER = 1

export const SNAPSHOT_META_STORE = 'meta'
export const SNAPSHOT_MODULE_STORES = [
  'plansPrevention',
  'permitsTravail',
  'interventions',
  'activityPlannings',
  'sites',
  'categoriesRisque',
  'installationsEquipements',
] as const

export type SnapshotStoreName = (typeof SNAPSHOT_MODULE_STORES)[number]

const META_KEY = 'current'

type SnapshotListener = () => void
const listeners = new Set<SnapshotListener>()

function notify(): void {
  listeners.forEach((listener) => listener())
}

export function subscribeSnapshot(listener: SnapshotListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

let dbPromise: Promise<IDBPDatabase> | null = null

export function getSnapshotDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(SNAPSHOT_DB, SNAPSHOT_DB_VER, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SNAPSHOT_META_STORE)) {
          db.createObjectStore(SNAPSHOT_META_STORE)
        }
        for (const store of SNAPSHOT_MODULE_STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' })
          }
        }
      },
    })
  }
  return dbPromise
}

export function resetSnapshotDbForTests(): void {
  dbPromise = null
}

function storeKey(module: SnapshotStoreName, id: string | number): string | number {
  if (module === 'activityPlannings') return Number(id)
  return String(id)
}

async function replaceStore(store: SnapshotStoreName, items: unknown[]): Promise<void> {
  const db = await getSnapshotDb()
  await db.clear(store)
  for (const item of items) {
    if (!item || typeof item !== 'object' || !('id' in item)) continue
    await db.put(store, item)
  }
}

async function putItems(store: SnapshotStoreName, items: unknown[]): Promise<void> {
  const db = await getSnapshotDb()
  for (const item of items) {
    if (!item || typeof item !== 'object' || !('id' in item)) continue
    await db.put(store, item)
  }
}

async function deleteIds(store: SnapshotStoreName, ids: Array<string | number>): Promise<void> {
  const db = await getSnapshotDb()
  for (const id of ids) {
    await db.delete(store, storeKey(store, id))
  }
}

function modulesPresent(snapshot: OfflineSnapshot): OfflineSnapshotModule[] {
  const modules: OfflineSnapshotModule[] = []
  if (snapshot.plansPrevention) modules.push('plansPrevention')
  if (snapshot.permitsTravail) modules.push('permitsTravail')
  if (snapshot.interventions) modules.push('interventions')
  if (snapshot.activityPlannings) modules.push('activityPlannings')
  if (snapshot.sites) modules.push('sites')
  if (snapshot.referentiel) modules.push('referentiel')
  return modules
}

async function writeMeta(snapshot: OfflineSnapshot, previous?: OfflineSnapshotMeta | null): Promise<void> {
  const db = await getSnapshotDb()
  const userId = currentUserId() ?? String(snapshot.userId)
  const modules = Array.from(new Set([...(previous?.modules ?? []), ...modulesPresent(snapshot)]))
  const meta: OfflineSnapshotMeta = {
    userId,
    generatedAt: snapshot.generatedAt,
    lastPulledAt: Date.now(),
    modules,
  }
  await db.put(SNAPSHOT_META_STORE, meta, META_KEY)
}

export async function getSnapshotMeta(): Promise<OfflineSnapshotMeta | null> {
  try {
    const db = await getSnapshotDb()
    const meta = (await db.get(SNAPSHOT_META_STORE, META_KEY)) as OfflineSnapshotMeta | undefined
    if (!meta) return null
    const userId = currentUserId()
    if (userId && meta.userId !== userId) return null
    return meta
  } catch {
    return null
  }
}

export async function hasSnapshot(): Promise<boolean> {
  return (await getSnapshotMeta()) !== null
}

export async function saveSnapshot(snapshot: OfflineSnapshot): Promise<void> {
  await replaceStore('plansPrevention', snapshot.plansPrevention ?? [])
  await replaceStore('permitsTravail', snapshot.permitsTravail ?? [])
  await replaceStore('interventions', snapshot.interventions ?? [])
  await replaceStore('activityPlannings', snapshot.activityPlannings ?? [])
  await replaceStore('sites', snapshot.sites ?? [])
  await replaceStore('categoriesRisque', snapshot.referentiel?.categoriesRisque ?? [])
  await replaceStore(
    'installationsEquipements',
    snapshot.referentiel?.installationsEquipements ?? [],
  )
  await writeMeta(snapshot, null)
  notify()
}

export async function applyDelta(snapshot: OfflineSnapshot): Promise<void> {
  const previous = await getSnapshotMeta()
  await putItems('plansPrevention', snapshot.plansPrevention ?? [])
  await putItems('permitsTravail', snapshot.permitsTravail ?? [])
  await putItems('interventions', snapshot.interventions ?? [])
  await putItems('activityPlannings', snapshot.activityPlannings ?? [])
  await putItems('sites', snapshot.sites ?? [])
  await putItems('categoriesRisque', snapshot.referentiel?.categoriesRisque ?? [])
  await putItems(
    'installationsEquipements',
    snapshot.referentiel?.installationsEquipements ?? [],
  )
  await applyTombstones(snapshot.tombstones)
  await writeMeta(snapshot, previous)
  notify()
}

export async function applyTombstones(tombstones?: OfflineSnapshotTombstones): Promise<void> {
  if (!tombstones) return
  if (tombstones.plansPrevention?.length) await deleteIds('plansPrevention', tombstones.plansPrevention)
  if (tombstones.permitsTravail?.length) await deleteIds('permitsTravail', tombstones.permitsTravail)
  if (tombstones.interventions?.length) await deleteIds('interventions', tombstones.interventions)
  if (tombstones.activityPlannings?.length) {
    await deleteIds('activityPlannings', tombstones.activityPlannings)
  }
  if (tombstones.sites?.length) await deleteIds('sites', tombstones.sites)
  if (tombstones.categoriesRisque?.length) {
    await deleteIds('categoriesRisque', tombstones.categoriesRisque)
  }
  if (tombstones.installationsEquipements?.length) {
    await deleteIds('installationsEquipements', tombstones.installationsEquipements)
  }
}

export async function getAllFromSnapshot<T>(store: SnapshotStoreName): Promise<T[]> {
  const meta = await getSnapshotMeta()
  if (!meta) return []
  try {
    const db = await getSnapshotDb()
    return (await db.getAll(store)) as T[]
  } catch {
    return []
  }
}

export async function getByIdFromSnapshot<T>(
  store: SnapshotStoreName,
  id: string | number,
): Promise<T | undefined> {
  const meta = await getSnapshotMeta()
  if (!meta) return undefined
  try {
    const db = await getSnapshotDb()
    return (await db.get(store, storeKey(store, id))) as T | undefined
  } catch {
    return undefined
  }
}

export async function clearSnapshot(): Promise<void> {
  try {
    const db = await getSnapshotDb()
    await db.clear(SNAPSHOT_META_STORE)
    for (const store of SNAPSHOT_MODULE_STORES) {
      await db.clear(store)
    }
    notify()
  } catch {
    // IDB unavailable
  }
}
