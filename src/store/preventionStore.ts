import { create } from 'zustand'
import type { PreventionPlan } from '@/types/prevention'

interface PreventionState {
  selectedPlanId: string | null
  plansPrevention: PreventionPlan[]
  setSelectedPlanId: (id: string | null) => void
  setPlansPrevention: (plans: PreventionPlan[]) => void
  getPlanPreventionById: (id: string) => PreventionPlan | undefined
}

export const usePreventionStore = create<PreventionState>((set, get) => ({
  selectedPlanId: null,
  plansPrevention: [],
  setSelectedPlanId: (id) => set({ selectedPlanId: id }),
  setPlansPrevention: (plans) => set({ plansPrevention: plans }),
  getPlanPreventionById: (id) => get().plansPrevention.find((p) => p.id === id),
}))
