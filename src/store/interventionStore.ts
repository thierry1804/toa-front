import { create } from 'zustand'
import type { Take5Record, ValidationInterventionJournaliere, InterventionStatus } from '@/types'

export interface StoredIntervention {
  id: string
  reference: string
  codeSite: string
  nomSite: string
  description: string
  dateDebut: string
  dateFin: string
  prestataire: string
  status: InterventionStatus
  createdAt?: string | null
  creerPar?: string
  zoneEnclavee: boolean
  nombreIntervenants: number
  validationsJournalieres: ValidationInterventionJournaliere[]
  take5Records: Take5Record[]
  incidents: unknown[]
  documentsProgres: unknown[]
  observations?: string[]
  permisId?: string
  permisReference?: string
  typeIntervention?: string
  region?: string
  responsableChantier?: string
  responsableContact?: string
}

interface InterventionState {
  selectedInterventionId: string | null
  interventions: StoredIntervention[]
  setSelectedInterventionId: (id: string | null) => void
  setInterventions: (interventions: StoredIntervention[]) => void
  addIntervention: (intervention: StoredIntervention) => void
  addValidationJournaliere: (
    interventionId: string,
    validation: ValidationInterventionJournaliere,
  ) => void
  addTake5Record: (interventionId: string, record: Take5Record) => void
  updateInterventionStatus: (id: string, status: InterventionStatus) => void
  cloturerIntervention: (
    id: string,
    email?: string,
    raison?: string,
    date?: string | Date,
  ) => void
}

export const useInterventionStore = create<InterventionState>((set) => ({
  selectedInterventionId: null,
  interventions: [],
  setSelectedInterventionId: (id) => set({ selectedInterventionId: id }),
  setInterventions: (interventions) => set({ interventions }),
  addIntervention: (intervention) =>
    set((state) => ({ interventions: [...state.interventions, intervention] })),
  addValidationJournaliere: (interventionId, validation) =>
    set((state) => ({
      interventions: state.interventions.map((i) =>
        i.id === interventionId
          ? {
              ...i,
              validationsJournalieres: [
                ...(i.validationsJournalieres ?? []),
                validation,
              ],
            }
          : i,
      ),
    })),
  addTake5Record: (interventionId, record) =>
    set((state) => ({
      interventions: state.interventions.map((i) =>
        i.id === interventionId
          ? {
              ...i,
              take5Records: [...(i.take5Records ?? []), record],
            }
          : i,
      ),
    })),
  updateInterventionStatus: (id, status) =>
    set((state) => ({
      interventions: state.interventions.map((i) =>
        i.id === id ? { ...i, status } : i,
      ),
    })),
  cloturerIntervention: (id) =>
    set((state) => ({
      interventions: state.interventions.map((i) =>
        i.id === id ? { ...i, status: 'terminee' } : i,
      ),
    })),
}))
