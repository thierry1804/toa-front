import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Checkbox from "@/components/ui/Checkbox";
import Select from "@/components/ui/Select";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Search,
  Shield,
  Play,
} from "lucide-react";
import type { Take5Record, RisqueEvalue, MesureControle } from "@/types";

interface Take5FormProps {
  interventionId: string;
  onSubmit: (
    take5: Omit<Take5Record, "id" | "createdAt" | "updatedAt">,
  ) => void;
  onCancel?: () => void;
  initialData?: Partial<Take5Record>;
}

export default function Take5Form({
  interventionId,
  onSubmit,
  onCancel,
  initialData,
}: Take5FormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<{
    responsableNom: string;
    equipe: string[];
    localisation: string;
    tacheDescription: string;
    etape1_arreter: any;
    etape2_observer: any;
    etape3_analyser: any;
    etape4_controler: any;
    etape5_proceder: any;
  }>({
    responsableNom: initialData?.responsableNom || "",
    equipe: (initialData?.equipe as unknown as string[]) || [],
    localisation: initialData?.localisation || "",
    tacheDescription: initialData?.tacheDescription || "",

    // Étape 1: Arrêter
    etape1_arreter: {
      complete: initialData?.etape1_arreter?.complete || false,
      observations: initialData?.etape1_arreter?.observations || "",
    },

    // Étape 2: Observer
    etape2_observer: {
      complete: initialData?.etape2_observer?.complete || false,
      dangersIdentifies: initialData?.etape2_observer?.dangersIdentifies || [],
      autresDangers: initialData?.etape2_observer?.autresDangers || "",
    },

    // Étape 3: Analyser
    etape3_analyser: {
      complete: initialData?.etape3_analyser?.complete || false,
      risquesEvalues: initialData?.etape3_analyser?.risquesEvalues || [],
    },

    // Étape 4: Contrôler
    etape4_controler: {
      complete: initialData?.etape4_controler?.complete || false,
      mesuresControle: initialData?.etape4_controler?.mesuresControle || [],
    },

    // Étape 5: Procéder
    etape5_proceder: {
      complete: initialData?.etape5_proceder?.complete || false,
      securiteConfirmee:
        initialData?.etape5_proceder?.securiteConfirmee || false,
      autorisationProceder:
        initialData?.etape5_proceder?.autorisationProceder || false,
    },
  });

  const [nouveauMembre, setNouveauMembre] = useState("");
  const [nouveauRisque, setNouveauRisque] = useState<RisqueEvalue>({
    danger: "",
    niveauRisque: "faible",
    probabilite: "faible",
    gravite: "mineure",
  });
  const [nouvelleMesure, setNouvelleMesure] = useState<MesureControle>({
    type: "epi",
    description: "",
    miseEnPlace: false,
    responsable: "",
  });

  // Valeurs stockées inchangées (français) — seul le libellé affiché est traduit
  const dangersCommuns: { value: string; labelKey: string }[] = [
    { value: "Travail en hauteur", labelKey: "dangers.travailHauteur" },
    { value: "Risque électrique", labelKey: "dangers.risqueElectrique" },
    { value: "Chute d'objets", labelKey: "dangers.chuteObjets" },
    { value: "Risque chimique", labelKey: "dangers.risqueChimique" },
    { value: "Manutention manuelle", labelKey: "dangers.manutentionManuelle" },
    { value: "Conditions météo", labelKey: "dangers.conditionsMeteo" },
    { value: "Circulation véhicules", labelKey: "dangers.circulationVehicules" },
    { value: "Espaces confinés", labelKey: "dangers.espacesConfines" },
    { value: "Machines en mouvement", labelKey: "dangers.machinesMouvement" },
    { value: "Surfaces glissantes", labelKey: "dangers.surfacesGlissantes" },
  ];

  const addMembre = () => {
    if (nouveauMembre.trim()) {
      setFormData({
        ...formData,
        equipe: [...formData.equipe, nouveauMembre.trim()],
      });
      setNouveauMembre("");
    }
  };

  const removeMembre = (index: number) => {
    setFormData({
      ...formData,
      equipe: formData.equipe.filter((_, i) => i !== index),
    });
  };

  const toggleDanger = (danger: string) => {
    const currentDangers = formData.etape2_observer.dangersIdentifies;
    const newDangers = currentDangers.includes(danger)
      ? currentDangers.filter((d) => d !== danger)
      : [...currentDangers, danger];

    setFormData({
      ...formData,
      etape2_observer: {
        ...formData.etape2_observer,
        dangersIdentifies: newDangers,
      },
    });
  };

  const addRisque = () => {
    if (nouveauRisque.danger?.trim()) {
      setFormData({
        ...formData,
        etape3_analyser: {
          ...formData.etape3_analyser,
          risquesEvalues: [
            ...formData.etape3_analyser.risquesEvalues,
            nouveauRisque,
          ],
        },
      });
      setNouveauRisque({
        danger: "",
        niveauRisque: "faible",
        probabilite: "faible",
        gravite: "mineure",
      });
    }
  };

  const removeRisque = (index: number) => {
    setFormData({
      ...formData,
      etape3_analyser: {
        ...formData.etape3_analyser,
        risquesEvalues: formData.etape3_analyser.risquesEvalues.filter(
          (_, i) => i !== index,
        ),
      },
    });
  };

  const addMesure = () => {
    if (nouvelleMesure.description?.trim()) {
      setFormData({
        ...formData,
        etape4_controler: {
          ...formData.etape4_controler,
          mesuresControle: [
            ...formData.etape4_controler.mesuresControle,
            nouvelleMesure,
          ],
        },
      });
      setNouvelleMesure({
        type: "epi",
        description: "",
        miseEnPlace: false,
        responsable: "",
      });
    }
  };

  const removeMesure = (index: number) => {
    setFormData({
      ...formData,
      etape4_controler: {
        ...formData.etape4_controler,
        mesuresControle: formData.etape4_controler.mesuresControle.filter(
          (_, i) => i !== index,
        ),
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const take5Data: Omit<Take5Record, "id" | "createdAt" | "updatedAt"> = {
      interventionId,
      date: now,
      heure: now.toTimeString().slice(0, 5),
      responsableNom: formData.responsableNom,
      equipe: formData.equipe,
      localisation: formData.localisation,
      tacheDescription: formData.tacheDescription,
      etape1_arreter: formData.etape1_arreter,
      etape2_observer: formData.etape2_observer,
      etape3_analyser: formData.etape3_analyser,
      etape4_controler: formData.etape4_controler,
      etape5_proceder: formData.etape5_proceder,
      transmisHSE: false,
    };

    onSubmit(take5Data);
  };

  const isFormValid = () => {
    return (
      formData.responsableNom.trim() !== "" &&
      formData.equipe.length > 0 &&
      formData.localisation.trim() !== "" &&
      formData.tacheDescription.trim() !== "" &&
      formData.etape1_arreter.complete &&
      formData.etape2_observer.complete &&
      formData.etape3_analyser.complete &&
      formData.etape4_controler.complete &&
      formData.etape5_proceder.complete &&
      formData.etape5_proceder.securiteConfirmee &&
      formData.etape5_proceder.autorisationProceder
    );
  };

  const getNiveauRisqueColor = (niveau: string) => {
    switch (niveau) {
      case "faible":
        return "bg-green-100 text-green-800";
      case "moyen":
        return "bg-yellow-100 text-yellow-800";
      case "eleve":
        return "bg-orange-100 text-orange-800";
      case "critique":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header avec logo Take 5 */}
      <Card className="bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                {t("intervention.components.take5Form.header.title")}
              </CardTitle>
              <CardDescription>
                {t("intervention.components.take5Form.header.subtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Informations de base */}
      <Card>
        <CardHeader>
          <CardTitle>{t("intervention.components.take5Form.generalInfo.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t("intervention.components.take5Form.generalInfo.responsableLabel")}
              value={formData.responsableNom}
              onChange={(e) =>
                setFormData({ ...formData, responsableNom: e.target.value })
              }
              placeholder={t("intervention.components.take5Form.generalInfo.responsablePlaceholder")}
              required
            />
            <Input
              label={t("intervention.components.take5Form.generalInfo.localisationLabel")}
              value={formData.localisation}
              onChange={(e) =>
                setFormData({ ...formData, localisation: e.target.value })
              }
              placeholder={t("intervention.components.take5Form.generalInfo.localisationPlaceholder")}
              required
            />
          </div>

          <Textarea
            label={t("intervention.components.take5Form.generalInfo.tacheLabel")}
            value={formData.tacheDescription}
            onChange={(e) =>
              setFormData({ ...formData, tacheDescription: e.target.value })
            }
            placeholder={t("intervention.components.take5Form.generalInfo.tachePlaceholder")}
            rows={3}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("intervention.components.take5Form.generalInfo.equipeLabel")}
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={nouveauMembre}
                onChange={(e) => setNouveauMembre(e.target.value)}
                placeholder={t("intervention.components.take5Form.generalInfo.membrePlaceholder")}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addMembre())
                }
              />
              <Button type="button" onClick={addMembre} variant="outline">
                {t("intervention.components.take5Form.add")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.equipe.map((membre, index) => (
                <div
                  key={index}
                  className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {membre}
                  <button
                    type="button"
                    onClick={() => removeMembre(index)}
                    className="text-primary-900 hover:text-primary-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Étape 1: ARRÊTER */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-700 font-bold text-lg">1</span>
            </div>
            <div>
              <CardTitle>{t("intervention.components.take5Form.step1.title")}</CardTitle>
              <CardDescription>
                {t("intervention.components.take5Form.step1.description")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Checkbox
            label={t("intervention.components.take5Form.step1.checkboxLabel")}
            checked={formData.etape1_arreter.complete}
            onChange={(e) =>
              setFormData({
                ...formData,
                etape1_arreter: {
                  ...formData.etape1_arreter,
                  complete: e.target.checked,
                },
              })
            }
          />
          <Textarea
            label={t("intervention.components.take5Form.step1.observationsLabel")}
            value={formData.etape1_arreter.observations}
            onChange={(e) =>
              setFormData({
                ...formData,
                etape1_arreter: {
                  ...formData.etape1_arreter,
                  observations: e.target.value,
                },
              })
            }
            placeholder={t("intervention.components.take5Form.step1.observationsPlaceholder")}
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Étape 2: OBSERVER */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Eye className="h-5 w-5 text-orange-700" />
            </div>
            <div>
              <CardTitle>{t("intervention.components.take5Form.step2.title")}</CardTitle>
              <CardDescription>
                {t("intervention.components.take5Form.step2.description")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t("intervention.components.take5Form.step2.dangersLabel")}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {dangersCommuns.map((danger) => (
                <div
                  key={danger.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.etape2_observer.dangersIdentifies.includes(danger.value)
                      ? "bg-orange-50 border-orange-500 text-orange-900"
                      : "bg-white border-gray-300 hover:border-orange-300"
                  }`}
                  onClick={() => toggleDanger(danger.value)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.etape2_observer.dangersIdentifies.includes(
                        danger.value,
                      )}
                      onChange={() => toggleDanger(danger.value)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{t(`intervention.components.take5Form.${danger.labelKey}`)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Textarea
            label={t("intervention.components.take5Form.step2.autresDangersLabel")}
            value={formData.etape2_observer.autresDangers}
            onChange={(e) =>
              setFormData({
                ...formData,
                etape2_observer: {
                  ...formData.etape2_observer,
                  autresDangers: e.target.value,
                },
              })
            }
            placeholder={t("intervention.components.take5Form.step2.autresDangersPlaceholder")}
            rows={2}
          />

          <Checkbox
            label={t("intervention.components.take5Form.step2.checkboxLabel")}
            checked={formData.etape2_observer.complete}
            onChange={(e) =>
              setFormData({
                ...formData,
                etape2_observer: {
                  ...formData.etape2_observer,
                  complete: e.target.checked,
                },
              })
            }
          />
        </CardContent>
      </Card>

      {/* Étape 3: ANALYSER */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Search className="h-5 w-5 text-yellow-700" />
            </div>
            <div>
              <CardTitle>{t("intervention.components.take5Form.step3.title")}</CardTitle>
              <CardDescription>
                {t("intervention.components.take5Form.step3.description")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium text-gray-900">
              {t("intervention.components.take5Form.step3.addRisqueTitle")}
            </h4>
            <Input
              label={t("intervention.components.take5Form.step3.dangerLabel")}
              value={nouveauRisque.danger}
              onChange={(e) =>
                setNouveauRisque({ ...nouveauRisque, danger: e.target.value })
              }
              placeholder={t("intervention.components.take5Form.step3.dangerPlaceholder")}
            />
            <div className="grid grid-cols-3 gap-3">
              <Select
                label={t("intervention.components.take5Form.step3.probabiliteLabel")}
                options={[
                  { value: "faible", label: t("intervention.components.take5Form.probabiliteOptions.faible") },
                  { value: "moyenne", label: t("intervention.components.take5Form.probabiliteOptions.moyenne") },
                  { value: "elevee", label: t("intervention.components.take5Form.probabiliteOptions.elevee") },
                ]}
                value={nouveauRisque.probabilite}
                onChange={(e) =>
                  setNouveauRisque({
                    ...nouveauRisque,
                    probabilite: e.target.value as
                      | "faible"
                      | "moyenne"
                      | "elevee",
                  })
                }
              />
              <Select
                label={t("intervention.components.take5Form.step3.graviteLabel")}
                options={[
                  { value: "mineure", label: t("intervention.components.take5Form.graviteOptions.mineure") },
                  { value: "moderee", label: t("intervention.components.take5Form.graviteOptions.moderee") },
                  { value: "grave", label: t("intervention.components.take5Form.graviteOptions.grave") },
                  { value: "critique", label: t("intervention.components.take5Form.graviteOptions.critique") },
                ]}
                value={nouveauRisque.gravite}
                onChange={(e) =>
                  setNouveauRisque({
                    ...nouveauRisque,
                    gravite: e.target.value as
                      | "mineure"
                      | "moderee"
                      | "grave"
                      | "critique",
                  })
                }
              />
              <Select
                label={t("intervention.components.take5Form.step3.niveauRisqueLabel")}
                options={[
                  { value: "faible", label: t("intervention.components.take5Form.niveauRisqueOptions.faible") },
                  { value: "moyen", label: t("intervention.components.take5Form.niveauRisqueOptions.moyen") },
                  { value: "eleve", label: t("intervention.components.take5Form.niveauRisqueOptions.eleve") },
                  { value: "critique", label: t("intervention.components.take5Form.niveauRisqueOptions.critique") },
                ]}
                value={nouveauRisque.niveauRisque}
                onChange={(e) =>
                  setNouveauRisque({
                    ...nouveauRisque,
                    niveauRisque: e.target.value as
                      | "faible"
                      | "moyen"
                      | "eleve"
                      | "critique",
                  })
                }
              />
            </div>
            <Button
              type="button"
              onClick={addRisque}
              variant="outline"
              className="w-full"
            >
              {t("intervention.components.take5Form.step3.addRisqueButton")}
            </Button>
          </div>

          <div className="space-y-2">
            {formData.etape3_analyser.risquesEvalues.map((risque, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 p-3 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{risque.danger}</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {t("intervention.components.take5Form.step3.probabiliteBadge", { value: risque.probabilite })}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {t("intervention.components.take5Form.step3.graviteBadge", { value: risque.gravite })}
                      </span>
                      <span
                        className={`px-2 py-1 rounded font-medium ${getNiveauRisqueColor(risque.niveauRisque)}`}
                      >
                        {t("intervention.components.take5Form.step3.niveauBadge", { value: risque.niveauRisque })}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRisque(index)}
                    className="text-red-600 hover:text-red-700 ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Checkbox
            label={t("intervention.components.take5Form.step3.checkboxLabel")}
            checked={formData.etape3_analyser.complete}
            onChange={(e) =>
              setFormData({
                ...formData,
                etape3_analyser: {
                  ...formData.etape3_analyser,
                  complete: e.target.checked,
                },
              })
            }
          />
        </CardContent>
      </Card>

      {/* Étape 4: CONTRÔLER */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <CardTitle>{t("intervention.components.take5Form.step4.title")}</CardTitle>
              <CardDescription>
                {t("intervention.components.take5Form.step4.description")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium text-gray-900">
              {t("intervention.components.take5Form.step4.addMesureTitle")}
            </h4>
            <Select
              label={t("intervention.components.take5Form.step4.typeLabel")}
              options={[
                { value: "elimination", label: t("intervention.components.take5Form.typeOptions.elimination") },
                { value: "substitution", label: t("intervention.components.take5Form.typeOptions.substitution") },
                {
                  value: "controle_ingenierie",
                  label: t("intervention.components.take5Form.typeOptions.controleIngenierie"),
                },
                {
                  value: "controle_administratif",
                  label: t("intervention.components.take5Form.typeOptions.controleAdministratif"),
                },
                {
                  value: "epi",
                  label: t("intervention.components.take5Form.typeOptions.epi"),
                },
              ]}
              value={nouvelleMesure.type}
              onChange={(e) =>
                setNouvelleMesure({
                  ...nouvelleMesure,
                  type: e.target.value as
                    | "elimination"
                    | "substitution"
                    | "controle_ingenierie"
                    | "controle_administratif"
                    | "epi",
                })
              }
            />
            <Textarea
              label={t("intervention.components.take5Form.step4.descriptionLabel")}
              value={nouvelleMesure.description}
              onChange={(e) =>
                setNouvelleMesure({
                  ...nouvelleMesure,
                  description: e.target.value,
                })
              }
              placeholder={t("intervention.components.take5Form.step4.descriptionPlaceholder")}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("intervention.components.take5Form.step4.responsableLabel")}
                value={nouvelleMesure.responsable}
                onChange={(e) =>
                  setNouvelleMesure({
                    ...nouvelleMesure,
                    responsable: e.target.value,
                  })
                }
                placeholder={t("intervention.components.take5Form.step4.responsablePlaceholder")}
              />
              <div className="flex items-end">
                <Checkbox
                  label={t("intervention.components.take5Form.step4.miseEnPlaceLabel")}
                  checked={nouvelleMesure.miseEnPlace}
                  onChange={(e) =>
                    setNouvelleMesure({
                      ...nouvelleMesure,
                      miseEnPlace: e.target.checked,
                    })
                  }
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={addMesure}
              variant="outline"
              className="w-full"
            >
              {t("intervention.components.take5Form.step4.addMesureButton")}
            </Button>
          </div>

          <div className="space-y-2">
            {formData.etape4_controler.mesuresControle.map((mesure, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 p-3 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {mesure.type.replace(/_/g, " ")}
                      </span>
                      {mesure.miseEnPlace && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-gray-900">{mesure.description}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t("intervention.components.take5Form.step4.responsableBadge", { value: mesure.responsable })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMesure(index)}
                    className="text-red-600 hover:text-red-700 ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Checkbox
            label={t("intervention.components.take5Form.step4.checkboxLabel")}
            checked={formData.etape4_controler.complete}
            onChange={(e) =>
              setFormData({
                ...formData,
                etape4_controler: {
                  ...formData.etape4_controler,
                  complete: e.target.checked,
                },
              })
            }
          />
        </CardContent>
      </Card>

      {/* Étape 5: PROCÉDER */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Play className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <CardTitle>{t("intervention.components.take5Form.step5.title")}</CardTitle>
              <CardDescription>
                {t("intervention.components.take5Form.step5.description")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg space-y-3">
            <Checkbox
              label={
                <span className="font-medium">
                  {t("intervention.components.take5Form.step5.securiteConfirmeeLabel")}
                </span>
              }
              checked={formData.etape5_proceder.securiteConfirmee}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  etape5_proceder: {
                    ...formData.etape5_proceder,
                    securiteConfirmee: e.target.checked,
                  },
                })
              }
            />
            <Checkbox
              label={
                <span className="font-medium">
                  {t("intervention.components.take5Form.step5.autorisationLabel")}
                </span>
              }
              checked={formData.etape5_proceder.autorisationProceder}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  etape5_proceder: {
                    ...formData.etape5_proceder,
                    autorisationProceder: e.target.checked,
                  },
                })
              }
            />
          </div>

          <Checkbox
            label={t("intervention.components.take5Form.step5.checkboxLabel")}
            checked={formData.etape5_proceder.complete}
            onChange={(e) =>
              setFormData({
                ...formData,
                etape5_proceder: {
                  ...formData.etape5_proceder,
                  complete: e.target.checked,
                },
              })
            }
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("intervention.components.take5Form.cancel")}
          </Button>
        )}
        <div className="flex-1" />
        <div className="text-sm text-gray-600">
          {isFormValid() ? (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {t("intervention.components.take5Form.readyToSubmit")}
            </span>
          ) : (
            <span className="text-orange-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {t("intervention.components.take5Form.incompleteWarning")}
            </span>
          )}
        </div>
        <Button type="submit" disabled={!isFormValid()}>
          {t("intervention.components.take5Form.submit")}
        </Button>
      </div>
    </form>
  );
}
