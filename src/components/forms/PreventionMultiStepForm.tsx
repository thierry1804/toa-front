import { useState, useEffect } from "react";
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

interface PreventionMultiStepFormProps {
  onSubmit: (data: PreventionPlan) => void;
  onCancel?: () => void;
  initialData?: Partial<PreventionPlan>;
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

      const newRisque = {
        id: risqueId,
        categorie: categorieLabel,
        risque: risqueLabel,
        gravite: "faible" as const,
        probabilite: "rare" as const,
        niveau: "faible" as const,
        mesures: "",
        mesuresExistentes: false,
      };

      updateFormData({ risquesIdentifies: [...currentRisques, newRisque] });
    }
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
                    name={`risquesIdentifies.${index}.gravite`}
                    label="Gravité"
                    options={[
                      { value: "faible", label: "Faible" },
                      { value: "moyenne", label: "Moyenne" },
                      { value: "grave", label: "Grave" },
                      { value: "mortelle", label: "Mortelle" },
                    ]}
                    required
                  />

                  <Select
                    name={`risquesIdentifies.${index}.probabilite`}
                    label="Probabilité"
                    options={[
                      { value: "rare", label: "Rare" },
                      { value: "peu_probable", label: "Peu probable" },
                      { value: "probable", label: "Probable" },
                      { value: "tres_probable", label: "Très probable" },
                    ]}
                    required
                  />

                  <Select
                    name={`risquesIdentifies.${index}.niveau`}
                    label="Niveau de risque"
                    options={[
                      { value: "faible", label: "Faible" },
                      { value: "modere", label: "Modéré" },
                      { value: "eleve", label: "Élevé" },
                      { value: "intolerable", label: "Intolérable" },
                    ]}
                    required
                  />
                </div>

                <Textarea
                  name={`risquesIdentifies.${index}.mesures`}
                  label="Mesures de prévention prévues"
                  placeholder="Décrivez les mesures de prévention spécifiques pour ce risque"
                  rows={2}
                  required
                />

                <div className="flex items-center">
                  <Checkbox
                    name={`risquesIdentifies.${index}.mesuresExistentes`}
                    label="Des mesures de prévention sont déjà en place"
                    className="mr-2"
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

  const updateFormData = (data: Partial<PreventionPlan>) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
  };

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
          <Input
            name="entreprisePrestataire"
            label="Nom de l'entreprise"
            required
          />
          <Input
            name="siret"
            label="N° SIRET"
            required
            placeholder="14 chiffres"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              name="representantPrestataire"
              label="Représentant"
              required
            />
            <Input name="fonctionPrestataire" label="Fonction" required />
          </div>
        </div>
      ),
      validationSchema: step1Schema,
    },
    // Step 2: Maître d'Ouvrage
    {
      id: "maitre-ouvrage",
      title: "Maître d'Ouvrage",
      description: "Informations sur le maître d'ouvrage",
      icon: User,
      component: (
        <div className="space-y-4">
          <Input name="maitreOuvrage" label="Maître d'ouvrage" required />
          <Input
            name="representantMaitreOuvrage"
            label="Représentant"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input name="contactMaitreOuvrage" label="Contact" required />
            <Input name="emailMaitreOuvrage" label="Email" type="email" />
          </div>
        </div>
      ),
      validationSchema: step2Schema,
    },
    // Step 3: Localisation
    {
      id: "localisation",
      title: "Localisation",
      description: "Informations sur le site d'intervention",
      icon: MapPin,
      component: (
        <div className="space-y-4">
          <Input name="nomSite" label="Nom du site" required />
          <Input name="adresseSite" label="Adresse" required />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input name="codePostal" label="Code postal" required />
            <div className="md:col-span-2">
              <Input name="ville" label="Ville" required />
            </div>
          </div>
          <div className="mt-4">
            <GPSCoordinatesInput
              value={formData.coordonneesGPS || []}
              onChange={(coords) => updateFormData({ coordonneesGPS: coords })}
            />
          </div>
        </div>
      ),
      validationSchema: step3Schema,
    },
    // Step 4: Description des Travaux
    {
      id: "description-travaux",
      title: "Description des Travaux",
      description: "Détails de l'intervention",
      icon: FileText,
      component: (
        <div className="space-y-4">
          <Input
            name="natureIntervention"
            label="Nature de l'intervention"
            required
          />
          <Textarea
            name="descriptionTravaux"
            label="Description détaillée des travaux"
            required
            rows={4}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              name="nombreIntervenants"
              label="Nombre d'intervenants"
              type="number"
              min={1}
              required
            />
            <Input
              name="dureeEstimee"
              label="Durée estimée (heures)"
              type="number"
              min={1}
              required
            />
          </div>
        </div>
      ),
      validationSchema: step4Schema,
    },
    // Step 5: Planning
    {
      id: "planning",
      title: "Planning",
      description: "Dates et horaires des travaux",
      icon: Calendar,
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              name="dateDebut"
              label="Date de début"
              type="date"
              required
            />
            <Input name="dateFin" label="Date de fin" type="date" required />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Horaires de travail</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                name="horairesTravail.debut"
                label="Début"
                type="time"
                required
              />
              <Input
                name="horairesTravail.fin"
                label="Fin"
                type="time"
                required
              />
              <Input
                name="horairesTravail.pause"
                label="Pause"
                type="time"
                required
              />
            </div>
          </div>
        </div>
      ),
      validationSchema: step5Schema,
    },
    // Step 6: Risques Identifiés
    {
      id: "risques",
      title: "Risques Identifiés",
      description: "Identification des risques potentiels",
      icon: AlertTriangle,
      component: (
        <RisquesIdentifies
          formData={formData}
          updateFormData={updateFormData}
        />
      ),
      validationSchema: step6Schema,
    },
    // Step 7: Équipements de Sécurité
    {
      id: "equipements",
      title: "Équipements de Sécurité",
      description: "Équipements nécessaires pour la sécurité",
      icon: Shield,
      component: (
        <div className="space-y-4">
          <div className="space-y-4">
            {formData.equipementsSecurite?.map((_, index) => (
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
                    name={`equipementsSecurite.${index}.type`}
                    label="Type d'équipement"
                    required
                  />
                  <Input
                    name={`equipementsSecurite.${index}.quantite`}
                    label="Quantité"
                    type="number"
                    min={1}
                    required
                  />
                </div>
                <Checkbox
                  name={`equipementsSecurite.${index}.conforme`}
                  label="Équipement conforme aux normes"
                  defaultChecked={true}
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
      validationSchema: step7Schema,
    },
    // Step 8: Consignes de Sécurité
    {
      id: "consignes",
      title: "Consignes de Sécurité",
      description: "Consignes à respecter pendant les travaux",
      icon: AlertCircle,
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">Consignes générales de sécurité</h4>
            <Textarea
              name="consignesSecurite"
              label="Consignes à respecter"
              required
              rows={4}
              placeholder="Ex. : Port des EPI obligatoire, zone sécurisée, etc."
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Consignes en cas d'urgence</h4>
            <Textarea
              name="consignesUrgence"
              label="Procédures d'urgence"
              required
              rows={4}
              placeholder="Ex. : Numéros d'urgence, points de rassemblement, etc."
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Contacts d'urgence</h4>
            <Textarea
              name="contactsUrgence"
              label="Personnes à contacter en cas d'urgence"
              required
              rows={3}
              placeholder="Ex. : Responsable sécurité: 01 23 45 67 89, SAMU: 15, Pompiers: 18, etc."
            />
          </div>
        </div>
      ),
      validationSchema: step8Schema,
    },
    // Step 9: Formation et Compétences
    {
      id: "formation",
      title: "Formation et Compétences",
      description: "Formation des intervenants",
      icon: Users,
      component: (
        <div className="space-y-6">
          <div className="space-y-4">
            <Checkbox
              name="formationSecurite"
              label="Les intervenants ont-ils reçu une formation à la sécurité spécifique à cette intervention ?"
            />

            {formData.formationSecurite && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                <Input
                  name="dateFormation"
                  label="Date de la formation"
                  type="date"
                />
                <Input
                  name="nomFormateur"
                  label="Nom du formateur"
                  placeholder="Nom du formateur ou de l'organisme"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Commentaires additionnels</h4>
            <Textarea
              name="commentaires"
              label="Remarques ou informations complémentaires"
              rows={3}
              placeholder="Ex. : Compétences particulières requises, habilitations spécifiques, etc."
            />
          </div>
        </div>
      ),
      validationSchema: step9Schema,
    },
    // Step 10: Documents et Validation
    {
      id: "documents",
      title: "Documents et Validation",
      description: "Pièces jointes et validation finale",
      icon: FileText,
      component: (
        <div className="space-y-6">
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
                name="accordResponsable"
                label={
                  <span>
                    Je certifie sur l'honneur l'exactitude des informations
                    fournies et m'engage à respecter les consignes de sécurité
                    énoncées dans ce document.
                  </span>
                }
                required
              />
            </div>
          </div>
        </div>
      ),
      validationSchema: step10Schema,
    },
    // Step 11: Confirmation
    {
      id: "confirmation",
      title: "Confirmation",
      description: "Vérifiez les informations avant soumission",
      icon: AlertOctagon,
      component: (
        <div className="space-y-6">
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
              name="confirmationFinale"
              label={
                <span className="font-medium">
                  Je confirme que toutes les informations sont exactes et
                  complètes. En cochant cette case, je valide définitivement ce
                  plan de prévention.
                </span>
              }
              required
            />
          </div>
        </div>
      ),
      validationSchema: step11Schema,
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
