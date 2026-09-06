import { describe, it, expect } from 'vitest'
import {
  PULL_PROGRESS,
  clampPercent,
  snapshotDownloadPercent,
  modulePullPercent,
  documentsPullPercent,
  estimatedSnapshotBytes,
} from './pullProgress'

describe('pullProgress', () => {
  it('clamps percent to 0–100', () => {
    expect(clampPercent(-5)).toBe(0)
    expect(clampPercent(150)).toBe(100)
    expect(clampPercent(33.4)).toBe(33)
  })

  it('maps snapshot download into the snapshot band', () => {
    expect(snapshotDownloadPercent(0, 1000)).toBe(PULL_PROGRESS.manifestEnd)
    expect(snapshotDownloadPercent(500, 1000)).toBe(30)
    expect(snapshotDownloadPercent(1000, 1000)).toBe(PULL_PROGRESS.snapshotEnd)
    expect(snapshotDownloadPercent(10, 0)).toBe(PULL_PROGRESS.manifestEnd)
  })

  it('maps paginated modules across the snapshot band', () => {
    expect(modulePullPercent(0, 2, 0, 100)).toBe(PULL_PROGRESS.manifestEnd)
    expect(modulePullPercent(0, 2, 100, 100)).toBe(30)
    expect(modulePullPercent(1, 2, 100, 100)).toBe(PULL_PROGRESS.snapshotEnd)
  })

  it('maps document prefetch into the final band', () => {
    expect(documentsPullPercent(0, 10)).toBe(PULL_PROGRESS.persistEnd)
    expect(documentsPullPercent(5, 10)).toBe(80)
    expect(documentsPullPercent(10, 10)).toBe(PULL_PROGRESS.done)
    expect(documentsPullPercent(0, 0)).toBe(PULL_PROGRESS.done)
  })

  it('sums estimated bytes from the manifest', () => {
    expect(
      estimatedSnapshotBytes({
        plansPrevention: { estimatedBytes: 100 },
        permitsTravail: { estimatedBytes: 250 },
      }),
    ).toBe(350)
    expect(estimatedSnapshotBytes(undefined)).toBe(0)
  })
})
