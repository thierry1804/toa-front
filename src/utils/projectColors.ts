import { INTERVENTION_TYPES } from '@/data/constant/planning'

const PALETTE = [
  { bar: 'bg-blue-500', dot: 'bg-blue-500' },
  { bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { bar: 'bg-amber-500', dot: 'bg-amber-500' },
  { bar: 'bg-violet-500', dot: 'bg-violet-500' },
  { bar: 'bg-rose-500', dot: 'bg-rose-500' },
  { bar: 'bg-cyan-500', dot: 'bg-cyan-500' },
  { bar: 'bg-orange-500', dot: 'bg-orange-500' },
  { bar: 'bg-lime-600', dot: 'bg-lime-600' },
] as const

const NEUTRAL = { bar: 'bg-gray-400', dot: 'bg-gray-400' } as const

const KNOWN_TYPES = INTERVENTION_TYPES.map((type) => type.toLowerCase())

function hash(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}

export function projectColor(typeIntervention: string | null | undefined) {
  const key = (typeIntervention ?? '').trim().toLowerCase()
  if (!key) return NEUTRAL
  const knownIndex = KNOWN_TYPES.indexOf(key)
  if (knownIndex >= 0) return PALETTE[knownIndex % PALETTE.length]
  return PALETTE[hash(key) % PALETTE.length]
}
