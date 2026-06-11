import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePermitStore } from '@/store/permitStore';
import { useAuthStore } from '@/store/authStore';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import Textarea from '@/components/ui/Textarea';
import MultiStepForm from './MultiStepForm';
import { AlertCircle, FileText } from 'lucide-react';

// Schémas de validation pour chaque étape
const step1Schema = z.object({
  planPreventionId: z.string().min(1, 'Plan de prévention requis'),
  prestataire: z.string().min(1, 'Prestataire requis'),
  dateDebut: z.string().min(1, 'Date de début requise'),
  dateFin: z.string().min(1, 'Date de fin requise'),
  descriptionOperation: z.string().min(5, 'Description trop courte (min 5 caractères)'),
  codeSite: z.string().min(1, 'Code site requis'),
  region: z.string().min(1, 'Région requise'),
  nombreIntervenants: z.number().min(1, 'Minimum 1 intervenant'),
  hauteurChute: z.enum(['<=3m', '3-8m', '8-40m', '>40m']),
  travailToiture: z.boolean(),
  typePente: z.enum(['plat', 'legere', 'forte', 'tres_forte', 'extreme']).optional(),
});

const step2Schema = z.object({
  effondrement: z.boolean(),
  incendie: z.boolean(),
  deversement: z.boolean(),
  electrisation: z.boolean(),
  chutePersonnes: z.boolean(),
  blessure: z.boolean(),
  chuteObjet: z.boolean(),
  expositionSubstances: z.boolean(),
  ecrasement: z.boolean(),
  mauvaiseMeteo: z.boolean(),
  autres: z.array(z.string()).optional(),
});

const step3Schema = z.object({
  echafaudageRoulant: z.boolean(),
  echafaudageFixe: z.boolean(),
  filetSecurite: z.boolean(),
  ligneVieVerticale: z.boolean(),
  ligneVieHorizontale: z.boolean(),
  pointAncrage: z.boolean(),
  echelleCrinoline: z.boolean(),
  plateformeElevatrice: z.boolean(),
  travailCordes: z.boolean(),
  echelle: z.boolean(),
  escabeau: z.boolean(),
  autres: z.array(z.string()).optional(),
});

const step4Schema = z.object({
  personnelHabilite: z.boolean(),
  personnelApte: z.boolean(),
  balisage: z.boolean(),
  chaussuresSecurite: z.boolean(),
  casque: z.boolean(),
  gantsNitrile: z.boolean(),
  gantsIsolants: z.boolean(),
  gantsManutention: z.boolean(),
  bouchonOreille: z.boolean(),
  casqueAntiBruit: z.boolean(),
  longeAbsorbeur: z.boolean(),
  doubleLonge: z.boolean(),
  ligneVieConforme: z.boolean(),
  harnaisVerifie: z.boolean(),
  echafaudageConforme: z.boolean(),
  echelleConforme: z.boolean(),
  sanglageOutils: z.boolean(),
  travailDeux: z.boolean(),
  mesureVent: z.boolean(),
  autres: z.array(z.string()).optional(),
});

