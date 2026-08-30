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

export interface HorairesTravail {
  debut?: string
  fin?: string
  pause?: string
}

export interface FormationPrevention {
  personnelForme?: boolean
  formationsRequises?: string[]
}

export interface ProceduresUrgence {
  planEvacuation?: boolean
  numerosUrgence?: string[]
  secouristePresent?: boolean
  posteSecours?: string
  hopitalReference?: string
}

export interface SurveillancePrevention {
  controlesReguliers?: boolean
  frequenceControles?: string
  responsableControle?: string
  pointsControle?: string[]
}

export interface AttestationsPrevention {
  assuranceResponsabilite?: boolean
  attestationFormation?: boolean
  certificatHabilitation?: boolean
  autres?: string[]
}

export interface SignatureDonneurOrdre {
  nomPrenom?: string
  fonction?: string
  signature?: string
}

export interface SignaturePrestataire {
  nomSociete?: string
  nomPrenom?: string
  fonction?: string
  signature?: string
}

export interface EquipementsPrevention {
  equipementsProtection?: string[]
}

export interface ValidationChef {
  valideePar?: string
  dateValidation?: Date | string
}

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
  horairesTravail: HorairesTravail
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
  formation: FormationPrevention
  proceduresUrgence: ProceduresUrgence
  surveillance: SurveillancePrevention
  documents: string[]
  attestations: AttestationsPrevention
  signatureDonneurOrdre: SignatureDonneurOrdre
  signaturePrestataire: SignaturePrestataire
  projetActivite: string
  dateSignature: Date | string
  status: PreventionStatus
  risques: Risque[]
  equipements: EquipementsPrevention
  validationChef: ValidationChef
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
