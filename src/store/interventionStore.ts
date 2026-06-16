import { create } from 'zustand'

interface InterventionState {
  selectedInterventionId: string | null
  interventions: any[]
  setSelectedInterventionId: (id: string | null) => void
  addIntervention: (intervention: any) => void
  addValidationJournaliere: (interventionId: string, validation: any) => void
  addTake5Record: (interventionId: string, record: any) => void
  updateInterventionStatus: (id: string, status: string) => void
  cloturerIntervention: (id: string, email?: string, raison?: string, date?: any) => void
}

export const useInterventionStore = create<InterventionState>((set) => ({
  selectedInterventionId: null,
  interventions: [],
  setSelectedInterventionId: (id) => set({ selectedInterventionId: id }),
  addIntervention: (intervention) =>
    set((state) => ({ interventions: [...state.interventions, intervention] })),
  addValidationJournaliere: (interventionId, validation) =>
    set((state) => ({
      interventions: state.interventions.map((i) =>
        i.id === interventionId
          ? {
              ...i,
              validationsJournalieres: [
                ...(i.validationsJournalieres || []),
                validation,
              ],
            }
          : i
      ),
    })),
  addTake5Record: (interventionId, record) =>
    set((state) => ({
      interventions: state.interventions.map((i) =>
        i.id === interventionId
          ? {
              ...i,
              take5Records: [...(i.take5Records || []), record],
            }
          : i
      ),
    })),
  updateInterventionStatus: (id, status) =>
    set((state) => ({
      interventions: state.interventions.map((i) =>
        i.id === id ? { ...i, status } : i
      ),
    })),
  cloturerIntervention: (id) =>
    set((state) => ({
      interventions: state.interventions.map((i) =>
        i.id === id ? { ...i, status: 'terminee' } : i
      ),
    })),
}))
