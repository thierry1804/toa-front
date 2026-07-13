export type ProcessusPermit = 'NOUVEAU_SITE' | 'MAINTENANCE' | 'RENOUVELLEMENT'
export type TypePermit = 'GENERAL' | 'ELECTRIQUE' | 'HAUTEUR'
export type StatutPermitTravail = 'BROUILLON' | 'SOUMIS' | 'EN_COURS' | 'VALIDE' | 'REJETE' | 'VALIDE_HSE' | 'REFUSE_HSE'

export type TypeDocumentPermitTravail =
  | 'ATTESTATION_ENTREPRISE'
  | 'LISTE_INTERVENANTS'
  | 'PLAN_PREVENTION_REF'
  | 'HABILITATION_ELECTRIQUE'
  | 'CONSIGNATION_FICHE'
  | 'ATTESTATION_BASSE_TENSION'
  | 'CERTIFICAT_TRAVAIL_HAUTEUR'
  | 'EPI_FICHE'
  | 'PLAN_SAUVETAGE'

export const DOCUMENT_TYPES_BY_PERMIT: Record<TypePermit, TypeDocumentPermitTravail[]> = {
  GENERAL:    ['ATTESTATION_ENTREPRISE', 'LISTE_INTERVENANTS', 'PLAN_PREVENTION_REF'],
  ELECTRIQUE: ['HABILITATION_ELECTRIQUE', 'CONSIGNATION_FICHE', 'ATTESTATION_BASSE_TENSION'],
  HAUTEUR:    ['CERTIFICAT_TRAVAIL_HAUTEUR', 'EPI_FICHE', 'PLAN_SAUVETAGE'],
}

export const DOCUMENT_TYPE_LABELS: Record<TypeDocumentPermitTravail, string> = {
  ATTESTATION_ENTREPRISE:    "Attestation entreprise",
  LISTE_INTERVENANTS:        "Liste des intervenants",
  PLAN_PREVENTION_REF:       "Plan de prévention (référence)",
  HABILITATION_ELECTRIQUE:   "Habilitation électrique",
  CONSIGNATION_FICHE:        "Fiche de consignation",
  ATTESTATION_BASSE_TENSION: "Attestation basse tension",
  CERTIFICAT_TRAVAIL_HAUTEUR: "Certificat travail en hauteur",
  EPI_FICHE:                 "Fiche EPI",
  PLAN_SAUVETAGE:            "Plan de sauvetage",
}

export const PROCESSUS_LABELS: Record<ProcessusPermit, string> = {
  NOUVEAU_SITE:  "Nouveau site",
  MAINTENANCE:   "Maintenance",
  RENOUVELLEMENT: "Renouvellement",
}

export const TYPE_PERMIT_LABELS: Record<TypePermit, string> = {
  GENERAL:   "Général",
  ELECTRIQUE: "Électrique",
  HAUTEUR:   "Hauteur",
}

export interface DocumentPermitTravail {
  id: string
  type: TypeDocumentPermitTravail
  filePath: string
  mimeType: string
  uploadedAt: string
}

export interface DecisionHsePermitTravail {
  id: string
  decision: 'VALIDE' | 'REFUSE'
  commentaire?: string | null
  signatureElectronique: string
  decidedAt: string
  decidePar: { id: number; email: string; name: string; firstname?: string }
}

export interface PermitTravailInput {
  processus: ProcessusPermit
  typePermis: TypePermit
  planPreventionId?: string
  codeSite: string
  descriptionTravaux: string
  dateDebutPrevue: string
  dateFinPrevue: string
  engagementAccepte?: boolean
}

export interface PermitTravail {
  '@id'?: string
  id: string
  reference: string
  processus: ProcessusPermit
  typePermis: TypePermit
  planPreventionId?: string | null
  codeSite: string
  descriptionTravaux: string
  dateDebutPrevue: string
  dateFinPrevue: string
  statut: StatutPermitTravail
  createdBy: { id: number; email: string; name: string; firstname?: string }
  nomPrestataire?: string | null
  soumisAt?: string | null
  createdAt: string
  documents: DocumentPermitTravail[]
  decisionsHse?: DecisionHsePermitTravail[]
  groupeId?: string | null
  permitsGroupe?: {
    id: string
    reference: string
    typePermis: TypePermit
    statut: StatutPermitTravail
    documents: DocumentPermitTravail[]
  }[]
}
