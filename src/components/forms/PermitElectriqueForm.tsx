/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { useAuthStore } from '@/store/auth.store';
import { usePreventionStore } from "@/store/preventionStore";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import MultiStepForm from "./MultiStepForm";
import { wireStepValidation, type RegisterValidate } from "./wireStepValidation";
import { AlertCircle } from "lucide-react";
import { useMemo, useState } from "react";

// Schémas de validation pour chaque étape (messages traduits via t())
const makeStep1Schema = (t: TFunction) =>
  z
    .object({
      planPreventionId: z.string().min(1, t("forms.permitElectrique.validation.planPreventionRequired")),
      codeSite: z.string().min(1, t("forms.permitElectrique.validation.codeSiteRequired")),
      nombreIntervenants: z.number().min(1, t("forms.permitElectrique.validation.minIntervenants")),
      dateDebut: z.string().min(1, t("forms.permitElectrique.validation.dateDebutRequired")),
      dateFin: z.string().min(1, t("forms.permitElectrique.validation.dateFinRequired")),
      travailSousTension: z.boolean(),
      travailHorsTension: z.boolean(),
      consignationEnergie: z.boolean(),
      basseTension: z.boolean(),
      moyenneTension: z.boolean(),
      hauteTension: z.boolean(),
    })
    .refine(
      (data) => {
        // Validation: dateFin >= dateDebut
        if (data.dateDebut && data.dateFin) {
          return new Date(data.dateFin) >= new Date(data.dateDebut);
        }
        return true;
      },
      {
        message: t("forms.permitElectrique.validation.dateFinBeforeDebut"),
        path: ["dateFin"],
      },
    );

const makeStep2Schema = (t: TFunction) =>
  z.object({
    typeCircuitEquipement: z.string().min(1, t("forms.permitElectrique.validation.typeCircuitRequired")),
    descriptionTravail: z
      .string()
      .min(5, t("forms.permitElectrique.validation.descriptionTooShort")),
    raisonNonMiseHorsTension: z.string().optional(),
    electrisation: z.boolean(),
    electrocution: z.boolean(),
    brulure: z.boolean(),
    autres: z.array(z.string()).optional(),
  });

