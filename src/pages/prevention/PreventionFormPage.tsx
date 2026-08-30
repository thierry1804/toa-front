/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useToastStore } from '@/store/toastStore';
import { usePermitStore } from '@/store/permitStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import PreventionMultiStepForm from '@/components/forms/PreventionMultiStepForm';
import { z } from 'zod';

// Import types from the prevention module

// Define the schema for the form
const preventionPlanSchema = z.object({
  entreprisePrestataire: z.string().min(1, 'Entreprise requise'),
  siret: z.string().min(14, 'SIRET invalide').max(14, 'SIRET invalide'),
  representantPrestataire: z.string().min(1, 'Représentant requis'),
  fonctionPrestataire: z.string().min(1, 'Fonction requise'),
  maitreOuvrage: z.string().min(1, "Maître d'ouvrage requis"),
  representantMaitreOuvrage: z.string().min(1, 'Représentant requis'),
  contactMaitreOuvrage: z.string().min(1, 'Contact requis'),
  emailMaitreOuvrage: z.string().email('Email invalide').or(z.literal('')),
  nomSite: z.string().min(1, 'Nom du site requis'),
  adresseSite: z.string().min(1, 'Adresse requise'),
  codePostal: z.string().regex(/^[0-9]{5}$/, 'Code postal invalide'),
  ville: z.string().min(1, 'Ville requise'),
  coordonneesGPS: z.string().optional(),
  natureIntervention: z.string().min(1, 'Nature requise'),
  descriptionTravaux: z.string().min(10, 'Description trop courte (min 10 caractères)'),
  nombreIntervenants: z.number().min(1, 'Minimum 1 intervenant'),
  dureeEstimee: z.number().min(1, 'Durée estimée requise'),
  dateDebut: z.string().min(1, 'Date de début requise'),
  dateFin: z.string().min(1, 'Date de fin requise'),
  horairesTravail: z.object({
    debut: z.string().min(1, 'Heure de début requise'),
    fin: z.string().min(1, 'Heure de fin requise'),
    pause: z.string().min(1, 'Heure de pause requise'),
  }),
  risquesIdentifies: z
    .array(
      z.object({
        id: z.string().optional(),
        categorie: z.string().min(1, 'Catégorie requise'),
        description: z.string().min(1, 'Description requise'),
        niveauGravite: z.enum(['faible', 'moyen', 'eleve', 'critique']),
        probabilite: z.enum(['faible', 'moyenne', 'elevee']),
        impact: z.enum(['faible', 'moyen', 'eleve', 'critique']),
        mesures: z.string().min(1, 'Mesures préventives requises'),
        mesuresExistentes: z.boolean().default(false),
      }),
    )
    .min(1, 'Au moins un risque doit être identifié'),
  equipementsSecurite: z
    .array(
      z.object({
        type: z.string().min(1, "Type d'équipement requis"),
        quantite: z.number().min(1, 'Quantité requise'),
        conforme: z.boolean(),
      }),
    )
    .min(1, 'Au moins un équipement doit être spécifié'),
  consignesSecurite: z.string().min(10, 'Les consignes de sécurité sont requises'),
  consignesUrgence: z.string().min(10, "Les consignes d'urgence sont requises"),
  contactsUrgence: z.string().min(1, "Les contacts d'urgence sont requis"),
  formationSecurite: z.boolean(),
  dateFormation: z.string().optional(),
  nomFormateur: z.string().optional(),
  commentaires: z.string().optional(),
  documentsFournis: z.array(z.string()).min(1, 'Au moins un document doit être fourni'),
  accordResponsable: z.boolean().refine((val) => val === true, {
    message: 'Vous devez accepter les conditions',
  }),
});

// Define the form data type from the schema
type PreventionFormData = z.infer<typeof preventionPlanSchema>;

