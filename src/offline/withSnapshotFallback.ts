export async function withSnapshotFallback<T>(
  network: () => Promise<T>,
  local: () => Promise<T | undefined>,
): Promise<T> {
  try {
    return await network()
  } catch (err) {
    const cached = await local()
    if (cached !== undefined) return cached
    throw err
  }
}
