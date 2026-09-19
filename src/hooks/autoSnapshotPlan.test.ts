import { describe, expect, it } from 'vitest'
import type { OfflineSnapshotMeta } from '@/types/offlineSnapshot'
import { AUTO_SNAPSHOT_INTERVAL_MS, planAutoSnapshot } from './autoSnapshotPlan'

const NOW = 1_800_000_000_000
const meta = (ageMs: number): OfflineSnapshotMeta => ({
  userId: '1',
  generatedAt: '2026-09-19T10:00:00Z',
  lastPulledAt: NOW - ageMs,
  modules: [],
})

describe('planAutoSnapshot', () => {
  it('tire tout dès la première connexion (aucun snapshot)', () => {
    expect(planAutoSnapshot(null, NOW)).toEqual({ kind: 'full' })
  })

  it('ne fait rien si le dernier tirage est récent', () => {
    expect(planAutoSnapshot(meta(AUTO_SNAPSHOT_INTERVAL_MS - 1), NOW)).toBeNull()
  })

  it('tire en incrémental depuis la date du dernier snapshot une fois le délai passé', () => {
    expect(planAutoSnapshot(meta(AUTO_SNAPSHOT_INTERVAL_MS), NOW)).toEqual({
      kind: 'incremental',
      since: '2026-09-19T10:00:00Z',
    })
  })
})
