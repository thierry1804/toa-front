export type PreventionStatus =
  | 'brouillon'
  | 'en_attente_chef'
  | 'en_attente_hse'
  | 'valide'
  | 'refuse'
  | 'soumis_validation_chef'
  | 'valide_chef_attente_hse'
  | 'en_cours'
  | 'termine'

export interface PreventionPlan {
  id: string
  reference: string
  codeSite: string
  nomSite: string
  entreprisePrestataire: string
  natureIntervention: string
  dateDebut: string
  dateFin: string
  creerPar: string
  siret: string
  representantPrestataire: string
  fonctionPrestataire: string
  maitreOuvrage: string
  representantMaitreOuvrage: string
  contactMaitreOuvrage: string
  emailMaitreOuvrage: string
  adresseSite: string
  codePostal: string
  ville: string
  coordonneesGPS: string
  descriptionTravaux: string
  nombreIntervenants: number
  dureeEstimee: string
  horairesTravail: any
  risquesIdentifies: string[]
  mesuresPrevention: string[]
  numeroRCS: string
  siegeSocial: string
  localite: string
  commune: string
  region: string
  qualiteFonctionRepresentant: string
  contactPrestataire: string
  emailPrestataire: string
  fokontany: string
  district: string
  situationGeographique: string
  situationGeographiqueAutre: string
  formation: any
  proceduresUrgence: any
  surveillance: any
  documents: any
  attestations: any
  signatureDonneurOrdre: any
  signaturePrestataire: any
  projetActivite: any
  dateSignature: any
  status: PreventionStatus
  risques: Risque[]
  equipements: any
  validationChef: any
  created_at: string
  updated_at: string
  createdAt: string
  updatedAt: string
}

export interface Risque {
  id: string
  libelle: string
  niveau: 'faible' | 'moyen' | 'eleve' | 'critique'
  niveauGravite?: string
  description?: string
  categorie?: string
  probabilite?: string
  impact?: string
  mesuresPrevention?: string[]
  equipementsNecessaires?: string[]
  mesures: Mesure[]
}

export interface Mesure {
  id: string
  description: string
  responsable: string
}

export type PlanPrevention = PreventionPlan
