import { useMemo, useState, useEffect, type ChangeEvent } from "react";
import { z } from "zod";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import MultiStepForm from "./MultiStepForm";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import {
  AlertTriangle,
  AlertCircle,
  HardHat,
  User,
  MapPin,
  Calendar,
  FileText,
  Shield,
  Users,
  AlertOctagon,
} from "lucide-react";
import GPSCoordinatesInput from "./GPSCoordinatesInput";

// Schémas de validation pour chaque étape (messages traduits via t())
const makeStep1Schema = (t: TFunction) =>
  z.object({
    entreprisePrestataire: z.string().min(1, t("forms.preventionMultiStep.validation.entrepriseRequired")),
    siret: z
      .string()
      .min(14, t("forms.preventionMultiStep.validation.siretInvalid"))
      .max(14, t("forms.preventionMultiStep.validation.siretInvalid")),
    representantPrestataire: z.string().min(1, t("forms.preventionMultiStep.validation.representantPrestataireRequired")),
    fonctionPrestataire: z.string().min(1, t("forms.preventionMultiStep.validation.fonctionRequired")),
  });

const makeStep2Schema = (t: TFunction) =>
  z.object({
    maitreOuvrage: z.string().min(1, t("forms.preventionMultiStep.validation.maitreOuvrageRequired")),
    representantMaitreOuvrage: z.string().min(1, t("forms.preventionMultiStep.validation.representantMaitreOuvrageRequired")),
    contactMaitreOuvrage: z.string().min(1, t("forms.preventionMultiStep.validation.contactRequired")),
    emailMaitreOuvrage: z.string().email(t("forms.preventionMultiStep.validation.emailInvalid")).or(z.literal("")),
  });

// Définition du schéma pour une coordonnée GPS
const makeCoordonneeGPSSchema = (t: TFunction) =>
  z.object({
    id: z.string(),
    lat: z.number().min(-90).max(90, t("forms.preventionMultiStep.validation.latitudeInvalid")),
    lng: z.number().min(-180).max(180, t("forms.preventionMultiStep.validation.longitudeInvalid")),
    nom: z.string().min(1, t("forms.preventionMultiStep.validation.pointNomRequired")),
  });

const makeStep3Schema = (t: TFunction) =>
  z.object({
    nomSite: z.string().min(1, t("forms.preventionMultiStep.validation.nomSiteRequired")),
    adresseSite: z.string().min(1, t("forms.preventionMultiStep.validation.adresseRequired")),
    codePostal: z.string().regex(/^[0-9]{5}$/, t("forms.preventionMultiStep.validation.codePostalInvalid")),
    ville: z.string().min(1, t("forms.preventionMultiStep.validation.villeRequired")),
    coordonneesGPS: z
      .array(makeCoordonneeGPSSchema(t))
      .min(1, t("forms.preventionMultiStep.validation.coordonneesGPSRequired")),
    fokontany: z.string().min(1, t("forms.preventionMultiStep.validation.fokontanyRequired")),
    commune: z.string().min(1, t("forms.preventionMultiStep.validation.communeRequired")),
    district: z.string().min(1, t("forms.preventionMultiStep.validation.districtRequired")),
    region: z.string().min(1, t("forms.preventionMultiStep.validation.regionRequired")),
    situationGeographique: z.enum([
      "en_ville",
      "rurale",
      "sur_montagne",
      "autre",
    ]),
    situationGeographiqueAutre: z.string().optional(),
  });

const makeStep4Schema = (t: TFunction) =>
  z.object({
    natureIntervention: z.string().min(1, t("forms.preventionMultiStep.validation.natureRequired")),
    descriptionTravaux: z
      .string()
      .min(10, t("forms.preventionMultiStep.validation.descriptionTooShort")),
    nombreIntervenants: z.number().min(1, t("forms.preventionMultiStep.validation.minIntervenants")),
    dureeEstimee: z.number().min(1, t("forms.preventionMultiStep.validation.dureeEstimeeRequired")),
  });

const makeStep5Schema = (t: TFunction) =>
  z.object({
    dateDebut: z.string().min(1, t("forms.preventionMultiStep.validation.dateDebutRequired")),
    dateFin: z.string().min(1, t("forms.preventionMultiStep.validation.dateFinRequired")),
    horairesTravail: z.object({
      debut: z.string().min(1, t("forms.preventionMultiStep.validation.heureDebutRequired")),
      fin: z.string().min(1, t("forms.preventionMultiStep.validation.heureFinRequired")),
      pause: z.string().min(1, t("forms.preventionMultiStep.validation.heurePauseRequired")),
    }),
  });

