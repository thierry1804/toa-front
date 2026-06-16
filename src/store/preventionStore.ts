import { create } from 'zustand'
import type { PreventionPlan } from '@/types/prevention'

interface PreventionState {
  selectedPlanId: string | null
  plansPrevention: PreventionPlan[]
  setSelectedPlanId: (id: string | null) => void
  setPlansPrevention: (plans: PreventionPlan[]) => void
  getPlanPreventionById: (id: string) => PreventionPlan | undefined
  soumettreValidationChef: (id: string) => void
  validerParChef: (id: string, email: string, commentaire?: string) => void
  refuserParChef: (id: string, email: string, motif: string) => void
  validerParHSE: (id: string, email: string, reference: string, commentaire?: string) => void
  refuserParHSE: (id: string, email: string, motif: string) => void
}

export const usePreventionStore = create<PreventionState>((set, get) => ({
  selectedPlanId: null,
  plansPrevention: [],
  setSelectedPlanId: (id) => set({ selectedPlanId: id }),
  setPlansPrevention: (plans) => set({ plansPrevention: plans }),
  getPlanPreventionById: (id) => get().plansPrevention.find((p) => p.id === id),
  soumettreValidationChef: (id) =>
    set((state) => ({
      plansPrevention: state.plansPrevention.map((p) =>
        p.id === id ? { ...p, status: 'en_attente_chef' as const } : p
      ),
    })),
  validerParChef: (id, _email, commentaire) =>
    set((state) => ({
      plansPrevention: state.plansPrevention.map((p) =>
        p.id === id ? { ...p, status: 'en_attente_hse' as const, commentaireChef: commentaire } : p
      ),
    })),
  refuserParChef: (id, _email, motif) =>
    set((state) => ({
      plansPrevention: state.plansPrevention.map((p) =>
        p.id === id ? { ...p, status: 'refuse' as const, motifRefus: motif } : p
      ),
    })),
  validerParHSE: (id, _email, reference, commentaire) =>
    set((state) => ({
      plansPrevention: state.plansPrevention.map((p) =>
        p.id === id ? { ...p, status: 'valide' as const, reference, commentaireHSE: commentaire } : p
      ),
    })),
  refuserParHSE: (id, _email, motif) =>
    set((state) => ({
      plansPrevention: state.plansPrevention.map((p) =>
        p.id === id ? { ...p, status: 'refuse' as const, motifRefus: motif } : p
      ),
    })),
}))
