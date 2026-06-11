import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePermitStore } from '@/store/permitStore';
import { useAuthStore } from '@/store/authStore';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import MultiStepForm from './MultiStepForm';
import { AlertCircle } from 'lucide-react';

// Schémas de validation pour chaque étape
const step1Schema = z.object({
  planPreventionId: z.string().min(1, 'Plan de prévention requis'),
  intituleTravaux: z.string().min(5, 'Intitulé trop court (min 5 caractères)'),
  localisation: z.string().min(1, 'Localisation requise'),
  codeSite: z.string().min(1, 'Code site requis'),
  contractant: z.string().min(1, 'Contractant requis'),
  nombreIntervenants: z.number().min(1, 'Minimum 1 intervenant'),
  dateDebut: z.string().min(1, 'Date de début requise'),
  dateFin: z.string().min(1, 'Date de fin requise'),
});

const step2Schema = z.object({
  travauxChaud: z.boolean(),
  travauxHauteur: z.boolean(),
  travauxElectrique: z.boolean(),
  travauxEspaceConfine: z.boolean(),
  travauxExcavation: z.boolean(),
  travauxAutres: z.boolean(),
  autresDescription: z.string().optional(),
});

const step3Schema = z.object({
  evaluationRisquesValidee: z.boolean().refine((val) => val === true, {
    message: 'L\'évaluation des risques doit être validée',
  }),
  personneCompetenteAssignee: z.boolean().refine((val) => val === true, {
    message: 'Une personne compétente doit être assignée',
  }),
  mesuresPreventionMisesEnPlace: z.boolean().refine((val) => val === true, {
    message: 'Les mesures de prévention doivent être mises en place',
  }),
  personnelInforme: z.boolean().refine((val) => val === true, {
    message: 'Le personnel doit être informé',
  }),
  dangersControles: z.boolean().refine((val) => val === true, {
    message: 'Les dangers doivent être contrôlés',
  }),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

interface PermitGeneralFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onComplete: (data: any) => void;
  onCancel?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export default function PermitGeneralForm({ onComplete, onCancel }: PermitGeneralFormProps) {
  const { plansPrevention } = usePermitStore();
  const { user } = useAuthStore();

  // Filtrer les plans validés
  const plansDisponibles = plansPrevention
    .filter((p) => p.status === 'valide')
    .map((p) => ({
      value: p.id,
      label: `${p.reference} - ${p.nomSite}`,
    }));

  // Étape 1: Détails de l'intervention
  const Step1Component = () => {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<Step1Data>({
      resolver: zodResolver(step1Schema),
      defaultValues: {
        planPreventionId: '',
        intituleTravaux: '',
        localisation: '',
        codeSite: '',
        contractant: user?.entreprise || '',
        nombreIntervenants: 1,
        dateDebut: '',
        dateFin: '',
      },
    });

    const onSubmit = (data: Step1Data) => {
      // Cette fonction sera appelée par le MultiStepForm
      console.log('Step1 data:', data);
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Plan de Prévention Associé *"
          {...register('planPreventionId')}
          error={errors.planPreventionId?.message}
          options={plansDisponibles}
          placeholder="Sélectionner un plan de prévention validé"
        />

        {plansDisponibles.length === 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Aucun plan de prévention disponible
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Vous devez d'abord créer et faire valider un plan de prévention avant de créer
                un permis de travail.
              </p>
            </div>
          </div>
        )}

        <Input
          label="Intitulé des Travaux *"
          {...register('intituleTravaux')}
          error={errors.intituleTravaux?.message}
          placeholder="Ex: Maintenance équipements télécoms"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Localisation *"
            {...register('localisation')}
            error={errors.localisation?.message}
            placeholder="Ex: Antananarivo Centre - Pylône principal"
          />
          <Input
            label="Code Site *"
            {...register('codeSite')}
            error={errors.codeSite?.message}
            placeholder="Ex: ANT-001"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Contractant *"
            {...register('contractant')}
            error={errors.contractant?.message}
            placeholder="Nom de l'entreprise"
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
            label="Date de Début *"
            type="date"
            {...register('dateDebut')}
            error={errors.dateDebut?.message}
          />
          <Input
            label="Date de Fin *"
            type="date"
            {...register('dateFin')}
            error={errors.dateFin?.message}
          />
        </div>
      </form>
    );
  };

  // Étape 2: Types de travaux à risques
  const Step2Component = () => {
    const {
      register,
      handleSubmit,
      watch,
    } = useForm<Step2Data>({
      resolver: zodResolver(step2Schema),
      defaultValues: {
        travauxChaud: false,
        travauxHauteur: false,
        travauxElectrique: false,
        travauxEspaceConfine: false,
        travauxExcavation: false,
        travauxAutres: false,
        autresDescription: '',
      },
    });

    const travauxAutres = watch('travauxAutres');

    const onSubmit = (data: Step2Data) => {
      console.log('Step2 data:', data);
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Cocher tous les types de travaux concernés par cette intervention
        </p>

        <Checkbox
          label="Travaux à chaud"
          description="Soudure, meulage, découpe thermique, etc."
          {...register('travauxChaud')}
        />
        <Checkbox
          label="Travaux en hauteur"
          description="Intervention à plus de 3 mètres de hauteur"
          {...register('travauxHauteur')}
        />
        <Checkbox
          label="Travaux électriques"
          description="Intervention sur installations électriques"
          {...register('travauxElectrique')}
        />
        <Checkbox
          label="Travaux en espace confiné"
          description="Intervention dans un espace restreint"
          {...register('travauxEspaceConfine')}
        />
        <Checkbox
          label="Travaux d'excavation"
          description="Terrassement, forage, creusement"
          {...register('travauxExcavation')}
        />
        <Checkbox
          label="Autres"
          description="Autres types de travaux à risques"
          {...register('travauxAutres')}
        />

        {travauxAutres && (
          <Input
            label="Description des autres travaux"
            {...register('autresDescription')}
            placeholder="Précisez le type de travaux..."
          />
        )}
      </form>
    );
  };

  // Étape 3: Engagement du demandeur
  const Step3Component = () => {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<Step3Data>({
      resolver: zodResolver(step3Schema),
      defaultValues: {
        evaluationRisquesValidee: false,
        personneCompetenteAssignee: false,
        mesuresPreventionMisesEnPlace: false,
        personnelInforme: false,
        dangersControles: false,
      },
    });

    const onSubmit = (data: Step3Data) => {
      console.log('Step3 data:', data);
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          En tant que demandeur, je m'engage et je confirme que :
        </p>

        <Checkbox
          label="L'évaluation des risques a été validée *"
          {...register('evaluationRisquesValidee')}
        />
        {errors.evaluationRisquesValidee && (
          <p className="text-sm text-red-600">{errors.evaluationRisquesValidee.message}</p>
        )}

        <Checkbox
          label="Une personne compétente a été assignée pour contrôler les mesures *"
          {...register('personneCompetenteAssignee')}
        />
        {errors.personneCompetenteAssignee && (
          <p className="text-sm text-red-600">{errors.personneCompetenteAssignee.message}</p>
        )}

        <Checkbox
          label="Les mesures de prévention sont mises en place *"
          {...register('mesuresPreventionMisesEnPlace')}
        />
        {errors.mesuresPreventionMisesEnPlace && (
          <p className="text-sm text-red-600">{errors.mesuresPreventionMisesEnPlace.message}</p>
        )}

        <Checkbox
          label="Le personnel a été informé des exigences de sécurité *"
          {...register('personnelInforme')}
        />
        {errors.personnelInforme && (
          <p className="text-sm text-red-600">{errors.personnelInforme.message}</p>
        )}

        <Checkbox
          label="Les dangers seront contrôlés tout au long des travaux *"
          {...register('dangersControles')}
        />
        {errors.dangersControles && (
          <p className="text-sm text-red-600">{errors.dangersControles.message}</p>
        )}
      </form>
    );
  };

  // Étape 4: Révision et soumission
  const Step4Component = () => {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Information importante</p>
              <p className="text-xs text-blue-700 mt-1">
                Après soumission, votre demande sera transmise au Chef de Projet pour validation.
                Une fois validée par le Chef de Projet, elle sera transmise à l'équipe HSE pour
                validation finale et attribution d'une référence unique.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Récapitulatif de votre demande</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Travaux:</p>
              <p className="text-gray-600">Maintenance équipements télécoms</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Site:</p>
              <p className="text-gray-600">ANT-001 - Antananarivo Centre</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Contractant:</p>
              <p className="text-gray-600">TOA Madagascar</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Intervenants:</p>
              <p className="text-gray-600">2 personne(s)</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Période:</p>
              <p className="text-gray-600">2025-01-20 au 2025-01-22</p>
            </div>
          </div>

          <div>
            <p className="font-medium text-gray-700 mb-2">Types de travaux à risques:</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">Travaux en hauteur</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Travaux électriques</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const steps = [
    {
      id: 'details',
      title: 'Détails de l\'intervention',
      description: 'Informations générales sur les travaux à effectuer',
      component: <Step1Component />,
      isValid: plansDisponibles.length > 0,
    },
    {
      id: 'risques',
      title: 'Types de travaux à risques',
      description: 'Sélection des types de travaux concernés',
      component: <Step2Component />,
    },
    {
      id: 'engagement',
      title: 'Engagement du demandeur',
      description: 'Confirmations obligatoires du demandeur',
      component: <Step3Component />,
    },
    {
      id: 'revision',
      title: 'Révision et soumission',
      description: 'Vérification des informations et soumission',
      component: <Step4Component />,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleComplete = (data: any) => {
    // Préparer les données pour le store
    const permisData = {
      planPreventionId: data.planPreventionId,
      planPreventionReference:
        plansPrevention.find((p) => p.id === data.planPreventionId)?.reference || '',
      intituleTravaux: data.intituleTravaux,
      localisation: data.localisation,
      codeSite: data.codeSite,
      contractant: data.contractant,
      nombreIntervenants: data.nombreIntervenants,
      dateDebut: new Date(data.dateDebut),
      dateFin: new Date(data.dateFin),
      dureeMaxJours: 30,
      travauxRisques: {
        travauxChaud: data.travauxChaud,
        travauxHauteur: data.travauxHauteur,
        travauxElectrique: data.travauxElectrique,
        travauxEspaceConfine: data.travauxEspaceConfine,
        travauxExcavation: data.travauxExcavation,
        autres: data.travauxAutres,
        autresDescription: data.autresDescription,
      },
      permisAnnexes: [],
      status: 'en_attente_validation_chef' as const,
      evaluationRisquesValidee: data.evaluationRisquesValidee,
      personneCompetenteAssignee: data.personneCompetenteAssignee,
      mesuresPreventionMisesEnPlace: data.mesuresPreventionMisesEnPlace,
      personnelInforme: data.personnelInforme,
      dangersControles: data.dangersControles,
      demandeurNom: user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : '',
      demandeurDate: new Date(),
      superviseurNom: user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : '',
      superviseurDate: new Date(),
      creerPar: user?.email || '',
    };

    onComplete(permisData);
  };

  return (
    <MultiStepForm
      steps={steps}
      onComplete={handleComplete}
      onCancel={onCancel}
      title="Permis de Travail Général"
      description="Demande de permis de travail général"
      submitLabel="Soumettre la demande"
    />
  );
}
