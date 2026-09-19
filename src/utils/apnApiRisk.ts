import type { CategorieRisque } from '@/types/referentiel'

export type ApnApiType = 'APN' | 'API'

interface SiteFlags {
  apn?: boolean
  api?: boolean
}

interface RiskRowLike {
  categorieIds?: string[]
}

type CategoryLike = Pick<CategorieRisque, 'id' | 'nom' | 'typeSite' | 'parentId'>

// Mirrors the back rule (PlanPreventionSubmissionValidator): the risk type is inherited from the nearest
// ancestor carrying `typeSite`, and the generic « Autre(s) risque(s) … à préciser » entries never count.
const GENERIC_CATEGORY = /^\s*autre\(s\)/i

export function requiredApnApiTypes(sites: SiteFlags[]): ApnApiType[] {
  const types: ApnApiType[] = []
  if (sites.some((s) => s.apn)) types.push('APN')
  if (sites.some((s) => s.api)) types.push('API')
  return types
}

function resolveTypeSite(category: CategoryLike, byId: Map<string, CategoryLike>): ApnApiType | null {
  const seen = new Set<string>()
  for (let current: CategoryLike | undefined = category; current && !seen.has(current.id); current = current.parentId ? byId.get(current.parentId) : undefined) {
    seen.add(current.id)
    if (current.typeSite === 'APN' || current.typeSite === 'API') return current.typeSite
  }
  return null
}

export function presentApnApiRiskTypes(rows: RiskRowLike[], categories: CategoryLike[]): ApnApiType[] {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const present = new Set<ApnApiType>()
  for (const row of rows) {
    for (const id of row.categorieIds ?? []) {
      const category = byId.get(id)
      if (!category || GENERIC_CATEGORY.test(category.nom)) continue
      const type = resolveTypeSite(category, byId)
      if (type) present.add(type)
    }
  }
  return [...present]
}

/** Protected-area risk types still to be covered before the plan can be submitted (empty = OK). */
export function missingApnApiRiskTypes(sites: SiteFlags[], rows: RiskRowLike[], categories: CategoryLike[]): ApnApiType[] {
  const present = presentApnApiRiskTypes(rows, categories)
  return requiredApnApiTypes(sites).filter((type) => !present.includes(type))
}
