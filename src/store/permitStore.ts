import { create } from 'zustand'
import type { PreventionPlan } from '@/types/prevention'

interface PermitState {
  selectedPermitId: string | null
  plansPrevention: PreventionPlan[]
  permisGeneraux: any[]
  setSelectedPermitId: (id: string | null) => void
  setPlansPrevention: (plans: PreventionPlan[]) => void
  getPermisGeneralById: (id: string) => any | undefined
  getPlanPreventionById: (id: string) => PreventionPlan | undefined
  getPermisHauteurById: (id: string) => any | undefined
  addPermisGeneral: (permis: any) => void
  addPermisHauteur: (permis: any) => void
  addPermisElectrique: (permis: any) => void
  validerParChefProjet: (id: string, nom: string, commentaire: string) => void
  validerParHSE: (id: string, nom: string, commentaire: string) => void
  refuserPermis: (id: string, commentaire: string) => void
  updatePermisHauteur: (id: string, data: any) => void
}

export const usePermitStore = create<PermitState>((set, get) => ({
  selectedPermitId: null,
  plansPrevention: [],
  permisGeneraux: [],
  setSelectedPermitId: (id) => set({ selectedPermitId: id }),
  setPlansPrevention: (plans) => set({ plansPrevention: plans }),
  getPermisGeneralById: (id) => get().permisGeneraux.find((p) => p.id === id),
  getPlanPreventionById: (id) => get().plansPrevention.find((p) => p.id === id),
  getPermisHauteurById: (id) => get().permisGeneraux.find((p) => p.id === id),
  addPermisGeneral: (permis) =>
    set((state) => ({ permisGeneraux: [...state.permisGeneraux, permis] })),
  addPermisHauteur: (permis) =>
    set((state) => ({ permisGeneraux: [...state.permisGeneraux, permis] })),
  addPermisElectrique: (permis) =>
    set((state) => ({ permisGeneraux: [...state.permisGeneraux, permis] })),
  validerParChefProjet: (id, _nom, commentaire) =>
    set((state) => ({
      permisGeneraux: state.permisGeneraux.map((p) =>
        p.id === id ? { ...p, status: 'en_attente_validation_hse', commentaireChef: commentaire } : p
      ),
    })),
  validerParHSE: (id, _nom, commentaire) =>
    set((state) => ({
      permisGeneraux: state.permisGeneraux.map((p) =>
        p.id === id ? { ...p, status: 'valide', commentaireHSE: commentaire } : p
      ),
    })),
  refuserPermis: (id, commentaire) =>
    set((state) => ({
      permisGeneraux: state.permisGeneraux.map((p) =>
        p.id === id ? { ...p, status: 'refuse', motifRefus: commentaire } : p
      ),
    })),
  updatePermisHauteur: (id, data) =>
    set((state) => ({
      permisGeneraux: state.permisGeneraux.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    })),
}))