export default function PreventionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToastStore;
  const { plansPrevention, getPlanPreventionById } = usePermitStore();
  const [editData, setEditData] = useState<PreventionFormData | null>(null);
  const [isLoading, setIsLoading] = useState(!!id);
  const isEditingWithData = !!id;

  useEffect(() => {
    const loadPreventionData = async () => {
      if (!id) return;
      
      try {
        const prevention = getPlanPreventionById(id);
        console.log('Loaded prevention data:', prevention);
        if (prevention) {
          // Map the prevention data to match the form data structure
          const formData: any = {
            // Step 1 - Informations de base
            nomSite: prevention.nomSite || '',
            codeSite: prevention.codeSite || '',
            entreprisePrestataire: prevention.entreprisePrestataire || '',
            numeroRCS: prevention.numeroRCS || '',
            siegeSocial: prevention.siegeSocial || '',
            representantPrestataire: prevention.representantPrestataire || '',
            qualiteFonctionRepresentant: prevention.qualiteFonctionRepresentant || '',
            contactPrestataire: prevention.contactPrestataire || '',
            emailPrestataire: prevention.emailPrestataire || '',
            
            // Step 2 - Localisation
            localite: prevention.localite || '',
            fokontany: prevention.fokontany || '',
            commune: prevention.commune || '',
            district: prevention.district || '',
            region: prevention.region || '',
            coordonneesGPS: prevention.coordonneesGPS || '',
            situationGeographique: prevention.situationGeographique || 'autre',
            situationGeographiqueAutre: prevention.situationGeographiqueAutre || '',
            
            // Step 3 - Description des travaux
            natureIntervention: prevention.natureIntervention || '',
            descriptionTravaux: prevention.descriptionTravaux || '',
            nombreIntervenants: prevention.nombreIntervenants || 1,
            dureeEstimee: prevention.dureeEstimee || 8,
            
            // Step 4 - Période d'intervention
            dateDebut: prevention.dateDebut || new Date().toISOString().split('T')[0],
            dateFin: prevention.dateFin || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            horairesTravail: prevention.horairesTravail || { debut: '08:00', fin: '17:00', pause: '12:00-13:00' },
            
            // Step 5 - Risques identifiés
            risquesIdentifies: (prevention.risques || []).map((risque: any) => ({
              id: risque.id || '',
              categorie: risque.categorie || '',
              risque: risque.description || '',
              gravite: risque.niveauGravite || 'faible',
              probabilite: risque.probabilite || 'faible',
              niveau: risque.niveauGravite || 'faible',
              mesures: risque.mesuresPrevention?.join('\n') || '',
              mesuresExistentes: risque.verification || false
            })),
            
            // Step 6 - Équipements de protection
            equipements: prevention.equipements || {
              equipementsProtection: [],
              outilsTravail: [],
              materielSecurite: [],
              equipementsUrgence: []
            },
            
            // Step 7 - Formation et compétences
            formation: prevention.formation || {
              personnelForme: false,
              formationsRequises: [],
              certifications: [],
              personnelHabilite: []
            },
            
            // Step 8 - Procédures d'urgence
            proceduresUrgence: prevention.proceduresUrgence || {
              planEvacuation: false,
              numerosUrgence: [],
              secouristePresent: false,
              posteSecours: '',
              hopitalReference: ''
            },
            
            // Step 9 - Surveillance et contrôle
            surveillance: prevention.surveillance || {
              controlesReguliers: false,
              frequenceControles: '',
              responsableControle: '',
              pointsControle: []
            },
            
            // Step 10 - Documents et validation
            documents: prevention.documents || [],
            attestations: prevention.attestations || {
              assuranceResponsabilite: false,
              attestationFormation: false,
              certificatHabilitation: false,
              autres: []
            },
            
            // Signatures
            signatureDonneurOrdre: prevention.signatureDonneurOrdre || {
              nomPrenom: '',
              fonction: '',
              signature: ''
            },
            
            signaturePrestataire: prevention.signaturePrestataire || {
              nomSociete: '',
              nomPrenom: '',
              fonction: '',
              signature: ''
            },
            
            // Métadonnées
            status: prevention.status || 'brouillon',
            projetActivite: prevention.projetActivite || '',
            dateSignature: prevention.dateSignature || new Date()
          };
          
          // Ensure at least one risk exists
          if (formData.risquesIdentifies.length === 0) {
            formData.risquesIdentifies = [{
              id: '',
              categorie: '',
              risque: '',
              gravite: 'faible',
              probabilite: 'faible',
              niveau: 'faible',
              mesures: '',
              mesuresExistentes: false
            }];
          }
          
          // Ensure at least one equipment exists
          if (formData.equipementsSecurite.length === 0) {
            formData.equipementsSecurite = [{
              type: '',
              quantite: 1,
              conforme: true
            }];
          }
          
          console.log('Mapped form data:', formData);
          setEditData(formData);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du plan de prévention:", error);
        toast.showError('Erreur lors du chargement du plan de prévention');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreventionData();
  }, [id, plansPrevention, getPlanPreventionById, toast]);

  const defaultValues: any = {
    // Step 1
    entreprisePrestataire: '',
    siret: '',
    representantPrestataire: '',
    fonctionPrestataire: '',
    
    // Step 2
    maitreOuvrage: '',
    representantMaitreOuvrage: '',
    contactMaitreOuvrage: '',
    emailMaitreOuvrage: '',
    
    // Step 3
    nomSite: '',
    adresseSite: '',
    codePostal: '',
    ville: '',
    coordonneesGPS: '',
    fokontany: '',
    commune: '',
    district: '',
    region: '',
    situationGeographique: 'en_ville',
    situationGeographiqueAutre: '',
    
    // Step 4
    natureIntervention: '',
    descriptionTravaux: '',
    nombreIntervenants: 1,
    dureeEstimee: 8,
    
    // Step 5
    dateDebut: '',
    dateFin: '',
    horairesTravail: { debut: '08:00', fin: '17:00', pause: '12:00-13:00' },
    
    // Step 6
    risquesIdentifies: [{
      id: '',
      categorie: '',
      risque: '',
      gravite: 'faible',
      probabilite: 'faible',
      niveau: 'faible',
      mesures: '',
      mesuresExistentes: false
    }],
    
    // Step 7
    equipementsSecurite: [{ type: '', quantite: 1, conforme: true }],
    
    // Step 8
    consignesSecurite: '',
    consignesUrgence: '',
    contactsUrgence: '',
    
    // Step 9
    formationSecurite: false,
    dateFormation: '',
    nomFormateur: '',
    commentaires: '',
    
    // Step 10
    documentsFournis: [],
    accordResponsable: false,
    
    // Step 11
    confirmationFinale: false
  };

  const handleCancel = () => {
    if (window.confirm('Voulez-vous vraiment annuler ? Les modifications non enregistrées seront perdues.')) {
      navigate('/prevention');
    }
  };

  const onSubmit = async (data: PreventionFormData) => {
    try {
      preventionPlanSchema.safeParse(data)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isEditingWithData && id) {
        const updatedPlan = {
          ...data,
          id: id,
          updatedAt: new Date().toISOString(),
        };
        console.log('Mise à jour du plan:', updatedPlan);
        // Here you would typically call an update function from your store
        // updatePreventionPlan(updatedPlan);
      } else {
        console.log("Création d'un nouveau plan:", data);
        // Here you would typically call a create function from your store
        // createPreventionPlan(data);
      }

      toast.showSuccess(
        isEditingWithData
          ? 'Le plan de prévention a été mis à jour avec succès.'
          : 'Le plan de prévention a été créé avec succès.',
      );

      navigate('/prevention');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du plan:', error);
      toast.showError('Une erreur est survenue lors de la sauvegarde du plan de prévention.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={handleCancel} className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditingWithData ? 'Modifier le plan de prévention' : 'Nouveau plan de prévention'}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditingWithData ? 'Modifier le plan de prévention' : 'Nouveau plan de prévention'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PreventionMultiStepForm
              onSubmit={onSubmit as any}
              onCancel={handleCancel}
              initialData={{
                ...defaultValues,
                ...editData,
                risquesIdentifies: (editData?.risquesIdentifies || defaultValues.risquesIdentifies)?.map((r: any) => ({
                  ...r,
                  description: (r as any).risque || r.description || '',
                  niveauGravite: (r as any).niveau || r.niveauGravite || 'faible',
                  impact: (r as any).gravite || r.impact || 'faible',
                }))
              } as any}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
