/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
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
import MultiStepForm from "./MultiStepForm";
import { wireStepValidation, type RegisterValidate } from "./wireStepValidation";
import { AlertCircle } from "lucide-react";

// Schémas de validation pour chaque étape (messages traduits via t())
const makeStep1Schema = (t: TFunction) =>
  z.object({
    planPreventionId: z.string().min(1, t("forms.permitGeneral.validation.planPreventionRequired")),
    intituleTravaux: z.string().min(5, t("forms.permitGeneral.validation.intituleTooShort")),
    localisation: z.string().min(1, t("forms.permitGeneral.validation.localisationRequired")),
    codeSite: z.string().min(1, t("forms.permitGeneral.validation.codeSiteRequired")),
    contractant: z.string().min(1, t("forms.permitGeneral.validation.contractantRequired")),
    nombreIntervenants: z.number().min(1, t("forms.permitGeneral.validation.minIntervenants")),
    dateDebut: z.string().min(1, t("forms.permitGeneral.validation.dateDebutRequired")),
    dateFin: z.string().min(1, t("forms.permitGeneral.validation.dateFinRequired")),
  });

const makeStep2Schema = () =>
  z.object({
    travauxChaud: z.boolean(),
    travauxHauteur: z.boolean(),
    travauxElectrique: z.boolean(),
    travauxEspaceConfine: z.boolean(),
    travauxExcavation: z.boolean(),
    travauxAutres: z.boolean(),
    autresDescription: z.string().optional(),
  });

const makeStep3Schema = (t: TFunction) =>
  z.object({
    evaluationRisquesValidee: z.boolean().refine((val) => val === true, {
      message: t("forms.permitGeneral.validation.evaluationRisquesRequired"),
    }),
    personneCompetenteAssignee: z.boolean().refine((val) => val === true, {
      message: t("forms.permitGeneral.validation.personneCompetenteRequired"),
    }),
    mesuresPreventionMisesEnPlace: z.boolean().refine((val) => val === true, {
      message: t("forms.permitGeneral.validation.mesuresPreventionRequired"),
    }),
    personnelInforme: z.boolean().refine((val) => val === true, {
      message: t("forms.permitGeneral.validation.personnelInformeRequired"),
    }),
    dangersControles: z.boolean().refine((val) => val === true, {
      message: t("forms.permitGeneral.validation.dangersControlesRequired"),
    }),
  });

type Step1Data = z.infer<ReturnType<typeof makeStep1Schema>>;
type Step2Data = z.infer<ReturnType<typeof makeStep2Schema>>;
type Step3Data = z.infer<ReturnType<typeof makeStep3Schema>>;

interface PermitGeneralFormProps {
  onComplete: (data: any) => void;
  onCancel?: () => void;
  initialData?: any;
}

