import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/authStore';
import { usePreventionStore } from '@/store/preventionStore';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import MultiStepForm from './MultiStepForm';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

// Schémas de validation pour chaque étape
const step1Schema = z.object({
  planPreventionId: z.string().min(1, 'Plan de prévention requis'),
  codeSite: z.string().min(1, 'Code site requis'),
  nombreIntervenants: z.number().min(1, 'Minimum 1 intervenant'),
  dateDebut: z.string().min(1, 'Date de début requise'),
  dateFin: z.string().min(1, 'Date de fin requise'),
  travailSousTension: z.boolean(),
  travailHorsTension: z.boolean(),
  consignationEnergie: z.boolean(),
  basseTension: z.boolean(),
  moyenneTension: z.boolean(),
  hauteTension: z.boolean(),
}).refine((data) => {
  // Validation: dateFin >= dateDebut
  if (data.dateDebut && data.dateFin) {
    return new Date(data.dateFin) >= new Date(data.dateDebut);
  }
  return true;
}, {
  message: 'La date de fin doit être postérieure ou égale à la date de début',
  path: ['dateFin'],
});

const step2Schema = z.object({
  typeCircuitEquipement: z.string().min(1, 'Type de circuit requis'),
  descriptionTravail: z.string().min(5, 'Description trop courte (min 5 caractères)'),
  raisonNonMiseHorsTension: z.string().optional(),
  electrisation: z.boolean(),
  electrocution: z.boolean(),
  brulure: z.boolean(),
  autres: z.array(z.string()).optional(),
});

const step3Schema = z.object({
  multimetreDC: z.boolean(),
  outilsIsolants: z.boolean(),
  personnelHabilite: z.boolean(),
  personnelApte: z.boolean(),
  balisage: z.boolean(),
  chaussuresSecurite: z.boolean(),
  casque: z.boolean(),
  gantsElectriques: z.boolean(),
  tapisIsolant: z.boolean(),
  lunetteSecurite: z.boolean(),
  testTension: z.boolean(),
  toolbox: z.boolean(),
  consignationEnergie: z.boolean(),
  autres: z.array(z.string()).optional(),
});

const step4Schema = z.object({
  secouristePresent: z.boolean(),
  numerosUrgenceDisponibles: z.boolean(),
  engagementDemandeur: z.boolean().refine((val) => val === true, {
    message: 'L\'engagement du demandeur est obligatoire',
  }),
});