const makeStep6Schema = (t: TFunction) =>
  z.object({
    risquesIdentifies: z
      .array(
        z.object({
          id: z.string(),
          categorie: z.string().min(1),
          risque: z.string().min(1, t("forms.preventionMultiStep.validation.risqueDescriptionRequired")),
          gravite: z.enum(["faible", "moyenne", "grave", "mortelle"]),
          probabilite: z.enum([
            "rare",
            "peu_probable",
            "probable",
            "tres_probable",
          ]),
          niveau: z.enum(["faible", "modere", "eleve", "intolerable"]),
          mesures: z.string().min(1, t("forms.preventionMultiStep.validation.mesuresRequired")),
          mesuresExistentes: z.boolean(),
        }),
      )
      .min(1, t("forms.preventionMultiStep.validation.risquesMinRequired")),
  });

const makeStep7Schema = (t: TFunction) =>
  z.object({
    equipementsSecurite: z
      .array(
        z.object({
          type: z.string().min(1, t("forms.preventionMultiStep.validation.typeEquipementRequired")),
          quantite: z.number().min(1, t("forms.preventionMultiStep.validation.quantiteRequired")),
          conforme: z.boolean(),
        }),
      )
      .min(1, t("forms.preventionMultiStep.validation.equipementsMinRequired")),
  });

const makeStep8Schema = (t: TFunction) =>
  z.object({
    consignesSecurite: z
      .string()
      .min(10, t("forms.preventionMultiStep.validation.consignesSecuriteRequired")),
    consignesUrgence: z.string().min(10, t("forms.preventionMultiStep.validation.consignesUrgenceRequired")),
    contactsUrgence: z.string().min(1, t("forms.preventionMultiStep.validation.contactsUrgenceRequired")),
  });

const makeStep9Schema = () =>
  z.object({
    formationSecurite: z.boolean(),
    dateFormation: z.string().optional(),
    nomFormateur: z.string().optional(),
    commentaires: z.string().optional(),
  });

const makeStep10Schema = (t: TFunction) =>
  z.object({
    documentsFournis: z
      .array(z.string())
      .min(1, t("forms.preventionMultiStep.validation.documentsMinRequired")),
    accordResponsable: z.boolean().refine((val) => val === true, {
      message: t("forms.preventionMultiStep.validation.accordResponsableRequired"),
    }),
  });

const makeStep11Schema = (t: TFunction) =>
  z.object({
    confirmationFinale: z.boolean().refine((val) => val === true, {
      message: t("forms.preventionMultiStep.validation.confirmationRequired"),
    }),
  });

// Fonction identité utilisée uniquement pour extraire le type combiné du
// formulaire (le contenu des messages de validation n'a pas d'incidence sur
// le typage), afin de ne pas dépendre d'un contexte i18n au chargement du module.
const identityT = ((key: string) => key) as TFunction;

// Combine all schemas for final validation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const preventionPlanSchema = makeStep1Schema(identityT)
  .merge(makeStep2Schema(identityT))
  .merge(makeStep3Schema(identityT))
  .merge(makeStep4Schema(identityT))
  .merge(makeStep5Schema(identityT))
  .merge(makeStep6Schema(identityT))
  .merge(makeStep7Schema(identityT))
  .merge(makeStep8Schema(identityT))
  .merge(makeStep9Schema())
  .merge(makeStep10Schema(identityT))
  .merge(makeStep11Schema(identityT));

type PreventionPlan = z.infer<typeof preventionPlanSchema>;
type RisqueIdentifie = PreventionPlan["risquesIdentifies"][number];
type EquipementSecurite = PreventionPlan["equipementsSecurite"][number];

interface PreventionMultiStepFormProps {
  onSubmit: (data: PreventionPlan) => void;
  onCancel?: () => void;
  initialData?: Partial<PreventionPlan>;
}

// Runs a step's zod schema against the (partial) shared form state. Extra
// keys belonging to other steps are ignored by zod's default (non-strict)
// object parsing, so this is safe to call with the whole formData object.
function validateStep(
  schema: z.ZodTypeAny,
  data: unknown,
  setErrors: (errors: string[] | null) => void,
): boolean {
  const result = schema.safeParse(data);
  if (!result.success) {
    setErrors(result.error.issues.map((issue) => issue.message));
    return false;
  }
  setErrors(null);
  return true;
}

