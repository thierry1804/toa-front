export async function withSnapshotFallback<T>(
  network: () => Promise<T>,
  local: () => Promise<T | undefined>,
): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const cached = await local()
    if (cached !== undefined) return cached
  }
  try {
    return await network()
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status
    // Un refus d'accès ne doit jamais être remplacé par une ancienne copie
    // locale : cela afficherait des données que le serveur vient d'interdire.
    if (status === 401 || status === 403) throw err
    const cached = await local()
    if (cached !== undefined) return cached
    throw err
  }
}
