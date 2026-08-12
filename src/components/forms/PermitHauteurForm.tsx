import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { usePermitStore } from "@/store/permitStore";
import { useAuthStore } from '@/store/auth.store';
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import Textarea from "@/components/ui/Textarea";
import MultiStepForm from "./MultiStepForm";
import { wireStepValidation, type RegisterValidate } from "./wireStepValidation";
import { AlertCircle, FileText } from "lucide-react";

// Schémas de validation pour chaque étape (messages traduits via t())
const makeStep1Schema = (t: TFunction) =>
  z.object({
    planPreventionId: z.string().min(1, t("forms.permitHauteur.validation.planPreventionRequired")),
    prestataire: z.string().min(1, t("forms.permitHauteur.validation.prestataireRequired")),
    dateDebut: z.string().min(1, t("forms.permitHauteur.validation.dateDebutRequired")),
    dateFin: z.string().min(1, t("forms.permitHauteur.validation.dateFinRequired")),
    descriptionOperation: z
      .string()
      .min(5, t("forms.permitHauteur.validation.descriptionTooShort")),
    codeSite: z.string().min(1, t("forms.permitHauteur.validation.codeSiteRequired")),
    region: z.string().min(1, t("forms.permitHauteur.validation.regionRequired")),
    nombreIntervenants: z.number().min(1, t("forms.permitHauteur.validation.minIntervenants")),
    hauteurChute: z.enum(["<=3m", "3-8m", "8-40m", ">40m"]),
    travailToiture: z.boolean(),
    typePente: z
      .enum(["plat", "legere", "forte", "tres_forte", "extreme"])
      .optional(),
  });

