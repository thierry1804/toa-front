import { create } from 'zustand'
import type { PreventionPlan } from '@/types/prevention'

interface PermitState {
  selectedPermitId: string | null
  plansPrevention: PreventionPlan[]
  setSelectedPermitId: (id: string | null) => void
  setPlansPrevention: (plans: PreventionPlan[]) => void
}

export const usePermitStore = create<PermitState>((set) => ({
  selectedPermitId: null,
  plansPrevention: [],
  setSelectedPermitId: (id) => set({ selectedPermitId: id }),
  setPlansPrevention: (plans) => set({ plansPrevention: plans }),
}))
