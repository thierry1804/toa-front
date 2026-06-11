import { create } from 'zustand'

interface InterventionState {
  selectedInterventionId: string | null
  setSelectedInterventionId: (id: string | null) => void
}

export const useInterventionStore = create<InterventionState>((set) => ({
  selectedInterventionId: null,
  setSelectedInterventionId: (id) => set({ selectedInterventionId: id }),
}))
