import type { SectionPlanifieeItem } from '@/types'

interface WithSections {
  sections?: SectionPlanifieeItem[] | null
  planificationSections?: SectionPlanifieeItem[] | null
}

// `sections` is authoritative as soon as the API sends it (a plan whose sections were all deleted stays empty);
// `planificationSections` is only a read-only fallback for payloads that carry no `sections` at all.
export function planSections(plan: WithSections | null | undefined): SectionPlanifieeItem[] {
  if (!plan) return []
  return plan.sections ?? plan.planificationSections ?? []
}

// Sections owned by the plan: the only source for edit forms and PATCH payloads (never planification ids).
export function ownSections(plan: Pick<WithSections, 'sections'> | null | undefined): SectionPlanifieeItem[] {
  return plan?.sections ?? []
}