const step5Schema = z.object({
  motifConsignation: z.string().optional(),
  equipementConcerne: z.string().optional(),
  electrique: z.string().optional(),
  dateConsignation: z.string().optional(),
  heureConsignation: z.string().optional(),
  vatVerification: z.boolean().optional(),
  visaConsignation: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;
type Step5Data = z.infer<typeof step5Schema>;

interface PermitElectriqueFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onComplete: (data: any) => void;
  onCancel?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export default function PermitElectriqueForm({ onComplete, onCancel, initialData }: PermitElectriqueFormProps) {
  const { user } = useAuthStore();

  // État global pour partager les données entre les étapes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>(initialData || {});

  // Étape 1: Informations générales et type de travail
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Step1Component = (formData: any, updateFormData: (data: any) => void) => {
    const { plansPrevention } = usePreventionStore();
    const plansActifs = plansPrevention.filter(p => p.status === 'valide');

    const {
      register,
      handleSubmit,
      watch,
      formState: { errors },
    } = useForm<Step1Data>({
      resolver: zodResolver(step1Schema),
      defaultValues: {
        planPreventionId: formData.planPreventionId || '',
        codeSite: formData.codeSite || '',
        nombreIntervenants: formData.nombreIntervenants || 1,
        dateDebut: formData.dateDebut || '',
        dateFin: formData.dateFin || '',
        travailSousTension: formData.travailSousTension || false,
        travailHorsTension: formData.travailHorsTension || false,
        consignationEnergie: formData.consignationEnergie || false,
        basseTension: formData.basseTension || false,
        moyenneTension: formData.moyenneTension || false,
        hauteTension: formData.hauteTension || false,
      },
    });

    const travailSousTension = watch('travailSousTension');

    const onSubmit = (data: Step1Data) => {
      updateFormData({ ...formData, ...data });
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="mb-4">
          <Select
            label="Référence du plan de prévention *"
            {...register('planPreventionId')}
            error={errors.planPreventionId?.message}
            options={[
              { value: '', label: 'Sélectionnez un plan de prévention' },
              ...plansActifs.map((plan) => ({
                value: plan.id,
                label: `${plan.reference} - ${plan.nomSite}`
              }))
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Code Site *"
            {...register('codeSite')}
            error={errors.codeSite?.message}
            placeholder="Ex: ANT-001"
          />
          <Input
            label="Nombre d'Intervenants *"
            type="number"
            {...register('nombreIntervenants', { valueAsNumber: true })}
            error={errors.nombreIntervenants?.message}
            min={1}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date de début *"
            type="date"
            {...register('dateDebut')}
            error={errors.dateDebut?.message}
          />
          <Input
            label="Date de fin *"
            type="date"
            {...register('dateFin')}
            error={errors.dateFin?.message}
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Type de travail</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Checkbox
              label="Travail sous tension"
              description="Intervention sur installation sous tension"
              {...register('travailSousTension')}
            />
            <Checkbox
              label="Travail hors tension"
              description="Intervention après mise hors tension"
              {...register('travailHorsTension')}
            />
            <Checkbox
              label="Consignation énergétique"
              description="Procédure de consignation"
              {...register('consignationEnergie')}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Niveau de tension</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Checkbox
              label="Basse tension"
              description="≤ 1000V"
              {...register('basseTension')}
            />
            <Checkbox
              label="Moyenne tension"
              description="1kV à 50kV"
              {...register('moyenneTension')}
            />
            <Checkbox
              label="Haute tension"
              description="> 50kV"
              {...register('hauteTension')}
            />
          </div>
        </div>

        {travailSousTension && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Travail sous tension</p>
                <p className="text-xs text-red-700 mt-1">
                  Le travail sous tension nécessite des compétences spécialisées et des équipements spécifiques.
                  Assurez-vous que le personnel est habilité et que les mesures de sécurité sont adaptées.
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    );
  };

  // Étape 2: Description et risques
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Step2Component = (formData: any, updateFormData: (data: any) => void) => {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<Step2Data>({
      resolver: zodResolver(step2Schema),
      defaultValues: {
        typeCircuitEquipement: formData.typeCircuitEquipement || '',
        descriptionTravail: formData.descriptionTravail || '',
        raisonNonMiseHorsTension: formData.raisonNonMiseHorsTension || '',
        electrisation: formData.electrisation || false,
        electrocution: formData.electrocution || false,
        brulure: formData.brulure || false,
        autres: formData.autres || [],
      },
    });

    const travailSousTension = formData.travailSousTension;

    const onSubmit = (data: Step2Data) => {
      updateFormData({ ...formData, ...data });
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Type de circuit/équipement *"
          {...register('typeCircuitEquipement')}
          error={errors.typeCircuitEquipement?.message}
          placeholder="Ex: Tableau électrique principal, Câble HT, etc."
        />

        <Textarea
          label="Description du travail *"
          {...register('descriptionTravail')}
          error={errors.descriptionTravail?.message}
          placeholder="Décrivez en détail les travaux électriques à effectuer..."
          rows={3}
        />

        {travailSousTension && (
          <Textarea
            label="Raison de la non mise hors tension"
            {...register('raisonNonMiseHorsTension')}
            placeholder="Justifiez pourquoi les travaux doivent être effectués sous tension..."
            rows={2}
          />
        )}

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Risques identifiés</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Checkbox
              label="Électrisation"
              description="Passage du courant dans le corps"
              {...register('electrisation')}
            />
            <Checkbox
              label="Électrocution"
              description="Électrisation mortelle"
              {...register('electrocution')}
            />
            <Checkbox
              label="Brûlure"
              description="Brûlure par arc électrique"
              {...register('brulure')}
            />
          </div>
        </div>
      </form>
    );
  };

  // Étape 3: Matériels et mesures de prévention
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Step3Component = (formData: any, updateFormData: (data: any) => void) => {
    const {
      register,
      handleSubmit,
    } = useForm<Step3Data>({
      resolver: zodResolver(step3Schema),
      defaultValues: {
        multimetreDC: formData.multimetreDC || false,
        outilsIsolants: formData.outilsIsolants || false,
        personnelHabilite: formData.personnelHabilite || false,
        personnelApte: formData.personnelApte || false,
        balisage: formData.balisage || false,
        chaussuresSecurite: formData.chaussuresSecurite || false,
        casque: formData.casque || false,
        gantsElectriques: formData.gantsElectriques || false,
        tapisIsolant: formData.tapisIsolant || false,
        lunetteSecurite: formData.lunetteSecurite || false,
        testTension: formData.testTension || false,
        toolbox: formData.toolbox || false,
        consignationEnergie: formData.consignationEnergie || false,
        autres: formData.autres || [],
      },
    });

    const onSubmit = (data: Step3Data) => {
      updateFormData({ ...formData, ...data });
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Matériels de mesure et outils</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Checkbox
              label="Multimètre DC"
              description="Appareil de mesure de tension"
              {...register('multimetreDC')}
            />
            <Checkbox
              label="Outils isolants"
              description="Outils avec isolation électrique"
              {...register('outilsIsolants')}
            />
            <Checkbox
              label="Test de tension"
              description="VAT (Vérificateur d'Absence de Tension)"
              {...register('testTension')}
            />
            <Checkbox
              label="Toolbox électrique"
              description="Boîte à outils spécialisée"
              {...register('toolbox')}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Formation et compétences</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Checkbox
              label="Personnel habilité"
              description="Personnel formé et habilité électrique"
              {...register('personnelHabilite')}
            />
            <Checkbox
              label="Personnel apte"
              description="Personnel médicalement apte"
              {...register('personnelApte')}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Équipements de protection individuelle</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Checkbox
              label="Chaussures de sécurité"
              {...register('chaussuresSecurite')}
            />
            <Checkbox
              label="Casque de sécurité"
              {...register('casque')}
            />
            <Checkbox
              label="Gants électriques"
              description="Gants isolants pour travaux électriques"
              {...register('gantsElectriques')}
            />
            <Checkbox
              label="Tapis isolant"
              description="Tapis de protection isolant"
              {...register('tapisIsolant')}
            />
            <Checkbox
              label="Lunettes de sécurité"
              {...register('lunetteSecurite')}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Procédures de sécurité</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Checkbox
              label="Balisage de la zone"
              {...register('balisage')}
            />
            <Checkbox
              label="Consignation énergétique"
              description="Procédure de consignation effectuée"
              {...register('consignationEnergie')}
            />
          </div>
        </div>
      </form>
    );
  };

  // Étape 4: Prévention urgence et engagement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Step4Component = (formData: any, updateFormData: (data: any) => void) => {
    const {
      register,
      handleSubmit,
    } = useForm<Step4Data>({
      resolver: zodResolver(step4Schema),
      defaultValues: {
        secouristePresent: formData.secouristePresent || false,
        numerosUrgenceDisponibles: formData.numerosUrgenceDisponibles || false,
        engagementDemandeur: formData.engagementDemandeur || false,
      },
    });

    const onSubmit = (data: Step4Data) => {
      updateFormData({ ...formData, ...data });
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Prévention urgence</p>
              <p className="text-xs text-blue-700 mt-1">
                Vérifiez que les mesures d'urgence sont en place avant de commencer les travaux électriques.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Checkbox
            label="Secouriste présent"
            description="Personnel formé aux premiers secours présent sur site"
            {...register('secouristePresent')}
          />
          <Checkbox
            label="Numéros d'urgence disponibles"
            description="Numéros d'urgence affichés et accessibles"
            {...register('numerosUrgenceDisponibles')}
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Engagement du demandeur</h4>
          <Checkbox
            label="Je m'engage à respecter toutes les mesures de sécurité et procédures définies *"
            description="Engagement obligatoire du demandeur"
            {...register('engagementDemandeur')}
          />
        </div>
      </form>
    );
  };

  // Étape 5: Consignation énergétique (optionnelle)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Step5Component = (formData: any, updateFormData: (data: any) => void) => {
    const {
      register,
      handleSubmit,
    } = useForm<Step5Data>({
      resolver: zodResolver(step5Schema),
      defaultValues: {
        motifConsignation: formData.motifConsignation || '',
        equipementConcerne: formData.equipementConcerne || '',
        electrique: formData.electrique || '',
        dateConsignation: formData.dateConsignation || '',
        heureConsignation: formData.heureConsignation || '',
        vatVerification: formData.vatVerification || false,
        visaConsignation: formData.visaConsignation || '',
      },
    });

    const consignationEnergie = formData.consignationEnergie;

    const onSubmit = (data: Step5Data) => {
      updateFormData({ ...formData, ...data });
    };

    if (!consignationEnergie) {
      return (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Consignation non requise</p>
                <p className="text-xs text-gray-700 mt-1">
                  Aucune consignation énergétique n'est requise pour ce type de travaux.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Récapitulatif de votre demande</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Site:</p>
                <p className="text-gray-600">{formData.codeSite}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Intervenants:</p>
                <p className="text-gray-600">{formData.nombreIntervenants} personne(s)</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Type de travail:</p>
                <p className="text-gray-600">
                  {formData.travailSousTension ? 'Sous tension' : 'Hors tension'}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Niveau de tension:</p>
                <p className="text-gray-600">
                  {formData.basseTension ? 'Basse tension' : 
                   formData.moyenneTension ? 'Moyenne tension' : 
                   formData.hauteTension ? 'Haute tension' : 'Non spécifié'}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">Consignation énergétique</p>
              <p className="text-xs text-yellow-700 mt-1">
                Remplissez les informations de consignation si applicable.
              </p>
            </div>
          </div>
        </div>

        <Input
          label="Motif de consignation"
          {...register('motifConsignation')}
          placeholder="Ex: Maintenance préventive, Réparation..."
        />

        <Input
          label="Équipement concerné"
          {...register('equipementConcerne')}
          placeholder="Ex: Tableau électrique principal, Disjoncteur..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date de consignation"
            type="date"
            {...register('dateConsignation')}
          />
          <Input
            label="Heure de consignation"
            type="time"
            {...register('heureConsignation')}
          />
        </div>

        <Input
          label="Électrique"
          {...register('electrique')}
          placeholder="Détails électriques..."
        />

        <Checkbox
          label="VAT vérification"
          description="Vérification d'absence de tension effectuée"
          {...register('vatVerification')}
        />

        <Input
          label="Visa de consignation"
          {...register('visaConsignation')}
          placeholder="Nom et signature du consignateur"
        />
      </form>
    );
  };

  const steps = [
    {
      id: 'informations',
      title: 'Informations générales',
      description: 'Type de travail et niveau de tension',
      component: Step1Component,
    },
    {
      id: 'description',
      title: 'Description et risques',
      description: 'Détails des travaux et risques identifiés',
      component: Step2Component,
    },
    {
      id: 'materiels',
      title: 'Matériels et prévention',
      description: 'Équipements et mesures de prévention',
      component: Step3Component,
    },
    {
      id: 'urgence',
      title: 'Prévention urgence',
      description: 'Mesures d\'urgence et engagement',
      component: Step4Component,
    },
    {
      id: 'consignation',
      title: 'Consignation énergétique',
      description: 'Informations de consignation (si applicable)',
      component: Step5Component,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleComplete = (data: any) => {
    // Récupérer la référence du plan de prévention
    const { getPlanPreventionById } = usePreventionStore.getState();
    const planPrevention = getPlanPreventionById(data.planPreventionId);

    // Préparer les données pour le store
    const permisData = {
      permisGeneralId: '', // Sera lié au permis général
      planPreventionReference: planPrevention?.reference || '',
      codeSite: data.codeSite,
      nombreIntervenants: data.nombreIntervenants,
      typeTravail: {
        travailSousTension: data.travailSousTension,
        travailHorsTension: data.travailHorsTension,
        consignationEnergie: data.consignationEnergie,
      },
      tension: {
        basseTension: data.basseTension,
        moyenneTension: data.moyenneTension,
        hauteTension: data.hauteTension,
      },
      typeCircuitEquipement: data.typeCircuitEquipement,
      descriptionTravail: data.descriptionTravail,
      raisonNonMiseHorsTension: data.raisonNonMiseHorsTension,
      risques: {
        electrisation: data.electrisation,
        electrocution: data.electrocution,
        brulure: data.brulure,
        autres: data.autres || [],
      },
      materiels: {
        multimetreDC: data.multimetreDC,
        outilsIsolants: data.outilsIsolants,
        autres: data.autres || [],
      },
      mesuresPrevention: {
        personnelHabilite: data.personnelHabilite,
        personnelApte: data.personnelApte,
        balisage: data.balisage,
        chaussuresSecurite: data.chaussuresSecurite,
        casque: data.casque,
        gantsElectriques: data.gantsElectriques,
        tapisIsolant: data.tapisIsolant,
        lunetteSecurite: data.lunetteSecurite,
        testTension: data.testTension,
        toolbox: data.toolbox,
        consignationEnergie: data.consignationEnergie,
        autres: data.autres || [],
      },
      secouristePresent: data.secouristePresent,
      numerosUrgenceDisponibles: data.numerosUrgenceDisponibles,
      engagementDemandeur: data.engagementDemandeur,
      demandeurNom: user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : '',
      demandeurDate: new Date(),
      personnelsExecutants: [],
      controlesJournaliers: [],
      bonConsignation: data.consignationEnergie ? {
        motif: data.motifConsignation || '',
        consignations: [{
          codeSite: data.codeSite,
          equipementConcerne: data.equipementConcerne || '',
          electrique: data.electrique || '',
          dateConsignation: data.dateConsignation ? new Date(data.dateConsignation) : undefined,
          heureConsignation: data.heureConsignation || '',
          vatVerification: data.vatVerification || false,
          visaConsignation: data.visaConsignation || '',
        }],
      } : undefined,
      status: 'en_attente_validation_chef' as const,
      dateDebut: data.dateDebut ? new Date(data.dateDebut) : new Date(),
      dateFin: data.dateFin ? new Date(data.dateFin) : new Date(),
      creerPar: user?.email || '',
    };

    onComplete(permisData);
  };

  return (
    <MultiStepForm
      steps={steps}
      onComplete={handleComplete}
      onCancel={onCancel}
      title="Permis de Travail Électrique"
      description="Demande de permis de travail électrique"
      submitLabel="Soumettre la demande"
      formData={formData}
      updateFormData={setFormData}
    />
  );
}