const makeStep2Schema = () =>
  z.object({
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

const makeStep3Schema = () =>
  z.object({
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

const makeStep4Schema = () =>
  z.object({
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

const makeStep5Schema = (t: TFunction) =>
  z.object({
    planSauvetageDisponible: z.boolean(),
    numerosUrgenceDisponibles: z.boolean(),
    secouristePresent: z.boolean(),
    engagementDemandeur: z.boolean().refine((val) => val === true, {
      message: t("forms.permitHauteur.validation.engagementRequired"),
    }),
  });

type Step1Data = z.infer<ReturnType<typeof makeStep1Schema>>;
type Step2Data = z.infer<ReturnType<typeof makeStep2Schema>>;
type Step3Data = z.infer<ReturnType<typeof makeStep3Schema>>;
type Step4Data = z.infer<ReturnType<typeof makeStep4Schema>>;
type Step5Data = z.infer<ReturnType<typeof makeStep5Schema>>;

interface PermitHauteurFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onComplete: (data: any) => void;
  onCancel?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
}

export default function PermitHauteurForm({
  onComplete,
  onCancel,
  initialData,
}: PermitHauteurFormProps) {
  const { plansPrevention } = usePermitStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  // État global pour partager les données entre les étapes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<any>(initialData || {});

  // Générer le numéro de permis dès l'ouverture du formulaire
  const [permitNumber] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `PTWH-${year}${month}${day}-${random}`;
  });

  // Filtrer les plans validés
  const plansDisponibles = plansPrevention
    .filter((p) => p.status === "valide")
    .map((p) => ({
      value: p.id,
      label: `${p.reference} - ${p.nomSite}`,
    }));

  // Étape 1: Informations générales
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Step1Component = (
    formData: any,
    updateFormData: (data: any) => void,
    registerValidate: RegisterValidate,
  ) => {
    const { t } = useTranslation();
    const step1Schema = useMemo(() => makeStep1Schema(t), [t]);
    const {
      register,
      handleSubmit,
      watch,
      setValue,
      formState: { errors },
    } = useForm<Step1Data>({
      resolver: zodResolver(step1Schema),
      defaultValues: {
        planPreventionId: formData.planPreventionId || "",
        prestataire: formData.prestataire || user?.entreprise || "",
        dateDebut: formData.dateDebut || "",
        dateFin: formData.dateFin || "",
        descriptionOperation: formData.descriptionOperation || "",
        codeSite: formData.codeSite || "",
        region: formData.region || "",
        nombreIntervenants: formData.nombreIntervenants || 1,
        hauteurChute: formData.hauteurChute || "<=3m",
        travailToiture: formData.travailToiture || false,
        typePente: formData.typePente || "plat",
      },
    });

    const travailToiture = watch("travailToiture");
    const hauteurChute = watch("hauteurChute");
    const typePente = watch("typePente");

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
    wireStepValidation(registerValidate, handleSubmit, onSubmit);

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label={t("forms.permitHauteur.step1.planPreventionLabel")}
          {...register("planPreventionId")}
          error={errors.planPreventionId?.message}
          options={plansDisponibles}
          placeholder={t("forms.permitHauteur.step1.planPreventionPlaceholder")}
        />

        <Input
          label={t("forms.permitHauteur.step1.prestataireLabel")}
          {...register("prestataire")}
          error={errors.prestataire?.message}
          placeholder={t("forms.permitHauteur.step1.prestatairePlaceholder")}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t("forms.permitHauteur.step1.dateDebutLabel")}
            type="date"
            {...register("dateDebut")}
            error={errors.dateDebut?.message}
          />
          <Input
            label={t("forms.permitHauteur.step1.dateFinLabel")}
            type="date"
            {...register("dateFin")}
            error={errors.dateFin?.message}
          />
        </div>

        <Textarea
          label={t("forms.permitHauteur.step1.descriptionLabel")}
          {...register("descriptionOperation")}
          error={errors.descriptionOperation?.message}
          placeholder={t("forms.permitHauteur.step1.descriptionPlaceholder")}
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t("forms.permitHauteur.step1.codeSiteLabel")}
            {...register("codeSite")}
            error={errors.codeSite?.message}
            placeholder={t("forms.permitHauteur.step1.codeSitePlaceholder")}
          />
          <Input
            label={t("forms.permitHauteur.step1.regionLabel")}
            {...register("region")}
            error={errors.region?.message}
            placeholder={t("forms.permitHauteur.step1.regionPlaceholder")}
          />
        </div>

        <Input
          label={t("forms.permitHauteur.step1.nombreIntervenantsLabel")}
          type="number"
          {...register("nombreIntervenants", { valueAsNumber: true })}
          error={errors.nombreIntervenants?.message}
          min={1}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("forms.permitHauteur.step1.hauteurChuteLabel")}
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { value: "<=3m", label: t("forms.permitHauteur.step1.hauteur3mLabel") },
              { value: "3-8m", label: t("forms.permitHauteur.step1.hauteur3to8mLabel") },
              { value: "8-40m", label: t("forms.permitHauteur.step1.hauteur8to40mLabel") },
              { value: ">40m", label: t("forms.permitHauteur.step1.hauteurSup40mLabel") },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setValue(
                    "hauteurChute",
                    option.value as "<=3m" | "3-8m" | "8-40m" | ">40m",
                  );
                  updateFormData({ ...formData, hauteurChute: option.value });
                }}
                className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                  hauteurChute === option.value
                    ? "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.hauteurChute && (
            <p className="mt-1 text-sm text-red-600">
              {errors.hauteurChute.message}
            </p>
          )}
        </div>

        <Checkbox
          label={t("forms.permitHauteur.step1.travailToitureLabel")}
          description={t("forms.permitHauteur.step1.travailToitureDesc")}
          {...register("travailToiture")}
        />

        {travailToiture && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("forms.permitHauteur.step1.typePenteLabel")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
              {[
                { value: "plat", label: t("forms.permitHauteur.step1.pentePlatLabel") },
                { value: "legere", label: t("forms.permitHauteur.step1.penteLegereLabel") },
                { value: "forte", label: t("forms.permitHauteur.step1.penteForteLabel") },
                {
                  value: "tres_forte",
                  label: t("forms.permitHauteur.step1.penteTresForteLabel"),
                },
                { value: "extreme", label: t("forms.permitHauteur.step1.penteExtremeLabel") },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setValue(
                      "typePente",
                      option.value as
                        | "plat"
                        | "legere"
                        | "forte"
                        | "tres_forte"
                        | "extreme",
                    );
                    updateFormData({ ...formData, typePente: option.value });
                  }}
                  className={`px-3 py-2 text-sm border rounded-md transition-colors text-left ${
                    typePente === option.value
                      ? "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
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
  const Step2Component = (
    formData: any,
    updateFormData: (data: any) => void,
    registerValidate: RegisterValidate,
  ) => {
    const { t } = useTranslation();
    const step2Schema = useMemo(() => makeStep2Schema(), []);
    const { register, handleSubmit, watch, setValue } = useForm<Step2Data>({
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
    wireStepValidation(registerValidate, handleSubmit, onSubmit);

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          {t("forms.permitHauteur.step2.intro")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            label={t("forms.permitHauteur.step2.effondrementLabel")}
            {...register("effondrement")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step2.incendieLabel")}
            {...register("incendie")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step2.deversementLabel")}
            {...register("deversement")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step2.electrisationLabel")}
            {...register("electrisation")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step2.chutePersonnesLabel")}
            {...register("chutePersonnes")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step2.blessureLabel")}
            {...register("blessure")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step2.chuteObjetLabel")}
            {...register("chuteObjet")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step2.expositionSubstancesLabel")}
            {...register("expositionSubstances")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step2.ecrasementLabel")}
            {...register("ecrasement")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step2.mauvaiseMeteoLabel")}
            {...register("mauvaiseMeteo")}
          />
        </div>

        {/* Section Autre */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox label={t("forms.permitHauteur.step2.autreLabel")} {...register("autres")} />
          </div>

          <div className="ml-6">
            <Input
              label={t("forms.permitHauteur.step2.precisezRisqueLabel")}
              placeholder={t("forms.permitHauteur.step2.precisezRisquePlaceholder")}
              onKeyDown={(e) => {
                const input = e.target as HTMLInputElement;
                if (e.key === "Enter" && input.value.trim()) {
                  e.preventDefault();
                  const currentAutres = formData.autres || [];
                  if (!currentAutres.includes(input.value.trim())) {
                    const newAutres = [...currentAutres, input.value.trim()];
                    setValue("autres", newAutres);
                    updateFormData({ ...formData, autres: newAutres });
                    input.value = "";
                  }
                }
              }}
            />

            {/* Affichage des risques "autres" ajoutés */}
            {formData.autres && formData.autres.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.autres.map((risque: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                  >
                    <span className="text-sm text-gray-700">{risque}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newAutres = formData.autres.filter(
                          (_: string, i: number) => i !== index,
                        );
                        setValue("autres", newAutres);
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
  const Step3Component = (
    formData: any,
    updateFormData: (data: any) => void,
    registerValidate: RegisterValidate,
  ) => {
    const { t } = useTranslation();
    const step3Schema = useMemo(() => makeStep3Schema(), []);
    const { register, handleSubmit, watch, setValue } = useForm<Step3Data>({
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
    wireStepValidation(registerValidate, handleSubmit, onSubmit);

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          {t("forms.permitHauteur.step3.intro")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Checkbox
            label={t("forms.permitHauteur.step3.echafaudageRoulantLabel")}
            description={t("forms.permitHauteur.step3.echafaudageRoulantDesc")}
            {...register("echafaudageRoulant")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step3.echafaudageFixeLabel")}
            description={t("forms.permitHauteur.step3.echafaudageFixeDesc")}
            {...register("echafaudageFixe")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step3.filetSecuriteLabel")}
            description={t("forms.permitHauteur.step3.filetSecuriteDesc")}
            {...register("filetSecurite")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step3.ligneVieVerticaleLabel")}
            description={t("forms.permitHauteur.step3.ligneVieVerticaleDesc")}
            {...register("ligneVieVerticale")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step3.ligneVieHorizontaleLabel")}
            description={t("forms.permitHauteur.step3.ligneVieHorizontaleDesc")}
            {...register("ligneVieHorizontale")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step3.pointAncrageLabel")}
            description={t("forms.permitHauteur.step3.pointAncrageDesc")}
            {...register("pointAncrage")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step3.echelleCrinolineLabel")}
            {...register("echelleCrinoline")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step3.plateformeElevatriceLabel")}
            description={t("forms.permitHauteur.step3.plateformeElevatriceDesc")}
            {...register("plateformeElevatrice")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step3.travailCordesLabel")}
            description={t("forms.permitHauteur.step3.travailCordesDesc")}
            {...register("travailCordes")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step3.echelleLabel")}
            description={t("forms.permitHauteur.step3.echelleDesc")}
            {...register("echelle")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step3.escabeauLabel")}
            description={t("forms.permitHauteur.step3.escabeauDesc")}
            {...register("escabeau")}
          />
        </div>

        {/* Section Autre */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox label={t("forms.permitHauteur.step3.autreLabel")} {...register("autres")} />
          </div>

          <div className="ml-6">
            <Input
              label={t("forms.permitHauteur.step3.precisezEquipementLabel")}
              placeholder={t("forms.permitHauteur.step3.precisezEquipementPlaceholder")}
              onKeyDown={(e) => {
                const input = e.target as HTMLInputElement;
                if (e.key === "Enter" && input.value.trim()) {
                  e.preventDefault();
                  const currentAutres = formData.autres || [];
                  if (!currentAutres.includes(input.value.trim())) {
                    const newAutres = [...currentAutres, input.value.trim()];
                    setValue("autres", newAutres);
                    updateFormData({ ...formData, autres: newAutres });
                    input.value = "";
                  }
                }
              }}
            />

            {/* Affichage des équipements "autres" ajoutés */}
            {formData.autres && formData.autres.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.autres.map((equipement: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                  >
                    <span className="text-sm text-gray-700">{equipement}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newAutres = formData.autres.filter(
                          (_: string, i: number) => i !== index,
                        );
                        setValue("autres", newAutres);
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
  const Step4Component = (
    formData: any,
    updateFormData: (data: any) => void,
    registerValidate: RegisterValidate,
  ) => {
    const { t } = useTranslation();
    const step4Schema = useMemo(() => makeStep4Schema(), []);
    const { register, handleSubmit, watch } = useForm<Step4Data>({
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
    wireStepValidation(registerValidate, handleSubmit, onSubmit);

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          {t("forms.permitHauteur.step4.intro")}
        </p>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {t("forms.permitHauteur.step4.formationTitle")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Checkbox
                label={t("forms.permitHauteur.step4.personnelHabiliteLabel")}
                {...register("personnelHabilite")}
              />
              <Checkbox
                label={t("forms.permitHauteur.step4.personnelApteLabel")}
                {...register("personnelApte")}
              />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {t("forms.permitHauteur.step4.epiTitle")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Checkbox
                label={t("forms.permitHauteur.step4.chaussuresLabel")}
                {...register("chaussuresSecurite")}
              />
              <Checkbox label={t("forms.permitHauteur.step4.casqueLabel")} {...register("casque")} />
              <Checkbox
                label={t("forms.permitHauteur.step4.gantsNitrileLabel")}
                {...register("gantsNitrile")}
              />
              <Checkbox
                label={t("forms.permitHauteur.step4.gantsIsolantsLabel")}
                {...register("gantsIsolants")}
              />
              <Checkbox
                label={t("forms.permitHauteur.step4.gantsManutentionLabel")}
                {...register("gantsManutention")}
              />
              <Checkbox
                label={t("forms.permitHauteur.step4.bouchonOreilleLabel")}
                {...register("bouchonOreille")}
              />
              <Checkbox
                label={t("forms.permitHauteur.step4.casqueAntiBruitLabel")}
                {...register("casqueAntiBruit")}
              />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {t("forms.permitHauteur.step4.antiChuteTitle")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Checkbox
                label={t("forms.permitHauteur.step4.longeAbsorbeurLabel")}
                {...register("longeAbsorbeur")}
              />
              <Checkbox label={t("forms.permitHauteur.step4.doubleLongeLabel")} {...register("doubleLonge")} />
              <Checkbox
                label={t("forms.permitHauteur.step4.ligneVieConformeLabel")}
                {...register("ligneVieConforme")}
              />
              <Checkbox
                label={t("forms.permitHauteur.step4.harnaisVerifieLabel")}
                {...register("harnaisVerifie")}
              />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {t("forms.permitHauteur.step4.verificationsTitle")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Checkbox
                label={t("forms.permitHauteur.step4.balisageLabel")}
                {...register("balisage")}
              />
              <Checkbox
                label={t("forms.permitHauteur.step4.echafaudageConformeLabel")}
                {...register("echafaudageConforme")}
              />
              <Checkbox
                label={t("forms.permitHauteur.step4.echelleConformeLabel")}
                {...register("echelleConforme")}
              />
              <Checkbox
                label={t("forms.permitHauteur.step4.sanglageOutilsLabel")}
                {...register("sanglageOutils")}
              />
              <Checkbox
                label={t("forms.permitHauteur.step4.travailDeuxLabel")}
                {...register("travailDeux")}
              />
              <Checkbox
                label={t("forms.permitHauteur.step4.mesureVentLabel")}
                {...register("mesureVent")}
              />
            </div>
          </div>
        </div>
      </form>
    );
  };

  // Étape 5: Prévention urgence et validation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Step5Component = (
    formData: any,
    updateFormData: (data: any) => void,
    registerValidate: RegisterValidate,
  ) => {
    const { t } = useTranslation();
    const step5Schema = useMemo(() => makeStep5Schema(t), [t]);
    const { register, handleSubmit, watch } = useForm<Step5Data>({
      resolver: zodResolver(step5Schema),
      defaultValues: {
        planSauvetageDisponible: formData.planSauvetageDisponible || false,
        numerosUrgenceDisponibles: formData.numerosUrgenceDisponibles || false,
        secouristePresent: formData.secouristePresent || false,
        engagementDemandeur: formData.engagementDemandeur || false,
      },
    });

    const planSauvetage = watch("planSauvetageDisponible");

    // Vérifier si la hauteur > 20m (8-40m ou >40m)
    const hauteurSuperieure20m =
      formData.hauteurChute === "8-40m" || formData.hauteurChute === ">40m";

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
    wireStepValidation(registerValidate, handleSubmit, onSubmit);

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {t("forms.permitHauteur.step5.warningTitle")}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {t("forms.permitHauteur.step5.warningText")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Checkbox
              label={`${t("forms.permitHauteur.step5.planSauvetageLabel")}${hauteurSuperieure20m ? " *" : ""}`}
              description={
                hauteurSuperieure20m
                  ? t("forms.permitHauteur.step5.planSauvetageRequiredDesc")
                  : t("forms.permitHauteur.step5.planSauvetageDesc")
              }
              {...register("planSauvetageDisponible")}
            />
            {hauteurSuperieure20m && !planSauvetage && (
              <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-sm text-orange-800">
                  ⚠️ <strong>{t("forms.permitHauteur.step5.attentionLabel")}</strong>{" "}
                  {t("forms.permitHauteur.step5.planSauvetageWarningText")}
                </p>
              </div>
            )}
          </div>

          <Checkbox
            label={t("forms.permitHauteur.step5.numerosUrgenceLabel")}
            description={t("forms.permitHauteur.step5.numerosUrgenceDesc")}
            {...register("numerosUrgenceDisponibles")}
          />
          <Checkbox
            label={t("forms.permitHauteur.step5.secouristeLabel")}
            description={t("forms.permitHauteur.step5.secouristeDesc")}
            {...register("secouristePresent")}
          />
        </div>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">
            {t("forms.permitHauteur.step5.engagementTitle")}
          </h4>
          <Checkbox
            label={t("forms.permitHauteur.step5.engagementLabel")}
            {...register("engagementDemandeur")}
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">
            {t("forms.permitHauteur.step5.recapTitle")}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">{t("forms.permitHauteur.step5.planPreventionLabel")}</p>
              <p className="text-gray-600">
                {formData.planPreventionId
                  ? plansDisponibles.find(
                      (p) => p.value === formData.planPreventionId,
                    )?.label || t("forms.permitHauteur.step5.na")
                  : t("forms.permitHauteur.step5.nonRenseigne")}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">{t("forms.permitHauteur.step5.prestataireLabel")}</p>
              <p className="text-gray-600">
                {formData.prestataire || t("forms.permitHauteur.step5.nonRenseigne")}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">{t("forms.permitHauteur.step5.periodeLabel")}</p>
              <p className="text-gray-600">
                {formData.dateDebut && formData.dateFin
                  ? t("forms.permitHauteur.step5.periodeValue", {
                      debut: formData.dateDebut,
                      fin: formData.dateFin,
                    })
                  : t("forms.permitHauteur.step5.nonRenseigne")}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">{t("forms.permitHauteur.step5.siteLabel")}</p>
              <p className="text-gray-600">
                {formData.codeSite
                  ? `${formData.codeSite} - ${formData.region}`
                  : t("forms.permitHauteur.step5.nonRenseigne")}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">{t("forms.permitHauteur.step5.operationLabel")}</p>
              <p className="text-gray-600">
                {formData.descriptionOperation || t("forms.permitHauteur.step5.nonRenseigne")}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">{t("forms.permitHauteur.step5.intervenantsLabel")}</p>
              <p className="text-gray-600">
                {formData.nombreIntervenants
                  ? `${formData.nombreIntervenants} ${t("forms.permitHauteur.step5.intervenantsSuffix")}`
                  : t("forms.permitHauteur.step5.nonRenseigne")}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">
                {t("forms.permitHauteur.step5.hauteurChuteLabel")}
              </p>
              <p className="text-gray-600">
                {formData.hauteurChute || t("forms.permitHauteur.step5.nonRenseigne")}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">{t("forms.permitHauteur.step5.travailToitureLabel")}</p>
              <p className="text-gray-600">
                {formData.travailToiture
                  ? `${t("forms.permitHauteur.step5.oui")}${formData.typePente ? ` (${formData.typePente})` : ""}`
                  : t("forms.permitHauteur.step5.non")}
              </p>
            </div>
          </div>
        </div>
      </form>
    );
  };

  const steps = [
    {
      id: "informations",
      title: t("forms.permitHauteur.steps.informations.title"),
      description: t("forms.permitHauteur.steps.informations.description"),
      component: Step1Component,
    },
    {
      id: "risques",
      title: t("forms.permitHauteur.steps.risques.title"),
      description: t("forms.permitHauteur.steps.risques.description"),
      component: Step2Component,
    },
    {
      id: "materiels",
      title: t("forms.permitHauteur.steps.materiels.title"),
      description: t("forms.permitHauteur.steps.materiels.description"),
      component: Step3Component,
    },
    {
      id: "prevention",
      title: t("forms.permitHauteur.steps.prevention.title"),
      description: t("forms.permitHauteur.steps.prevention.description"),
      component: Step4Component,
    },
    {
      id: "urgence",
      title: t("forms.permitHauteur.steps.urgence.title"),
      description: t("forms.permitHauteur.steps.urgence.description"),
      component: Step5Component,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleComplete = (data: any) => {
    // Récupérer la référence du plan de prévention
    const planPrevention = plansPrevention.find(
      (p) => p.id === data.planPreventionId,
    );

    // Préparer les données pour le store
    const permisData = {
      permisGeneralId: "", // Sera lié au permis général
      planPreventionId: data.planPreventionId,
      planPreventionReference: planPrevention?.reference || "",
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
      demandeurNom:
        user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : "",
      demandeurDate: new Date(),
      personnelsExecutants: [],
      validationsJournalieres: [],
      status: "brouillon" as const,
      creerPar: user?.email || "",
    };

    onComplete(permisData);
  };

  // Récupérer la référence du plan de prévention sélectionné
  const selectedPlan = formData.planPreventionId
    ? plansPrevention.find((p) => p.id === formData.planPreventionId)
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
            <h3 className="font-semibold text-blue-900">
              {t("forms.permitHauteur.headerTitle")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-sm">
              <div>
                <span className="text-blue-700 font-medium">
                  {t("forms.permitHauteur.permitNumberLabel")}
                </span>
                <span className="text-blue-900 ml-2 font-mono">
                  {permitNumber}
                </span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">
                  {t("forms.permitHauteur.planPreventionRefLabel")}
                </span>
                <span className="text-blue-900 ml-2">
                  {selectedPlan ? selectedPlan.reference : t("forms.permitHauteur.notSelected")}
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
        title={t("forms.permitHauteur.title")}
        description={t("forms.permitHauteur.description")}
        submitLabel={t("forms.permitHauteur.submitLabel")}
        formData={formData}
        updateFormData={setFormData}
      />
    </div>
  );
}