function StepErrorBanner({ errors }: { errors: string[] | null }) {
  const { t } = useTranslation();
  if (!errors || errors.length === 0) return null;
  return (
    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 space-y-1">
      <p className="font-medium">{t("forms.preventionMultiStep.errorBanner.title")}</p>
      <ul className="list-disc list-inside">
        {errors.map((message, i) => (
          <li key={i}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

// Catégories de risques : seuls les `id` sont des identifiants stables
// (utilisés comme clés de données) ; les libellés sont résolus via t() au
// moment du rendu pour rester traduisibles.
const getCategoriesRisques = (t: TFunction) => [
  {
    id: "environnement",
    label: t("forms.preventionMultiStep.risks.environnement"),
    sousCategories: [
      { id: "pollution", label: t("forms.preventionMultiStep.risks.pollution") },
      { id: "incendie", label: t("forms.preventionMultiStep.risks.incendie") },
    ],
  },
  {
    id: "chantier",
    label: t("forms.preventionMultiStep.risks.chantier"),
    sousCategories: [
      { id: "voie_circulation", label: t("forms.preventionMultiStep.risks.voie_circulation") },
      { id: "zone_chargement", label: t("forms.preventionMultiStep.risks.zone_chargement") },
      { id: "stockage", label: t("forms.preventionMultiStep.risks.stockage") },
    ],
  },
  {
    id: "travaux",
    label: t("forms.preventionMultiStep.risks.travaux"),
    sousCategories: [
      { id: "travaux_hauteur", label: t("forms.preventionMultiStep.risks.travaux_hauteur") },
      { id: "manutention", label: t("forms.preventionMultiStep.risks.manutention") },
      { id: "outillage", label: t("forms.preventionMultiStep.risks.outillage") },
      { id: "chimique", label: t("forms.preventionMultiStep.risks.chimique") },
      { id: "electrique", label: t("forms.preventionMultiStep.risks.electrique") },
      { id: "tronconnage", label: t("forms.preventionMultiStep.risks.tronconnage") },
      { id: "demolition", label: t("forms.preventionMultiStep.risks.demolition") },
      { id: "travaux_enterres", label: t("forms.preventionMultiStep.risks.travaux_enterres") },
      { id: "coactivite", label: t("forms.preventionMultiStep.risks.coactivite") },
      { id: "autres_travaux", label: t("forms.preventionMultiStep.risks.autres_travaux") },
    ],
  },
  {
    id: "autres",
    label: t("forms.preventionMultiStep.risks.autres"),
    sousCategories: [
      { id: "meteo", label: t("forms.preventionMultiStep.risks.meteo") },
      { id: "vandalisme", label: t("forms.preventionMultiStep.risks.vandalisme") },
      { id: "autres_risques", label: t("forms.preventionMultiStep.risks.autres_risques") },
    ],
  },
];

const RisquesIdentifies = ({
  formData,
  updateFormData,
}: {
  formData: Partial<PreventionPlan>;
  updateFormData: (data: Partial<PreventionPlan>) => void;
}) => {
  const { t } = useTranslation();
  const categoriesRisques = useMemo(() => getCategoriesRisques(t), [t]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const selectedRisques = (formData.risquesIdentifies || []).map(
    (r: { id: string }) => r.id,
  );

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const toggleRisque = (risqueId: string) => {
    const currentRisques = formData.risquesIdentifies || [];

    if (currentRisques.some((r: { id: string }) => r.id === risqueId)) {
      // remove
      const updated = currentRisques.filter((r) => r.id !== risqueId);
      updateFormData({ risquesIdentifies: updated });
    } else {
      // add
      let risqueLabel = "";
      let categorieLabel = "";

      categoriesRisques.forEach((categorie) => {
        const sousCategorie = categorie.sousCategories.find(
          (sc) => sc.id === risqueId,
        );
        if (sousCategorie) {
          risqueLabel = sousCategorie.label;
          categorieLabel = categorie.label;
        }
      });

      const newRisque: RisqueIdentifie = {
        id: risqueId,
        categorie: categorieLabel,
        risque: risqueLabel,
        gravite: "faible",
        probabilite: "rare",
        niveau: "faible",
        mesures: "",
        mesuresExistentes: false,
      };

      updateFormData({ risquesIdentifies: [...currentRisques, newRisque] });
    }
  };

  const updateRisque = (index: number, patch: Partial<RisqueIdentifie>) => {
    const current = formData.risquesIdentifies || [];
    const updated = current.map((r, i) => (i === index ? { ...r, ...patch } : r));
    updateFormData({ risquesIdentifies: updated });
  };

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
        <h4 className="text-sm font-medium text-yellow-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {t("forms.preventionMultiStep.risks.sectionTitle")}
        </h4>
        <p className="text-xs text-yellow-700 mt-1">
          {t("forms.preventionMultiStep.risks.sectionDesc")}
        </p>
      </div>

      <div className="space-y-4">
        <h5 className="font-medium text-sm text-gray-700">
          {t("forms.preventionMultiStep.risks.categoriesTitle")}
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoriesRisques.map((categorie) => (
            <div
              key={categorie.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedCategory === categorie.id
                  ? "border-blue-500 bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => handleSelectCategory(categorie.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{categorie.label}</span>
                <svg
                  className={`w-5 h-5 transition-transform ${
                    selectedCategory === categorie.id ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {selectedCategory === categorie.id && (
                <div className="mt-3 space-y-2">
                  {categorie.sousCategories.map((sousCategorie) => (
                    <div
                      key={sousCategorie.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-blue-100"
                    >
                      <input
                        type="checkbox"
                        id={`risque-${sousCategorie.id}`}
                        checked={selectedRisques.includes(sousCategorie.id)}
                        onChange={() => toggleRisque(sousCategorie.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <label
                        htmlFor={`risque-${sousCategorie.id}`}
                        className="text-sm"
                      >
                        {sousCategorie.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Détails des risques sélectionnés */}
        {(formData.risquesIdentifies || []).length > 0 && (
          <div className="mt-6 space-y-4">
            <h5 className="font-medium text-sm text-gray-700">
              {t("forms.preventionMultiStep.risks.detailsTitle")}
            </h5>

            {(formData.risquesIdentifies || []).map((risque, index) => (
              <div key={risque.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h6 className="font-medium">{risque.risque}</h6>
                    <p className="text-xs text-gray-500">{risque.categorie}</p>
                  </div>
                  <button
                    type="button"
                    className="text-red-500 text-sm"
                    onClick={() => {
                      const updated = (formData.risquesIdentifies || []).filter(
                        (_: unknown, i: number) => i !== index,
                      );
                      updateFormData({ risquesIdentifies: updated });
                    }}
                  >
                    {t("forms.preventionMultiStep.risks.removeButton")}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label={t("forms.preventionMultiStep.risks.graviteLabel")}
                    options={[
                      { value: "faible", label: t("forms.preventionMultiStep.risks.graviteOptions.faible") },
                      { value: "moyenne", label: t("forms.preventionMultiStep.risks.graviteOptions.moyenne") },
                      { value: "grave", label: t("forms.preventionMultiStep.risks.graviteOptions.grave") },
                      { value: "mortelle", label: t("forms.preventionMultiStep.risks.graviteOptions.mortelle") },
                    ]}
                    required
                    value={risque.gravite}
                    onChange={(e) =>
                      updateRisque(index, {
                        gravite: e.target.value as RisqueIdentifie["gravite"],
                      })
                    }
                  />

                  <Select
                    label={t("forms.preventionMultiStep.risks.probabiliteLabel")}
                    options={[
                      { value: "rare", label: t("forms.preventionMultiStep.risks.probabiliteOptions.rare") },
                      { value: "peu_probable", label: t("forms.preventionMultiStep.risks.probabiliteOptions.peu_probable") },
                      { value: "probable", label: t("forms.preventionMultiStep.risks.probabiliteOptions.probable") },
                      { value: "tres_probable", label: t("forms.preventionMultiStep.risks.probabiliteOptions.tres_probable") },
                    ]}
                    required
                    value={risque.probabilite}
                    onChange={(e) =>
                      updateRisque(index, {
                        probabilite: e.target.value as RisqueIdentifie["probabilite"],
                      })
                    }
                  />

                  <Select
                    label={t("forms.preventionMultiStep.risks.niveauLabel")}
                    options={[
                      { value: "faible", label: t("forms.preventionMultiStep.risks.niveauOptions.faible") },
                      { value: "modere", label: t("forms.preventionMultiStep.risks.niveauOptions.modere") },
                      { value: "eleve", label: t("forms.preventionMultiStep.risks.niveauOptions.eleve") },
                      { value: "intolerable", label: t("forms.preventionMultiStep.risks.niveauOptions.intolerable") },
                    ]}
                    required
                    value={risque.niveau}
                    onChange={(e) =>
                      updateRisque(index, {
                        niveau: e.target.value as RisqueIdentifie["niveau"],
                      })
                    }
                  />
                </div>

                <Textarea
                  label={t("forms.preventionMultiStep.risks.mesuresLabel")}
                  placeholder={t("forms.preventionMultiStep.risks.mesuresPlaceholder")}
                  rows={2}
                  required
                  value={risque.mesures}
                  onChange={(e) => updateRisque(index, { mesures: e.target.value })}
                />

                <div className="flex items-center">
                  <Checkbox
                    label={t("forms.preventionMultiStep.risks.mesuresExistentesLabel")}
                    className="mr-2"
                    checked={risque.mesuresExistentes}
                    onChange={(e) =>
                      updateRisque(index, { mesuresExistentes: e.target.checked })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const getDocumentOptions = (t: TFunction) => [
  {
    value: "attestation_assurance",
    label: t("forms.preventionMultiStep.documents.options.attestation_assurance"),
  },
  { value: "plan_intervention", label: t("forms.preventionMultiStep.documents.options.plan_intervention") },
  {
    value: "fiches_risques",
    label: t("forms.preventionMultiStep.documents.options.fiches_risques"),
  },
  { value: "autres", label: t("forms.preventionMultiStep.documents.options.autres") },
];

export default function PreventionMultiStepForm({
  onSubmit,
  onCancel,
  initialData = {},
}: PreventionMultiStepFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Partial<PreventionPlan>>(() => ({
    coordonneesGPS: [],
    ...initialData,
  }));
  const [stepErrors, setStepErrors] = useState<string[] | null>(null);

  const step1Schema = useMemo(() => makeStep1Schema(t), [t]);
  const step2Schema = useMemo(() => makeStep2Schema(t), [t]);
  const step3Schema = useMemo(() => makeStep3Schema(t), [t]);
  const step4Schema = useMemo(() => makeStep4Schema(t), [t]);
  const step5Schema = useMemo(() => makeStep5Schema(t), [t]);
  const step6Schema = useMemo(() => makeStep6Schema(t), [t]);
  const step7Schema = useMemo(() => makeStep7Schema(t), [t]);
  const step8Schema = useMemo(() => makeStep8Schema(t), [t]);
  const step9Schema = useMemo(() => makeStep9Schema(), []);
  const step10Schema = useMemo(() => makeStep10Schema(t), [t]);
  const step11Schema = useMemo(() => makeStep11Schema(t), [t]);

  const documentOptions = useMemo(() => getDocumentOptions(t), [t]);

  const updateFormData = (data: Partial<PreventionPlan>) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
  };

  const updateField = (key: keyof PreventionPlan, value: unknown) => {
    updateFormData({ [key]: value } as Partial<PreventionPlan>);
  };

  const updateHoraire = (key: "debut" | "fin" | "pause", value: string) => {
    setFormData((prev) => ({
      ...prev,
      horairesTravail: {
        ...(prev.horairesTravail || { debut: "", fin: "", pause: "" }),
        [key]: value,
      },
    }));
  };

  const updateEquipement = (
    index: number,
    patch: Partial<EquipementSecurite>,
  ) => {
    const current = formData.equipementsSecurite || [];
    const updated = current.map((eq, i) => (i === index ? { ...eq, ...patch } : eq));
    updateFormData({ equipementsSecurite: updated });
  };

  // Small controlled-field binders so text/number/checkbox inputs actually
  // persist into formData instead of being decorative uncontrolled elements.
  const text = (key: keyof PreventionPlan) => ({
    value: (formData[key] as string) ?? "",
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      updateField(key, e.target.value),
  });

  const numberField = (key: keyof PreventionPlan) => ({
    value: (formData[key] as number | undefined) ?? "",
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      updateField(key, e.target.value === "" ? undefined : Number(e.target.value)),
  });

  const selectField = (key: keyof PreventionPlan) => ({
    value: (formData[key] as string) ?? "",
    onChange: (e: ChangeEvent<HTMLSelectElement>) => updateField(key, e.target.value),
  });

  const checkboxField = (key: keyof PreventionPlan) => ({
    checked: Boolean(formData[key]),
    onChange: (e: ChangeEvent<HTMLInputElement>) => updateField(key, e.target.checked),
  });

  // Initialiser les coordonnées GPS si elles ne sont pas définies
  useEffect(() => {
    if (!formData.coordonneesGPS) {
      updateFormData({ coordonneesGPS: [] });
    }
  }, [formData.coordonneesGPS]);

  const handleSubmit = (data: PreventionPlan) => {
    onSubmit(data);
  };

  const steps = [
    // Step 1: Entreprise Prestataire
    {
      id: "entreprise",
      title: t("forms.preventionMultiStep.steps.entreprise.title"),
      description: t("forms.preventionMultiStep.steps.entreprise.description"),
      icon: HardHat,
      component: (
        <div className="space-y-4">
          <StepErrorBanner errors={stepErrors} />
          <Input label={t("forms.preventionMultiStep.entreprise.nomLabel")} required {...text("entreprisePrestataire")} />
          <Input
            label={t("forms.preventionMultiStep.entreprise.siretLabel")}
            required
            placeholder={t("forms.preventionMultiStep.entreprise.siretPlaceholder")}
            {...text("siret")}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t("forms.preventionMultiStep.entreprise.representantLabel")} required {...text("representantPrestataire")} />
            <Input label={t("forms.preventionMultiStep.entreprise.fonctionLabel")} required {...text("fonctionPrestataire")} />
          </div>
        </div>
      ),
      validate: () => validateStep(step1Schema, formData, setStepErrors),
    },
    // Step 2: Maître d'Ouvrage
    {
      id: "maitre-ouvrage",
      title: t("forms.preventionMultiStep.steps.maitreOuvrage.title"),
      description: t("forms.preventionMultiStep.steps.maitreOuvrage.description"),
      icon: User,
      component: (
        <div className="space-y-4">
          <StepErrorBanner errors={stepErrors} />
          <Input label={t("forms.preventionMultiStep.maitreOuvrage.nomLabel")} required {...text("maitreOuvrage")} />
          <Input
            label={t("forms.preventionMultiStep.maitreOuvrage.representantLabel")}
            required
            {...text("representantMaitreOuvrage")}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t("forms.preventionMultiStep.maitreOuvrage.contactLabel")} required {...text("contactMaitreOuvrage")} />
            <Input label={t("forms.preventionMultiStep.maitreOuvrage.emailLabel")} type="email" {...text("emailMaitreOuvrage")} />
          </div>
        </div>
      ),
      validate: () => validateStep(step2Schema, formData, setStepErrors),
    },
    // Step 3: Localisation
    {
      id: "localisation",
      title: t("forms.preventionMultiStep.steps.localisation.title"),
      description: t("forms.preventionMultiStep.steps.localisation.description"),
      icon: MapPin,
      component: (
        <div className="space-y-4">
          <StepErrorBanner errors={stepErrors} />
          <Input label={t("forms.preventionMultiStep.localisation.nomSiteLabel")} required {...text("nomSite")} />
          <Input label={t("forms.preventionMultiStep.localisation.adresseLabel")} required {...text("adresseSite")} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label={t("forms.preventionMultiStep.localisation.codePostalLabel")} required {...text("codePostal")} />
            <div className="md:col-span-2">
              <Input label={t("forms.preventionMultiStep.localisation.villeLabel")} required {...text("ville")} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t("forms.preventionMultiStep.localisation.fokontanyLabel")} required {...text("fokontany")} />
            <Input label={t("forms.preventionMultiStep.localisation.communeLabel")} required {...text("commune")} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t("forms.preventionMultiStep.localisation.districtLabel")} required {...text("district")} />
            <Input label={t("forms.preventionMultiStep.localisation.regionLabel")} required {...text("region")} />
          </div>
          <Select
            label={t("forms.preventionMultiStep.localisation.situationLabel")}
            required
            options={[
              { value: "en_ville", label: t("forms.preventionMultiStep.localisation.situationEnVille") },
              { value: "rurale", label: t("forms.preventionMultiStep.localisation.situationRurale") },
              { value: "sur_montagne", label: t("forms.preventionMultiStep.localisation.situationSurMontagne") },
              { value: "autre", label: t("forms.preventionMultiStep.localisation.situationAutre") },
            ]}
            placeholder={t("forms.preventionMultiStep.localisation.situationPlaceholder")}
            {...selectField("situationGeographique")}
          />
          {formData.situationGeographique === "autre" && (
            <Input label={t("forms.preventionMultiStep.localisation.situationAutrePrecisezLabel")} {...text("situationGeographiqueAutre")} />
          )}
          <div className="mt-4">
            <GPSCoordinatesInput
              value={formData.coordonneesGPS || []}
              onChange={(coords) => updateFormData({ coordonneesGPS: coords })}
            />
          </div>
        </div>
      ),
      validate: () => validateStep(step3Schema, formData, setStepErrors),
    },
    // Step 4: Description des Travaux
    {
      id: "description-travaux",
      title: t("forms.preventionMultiStep.steps.descriptionTravaux.title"),
      description: t("forms.preventionMultiStep.steps.descriptionTravaux.description"),
      icon: FileText,
      component: (
        <div className="space-y-4">
          <StepErrorBanner errors={stepErrors} />
          <Input
            label={t("forms.preventionMultiStep.descriptionTravaux.natureLabel")}
            required
            {...text("natureIntervention")}
          />
          <Textarea
            label={t("forms.preventionMultiStep.descriptionTravaux.descriptionLabel")}
            required
            rows={4}
            {...text("descriptionTravaux")}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t("forms.preventionMultiStep.descriptionTravaux.nombreIntervenantsLabel")}
              type="number"
              min={1}
              required
              {...numberField("nombreIntervenants")}
            />
            <Input
              label={t("forms.preventionMultiStep.descriptionTravaux.dureeEstimeeLabel")}
              type="number"
              min={1}
              required
              {...numberField("dureeEstimee")}
            />
          </div>
        </div>
      ),
      validate: () => validateStep(step4Schema, formData, setStepErrors),
    },
    // Step 5: Planning
    {
      id: "planning",
      title: t("forms.preventionMultiStep.steps.planning.title"),
      description: t("forms.preventionMultiStep.steps.planning.description"),
      icon: Calendar,
      component: (
        <div className="space-y-4">
          <StepErrorBanner errors={stepErrors} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t("forms.preventionMultiStep.planning.dateDebutLabel")} type="date" required {...text("dateDebut")} />
            <Input label={t("forms.preventionMultiStep.planning.dateFinLabel")} type="date" required {...text("dateFin")} />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t("forms.preventionMultiStep.planning.horairesTitle")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label={t("forms.preventionMultiStep.planning.heureDebutLabel")}
                type="time"
                required
                value={formData.horairesTravail?.debut ?? ""}
                onChange={(e) => updateHoraire("debut", e.target.value)}
              />
              <Input
                label={t("forms.preventionMultiStep.planning.heureFinLabel")}
                type="time"
                required
                value={formData.horairesTravail?.fin ?? ""}
                onChange={(e) => updateHoraire("fin", e.target.value)}
              />
              <Input
                label={t("forms.preventionMultiStep.planning.heurePauseLabel")}
                type="time"
                required
                value={formData.horairesTravail?.pause ?? ""}
                onChange={(e) => updateHoraire("pause", e.target.value)}
              />
            </div>
          </div>
        </div>
      ),
      validate: () => validateStep(step5Schema, formData, setStepErrors),
    },
    // Step 6: Risques Identifiés
    {
      id: "risques",
      title: t("forms.preventionMultiStep.steps.risques.title"),
      description: t("forms.preventionMultiStep.steps.risques.description"),
      icon: AlertTriangle,
      component: (
        <div className="space-y-4">
          <StepErrorBanner errors={stepErrors} />
          <RisquesIdentifies
            formData={formData}
            updateFormData={updateFormData}
          />
        </div>
      ),
      validate: () => validateStep(step6Schema, formData, setStepErrors),
    },
    // Step 7: Équipements de Sécurité
    {
      id: "equipements",
      title: t("forms.preventionMultiStep.steps.equipements.title"),
      description: t("forms.preventionMultiStep.steps.equipements.description"),
      icon: Shield,
      component: (
        <div className="space-y-4">
          <StepErrorBanner errors={stepErrors} />
          <div className="space-y-4">
            {formData.equipementsSecurite?.map((eq, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">{t("forms.preventionMultiStep.equipements.equipementTitle", { index: index + 1 })}</h5>
                  {index > 0 && (
                    <button
                      type="button"
                      className="text-red-500 text-sm"
                      onClick={() => {
                        const updatedEquipements = [
                          ...(formData.equipementsSecurite || []),
                        ];
                        updatedEquipements.splice(index, 1);
                        updateFormData({
                          equipementsSecurite: updatedEquipements,
                        });
                      }}
                    >
                      {t("forms.preventionMultiStep.equipements.removeButton")}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t("forms.preventionMultiStep.equipements.typeLabel")}
                    required
                    value={eq.type}
                    onChange={(e) => updateEquipement(index, { type: e.target.value })}
                  />
                  <Input
                    label={t("forms.preventionMultiStep.equipements.quantiteLabel")}
                    type="number"
                    min={1}
                    required
                    value={eq.quantite}
                    onChange={(e) =>
                      updateEquipement(index, {
                        quantite: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                  />
                </div>
                <Checkbox
                  label={t("forms.preventionMultiStep.equipements.conformeLabel")}
                  checked={eq.conforme}
                  onChange={(e) =>
                    updateEquipement(index, { conforme: e.target.checked })
                  }
                />
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const updatedEquipements = [
                  ...(formData.equipementsSecurite || []),
                  {
                    type: "",
                    quantite: 1,
                    conforme: true,
                  },
                ];
                updateFormData({ equipementsSecurite: updatedEquipements });
              }}
            >
              {t("forms.preventionMultiStep.equipements.addButton")}
            </Button>
          </div>
        </div>
      ),
      validate: () => validateStep(step7Schema, formData, setStepErrors),
    },
    // Step 8: Consignes de Sécurité
    {
      id: "consignes",
      title: t("forms.preventionMultiStep.steps.consignes.title"),
      description: t("forms.preventionMultiStep.steps.consignes.description"),
      icon: AlertCircle,
      component: (
        <div className="space-y-6">
          <StepErrorBanner errors={stepErrors} />
          <div className="space-y-4">
            <h4 className="font-medium">{t("forms.preventionMultiStep.consignes.generalesTitle")}</h4>
            <Textarea
              label={t("forms.preventionMultiStep.consignes.consignesSecuriteLabel")}
              required
              rows={4}
              placeholder={t("forms.preventionMultiStep.consignes.consignesSecuritePlaceholder")}
              {...text("consignesSecurite")}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">{t("forms.preventionMultiStep.consignes.urgenceTitle")}</h4>
            <Textarea
              label={t("forms.preventionMultiStep.consignes.consignesUrgenceLabel")}
              required
              rows={4}
              placeholder={t("forms.preventionMultiStep.consignes.consignesUrgencePlaceholder")}
              {...text("consignesUrgence")}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">{t("forms.preventionMultiStep.consignes.contactsTitle")}</h4>
            <Textarea
              label={t("forms.preventionMultiStep.consignes.contactsUrgenceLabel")}
              required
              rows={3}
              placeholder={t("forms.preventionMultiStep.consignes.contactsUrgencePlaceholder")}
              {...text("contactsUrgence")}
            />
          </div>
        </div>
      ),
      validate: () => validateStep(step8Schema, formData, setStepErrors),
    },
    // Step 9: Formation et Compétences
    {
      id: "formation",
      title: t("forms.preventionMultiStep.steps.formation.title"),
      description: t("forms.preventionMultiStep.steps.formation.description"),
      icon: Users,
      component: (
        <div className="space-y-6">
          <StepErrorBanner errors={stepErrors} />
          <div className="space-y-4">
            <Checkbox
              label={t("forms.preventionMultiStep.formation.formationSecuriteLabel")}
              {...checkboxField("formationSecurite")}
            />

            {formData.formationSecurite && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                <Input label={t("forms.preventionMultiStep.formation.dateFormationLabel")} type="date" {...text("dateFormation")} />
                <Input
                  label={t("forms.preventionMultiStep.formation.nomFormateurLabel")}
                  placeholder={t("forms.preventionMultiStep.formation.nomFormateurPlaceholder")}
                  {...text("nomFormateur")}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">{t("forms.preventionMultiStep.formation.commentairesTitle")}</h4>
            <Textarea
              label={t("forms.preventionMultiStep.formation.commentairesLabel")}
              rows={3}
              placeholder={t("forms.preventionMultiStep.formation.commentairesPlaceholder")}
              {...text("commentaires")}
            />
          </div>
        </div>
      ),
      validate: () => validateStep(step9Schema, formData, setStepErrors),
    },
    // Step 10: Documents et Validation
    {
      id: "documents",
      title: t("forms.preventionMultiStep.steps.documents.title"),
      description: t("forms.preventionMultiStep.steps.documents.description"),
      icon: FileText,
      component: (
        <div className="space-y-6">
          <StepErrorBanner errors={stepErrors} />
          <div className="space-y-4">
            <h4 className="font-medium">{t("forms.preventionMultiStep.documents.title")}</h4>
            <div className="space-y-2">
              {documentOptions.map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`doc-${value}`}
                    checked={(formData.documentsFournis || []).includes(value)}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      const updated = checked
                        ? [...(formData.documentsFournis || []), value]
                        : (formData.documentsFournis || []).filter(
                            (v) => v !== value,
                          );
                      updateFormData({ documentsFournis: updated });
                    }}
                  />
                  <label
                    htmlFor={`doc-${value}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">{t("forms.preventionMultiStep.documents.validationTitle")}</h4>
            <div className="p-4 border rounded-lg bg-gray-50">
              <Checkbox
                label={<span>{t("forms.preventionMultiStep.documents.accordLabel")}</span>}
                required
                {...checkboxField("accordResponsable")}
              />
            </div>
          </div>
        </div>
      ),
      validate: () => validateStep(step10Schema, formData, setStepErrors),
    },
    // Step 11: Confirmation
    {
      id: "confirmation",
      title: t("forms.preventionMultiStep.steps.confirmation.title"),
      description: t("forms.preventionMultiStep.steps.confirmation.description"),
      icon: AlertOctagon,
      component: (
        <div className="space-y-6">
          <StepErrorBanner errors={stepErrors} />
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800">{t("forms.preventionMultiStep.confirmation.verificationTitle")}</h3>
            <p className="text-sm text-blue-700 mt-1">
              {t("forms.preventionMultiStep.confirmation.verificationText")}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">{t("forms.preventionMultiStep.confirmation.recapTitle")}</h4>
            <div className="bg-white border rounded-lg divide-y">
              <div className="p-4">
                <h5 className="font-medium text-gray-900">
                  {t("forms.preventionMultiStep.confirmation.entrepriseTitle")}
                </h5>
                <p className="text-sm text-gray-600">
                  {formData.entreprisePrestataire} - {formData.siret}
                </p>
                <p className="text-sm text-gray-600">
                  {formData.representantPrestataire} (
                  {formData.fonctionPrestataire})
                </p>
              </div>

              <div className="p-4">
                <h5 className="font-medium text-gray-900">{t("forms.preventionMultiStep.confirmation.interventionTitle")}</h5>
                <p className="text-sm text-gray-600">
                  {formData.natureIntervention}
                </p>
                <p className="text-sm text-gray-600">
                  {formData.nombreIntervenants} {t("forms.preventionMultiStep.confirmation.intervenantsSuffix")}
                </p>
                <p className="text-sm text-gray-600">
                  {t("forms.preventionMultiStep.confirmation.periodeText", {
                    dateDebut: formData.dateDebut,
                    dateFin: formData.dateFin,
                  })}
                </p>
              </div>

              <div className="p-4">
                <h5 className="font-medium text-gray-900">{t("forms.preventionMultiStep.confirmation.localisationTitle")}</h5>
                <p className="text-sm text-gray-600">{formData.nomSite}</p>
                <p className="text-sm text-gray-600">
                  {formData.adresseSite}, {formData.codePostal} {formData.ville}
                </p>
              </div>

              {(formData.risquesIdentifies || []).length > 0 && (
                <div className="p-4">
                  <h5 className="font-medium text-gray-900">
                    {t("forms.preventionMultiStep.confirmation.risquesCountTitle", {
                      count: (formData.risquesIdentifies || []).length,
                    })}
                  </h5>
                  <div className="mt-2 space-y-2">
                    {(formData.risquesIdentifies || []).map((risque, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        • {risque.risque}{" "}
                        <span className="text-gray-400">({risque.niveau})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-amber-50">
            <Checkbox
              label={
                <span className="font-medium">
                  {t("forms.preventionMultiStep.confirmation.finalCheckboxLabel")}
                </span>
              }
              required
              {...checkboxField("confirmationFinale")}
            />
          </div>
        </div>
      ),
      validate: () => validateStep(step11Schema, formData, setStepErrors),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <MultiStepForm
        steps={steps}
        onComplete={handleSubmit}
        onCancel={onCancel}
        title={t("forms.preventionMultiStep.title")}
        description={t("forms.preventionMultiStep.description")}
        submitLabel={t("forms.preventionMultiStep.submitLabel")}
        formData={formData}
        updateFormData={updateFormData}
      />
    </div>
  );
}
