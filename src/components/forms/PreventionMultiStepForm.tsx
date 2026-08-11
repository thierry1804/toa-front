import { useState, useEffect, type ChangeEvent } from "react";
import { z } from "zod";
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

// Define schemas for each step
const step1Schema = z.object({
  entreprisePrestataire: z.string().min(1, "Entreprise requise"),
  siret: z.string().min(14, "SIRET invalide").max(14, "SIRET invalide"),
  representantPrestataire: z.string().min(1, "Représentant requis"),
  fonctionPrestataire: z.string().min(1, "Fonction requise"),
});

const step2Schema = z.object({
  maitreOuvrage: z.string().min(1, "Maître d'ouvrage requis"),
  representantMaitreOuvrage: z.string().min(1, "Représentant requis"),
  contactMaitreOuvrage: z.string().min(1, "Contact requis"),
  emailMaitreOuvrage: z.string().email("Email invalide").or(z.literal("")),
});

// Définition du schéma pour une coordonnée GPS
const coordonneeGPSSchema = z.object({
  id: z.string(),
  lat: z.number().min(-90).max(90, "Latitude invalide"),
  lng: z.number().min(-180).max(180, "Longitude invalide"),
  nom: z.string().min(1, "Nom du point requis"),
});

const step3Schema = z.object({
  nomSite: z.string().min(1, "Nom du site requis"),
  adresseSite: z.string().min(1, "Adresse requise"),
  codePostal: z.string().regex(/^[0-9]{5}$/, "Code postal invalide"),
  ville: z.string().min(1, "Ville requise"),
  coordonneesGPS: z
    .array(coordonneeGPSSchema)
    .min(1, "Au moins une coordonnée GPS est requise"),
  fokontany: z.string().min(1, "Fokontany requis"),
  commune: z.string().min(1, "Commune requise"),
  district: z.string().min(1, "District requis"),
  region: z.string().min(1, "Région requise"),
  situationGeographique: z.enum([
    "en_ville",
    "rurale",
    "sur_montagne",
    "autre",
  ]),
  situationGeographiqueAutre: z.string().optional(),
});

const step4Schema = z.object({
  natureIntervention: z.string().min(1, "Nature requise"),
  descriptionTravaux: z
    .string()
    .min(10, "Description trop courte (min 10 caractères)"),
  nombreIntervenants: z.number().min(1, "Minimum 1 intervenant"),
  dureeEstimee: z.number().min(1, "Durée estimée requise"),
});

const step5Schema = z.object({
  dateDebut: z.string().min(1, "Date de début requise"),
  dateFin: z.string().min(1, "Date de fin requise"),
  horairesTravail: z.object({
    debut: z.string().min(1, "Heure de début requise"),
    fin: z.string().min(1, "Heure de fin requise"),
    pause: z.string().min(1, "Heure de pause requise"),
  }),
});

const step6Schema = z.object({
  risquesIdentifies: z
    .array(
      z.object({
        id: z.string(),
        categorie: z.string().min(1),
        risque: z.string().min(1, "Description du risque requise"),
        gravite: z.enum(["faible", "moyenne", "grave", "mortelle"]),
        probabilite: z.enum([
          "rare",
          "peu_probable",
          "probable",
          "tres_probable",
        ]),
        niveau: z.enum(["faible", "modere", "eleve", "intolerable"]),
        mesures: z.string().min(1, "Mesures préventives requises"),
        mesuresExistentes: z.boolean(),
      }),
    )
    .min(1, "Au moins un risque doit être identifié"),
});

const step7Schema = z.object({
  equipementsSecurite: z
    .array(
      z.object({
        type: z.string().min(1, "Type d'équipement requis"),
        quantite: z.number().min(1, "Quantité requise"),
        conforme: z.boolean(),
      }),
    )
    .min(1, "Au moins un équipement doit être spécifié"),
});

const step8Schema = z.object({
  consignesSecurite: z
    .string()
    .min(10, "Les consignes de sécurité sont requises"),
  consignesUrgence: z.string().min(10, "Les consignes d'urgence sont requises"),
  contactsUrgence: z.string().min(1, "Les contacts d'urgence sont requis"),
});

const step9Schema = z.object({
  formationSecurite: z.boolean(),
  dateFormation: z.string().optional(),
  nomFormateur: z.string().optional(),
  commentaires: z.string().optional(),
});

const step10Schema = z.object({
  documentsFournis: z
    .array(z.string())
    .min(1, "Au moins un document doit être fourni"),
  accordResponsable: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les conditions",
  }),
});