const makeStep3Schema = () =>
  z.object({
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

const makeStep4Schema = (t: TFunction) =>
  z.object({
    secouristePresent: z.boolean(),
    numerosUrgenceDisponibles: z.boolean(),
    engagementDemandeur: z.boolean().refine((val) => val === true, {
      message: t("forms.permitElectrique.validation.engagementRequired"),
    }),
  });

const makeStep5Schema = () =>
  z.object({
    motifConsignation: z.string().optional(),
    equipementConcerne: z.string().optional(),
    electrique: z.string().optional(),
    dateConsignation: z.string().optional(),
    heureConsignation: z.string().optional(),
    vatVerification: z.boolean().optional(),
    visaConsignation: z.string().optional(),
  });

type Step1Data = z.infer<ReturnType<typeof makeStep1Schema>>;
type Step2Data = z.infer<ReturnType<typeof makeStep2Schema>>;
type Step3Data = z.infer<ReturnType<typeof makeStep3Schema>>;
type Step4Data = z.infer<ReturnType<typeof makeStep4Schema>>;
type Step5Data = z.infer<ReturnType<typeof makeStep5Schema>>;

interface PermitElectriqueFormProps {
  onComplete: (data: any) => void;
  onCancel?: () => void;
  initialData?: any;
}

export default function PermitElectriqueForm({
  onComplete,
  onCancel,
  initialData,
}: PermitElectriqueFormProps) {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  // État global pour partager les données entre les étapes
  const [formData, setFormData] = useState<any>(initialData || {});

  // Étape 1: Informations générales et type de travail
  const Step1Component = (
    formData: any,
    updateFormData: (data: any) => void,
    registerValidate: RegisterValidate,
  ) => {
    const { t } = useTranslation();
    const { plansPrevention } = usePreventionStore();
    const plansActifs = plansPrevention.filter((p) => p.status === "valide");
    const step1Schema = useMemo(() => makeStep1Schema(t), [t]);

    const {
      register,
      handleSubmit,
      watch,
      formState: { errors },
    } = useForm<Step1Data>({
      resolver: zodResolver(step1Schema),
      defaultValues: {
        planPreventionId: formData.planPreventionId || "",
        codeSite: formData.codeSite || "",
        nombreIntervenants: formData.nombreIntervenants || 1,
        dateDebut: formData.dateDebut || "",
        dateFin: formData.dateFin || "",
        travailSousTension: formData.travailSousTension || false,
        travailHorsTension: formData.travailHorsTension || false,
        consignationEnergie: formData.consignationEnergie || false,
        basseTension: formData.basseTension || false,
        moyenneTension: formData.moyenneTension || false,
        hauteTension: formData.hauteTension || false,
      },
    });

    const travailSousTension = watch("travailSousTension");

    const onSubmit = (data: Step1Data) => {
      updateFormData({ ...formData, ...data });
    };
    wireStepValidation(registerValidate, handleSubmit, onSubmit);

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="mb-4">
          <Select
            label={t("forms.permitElectrique.step1.planPreventionLabel")}
            {...register("planPreventionId")}
            error={errors.planPreventionId?.message}
            options={[
              { value: "", label: t("forms.permitElectrique.step1.planPreventionPlaceholder") },
              ...plansActifs.map((plan) => ({
                value: plan.id,
                label: `${plan.reference} - ${plan.nomSite}`,
              })),
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t("forms.permitElectrique.step1.codeSiteLabel")}
            {...register("codeSite")}
            error={errors.codeSite?.message}
            placeholder={t("forms.permitElectrique.step1.codeSitePlaceholder")}
          />
          <Input
            label={t("forms.permitElectrique.step1.nombreIntervenantsLabel")}
            type="number"
            {...register("nombreIntervenants", { valueAsNumber: true })}
            error={errors.nombreIntervenants?.message}
            min={1}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t("forms.permitElectrique.step1.dateDebutLabel")}
            type="date"
            {...register("dateDebut")}
            error={errors.dateDebut?.message}
          />
          <Input
            label={t("forms.permitElectrique.step1.dateFinLabel")}
            type="date"
            {...register("dateFin")}
            error={errors.dateFin?.message}
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">{t("forms.permitElectrique.step1.typeTravailTitle")}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Checkbox
              label={t("forms.permitElectrique.step1.travailSousTensionLabel")}
              description={t("forms.permitElectrique.step1.travailSousTensionDesc")}
              {...register("travailSousTension")}
            />
            <Checkbox
              label={t("forms.permitElectrique.step1.travailHorsTensionLabel")}
              description={t("forms.permitElectrique.step1.travailHorsTensionDesc")}
              {...register("travailHorsTension")}
            />
            <Checkbox
              label={t("forms.permitElectrique.step1.consignationEnergieLabel")}
              description={t("forms.permitElectrique.step1.consignationEnergieDesc")}
              {...register("consignationEnergie")}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">{t("forms.permitElectrique.step1.niveauTensionTitle")}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Checkbox
              label={t("forms.permitElectrique.step1.basseTensionLabel")}
              description={t("forms.permitElectrique.step1.basseTensionDesc")}
              {...register("basseTension")}
            />
            <Checkbox
              label={t("forms.permitElectrique.step1.moyenneTensionLabel")}
              description={t("forms.permitElectrique.step1.moyenneTensionDesc")}
              {...register("moyenneTension")}
            />
            <Checkbox
              label={t("forms.permitElectrique.step1.hauteTensionLabel")}
              description={t("forms.permitElectrique.step1.hauteTensionDesc")}
              {...register("hauteTension")}
            />
          </div>
        </div>

        {travailSousTension && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {t("forms.permitElectrique.step1.warningTitle")}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {t("forms.permitElectrique.step1.warningText")}
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    );
  };

  // Étape 2: Description et risques
  const Step2Component = (
    formData: any,
    updateFormData: (data: any) => void,
    registerValidate: RegisterValidate,
  ) => {
    const { t } = useTranslation();
    const step2Schema = useMemo(() => makeStep2Schema(t), [t]);
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<Step2Data>({
      resolver: zodResolver(step2Schema),
      defaultValues: {
        typeCircuitEquipement: formData.typeCircuitEquipement || "",
        descriptionTravail: formData.descriptionTravail || "",
        raisonNonMiseHorsTension: formData.raisonNonMiseHorsTension || "",
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
    wireStepValidation(registerValidate, handleSubmit, onSubmit);

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t("forms.permitElectrique.step2.typeCircuitLabel")}
          {...register("typeCircuitEquipement")}
          error={errors.typeCircuitEquipement?.message}
          placeholder={t("forms.permitElectrique.step2.typeCircuitPlaceholder")}
        />

        <Textarea
          label={t("forms.permitElectrique.step2.descriptionLabel")}
          {...register("descriptionTravail")}
          error={errors.descriptionTravail?.message}
          placeholder={t("forms.permitElectrique.step2.descriptionPlaceholder")}
          rows={3}
        />

        {travailSousTension && (
          <Textarea
            label={t("forms.permitElectrique.step2.raisonLabel")}
            {...register("raisonNonMiseHorsTension")}
            placeholder={t("forms.permitElectrique.step2.raisonPlaceholder")}
            rows={2}
          />
        )}

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">{t("forms.permitElectrique.step2.risquesTitle")}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Checkbox
              label={t("forms.permitElectrique.step2.electrisationLabel")}
              description={t("forms.permitElectrique.step2.electrisationDesc")}
              {...register("electrisation")}
            />
            <Checkbox
              label={t("forms.permitElectrique.step2.electrocutionLabel")}
              description={t("forms.permitElectrique.step2.electrocutionDesc")}
              {...register("electrocution")}
            />
            <Checkbox
              label={t("forms.permitElectrique.step2.brulureLabel")}
              description={t("forms.permitElectrique.step2.brulureDesc")}
              {...register("brulure")}
            />
          </div>
        </div>
      </form>
    );
  };

  // Étape 3: Matériels et mesures de prévention
  const Step3Component = (
    formData: any,
    updateFormData: (data: any) => void,
    registerValidate: RegisterValidate,
  ) => {
    const { t } = useTranslation();
    const step3Schema = useMemo(() => makeStep3Schema(), []);
    const { register, handleSubmit } = useForm<Step3Data>({
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
    wireStepValidation(registerValidate, handleSubmit, onSubmit);

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">
            {t("forms.permitElectrique.step3.materielsTitle")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Checkbox
              label={t("forms.permitElectrique.step3.multimetreLabel")}
              description={t("forms.permitElectrique.step3.multimetreDesc")}
              {...register("multimetreDC")}
            />
            <Checkbox
              label={t("forms.permitElectrique.step3.outilsIsolantsLabel")}
              description={t("forms.permitElectrique.step3.outilsIsolantsDesc")}
              {...register("outilsIsolants")}
            />
            <Checkbox
              label={t("forms.permitElectrique.step3.testTensionLabel")}
              description={t("forms.permitElectrique.step3.testTensionDesc")}
              {...register("testTension")}
            />
            <Checkbox
              label={t("forms.permitElectrique.step3.toolboxLabel")}
              description={t("forms.permitElectrique.step3.toolboxDesc")}
              {...register("toolbox")}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">
            {t("forms.permitElectrique.step3.formationTitle")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Checkbox
              label={t("forms.permitElectrique.step3.personnelHabiliteLabel")}
              description={t("forms.permitElectrique.step3.personnelHabiliteDesc")}
              {...register("personnelHabilite")}
            />
            <Checkbox
              label={t("forms.permitElectrique.step3.personnelApteLabel")}
              description={t("forms.permitElectrique.step3.personnelApteDesc")}
              {...register("personnelApte")}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">
            {t("forms.permitElectrique.step3.epiTitle")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Checkbox
              label={t("forms.permitElectrique.step3.chaussuresLabel")}
              {...register("chaussuresSecurite")}
            />
            <Checkbox label={t("forms.permitElectrique.step3.casqueLabel")} {...register("casque")} />
            <Checkbox
              label={t("forms.permitElectrique.step3.gantsLabel")}
              description={t("forms.permitElectrique.step3.gantsDesc")}
              {...register("gantsElectriques")}
            />
            <Checkbox
              label={t("forms.permitElectrique.step3.tapisLabel")}
              description={t("forms.permitElectrique.step3.tapisDesc")}
              {...register("tapisIsolant")}
            />
            <Checkbox
              label={t("forms.permitElectrique.step3.lunettesLabel")}
              {...register("lunetteSecurite")}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">{t("forms.permitElectrique.step3.proceduresTitle")}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Checkbox label={t("forms.permitElectrique.step3.balisageLabel")} {...register("balisage")} />
            <Checkbox
              label={t("forms.permitElectrique.step3.consignationLabel")}
              description={t("forms.permitElectrique.step3.consignationDesc")}
              {...register("consignationEnergie")}
            />
          </div>
        </div>
      </form>
    );
  };

  // Étape 4: Prévention urgence et engagement
  const Step4Component = (
    formData: any,
    updateFormData: (data: any) => void,
    registerValidate: RegisterValidate,
  ) => {
    const { t } = useTranslation();
    const step4Schema = useMemo(() => makeStep4Schema(t), [t]);
    const { register, handleSubmit } = useForm<Step4Data>({
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
    wireStepValidation(registerValidate, handleSubmit, onSubmit);

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {t("forms.permitElectrique.step4.warningTitle")}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {t("forms.permitElectrique.step4.warningText")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Checkbox
            label={t("forms.permitElectrique.step4.secouristeLabel")}
            description={t("forms.permitElectrique.step4.secouristeDesc")}
            {...register("secouristePresent")}
          />
          <Checkbox
            label={t("forms.permitElectrique.step4.numerosUrgenceLabel")}
            description={t("forms.permitElectrique.step4.numerosUrgenceDesc")}
            {...register("numerosUrgenceDisponibles")}
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">{t("forms.permitElectrique.step4.engagementTitle")}</h4>
          <Checkbox
            label={t("forms.permitElectrique.step4.engagementLabel")}
            description={t("forms.permitElectrique.step4.engagementDesc")}
            {...register("engagementDemandeur")}
          />
        </div>
      </form>
    );
  };

  // Étape 5: Consignation énergétique (optionnelle)
  const Step5Component = (
    formData: any,
    updateFormData: (data: any) => void,
    registerValidate: RegisterValidate,
  ) => {
    const { t } = useTranslation();
    const step5Schema = useMemo(() => makeStep5Schema(), []);
    const { register, handleSubmit } = useForm<Step5Data>({
      resolver: zodResolver(step5Schema),
      defaultValues: {
        motifConsignation: formData.motifConsignation || "",
        equipementConcerne: formData.equipementConcerne || "",
        electrique: formData.electrique || "",
        dateConsignation: formData.dateConsignation || "",
        heureConsignation: formData.heureConsignation || "",
        vatVerification: formData.vatVerification || false,
        visaConsignation: formData.visaConsignation || "",
      },
    });

    const consignationEnergie = formData.consignationEnergie;

    const onSubmit = (data: Step5Data) => {
      updateFormData({ ...formData, ...data });
    };
    wireStepValidation(registerValidate, handleSubmit, onSubmit);

    if (!consignationEnergie) {
      return (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t("forms.permitElectrique.step5.notRequiredTitle")}
                </p>
                <p className="text-xs text-gray-700 mt-1">
                  {t("forms.permitElectrique.step5.notRequiredText")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">
              {t("forms.permitElectrique.step5.recapTitle")}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">{t("forms.permitElectrique.step5.siteLabel")}</p>
                <p className="text-gray-600">{formData.codeSite}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">{t("forms.permitElectrique.step5.intervenantsLabel")}</p>
                <p className="text-gray-600">
                  {formData.nombreIntervenants} {t("forms.permitElectrique.step5.intervenantsSuffix")}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">{t("forms.permitElectrique.step5.typeTravailLabel")}</p>
                <p className="text-gray-600">
                  {formData.travailSousTension
                    ? t("forms.permitElectrique.step5.sousTension")
                    : formData.travailHorsTension
                      ? t("forms.permitElectrique.step5.horsTension")
                      : t("forms.permitElectrique.step5.nonRenseigne")}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-700">{t("forms.permitElectrique.step5.niveauTensionLabel")}</p>
                <p className="text-gray-600">
                  {formData.basseTension
                    ? t("forms.permitElectrique.step1.basseTensionLabel")
                    : formData.moyenneTension
                      ? t("forms.permitElectrique.step1.moyenneTensionLabel")
                      : formData.hauteTension
                        ? t("forms.permitElectrique.step1.hauteTensionLabel")
                        : t("forms.permitElectrique.step5.nonSpecifie")}
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
              <p className="text-sm font-medium text-yellow-900">
                {t("forms.permitElectrique.step5.consignationInfoTitle")}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                {t("forms.permitElectrique.step5.consignationInfoText")}
              </p>
            </div>
          </div>
        </div>

        <Input
          label={t("forms.permitElectrique.step5.motifLabel")}
          {...register("motifConsignation")}
          placeholder={t("forms.permitElectrique.step5.motifPlaceholder")}
        />

        <Input
          label={t("forms.permitElectrique.step5.equipementLabel")}
          {...register("equipementConcerne")}
          placeholder={t("forms.permitElectrique.step5.equipementPlaceholder")}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t("forms.permitElectrique.step5.dateConsignationLabel")}
            type="date"
            {...register("dateConsignation")}
          />
          <Input
            label={t("forms.permitElectrique.step5.heureConsignationLabel")}
            type="time"
            {...register("heureConsignation")}
          />
        </div>

        <Input
          label={t("forms.permitElectrique.step5.electriqueLabel")}
          {...register("electrique")}
          placeholder={t("forms.permitElectrique.step5.electriquePlaceholder")}
        />

        <Checkbox
          label={t("forms.permitElectrique.step5.vatLabel")}
          description={t("forms.permitElectrique.step5.vatDesc")}
          {...register("vatVerification")}
        />

        <Input
          label={t("forms.permitElectrique.step5.visaLabel")}
          {...register("visaConsignation")}
          placeholder={t("forms.permitElectrique.step5.visaPlaceholder")}
        />
      </form>
    );
  };

  const steps = [
    {
      id: "informations",
      title: t("forms.permitElectrique.steps.informations.title"),
      description: t("forms.permitElectrique.steps.informations.description"),
      component: Step1Component,
    },
    {
      id: "description",
      title: t("forms.permitElectrique.steps.description.title"),
      description: t("forms.permitElectrique.steps.description.description"),
      component: Step2Component,
    },
    {
      id: "materiels",
      title: t("forms.permitElectrique.steps.materiels.title"),
      description: t("forms.permitElectrique.steps.materiels.description"),
      component: Step3Component,
    },
    {
      id: "urgence",
      title: t("forms.permitElectrique.steps.urgence.title"),
      description: t("forms.permitElectrique.steps.urgence.description"),
      component: Step4Component,
    },
    {
      id: "consignation",
      title: t("forms.permitElectrique.steps.consignation.title"),
      description: t("forms.permitElectrique.steps.consignation.description"),
      component: Step5Component,
    },
  ];

  const handleComplete = (data: any) => {
    // Récupérer la référence du plan de prévention
    const { getPlanPreventionById } = usePreventionStore.getState();
    const planPrevention = getPlanPreventionById(data.planPreventionId);

    // Préparer les données pour le store
    const permisData = {
      permisGeneralId: "", // Sera lié au permis général
      planPreventionReference: planPrevention?.reference || "",
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
      demandeurNom:
        user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : "",
      demandeurDate: new Date(),
      personnelsExecutants: [],
      controlesJournaliers: [],
      bonConsignation: data.consignationEnergie
        ? {
            motif: data.motifConsignation || "",
            consignations: [
              {
                codeSite: data.codeSite,
                equipementConcerne: data.equipementConcerne || "",
                electrique: data.electrique || "",
                dateConsignation: data.dateConsignation
                  ? new Date(data.dateConsignation)
                  : undefined,
                heureConsignation: data.heureConsignation || "",
                vatVerification: data.vatVerification || false,
                visaConsignation: data.visaConsignation || "",
              },
            ],
          }
        : undefined,
      status: "en_attente_validation_chef" as const,
      dateDebut: data.dateDebut ? new Date(data.dateDebut) : new Date(),
      dateFin: data.dateFin ? new Date(data.dateFin) : new Date(),
      creerPar: user?.email || "",
    };

    onComplete(permisData);
  };

  return (
    <MultiStepForm
      steps={steps}
      onComplete={handleComplete}
      onCancel={onCancel}
      title={t("forms.permitElectrique.title")}
      description={t("forms.permitElectrique.description")}
      submitLabel={t("forms.permitElectrique.submitLabel")}
      formData={formData}
      updateFormData={setFormData}
    />
  );
}
