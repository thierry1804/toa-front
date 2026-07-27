export class OfflineQueuedError extends Error {
  readonly queued = true as const

  constructor() {
    super('Request queued for offline sync')
    this.name = 'OfflineQueuedError'
  }
}

export function isOfflineQueued(err: unknown): err is OfflineQueuedError {
  return err instanceof OfflineQueuedError
}