export default function PermitGeneralForm({
  onComplete,
  onCancel,
}: PermitGeneralFormProps) {
  const { plansPrevention } = usePermitStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  // État global pour partager les données entre les étapes
  const [formData, setFormData] = useState<any>({});

  // Filtrer les plans validés
  const plansDisponibles = plansPrevention
    .filter((p) => p.status === "valide")
    .map((p) => ({
      value: p.id,
      label: `${p.reference} - ${p.nomSite}`,
    }));

  // Étape 1: Détails de l'intervention
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
      formState: { errors },
    } = useForm<Step1Data>({
      resolver: zodResolver(step1Schema),
      defaultValues: {
        planPreventionId: formData.planPreventionId || "",
        intituleTravaux: formData.intituleTravaux || "",
        localisation: formData.localisation || "",
        codeSite: formData.codeSite || "",
        contractant: formData.contractant || user?.entreprise || "",
        nombreIntervenants: formData.nombreIntervenants || 1,
        dateDebut: formData.dateDebut || "",
        dateFin: formData.dateFin || "",
      },
    });

    const onSubmit = (data: Step1Data) => {
      updateFormData({ ...formData, ...data });
    };
    wireStepValidation(registerValidate, handleSubmit, onSubmit);

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label={t("forms.permitGeneral.step1.planPreventionLabel")}
          {...register("planPreventionId")}
          error={errors.planPreventionId?.message}
          options={plansDisponibles}
          placeholder={t("forms.permitGeneral.step1.planPreventionPlaceholder")}
        />

        {plansDisponibles.length === 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                {t("forms.permitGeneral.step1.noPlanTitle")}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                {t("forms.permitGeneral.step1.noPlanText")}
              </p>
            </div>
          </div>
        )}

        <Input
          label={t("forms.permitGeneral.step1.intituleLabel")}
          {...register("intituleTravaux")}
          error={errors.intituleTravaux?.message}
          placeholder={t("forms.permitGeneral.step1.intitulePlaceholder")}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t("forms.permitGeneral.step1.localisationLabel")}
            {...register("localisation")}
            error={errors.localisation?.message}
            placeholder={t("forms.permitGeneral.step1.localisationPlaceholder")}
          />
          <Input
            label={t("forms.permitGeneral.step1.codeSiteLabel")}
            {...register("codeSite")}
            error={errors.codeSite?.message}
            placeholder={t("forms.permitGeneral.step1.codeSitePlaceholder")}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t("forms.permitGeneral.step1.contractantLabel")}
            {...register("contractant")}
            error={errors.contractant?.message}
            placeholder={t("forms.permitGeneral.step1.contractantPlaceholder")}
          />
          <Input
            label={t("forms.permitGeneral.step1.nombreIntervenantsLabel")}
            type="number"
            {...register("nombreIntervenants", { valueAsNumber: true })}
            error={errors.nombreIntervenants?.message}
            min={1}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t("forms.permitGeneral.step1.dateDebutLabel")}
            type="date"
            {...register("dateDebut")}
            error={errors.dateDebut?.message}
          />
          <Input
            label={t("forms.permitGeneral.step1.dateFinLabel")}
            type="date"
            {...register("dateFin")}
            error={errors.dateFin?.message}
          />
        </div>
      </form>
    );
  };

  // Étape 2: Types de travaux à risques
  const Step2Component = (
    formData: any,
    updateFormData: (data: any) => void,
    registerValidate: RegisterValidate,
  ) => {
    const { t } = useTranslation();
    const step2Schema = useMemo(() => makeStep2Schema(), []);
    const { register, handleSubmit, watch } = useForm<Step2Data>({
      resolver: zodResolver(step2Schema),
      defaultValues: {
        travauxChaud: formData.travauxChaud || false,
        travauxHauteur: formData.travauxHauteur || false,
        travauxElectrique: formData.travauxElectrique || false,
        travauxEspaceConfine: formData.travauxEspaceConfine || false,
        travauxExcavation: formData.travauxExcavation || false,
        travauxAutres: formData.travauxAutres || false,
        autresDescription: formData.autresDescription || "",
      },
    });

    const travauxAutres = watch("travauxAutres");

    const onSubmit = (data: Step2Data) => {
      updateFormData({ ...formData, ...data });
    };
    wireStepValidation(registerValidate, handleSubmit, onSubmit);

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          {t("forms.permitGeneral.step2.intro")}
        </p>

        <Checkbox
          label={t("forms.permitGeneral.step2.chaudLabel")}
          description={t("forms.permitGeneral.step2.chaudDesc")}
          {...register("travauxChaud")}
        />
        <Checkbox
          label={t("forms.permitGeneral.step2.hauteurLabel")}
          description={t("forms.permitGeneral.step2.hauteurDesc")}
          {...register("travauxHauteur")}
        />
        <Checkbox
          label={t("forms.permitGeneral.step2.electriqueLabel")}
          description={t("forms.permitGeneral.step2.electriqueDesc")}
          {...register("travauxElectrique")}
        />
        <Checkbox
          label={t("forms.permitGeneral.step2.espaceConfineLabel")}
          description={t("forms.permitGeneral.step2.espaceConfineDesc")}
          {...register("travauxEspaceConfine")}
        />
        <Checkbox
          label={t("forms.permitGeneral.step2.excavationLabel")}
          description={t("forms.permitGeneral.step2.excavationDesc")}
          {...register("travauxExcavation")}
        />
        <Checkbox
          label={t("forms.permitGeneral.step2.autresLabel")}
          description={t("forms.permitGeneral.step2.autresDesc")}
          {...register("travauxAutres")}
        />

        {travauxAutres && (
          <Input
            label={t("forms.permitGeneral.step2.autresDescriptionLabel")}
            {...register("autresDescription")}
            placeholder={t("forms.permitGeneral.step2.autresDescriptionPlaceholder")}
          />
        )}
      </form>
    );
  };

  // Étape 3: Engagement du demandeur
  const Step3Component = (
    formData: any,
    updateFormData: (data: any) => void,
    registerValidate: RegisterValidate,
  ) => {
    const { t } = useTranslation();
    const step3Schema = useMemo(() => makeStep3Schema(t), [t]);
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<Step3Data>({
      resolver: zodResolver(step3Schema),
      defaultValues: {
        evaluationRisquesValidee: formData.evaluationRisquesValidee || false,
        personneCompetenteAssignee: formData.personneCompetenteAssignee || false,
        mesuresPreventionMisesEnPlace:
          formData.mesuresPreventionMisesEnPlace || false,
        personnelInforme: formData.personnelInforme || false,
        dangersControles: formData.dangersControles || false,
      },
    });

    const onSubmit = (data: Step3Data) => {
      updateFormData({ ...formData, ...data });
    };
    wireStepValidation(registerValidate, handleSubmit, onSubmit);

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          {t("forms.permitGeneral.step3.intro")}
        </p>

        <Checkbox
          label={t("forms.permitGeneral.step3.evaluationRisquesLabel")}
          {...register("evaluationRisquesValidee")}
        />
        {errors.evaluationRisquesValidee && (
          <p className="text-sm text-red-600">
            {errors.evaluationRisquesValidee.message}
          </p>
        )}

        <Checkbox
          label={t("forms.permitGeneral.step3.personneCompetenteLabel")}
          {...register("personneCompetenteAssignee")}
        />
        {errors.personneCompetenteAssignee && (
          <p className="text-sm text-red-600">
            {errors.personneCompetenteAssignee.message}
          </p>
        )}

        <Checkbox
          label={t("forms.permitGeneral.step3.mesuresPreventionLabel")}
          {...register("mesuresPreventionMisesEnPlace")}
        />
        {errors.mesuresPreventionMisesEnPlace && (
          <p className="text-sm text-red-600">
            {errors.mesuresPreventionMisesEnPlace.message}
          </p>
        )}

        <Checkbox
          label={t("forms.permitGeneral.step3.personnelInformeLabel")}
          {...register("personnelInforme")}
        />
        {errors.personnelInforme && (
          <p className="text-sm text-red-600">
            {errors.personnelInforme.message}
          </p>
        )}

        <Checkbox
          label={t("forms.permitGeneral.step3.dangersControlesLabel")}
          {...register("dangersControles")}
        />
        {errors.dangersControles && (
          <p className="text-sm text-red-600">
            {errors.dangersControles.message}
          </p>
        )}
      </form>
    );
  };

  // Étape 4: Révision et soumission
  const Step4Component = (formData: any) => {
    const { t } = useTranslation();
    const risquesSelectionnes: { key: string; label: string }[] = [
      { key: "travauxChaud", label: t("forms.permitGeneral.step2.chaudLabel") },
      { key: "travauxHauteur", label: t("forms.permitGeneral.step2.hauteurLabel") },
      { key: "travauxElectrique", label: t("forms.permitGeneral.step2.electriqueLabel") },
      { key: "travauxEspaceConfine", label: t("forms.permitGeneral.step2.espaceConfineLabel") },
      { key: "travauxExcavation", label: t("forms.permitGeneral.step2.excavationLabel") },
    ].filter(({ key }) => formData[key]);
    if (formData.travauxAutres) {
      risquesSelectionnes.push({
        key: "travauxAutres",
        label: formData.autresDescription || t("forms.permitGeneral.step2.autresLabel"),
      });
    }

    return (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {t("forms.permitGeneral.step4.infoTitle")}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {t("forms.permitGeneral.step4.infoText")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">
            {t("forms.permitGeneral.step4.recapTitle")}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">{t("forms.permitGeneral.step4.travauxLabel")}</p>
              <p className="text-gray-600">
                {formData.intituleTravaux || t("forms.permitGeneral.step4.nonRenseigne")}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">{t("forms.permitGeneral.step4.siteLabel")}</p>
              <p className="text-gray-600">
                {formData.codeSite || t("forms.permitGeneral.step4.nonRenseigne")}
                {formData.localisation ? ` - ${formData.localisation}` : ""}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">{t("forms.permitGeneral.step4.contractantLabel")}</p>
              <p className="text-gray-600">
                {formData.contractant || t("forms.permitGeneral.step4.nonRenseigne")}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">{t("forms.permitGeneral.step4.intervenantsLabel")}</p>
              <p className="text-gray-600">
                {formData.nombreIntervenants
                  ? `${formData.nombreIntervenants} ${t("forms.permitGeneral.step4.intervenantsSuffix")}`
                  : t("forms.permitGeneral.step4.nonRenseigne")}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">{t("forms.permitGeneral.step4.periodeLabel")}</p>
              <p className="text-gray-600">
                {formData.dateDebut && formData.dateFin
                  ? `${formData.dateDebut} ${t("forms.permitGeneral.step4.periodeSeparator")} ${formData.dateFin}`
                  : t("forms.permitGeneral.step4.nonRenseigne")}
              </p>
            </div>
          </div>

          <div>
            <p className="font-medium text-gray-700 mb-2">
              {t("forms.permitGeneral.step4.risquesTitle")}
            </p>
            <div className="flex flex-wrap gap-2">
              {risquesSelectionnes.length > 0 ? (
                risquesSelectionnes.map(({ key, label }) => (
                  <span
                    key={key}
                    className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">{t("forms.permitGeneral.step4.aucun")}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const steps = [
    {
      id: "details",
      title: t("forms.permitGeneral.steps.details.title"),
      description: t("forms.permitGeneral.steps.details.description"),
      component: Step1Component,
      isValid: plansDisponibles.length > 0,
    },
    {
      id: "risques",
      title: t("forms.permitGeneral.steps.risques.title"),
      description: t("forms.permitGeneral.steps.risques.description"),
      component: Step2Component,
    },
    {
      id: "engagement",
      title: t("forms.permitGeneral.steps.engagement.title"),
      description: t("forms.permitGeneral.steps.engagement.description"),
      component: Step3Component,
    },
    {
      id: "revision",
      title: t("forms.permitGeneral.steps.revision.title"),
      description: t("forms.permitGeneral.steps.revision.description"),
      component: Step4Component,
    },
  ];

  const handleComplete = (data: any) => {
    // Préparer les données pour le store
    const permisData = {
      planPreventionId: data.planPreventionId,
      planPreventionReference:
        plansPrevention.find((p) => p.id === data.planPreventionId)
          ?.reference || "",
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
      status: "en_attente_validation_chef" as const,
      evaluationRisquesValidee: data.evaluationRisquesValidee,
      personneCompetenteAssignee: data.personneCompetenteAssignee,
      mesuresPreventionMisesEnPlace: data.mesuresPreventionMisesEnPlace,
      personnelInforme: data.personnelInforme,
      dangersControles: data.dangersControles,
      demandeurNom:
        user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : "",
      demandeurDate: new Date(),
      superviseurNom:
        user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : "",
      superviseurDate: new Date(),
      creerPar: user?.email || "",
    };

    onComplete(permisData);
  };

  return (
    <MultiStepForm
      steps={steps}
      onComplete={handleComplete}
      onCancel={onCancel}
      title={t("forms.permitGeneral.title")}
      description={t("forms.permitGeneral.description")}
      submitLabel={t("forms.permitGeneral.submitLabel")}
      formData={formData}
      updateFormData={setFormData}
    />
  );
}