const step5Schema = z.object({
  planSauvetageDisponible: z.boolean(),
  numerosUrgenceDisponibles: z.boolean(),
  secouristePresent: z.boolean(),
  engagementDemandeur: z.boolean().refine((val) => val === true, {
    message: 'L\'engagement est obligatoire pour soumettre le permis',
  }),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;
type Step5Data = z.infer<typeof step5Schema>;

interface PermitHauteurFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onComplete: (data: any) => void;
  onCancel?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export default function PermitHauteurForm({ onComplete, onCancel, initialData }: PermitHauteurFormProps) {
  const { plansPrevention } = usePermitStore();
  const { user } = useAuthStore();

  // État global pour partager les données entre les étapes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>(initialData || {});

  // Générer le numéro de permis dès l'ouverture du formulaire
  const [permitNumber] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PTWH-${year}${month}${day}-${random}`;
  });

  // Filtrer les plans validés
  const plansDisponibles = plansPrevention
    .filter((p) => p.status === 'valide')
    .map((p) => ({
      value: p.id,
      label: `${p.reference} - ${p.nomSite}`,
    }));

  // Étape 1: Informations générales
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Step1Component = (formData: any, updateFormData: (data: any) => void) => {
    const {
      register,
      handleSubmit,
      watch,
      setValue,
      formState: { errors },
    } = useForm<Step1Data>({
      resolver: zodResolver(step1Schema),
      defaultValues: {
        planPreventionId: formData.planPreventionId || '',
        prestataire: formData.prestataire || user?.entreprise || '',
        dateDebut: formData.dateDebut || '',
        dateFin: formData.dateFin || '',
        descriptionOperation: formData.descriptionOperation || '',
        codeSite: formData.codeSite || '',
        region: formData.region || '',
        nombreIntervenants: formData.nombreIntervenants || 1,
        hauteurChute: formData.hauteurChute || '<=3m',
        travailToiture: formData.travailToiture || false,
        typePente: formData.typePente || 'plat',
      },
    });

    const travailToiture = watch('travailToiture');
    const hauteurChute = watch('hauteurChute');
    const typePente = watch('typePente');

    // Synchroniser les données en temps réel
    useEffect(() => {
      const subscription = watch((data) => {
        updateFormData({ ...formData, ...data });
      });
      return () => subscription.unsubscribe();
    }, [watch, formData, updateFormData]);

    const onSubmit = (data: Step1Data) => {
      updateFormData({ ...formData, ...data });
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Référence du plan de prévention *"
          {...register('planPreventionId')}
          error={errors.planPreventionId?.message}
          options={plansDisponibles}
          placeholder="Sélectionnez un plan de prévention"
        />

        <Input
          label="Prestataires - Sous-traitants *"
          {...register('prestataire')}
          error={errors.prestataire?.message}
          placeholder="Nom de l'entreprise prestataire"
        />

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

        <Textarea
          label="Description de l'opération / travaux *"
          {...register('descriptionOperation')}
          error={errors.descriptionOperation?.message}
          placeholder="Décrivez en détail l'opération à effectuer en hauteur..."
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nom du site *"
            {...register('codeSite')}
            error={errors.codeSite?.message}
            placeholder="Ex: ANT-001"
          />
          <Input
            label="Région *"
            {...register('region')}
            error={errors.region?.message}
            placeholder="Ex: Analamanga"
          />
        </div>

        <Input
          label="Nombre d'intervenants *"
          type="number"
          {...register('nombreIntervenants', { valueAsNumber: true })}
          error={errors.nombreIntervenants?.message}
          min={1}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hauteur de chute potentielle *
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { value: '<=3m', label: 'Hauteur ≤ 3m' },
              { value: '3-8m', label: '3m < hauteur ≤ 8m' },
              { value: '8-40m', label: '8m < hauteur ≤ 40m' },
              { value: '>40m', label: 'Hauteur > 40m' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setValue('hauteurChute', option.value as '<=3m' | '3-8m' | '8-40m' | '>40m');
                  updateFormData({ ...formData, hauteurChute: option.value });
                }}
                className={`px-3 py-2 text-sm border rounded-md transition-colors ${hauteurChute === option.value
                  ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.hauteurChute && (
            <p className="mt-1 text-sm text-red-600">{errors.hauteurChute.message}</p>
          )}
        </div>

        <Checkbox
          label="Travail en toiture"
          description="Intervention sur toiture ou surface inclinée"
          {...register('travailToiture')}
        />

        {travailToiture && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de pente
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
              {[
                { value: 'plat', label: 'Toit plat' },
                { value: 'legere', label: 'Légère pente < 20°' },
                { value: 'forte', label: 'Forte pente ≥ 20° et < 45°' },
                { value: 'tres_forte', label: 'Très forte pente ≥ 45° et < 60°' },
                { value: 'extreme', label: 'Pente extrême ≥ 60°' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setValue('typePente', option.value as 'plat' | 'legere' | 'forte' | 'tres_forte' | 'extreme');
                    updateFormData({ ...formData, typePente: option.value });
                  }}
                  className={`px-3 py-2 text-sm border rounded-md transition-colors text-left ${typePente === option.value
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    );
  };

  // Étape 2: Risques identifiés
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Step2Component = (formData: any, updateFormData: (data: any) => void) => {
    const {
      register,
      handleSubmit,
      watch,
      setValue,
    } = useForm<Step2Data>({
      resolver: zodResolver(step2Schema),
      defaultValues: {
        effondrement: formData.effondrement || false,
        incendie: formData.incendie || false,
        deversement: formData.deversement || false,
        electrisation: formData.electrisation || false,
        chutePersonnes: formData.chutePersonnes || false,
        blessure: formData.blessure || false,
        chuteObjet: formData.chuteObjet || false,
        expositionSubstances: formData.expositionSubstances || false,
        ecrasement: formData.ecrasement || false,
        mauvaiseMeteo: formData.mauvaiseMeteo || false,
        autres: formData.autres || [],
      },
    });

    // Synchroniser les données en temps réel
    useEffect(() => {
      const subscription = watch((data) => {
        updateFormData({ ...formData, ...data });
      });
      return () => subscription.unsubscribe();
    }, [watch, formData, updateFormData]);

    const onSubmit = (data: Step2Data) => {
      updateFormData({ ...formData, ...data });
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Identifiez tous les risques liés aux travaux en hauteur
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            label="Effondrement"
            {...register('effondrement')}
          />
          <Checkbox
            label="Incendie"
            {...register('incendie')}
          />
          <Checkbox
            label="Déversement accidentel"
            {...register('deversement')}
          />
          <Checkbox
            label="Electrisation / Electrocution"
            {...register('electrisation')}
          />
          <Checkbox
            label="Chute de personnes"
            {...register('chutePersonnes')}
          />
          <Checkbox
            label="Blessure (coupure…)"
            {...register('blessure')}
          />
          <Checkbox
            label="Chute d'objet"
            {...register('chuteObjet')}
          />
          <Checkbox
            label="Exposition aux substances dangereuses"
            {...register('expositionSubstances')}
          />
          <Checkbox
            label="Ecrasement"
            {...register('ecrasement')}
          />
          <Checkbox
            label="Mauvaise condition météorologique"
            {...register('mauvaiseMeteo')}
          />
        </div>

        {/* Section Autre */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              label="Autre"
              {...register('autres')}
            />
          </div>

          <div className="ml-6">
            <Input
              label="Précisez le risque"
              placeholder="Décrivez le risque spécifique..."
              onKeyDown={(e) => {
                const input = e.target as HTMLInputElement;
                if (e.key === 'Enter' && input.value.trim()) {
                  e.preventDefault();
                  const currentAutres = formData.autres || [];
                  if (!currentAutres.includes(input.value.trim())) {
                    const newAutres = [...currentAutres, input.value.trim()];
                    setValue('autres', newAutres);
                    updateFormData({ ...formData, autres: newAutres });
                    input.value = '';
                  }
                }
              }}
            />

            {/* Affichage des risques "autres" ajoutés */}
            {formData.autres && formData.autres.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.autres.map((risque: string, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                    <span className="text-sm text-gray-700">{risque}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newAutres = formData.autres.filter((_: string, i: number) => i !== index);
                        setValue('autres', newAutres);
                        updateFormData({ ...formData, autres: newAutres });
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    );
  };

  // Étape 3: Matériels et équipements
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Step3Component = (formData: any, updateFormData: (data: any) => void) => {
    const {
      register,
      handleSubmit,
      watch,
      setValue,
    } = useForm<Step3Data>({
      resolver: zodResolver(step3Schema),
      defaultValues: {
        echafaudageRoulant: formData.echafaudageRoulant || false,
        echafaudageFixe: formData.echafaudageFixe || false,
        filetSecurite: formData.filetSecurite || false,
        ligneVieVerticale: formData.ligneVieVerticale || false,
        ligneVieHorizontale: formData.ligneVieHorizontale || false,
        pointAncrage: formData.pointAncrage || false,
        echelleCrinoline: formData.echelleCrinoline || false,
        plateformeElevatrice: formData.plateformeElevatrice || false,
        travailCordes: formData.travailCordes || false,
        echelle: formData.echelle || false,
        escabeau: formData.escabeau || false,
        autres: formData.autres || [],
      },
    });

    // Synchroniser les données en temps réel
    useEffect(() => {
      const subscription = watch((data) => {
        updateFormData({ ...formData, ...data });
      });
      return () => subscription.unsubscribe();
    }, [watch, formData, updateFormData]);

    const onSubmit = (data: Step3Data) => {
      updateFormData({ ...formData, ...data });
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Sélectionnez les matériels et équipements utilisés
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            label="Échafaudage roulant"
            description="Échafaudage mobile sur roues"
            {...register('echafaudageRoulant')}
          />
          <Checkbox
            label="Échafaudage fixe"
            description="Échafaudage fixe monté sur structure"
            {...register('echafaudageFixe')}
          />
          <Checkbox
            label="Filet de sécurité"
            description="Filet de protection contre les chutes"
            {...register('filetSecurite')}
          />
          <Checkbox
            label="Ligne de vie verticale"
            description="Ligne de vie pour déplacement vertical"
            {...register('ligneVieVerticale')}
          />
          <Checkbox
            label="Ligne de vie horizontale"
            description="Ligne de vie pour déplacement horizontal"
            {...register('ligneVieHorizontale')}
          />
          <Checkbox
            label="Point d'ancrage"
            description="Point d'ancrage fixe"
            {...register('pointAncrage')}
          />
          <Checkbox
            label="Echelle crinoline"
            {...register('echelleCrinoline')}
          />
          <Checkbox
            label="Plateforme élévatrice"
            description="PEMP (Plateforme Élévatrice Mobile de Personnel)"
            {...register('plateformeElevatrice')}
          />
          <Checkbox
            label="Travail sur cordes"
            description="Techniques d'accès et de positionnement sur cordes"
            {...register('travailCordes')}
          />
          <Checkbox
            label="Échelle"
            description="Échelle simple"
            {...register('echelle')}
          />
          <Checkbox
            label="Escabeau"
            description="Escabeau ou marchepied"
            {...register('escabeau')}
          />
        </div>

        {/* Section Autre */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              label="Autre"
              {...register('autres')}
            />
          </div>

          <div className="ml-6">
            <Input
              label="Précisez l'équipement"
              placeholder="Décrivez l'équipement spécifique..."
              onKeyDown={(e) => {
                const input = e.target as HTMLInputElement;
                if (e.key === 'Enter' && input.value.trim()) {
                  e.preventDefault();
                  const currentAutres = formData.autres || [];
                  if (!currentAutres.includes(input.value.trim())) {
                    const newAutres = [...currentAutres, input.value.trim()];
                    setValue('autres', newAutres);
                    updateFormData({ ...formData, autres: newAutres });
                    input.value = '';
                  }
                }
              }}
            />

            {/* Affichage des équipements "autres" ajoutés */}
            {formData.autres && formData.autres.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.autres.map((equipement: string, index: number) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                    <span className="text-sm text-gray-700">{equipement}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newAutres = formData.autres.filter((_: string, i: number) => i !== index);
                        setValue('autres', newAutres);
                        updateFormData({ ...formData, autres: newAutres });
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    );
  };

  // Étape 4: Mesures de prévention
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Step4Component = (formData: any, updateFormData: (data: any) => void) => {
    const {
      register,
      handleSubmit,
      watch,
    } = useForm<Step4Data>({
      resolver: zodResolver(step4Schema),
      defaultValues: {
        personnelHabilite: formData.personnelHabilite || false,
        personnelApte: formData.personnelApte || false,
        balisage: formData.balisage || false,
        chaussuresSecurite: formData.chaussuresSecurite || false,
        casque: formData.casque || false,
        gantsNitrile: formData.gantsNitrile || false,
        gantsIsolants: formData.gantsIsolants || false,
        gantsManutention: formData.gantsManutention || false,
        bouchonOreille: formData.bouchonOreille || false,
        casqueAntiBruit: formData.casqueAntiBruit || false,
        longeAbsorbeur: formData.longeAbsorbeur || false,
        doubleLonge: formData.doubleLonge || false,
        ligneVieConforme: formData.ligneVieConforme || false,
        harnaisVerifie: formData.harnaisVerifie || false,
        echafaudageConforme: formData.echafaudageConforme || false,
        echelleConforme: formData.echelleConforme || false,
        sanglageOutils: formData.sanglageOutils || false,
        travailDeux: formData.travailDeux || false,
        mesureVent: formData.mesureVent || false,
        autres: formData.autres || [],
      },
    });

    // Synchroniser les données en temps réel
    useEffect(() => {
      const subscription = watch((data) => {
        updateFormData({ ...formData, ...data });
      });
      return () => subscription.unsubscribe();
    }, [watch, formData, updateFormData]);

    const onSubmit = (data: Step4Data) => {
      updateFormData({ ...formData, ...data });
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Confirmez les mesures de prévention mises en place
        </p>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Formation et compétences</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Checkbox
                label="Personnel habilité (formé et compétent)"
                {...register('personnelHabilite')}
              />
              <Checkbox
                label="Personnel apte médicalement"
                {...register('personnelApte')}
              />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Équipements de protection individuelle</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Checkbox
                label="Chaussures de sécurité"
                {...register('chaussuresSecurite')}
              />
              <Checkbox
                label="Casque avec jugulaire"
                {...register('casque')}
              />
              <Checkbox
                label="Gants de peinture nitrile"
                {...register('gantsNitrile')}
              />
              <Checkbox
                label="Gants isolant électrique"
                {...register('gantsIsolants')}
              />
              <Checkbox
                label="Gants de manutention"
                {...register('gantsManutention')}
              />
              <Checkbox
                label="Bouchon d'oreille"
                {...register('bouchonOreille')}
              />
              <Checkbox
                label="Casque anti-bruit"
                {...register('casqueAntiBruit')}
              />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Équipements anti-chute</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Checkbox
                label="Longe avec absorbeur"
                {...register('longeAbsorbeur')}
              />
              <Checkbox
                label="Double longe"
                {...register('doubleLonge')}
              />
              <Checkbox
                label="Lignes de vie conforme"
                {...register('ligneVieConforme')}
              />
              <Checkbox
                label="Harnais vérifié et conforme"
                {...register('harnaisVerifie')}
              />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Vérifications et procédures</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Checkbox
                label="Balisage de la zone de travaux"
                {...register('balisage')}
              />
              <Checkbox
                label="Echafaudage contrôlé et conforme"
                {...register('echafaudageConforme')}
              />
              <Checkbox
                label="Echelle en bon état (barreaux, montants, patins antidérapants)"
                {...register('echelleConforme')}
              />
              <Checkbox
                label="Sanglage des outils"
                {...register('sanglageOutils')}
              />
              <Checkbox
                label="Travail à 2 obligatoire"
                {...register('travailDeux')}
              />
              <Checkbox
                label="Mesure de la vitesse du vent"
                {...register('mesureVent')}
              />
            </div>
          </div>
        </div>
      </form>
    );
  };

  // Étape 5: Prévention urgence et validation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Step5Component = (formData: any, updateFormData: (data: any) => void) => {
    const {
      register,
      handleSubmit,
      watch,
    } = useForm<Step5Data>({
      resolver: zodResolver(step5Schema),
      defaultValues: {
        planSauvetageDisponible: formData.planSauvetageDisponible || false,
        numerosUrgenceDisponibles: formData.numerosUrgenceDisponibles || false,
        secouristePresent: formData.secouristePresent || false,
        engagementDemandeur: formData.engagementDemandeur || false,
      },
    });

    const planSauvetage = watch('planSauvetageDisponible');

    // Vérifier si la hauteur > 20m (8-40m ou >40m)
    const hauteurSuperieure20m = formData.hauteurChute === '8-40m' || formData.hauteurChute === '>40m';

    // Synchroniser les données en temps réel
    useEffect(() => {
      const subscription = watch((data) => {
        updateFormData({ ...formData, ...data });
      });
      return () => subscription.unsubscribe();
    }, [watch, formData, updateFormData]);

    const onSubmit = (data: Step5Data) => {
      updateFormData({ ...formData, ...data });
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Prévention en cas d'urgence</p>
              <p className="text-xs text-blue-700 mt-1">
                Vérifiez que les mesures d'urgence sont en place avant de commencer les travaux.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Checkbox
              label={`Plan de sauvetage disponible${hauteurSuperieure20m ? ' *' : ''}`}
              description={hauteurSuperieure20m ? "Obligatoire pour les travaux en hauteur > 20m" : "Plan de sauvetage en cas d'urgence"}
              {...register('planSauvetageDisponible')}
            />
            {hauteurSuperieure20m && !planSauvetage && (
              <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-sm text-orange-800">
                  ⚠️ <strong>Attention:</strong> Le plan de sauvetage est obligatoire pour les travaux en hauteur supérieure à 20 mètres.
                </p>
              </div>
            )}
          </div>

          <Checkbox
            label="Numéros d'urgence disponibles"
            description="Numéros d'urgence affichés et accessibles"
            {...register('numerosUrgenceDisponibles')}
          />
          <Checkbox
            label="Secouriste présent sur site"
            description="Personnel formé aux premiers secours présent sur site"
            {...register('secouristePresent')}
          />
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Engagement du demandeur de permis</h4>
          <Checkbox
            label="En tant que demandeur de ce permis, je m'engage à respecter la mise en œuvre des mesures de prévention mentionnées à chaque début de travaux impliquant un travail en hauteur"
            {...register('engagementDemandeur')}
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Récapitulatif de votre demande</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Plan de prévention:</p>
              <p className="text-gray-600">
                {formData.planPreventionId ?
                  plansDisponibles.find(p => p.value === formData.planPreventionId)?.label || 'N/A'
                  : 'Non renseigné'}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Prestataire:</p>
              <p className="text-gray-600">{formData.prestataire || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Période:</p>
              <p className="text-gray-600">
                {formData.dateDebut && formData.dateFin ?
                  `Du ${formData.dateDebut} au ${formData.dateFin}`
                  : 'Non renseigné'}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Site:</p>
              <p className="text-gray-600">{formData.codeSite ? `${formData.codeSite} - ${formData.region}` : 'Non renseigné'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Opération:</p>
              <p className="text-gray-600">{formData.descriptionOperation || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Intervenants:</p>
              <p className="text-gray-600">{formData.nombreIntervenants ? `${formData.nombreIntervenants} personne(s)` : 'Non renseigné'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Hauteur de chute potentielle:</p>
              <p className="text-gray-600">{formData.hauteurChute || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Travail en toiture:</p>
              <p className="text-gray-600">
                {formData.travailToiture ? `Oui${formData.typePente ? ` (${formData.typePente})` : ''}` : 'Non'}
              </p>
            </div>
          </div>
        </div>
      </form>
    );
  };

  const steps = [
    {
      id: 'informations',
      title: 'Informations générales',
      description: 'Détails de l\'opération et caractéristiques du site',
      component: Step1Component,
    },
    {
      id: 'risques',
      title: 'Risques identifiés',
      description: 'Identification des risques liés aux travaux en hauteur',
      component: Step2Component,
    },
    {
      id: 'materiels',
      title: 'Matériels et équipements',
      description: 'Équipements utilisés pour les travaux',
      component: Step3Component,
    },
    {
      id: 'prevention',
      title: 'Mesures de prévention',
      description: 'Mesures de sécurité mises en place',
      component: Step4Component,
    },
    {
      id: 'urgence',
      title: 'Prévention urgence',
      description: 'Mesures d\'urgence et validation finale',
      component: Step5Component,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleComplete = (data: any) => {
    // Récupérer la référence du plan de prévention
    const planPrevention = plansPrevention.find(p => p.id === data.planPreventionId);

    // Préparer les données pour le store
    const permisData = {
      permisGeneralId: '', // Sera lié au permis général
      planPreventionId: data.planPreventionId,
      planPreventionReference: planPrevention?.reference || '',
      prestataire: data.prestataire,
      dateDebut: new Date(data.dateDebut),
      dateFin: new Date(data.dateFin),
      descriptionOperation: data.descriptionOperation,
      codeSite: data.codeSite,
      region: data.region,
      nombreIntervenants: data.nombreIntervenants,
      hauteurChute: data.hauteurChute,
      travailToiture: data.travailToiture,
      typePente: data.typePente,
      risques: {
        effondrement: data.effondrement,
        incendie: data.incendie,
        deversement: data.deversement,
        electrisation: data.electrisation,
        chutePersonnes: data.chutePersonnes,
        blessure: data.blessure,
        chuteObjet: data.chuteObjet,
        expositionSubstances: data.expositionSubstances,
        ecrasement: data.ecrasement,
        mauvaiseMeteo: data.mauvaiseMeteo,
        autres: data.autres || [],
      },
      materiels: {
        echafaudageRoulant: data.echafaudageRoulant,
        echafaudageFixe: data.echafaudageFixe,
        filetSecurite: data.filetSecurite,
        ligneVieVerticale: data.ligneVieVerticale,
        ligneVieHorizontale: data.ligneVieHorizontale,
        pointAncrage: data.pointAncrage,
        echelleCrinoline: data.echelleCrinoline,
        plateformeElevatrice: data.plateformeElevatrice,
        travailCordes: data.travailCordes,
        echelle: data.echelle,
        escabeau: data.escabeau,
        autres: data.autres || [],
      },
      mesuresPrevention: {
        personnelHabilite: data.personnelHabilite,
        personnelApte: data.personnelApte,
        balisage: data.balisage,
        chaussuresSecurite: data.chaussuresSecurite,
        casque: data.casque,
        gantsNitrile: data.gantsNitrile,
        gantsIsolants: data.gantsIsolants,
        gantsManutention: data.gantsManutention,
        bouchonOreille: data.bouchonOreille,
        casqueAntiBruit: data.casqueAntiBruit,
        longeAbsorbeur: data.longeAbsorbeur,
        doubleLonge: data.doubleLonge,
        ligneVieConforme: data.ligneVieConforme,
        harnaisVerifie: data.harnaisVerifie,
        echafaudageConforme: data.echafaudageConforme,
        echelleConforme: data.echelleConforme,
        sanglageOutils: data.sanglageOutils,
        travailDeux: data.travailDeux,
        mesureVent: data.mesureVent,
        autres: data.autres || [],
      },
      planSauvetageDisponible: data.planSauvetageDisponible,
      numerosUrgenceDisponibles: data.numerosUrgenceDisponibles,
      secouristePresent: data.secouristePresent,
      engagementDemandeur: data.engagementDemandeur,
      demandeurNom: user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : '',
      demandeurDate: new Date(),
      personnelsExecutants: [],
      validationsJournalieres: [],
      status: 'brouillon' as const,
      creerPar: user?.email || '',
    };

    onComplete(permisData);
  };

  // Récupérer la référence du plan de prévention sélectionné
  const selectedPlan = formData.planPreventionId
    ? plansPrevention.find(p => p.id === formData.planPreventionId)
    : null;

  return (
    <div className="space-y-6">
      {/* Affichage des informations de référence */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Informations du Permis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Numéro de permis :</span>
                <span className="text-blue-900 ml-2 font-mono">{permitNumber}</span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Plan de prévention :</span>
                <span className="text-blue-900 ml-2">
                  {selectedPlan ? selectedPlan.reference : 'Non sélectionné'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MultiStepForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={onCancel}
        title="Permis de Travail en Hauteur"
        description="Demande de permis de travail en hauteur"
        submitLabel="Soumettre la demande"
        formData={formData}
        updateFormData={setFormData}
      />
    </div>
  );
}