const step11Schema = z.object({
  confirmationFinale: z.boolean().refine((val) => val === true, {
    message: "Vous devez confirmer les informations",
  }),
});

// Combine all schemas for final validation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const preventionPlanSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)
  .merge(step6Schema)
  .merge(step7Schema)
  .merge(step8Schema)
  .merge(step9Schema)
  .merge(step10Schema)
  .merge(step11Schema);

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
  if (!errors || errors.length === 0) return null;
  return (
    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 space-y-1">
      <p className="font-medium">Champs à corriger avant de continuer :</p>
      <ul className="list-disc list-inside">
        {errors.map((message, i) => (
          <li key={i}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

const categoriesRisques = [
  {
    id: "environnement",
    label: "Risques liés à l'environnement",
    sousCategories: [
      { id: "pollution", label: "Pollutions (déversement)" },
      { id: "incendie", label: "Incendie" },
    ],
  },
  {
    id: "chantier",
    label: "Risques liés au chantier",
    sousCategories: [
      { id: "voie_circulation", label: "Voie de circulation" },
      { id: "zone_chargement", label: "Zone de chargement/déchargement" },
      { id: "stockage", label: "Stockage" },
    ],
  },
  {
    id: "travaux",
    label: "Risques liés aux travaux",
    sousCategories: [
      { id: "travaux_hauteur", label: "Travaux en hauteur" },
      { id: "manutention", label: "Manutention manuelle" },
      { id: "outillage", label: "Utilisation d'outils et d'équipements" },
      { id: "chimique", label: "Produits chimiques" },
      { id: "electrique", label: "Risque électrique" },
      { id: "tronconnage", label: "Tronçonnage, meulage, soudage" },
      { id: "demolition", label: "Démolition" },
      { id: "travaux_enterres", label: "Travaux en milieu confiné ou enterré" },
      { id: "coactivite", label: "Cœxistence d'activités" },
      { id: "autres_travaux", label: "Autres risques liés aux travaux" },
    ],
  },
  {
    id: "autres",
    label: "Autres risques",
    sousCategories: [
      { id: "meteo", label: "Conditions météorologiques" },
      { id: "vandalisme", label: "Vandalisme, vol" },
      { id: "autres_risques", label: "Autres risques non identifiés" },
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
          Identification des risques
        </h4>
        <p className="text-xs text-yellow-700 mt-1">
          Sélectionnez les risques potentiels liés à l'intervention
        </p>
      </div>

      <div className="space-y-4">
        <h5 className="font-medium text-sm text-gray-700">
          Catégories de risques
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
              Détails des risques sélectionnés
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
                    Retirer
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Gravité"
                    options={[
                      { value: "faible", label: "Faible" },
                      { value: "moyenne", label: "Moyenne" },
                      { value: "grave", label: "Grave" },
                      { value: "mortelle", label: "Mortelle" },
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
                    label="Probabilité"
                    options={[
                      { value: "rare", label: "Rare" },
                      { value: "peu_probable", label: "Peu probable" },
                      { value: "probable", label: "Probable" },
                      { value: "tres_probable", label: "Très probable" },
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
                    label="Niveau de risque"
                    options={[
                      { value: "faible", label: "Faible" },
                      { value: "modere", label: "Modéré" },
                      { value: "eleve", label: "Élevé" },
                      { value: "intolerable", label: "Intolérable" },
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
                  label="Mesures de prévention prévues"
                  placeholder="Décrivez les mesures de prévention spécifiques pour ce risque"
                  rows={2}
                  required
                  value={risque.mesures}
                  onChange={(e) => updateRisque(index, { mesures: e.target.value })}
                />

                <div className="flex items-center">
                  <Checkbox
                    label="Des mesures de prévention sont déjà en place"
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

const documentOptions = [
  {
    value: "attestation_assurance",
    label: "Attestation d'assurance responsabilité civile",
  },
  { value: "plan_intervention", label: "Plan d'intervention détaillé" },
  {
    value: "fiches_risques",
    label: "Fiches de poste et d'exposition aux risques",
  },
  { value: "autres", label: "Autres documents" },
];

export default function PreventionMultiStepForm({
  onSubmit,
  onCancel,
  initialData = {},
}: PreventionMultiStepFormProps) {
  const [formData, setFormData] = useState<Partial<PreventionPlan>>(() => ({
    coordonneesGPS: [],
    ...initialData,
  }));
  const [stepErrors, setStepErrors] = useState<string[] | null>(null);

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
      title: "Entreprise Prestataire",
      description: "Informations sur l'entreprise réalisant les travaux",
      icon: HardHat,
      component: (
        <div className="space-y-4">
          <StepErrorBanner errors={stepErrors} />
          <Input label="Nom de l'entreprise" required {...text("entreprisePrestataire")} />
          <Input
            label="N° SIRET"
            required
            placeholder="14 chiffres"
            {...text("siret")}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Représentant" required {...text("representantPrestataire")} />
            <Input label="Fonction" required {...text("fonctionPrestataire")} />
          </div>
        </div>
      ),
      validate: () => validateStep(step1Schema, formData, setStepErrors),
    },
    // Step 2: Maître d'Ouvrage
    {
      id: "maitre-ouvrage",
      title: "Maître d'Ouvrage",
      description: "Informations sur le maître d'ouvrage",
      icon: User,
      component: (
        <div className="space-y-4">
          <StepErrorBanner errors={stepErrors} />
          <Input label="Maître d'ouvrage" required {...text("maitreOuvrage")} />
          <Input
            label="Représentant"
            required
            {...text("representantMaitreOuvrage")}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Contact" required {...text("contactMaitreOuvrage")} />
            <Input label="Email" type="email" {...text("emailMaitreOuvrage")} />
          </div>
        </div>
      ),
      validate: () => validateStep(step2Schema, formData, setStepErrors),
    },
    // Step 3: Localisation
    {
      id: "localisation",
      title: "Localisation",
      description: "Informations sur le site d'intervention",
      icon: MapPin,
      component: (
        <div className="space-y-4">
          <StepErrorBanner errors={stepErrors} />
          <Input label="Nom du site" required {...text("nomSite")} />
          <Input label="Adresse" required {...text("adresseSite")} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Code postal" required {...text("codePostal")} />
            <div className="md:col-span-2">
              <Input label="Ville" required {...text("ville")} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Fokontany" required {...text("fokontany")} />
            <Input label="Commune" required {...text("commune")} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="District" required {...text("district")} />
            <Input label="Région" required {...text("region")} />
          </div>
          <Select
            label="Situation géographique"
            required
            options={[
              { value: "en_ville", label: "En ville" },
              { value: "rurale", label: "Rurale" },
              { value: "sur_montagne", label: "Sur montagne" },
              { value: "autre", label: "Autre" },
            ]}
            placeholder="Sélectionnez une situation"
            {...selectField("situationGeographique")}
          />
          {formData.situationGeographique === "autre" && (
            <Input label="Précisez" {...text("situationGeographiqueAutre")} />
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
      title: "Description des Travaux",
      description: "Détails de l'intervention",
      icon: FileText,
      component: (
        <div className="space-y-4">
          <StepErrorBanner errors={stepErrors} />
          <Input
            label="Nature de l'intervention"
            required
            {...text("natureIntervention")}
          />
          <Textarea
            label="Description détaillée des travaux"
            required
            rows={4}
            {...text("descriptionTravaux")}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre d'intervenants"
              type="number"
              min={1}
              required
              {...numberField("nombreIntervenants")}
            />
            <Input
              label="Durée estimée (heures)"
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
      title: "Planning",
      description: "Dates et horaires des travaux",
      icon: Calendar,
      component: (
        <div className="space-y-4">
          <StepErrorBanner errors={stepErrors} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Date de début" type="date" required {...text("dateDebut")} />
            <Input label="Date de fin" type="date" required {...text("dateFin")} />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Horaires de travail</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Début"
                type="time"
                required
                value={formData.horairesTravail?.debut ?? ""}
                onChange={(e) => updateHoraire("debut", e.target.value)}
              />
              <Input
                label="Fin"
                type="time"
                required
                value={formData.horairesTravail?.fin ?? ""}
                onChange={(e) => updateHoraire("fin", e.target.value)}
              />
              <Input
                label="Pause"
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
      title: "Risques Identifiés",
      description: "Identification des risques potentiels",
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
      title: "Équipements de Sécurité",
      description: "Équipements nécessaires pour la sécurité",
      icon: Shield,
      component: (
        <div className="space-y-4">
          <StepErrorBanner errors={stepErrors} />
          <div className="space-y-4">
            {formData.equipementsSecurite?.map((eq, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">Équipement {index + 1}</h5>
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
                      Supprimer
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Type d'équipement"
                    required
                    value={eq.type}
                    onChange={(e) => updateEquipement(index, { type: e.target.value })}
                  />
                  <Input
                    label="Quantité"
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
                  label="Équipement conforme aux normes"
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
              Ajouter un équipement
            </Button>
          </div>
        </div>
      ),
      validate: () => validateStep(step7Schema, formData, setStepErrors),
    },
    // Step 8: Consignes de Sécurité
    {
      id: "consignes",
      title: "Consignes de Sécurité",
      description: "Consignes à respecter pendant les travaux",
      icon: AlertCircle,
      component: (
        <div className="space-y-6">
          <StepErrorBanner errors={stepErrors} />
          <div className="space-y-4">
            <h4 className="font-medium">Consignes générales de sécurité</h4>
            <Textarea
              label="Consignes à respecter"
              required
              rows={4}
              placeholder="Ex. : Port des EPI obligatoire, zone sécurisée, etc."
              {...text("consignesSecurite")}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Consignes en cas d'urgence</h4>
            <Textarea
              label="Procédures d'urgence"
              required
              rows={4}
              placeholder="Ex. : Numéros d'urgence, points de rassemblement, etc."
              {...text("consignesUrgence")}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Contacts d'urgence</h4>
            <Textarea
              label="Personnes à contacter en cas d'urgence"
              required
              rows={3}
              placeholder="Ex. : Responsable sécurité: 01 23 45 67 89, SAMU: 15, Pompiers: 18, etc."
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
      title: "Formation et Compétences",
      description: "Formation des intervenants",
      icon: Users,
      component: (
        <div className="space-y-6">
          <StepErrorBanner errors={stepErrors} />
          <div className="space-y-4">
            <Checkbox
              label="Les intervenants ont-ils reçu une formation à la sécurité spécifique à cette intervention ?"
              {...checkboxField("formationSecurite")}
            />

            {formData.formationSecurite && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                <Input label="Date de la formation" type="date" {...text("dateFormation")} />
                <Input
                  label="Nom du formateur"
                  placeholder="Nom du formateur ou de l'organisme"
                  {...text("nomFormateur")}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Commentaires additionnels</h4>
            <Textarea
              label="Remarques ou informations complémentaires"
              rows={3}
              placeholder="Ex. : Compétences particulières requises, habilitations spécifiques, etc."
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
      title: "Documents et Validation",
      description: "Pièces jointes et validation finale",
      icon: FileText,
      component: (
        <div className="space-y-6">
          <StepErrorBanner errors={stepErrors} />
          <div className="space-y-4">
            <h4 className="font-medium">Documents à fournir</h4>
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
            <h4 className="font-medium">Validation</h4>
            <div className="p-4 border rounded-lg bg-gray-50">
              <Checkbox
                label={
                  <span>
                    Je certifie sur l'honneur l'exactitude des informations
                    fournies et m'engage à respecter les consignes de sécurité
                    énoncées dans ce document.
                  </span>
                }
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
      title: "Confirmation",
      description: "Vérifiez les informations avant soumission",
      icon: AlertOctagon,
      component: (
        <div className="space-y-6">
          <StepErrorBanner errors={stepErrors} />
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800">Vérification finale</h3>
            <p className="text-sm text-blue-700 mt-1">
              Veuillez vérifier attentivement toutes les informations avant de
              soumettre le plan de prévention. Une fois validé, vous pourrez
              toujours le modifier ultérieurement.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Récapitulatif</h4>
            <div className="bg-white border rounded-lg divide-y">
              <div className="p-4">
                <h5 className="font-medium text-gray-900">
                  Entreprise Prestataire
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
                <h5 className="font-medium text-gray-900">Intervention</h5>
                <p className="text-sm text-gray-600">
                  {formData.natureIntervention}
                </p>
                <p className="text-sm text-gray-600">
                  {formData.nombreIntervenants} intervenant(s)
                </p>
                <p className="text-sm text-gray-600">
                  Du {formData.dateDebut} au {formData.dateFin}
                </p>
              </div>

              <div className="p-4">
                <h5 className="font-medium text-gray-900">Localisation</h5>
                <p className="text-sm text-gray-600">{formData.nomSite}</p>
                <p className="text-sm text-gray-600">
                  {formData.adresseSite}, {formData.codePostal} {formData.ville}
                </p>
              </div>

              {(formData.risquesIdentifies || []).length > 0 && (
                <div className="p-4">
                  <h5 className="font-medium text-gray-900">
                    {(formData.risquesIdentifies || []).length} risque(s)
                    identifié(s)
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
                  Je confirme que toutes les informations sont exactes et
                  complètes. En cochant cette case, je valide définitivement ce
                  plan de prévention.
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
        title="Créer un plan de prévention"
        description="Remplissez le formulaire en plusieurs étapes pour créer un nouveau plan de prévention"
        submitLabel="Soumettre le plan"
        formData={formData}
        updateFormData={updateFormData}
      />
    </div>
  );
}
