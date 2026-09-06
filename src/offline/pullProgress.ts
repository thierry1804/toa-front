/** Overall pull progress bands (percent 0–100). */
export const PULL_PROGRESS = {
  manifestEnd: 5,
  snapshotEnd: 55,
  persistEnd: 60,
  done: 100,
} as const

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function snapshotDownloadPercent(loaded: number, total: number): number {
  const { manifestEnd, snapshotEnd } = PULL_PROGRESS
  if (total <= 0) return manifestEnd
  const ratio = Math.min(1, Math.max(0, loaded / total))
  return clampPercent(manifestEnd + ratio * (snapshotEnd - manifestEnd))
}

export function modulePullPercent(
  moduleIndex: number,
  moduleCount: number,
  loaded: number,
  total: number,
): number {
  const { manifestEnd, snapshotEnd } = PULL_PROGRESS
  const n = Math.max(1, moduleCount)
  const span = snapshotEnd - manifestEnd
  const moduleSpan = span / n
  const ratio = total > 0 ? Math.min(1, Math.max(0, loaded / total)) : 1
  return clampPercent(manifestEnd + moduleIndex * moduleSpan + ratio * moduleSpan)
}

export function documentsPullPercent(loaded: number, total: number): number {
  const { persistEnd, done } = PULL_PROGRESS
  if (total <= 0) return done
  const ratio = Math.min(1, Math.max(0, loaded / total))
  return clampPercent(persistEnd + ratio * (done - persistEnd))
}

export function estimatedSnapshotBytes(
  modules: Partial<Record<string, { estimatedBytes?: number }>> | undefined,
): number {
  if (!modules) return 0
  return Object.values(modules).reduce((sum, m) => sum + (m?.estimatedBytes ?? 0), 0)
}
