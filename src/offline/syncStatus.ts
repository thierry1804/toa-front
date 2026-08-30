type Listener = () => void
const listeners = new Set<Listener>()

let syncing = false

function notify() {
  listeners.forEach((listener) => listener())
}

export function getSyncing(): boolean {
  return syncing
}

export function setSyncing(value: boolean): void {
  if (syncing === value) return
  syncing = value
  notify()
}

export function subscribeSyncing(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function resetSyncingForTests(): void {
  syncing = false
  listeners.clear()
}
