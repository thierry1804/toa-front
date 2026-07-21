import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Check, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import RisqueMatrice from "@/components/planPrevention/RisqueMatrice";
import InstallationsTable from "@/components/planPrevention/InstallationsTable";
import EquipementsTable from "@/components/planPrevention/EquipementsTable";
import DocumentUploadZone from "@/components/planPrevention/DocumentUploadZone";
import KmzImportButton from "@/components/planPrevention/KmzImportButton";
import SitesKmzMap from "@/components/planPrevention/SitesKmzMap";
import PlanReference from "@/components/planPrevention/PlanReference";
import BandeauRefus from "@/components/planPrevention/BandeauRefus";
import HistoriqueVersions from "@/components/planPrevention/HistoriqueVersions";
import {
  usePlanPrevention,
  usePlanPreventionDetail,
  usePlanificationsDisponibles,
} from "@/features/planPrevention/hooks/usePlanPrevention";
import { usePermissions } from "@/features/menus/hooks/usePermissions";
import { useAuthStore } from "@/store/auth.store";
import type {
  PlanPrevention,
  RisqueRow,
  SitePrevention,
  TypeDocumentPrevention,
  InstallationRow,
  EquipementRow,
} from "@/types/planPrevention";
import type { KmzImportResult } from "@/types/planPrevention";
import { TYPES_DOCUMENT_LABELS } from "@/types/planPrevention";
import type { KmzExtendedData } from "@/utils/kmzParser";

// ─── Zod schema for step 0 ────────────────────────────────────────────────────
const step0Schema = z
  .object({
    codeSite: z.string().min(1, "Code site requis"),
    localite: z.string().min(1, "Localité requise"),
    activitePlanifiee: z
      .string()
      .min(3, "Activité planifiée requise (min 3 caractères)"),
    dateDebut: z.string().min(1, "Date de début requise"),
    dateFin: z.string().min(1, "Date de fin requise"),
  })
  .refine((d) => !d.dateDebut || !d.dateFin || d.dateFin > d.dateDebut, {
    message: "La date de fin doit être postérieure à la date de début",
    path: ["dateFin"],
  });

type Step0FormData = z.infer<typeof step0Schema>;

// ─── Step indicator ────────────────────────────────────────────────────────────
const STEPS = [
  { title: "Informations générales" },
  { title: "Matrice des risques" },
  { title: "Sites concernés" },
  { title: "Documents obligatoires" },
  { title: "Installations & Équipements" },
  { title: "Récapitulatif" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="w-full mb-6">
      <div className="flex items-start w-full">
        {STEPS.map((step, index) => (
          <div key={step.title} className="flex items-start flex-1">
            <div className="flex flex-col items-center flex-1 min-w-0 px-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index < current
                    ? "bg-green-500 text-white"
                    : index === current
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {index < current ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <p
                className={`mt-2 text-xs text-center leading-tight px-1 ${
                  index <= current
                    ? "text-gray-900 font-medium"
                    : "text-gray-400"
                }`}
              >
                {step.title}
              </p>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mt-4 ${index < current ? "bg-green-500" : "bg-gray-200"}`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface PlanPreventionCreatePageProps {
  mode?: "create" | "edit";
  editPlanId?: string;
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function PlanPreventionCreatePage({
  mode = "create",
  editPlanId,
}: PlanPreventionCreatePageProps) {
  const navigate = useNavigate();
  const isEditMode = mode === "edit";

  const { data: editPlan, isLoading: isLoadingEdit } = usePlanPreventionDetail(
    editPlanId ?? "",
  );

  const perms = usePermissions("/prevention");
  // In edit mode the prestataire is correcting their own refused plan —
  // authorization is enforced by the backend RESOUMETTRE voter, not menu permissions.
  // In create mode, can_edit is irrelevant — gate on can_create (PRESTATAIRE has create but not edit).
  const canEdit = isEditMode ? true : (perms?.canCreate ?? true);
  const canSubmit = isEditMode ? true : (perms?.canCreate ?? true);

  const {
    createPlan,
    updatePlan,
    addRisque,
    updateRisque,
    deleteRisque,
    uploadDocument,
    importKmz,
    deleteSite,
    soumettrePlan,
    resoumettreplan,
    missingDocuments,
    isCreating,
    isUpdating,
    isSubmitting,
    isResoumetting,
  } = usePlanPrevention();

  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<PlanPrevention | null>(null);
  const [kmzPreviewSites, setKmzPreviewSites] = useState<SitePrevention[]>([]);
  // Metadata keyed by site name — persists after import for display below map
  const [kmzMetadata, setKmzMetadata] = useState<
    Record<string, KmzExtendedData>
  >({});
  const [kmzError, setKmzError] = useState(false);
  const [localRisques, setLocalRisques] = useState<RisqueRow[]>([]);
  const [isSavingRisques, setIsSavingRisques] = useState(false);
  const [localInstallations, setLocalInstallations] = useState<
    InstallationRow[]
  >([]);
  const [localEquipements, setLocalEquipements] = useState<EquipementRow[]>([]);
  const [installationsErrors, setInstallationsErrors] = useState<
    Record<number, string>
  >({});
  const [equipementsErrors, setEquipementsErrors] = useState<
    Record<number, string>
  >({});
  const [installationsMinError, setInstallationsMinError] = useState(false);
  const [isSavingInstallations, setIsSavingInstallations] = useState(false);
  const [motif, setMotif] = useState("");
  const originalRisqueIds = useRef<Set<string>>(new Set());
  const hasInitialized = useRef(false);

  // ── Step 0 form ──────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Step0FormData>({
    resolver: zodResolver(step0Schema),
  });

  // ── Planification selection (ROLE_PRESTATAIRE, create mode only) ─────────────
  const roles = useAuthStore((s) => s.roles);
  const isPrestataire = !isEditMode && roles.includes("ROLE_PRESTATAIRE");

  const { data: planificationsDisponibles = [], isLoading: isLoadingPlanifs } =
    usePlanificationsDisponibles({ enabled: isPrestataire });

  const [selectedPlanifId, setSelectedPlanifId] = useState<number | null>(null);
  const [autofillSource, setAutofillSource] = useState<string | null>(null);
  const [autofillValues, setAutofillValues] =
    useState<Partial<Step0FormData> | null>(null);

  const watchedCodSite = watch("codeSite");
  const watchedLocalite = watch("localite");
  const watchedActivite = watch("activitePlanifiee");
  const watchedDebut = watch("dateDebut");
  const watchedFin = watch("dateFin");

  const isManuallyModified =
    autofillValues !== null &&
    (watchedCodSite !== autofillValues.codeSite ||
      watchedLocalite !== autofillValues.localite ||
      watchedActivite !== autofillValues.activitePlanifiee ||
      watchedDebut !== autofillValues.dateDebut ||
      watchedFin !== autofillValues.dateFin);

  const handlePlanifSelect = (id: number | null) => {
    setSelectedPlanifId(id);
    if (id === null) {
      setAutofillSource(null);
      setAutofillValues(null);
      return;
    }
    const planif = planificationsDisponibles.find((p) => p.id === id);
    if (!planif) return;
    const fills: Partial<Step0FormData> = {
      codeSite: planif.siteCode,
      localite: planif.siteName,
      activitePlanifiee: planif.process,
      dateDebut: planif.expectedStartDate?.slice(0, 10) ?? "",
      dateFin: planif.expectedEndDate?.slice(0, 10) ?? "",
    };
    reset({ ...fills });
    setAutofillValues(fills);
    setAutofillSource(planif.process);
  };

  // ── Pre-fill form in edit mode once plan loads ───────────────────────────────
  useEffect(() => {
    if (isEditMode && editPlan && !hasInitialized.current) {
      hasInitialized.current = true;
      reset({
        codeSite: editPlan.codeSite,
        localite: editPlan.localite,
        activitePlanifiee: editPlan.activitePlanifiee,
        dateDebut: editPlan.dateDebut?.slice(0, 10) ?? "",
        dateFin: editPlan.dateFin?.slice(0, 10) ?? "",
      });
      setLocalRisques(
        (editPlan.risques ?? []).map((r) => ({
          localId: r.id,
          description: r.description,
          gravite: r.gravite,
          probabilite: r.probabilite,
          mesuresPreventives: r.mesuresPreventives,
        })),
      );
      originalRisqueIds.current = new Set(
        editPlan.risques?.map((r) => r.id) ?? [],
      );
      setLocalInstallations(editPlan.installations ?? []);
      setLocalEquipements(editPlan.equipements ?? []);
      setPlan(editPlan);
    }
  }, [editPlan, isEditMode, reset]);

  // In edit mode, use the fresh query data; in create mode, use local state
  const activePlan = isEditMode ? (editPlan ?? null) : plan;

  // ── Step 0: create or update ──────────────────────────────────────────────────
  const handleStep0Next = handleSubmit(async (data) => {
    if (isEditMode && activePlan) {
      await updatePlan(activePlan.id, data);
      setStep(1);
    } else {
      const selectedPlanif = planificationsDisponibles.find(
        (p) => p.id === selectedPlanifId,
      );
      const chefProjetIri = selectedPlanif?.createdBy?.["@id"] ?? null;
      const created = await createPlan({ ...data, chefProjet: chefProjetIri });
      setPlan(created);
      setStep(1);
    }
  });

  // ── Step 1: save risques then proceed ────────────────────────────────────────
  const handleStep1Next = async () => {
    if (!activePlan) return;
    setIsSavingRisques(true);
    try {
      if (isEditMode) {
        const origIds = originalRisqueIds.current;
        const currentIds = new Set(localRisques.map((r) => r.localId));

        for (const origId of origIds) {
          if (!currentIds.has(origId))
            await deleteRisque(activePlan.id, origId);
        }
        for (const row of localRisques) {
          if (!row.description.trim() || !row.mesuresPreventives.trim())
            continue;
          const payload = {
            description: row.description,
            gravite: row.gravite,
            probabilite: row.probabilite,
            mesuresPreventives: row.mesuresPreventives,
          };
          if (origIds.has(row.localId)) {
            await updateRisque(activePlan.id, row.localId, payload);
          } else {
            await addRisque(activePlan.id, payload);
          }
        }
      } else {
        for (const row of localRisques) {
          if (!row.description.trim() || !row.mesuresPreventives.trim())
            continue;
          await addRisque(activePlan.id, {
            description: row.description,
            gravite: row.gravite,
            probabilite: row.probabilite,
            mesuresPreventives: row.mesuresPreventives,
          });
        }
        // Update local plan state so the recap (step 5) can display the saved risques.
        // In edit mode the query auto-refreshes; in create mode we must patch manually.
        const savedRisques = localRisques
          .filter((r) => r.description.trim() && r.mesuresPreventives.trim())
          .map((r) => ({
            id: r.localId,
            description: r.description,
            gravite: r.gravite,
            probabilite: r.probabilite,
            niveauRisque: r.gravite * r.probabilite,
            mesuresPreventives: r.mesuresPreventives,
          }));
        setPlan((prev) => (prev ? { ...prev, risques: savedRisques } : prev));
      }
      setStep(2);
    } finally {
      setIsSavingRisques(false);
    }
  };

  // ── Step 4: save installations & équipements ──────────────────────────────────
  const handleStep4Next = async () => {
    if (!activePlan) return;

    const instErrors: Record<number, string> = {};
    localInstallations.forEach((row, i) => {
      if (!row.description.trim()) instErrors[i] = "Description requise";
    });
    if (localInstallations.length === 0) {
      setInstallationsMinError(true);
      return;
    }
    setInstallationsMinError(false);
    if (Object.keys(instErrors).length > 0) {
      setInstallationsErrors(instErrors);
      return;
    }
    setInstallationsErrors({});

    const eqErrors: Record<number, string> = {};
    localEquipements.forEach((row, i) => {
      if (!row.description.trim()) eqErrors[i] = "Description requise";
    });
    if (Object.keys(eqErrors).length > 0) {
      setEquipementsErrors(eqErrors);
      return;
    }
    setEquipementsErrors({});

    setIsSavingInstallations(true);
    try {
      await updatePlan(activePlan.id, {
        installations: localInstallations,
        equipements: localEquipements,
      });
      setStep(5);
    } finally {
      setIsSavingInstallations(false);
    }
  };

  // ── Step 5: soumettre or resoumettre ──────────────────────────────────────────
  const hasBeenRefused = (activePlan?.decisionsHse ?? []).some(
    (d) => d.decision === "REFUSE",
  );

  const handleSoumettre = async () => {
    if (!activePlan) return;
    try {
      if (hasBeenRefused) {
        await resoumettreplan(activePlan.id, motif || undefined);
      } else {
        await soumettrePlan(activePlan.id);
      }
      navigate("/prevention");
    } catch (err) {
      if ((err as { message?: string })?.message === "documents_manquants") {
        setStep(3);
      }
    }
  };

  const handleKmzImport = async (file: File): Promise<KmzImportResult> => {
    if (!activePlan) throw new Error("no_plan");
    return importKmz(activePlan.id, file);
  };

  const handleKmzPreview = (
    sites: SitePrevention[],
    metadata: Record<string, KmzExtendedData>,
  ) => {
    setKmzPreviewSites(sites);
    if (Object.keys(metadata).length > 0) setKmzMetadata(metadata);
    if (sites.length > 0) setKmzError(false);
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!activePlan) return;
    await deleteSite(activePlan.id, siteId);
  };

  const handleImportSuccess = (newSites: SitePrevention[]) => {
    // In edit mode, React Query invalidation refreshes activePlan automatically.
    // In create mode, activePlan is local state — we must patch it manually.
    if (!isEditMode) {
      setPlan((prev) =>
        prev ? { ...prev, sites: [...(prev.sites ?? []), ...newSites] } : prev,
      );
    }
  };

  const handleDocumentUpload = async (
    type: TypeDocumentPrevention,
    file: File,
  ) => {
    if (!activePlan) return;
    await uploadDocument(activePlan.id, type, file);
    if (!isEditMode) {
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              documents: [
                ...prev.documents.filter((d) => d.type !== type),
                {
                  id: crypto.randomUUID(),
                  type,
                  filePath: "",
                  mimeType: file.type,
                  uploadedAt: new Date().toISOString(),
                },
              ],
            }
          : prev,
      );
    }
  };

  const currentSites = activePlan?.sites ?? [];
  const currentDocuments = activePlan?.documents ?? [];

  // activePlan?.sites is a stable React Query reference; safe as dependency.
  // currentSites uses ?? [] which creates a new array every render — never use that as dep.
  useEffect(() => {
    if (kmzPreviewSites.length > 0) setKmzPreviewSites([]);
    if (activePlan?.sites && activePlan.sites.length > 0) setKmzError(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlan?.sites]);

  const mapSites = kmzPreviewSites.length > 0 ? kmzPreviewSites : currentSites;

  // ── Derived state for edit mode UI ───────────────────────────────────────────
  const lastRefusDecision = isEditMode
    ? activePlan?.decisionsHse?.filter((d) => d.decision === "REFUSE").at(-1)
    : undefined;
  const versions = isEditMode ? (activePlan?.versions ?? []) : [];

  // ── Render steps ─────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            {/* Planification selector — PRESTATAIRE only */}
            {isPrestataire && (
              <>
                {isLoadingPlanifs ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Chargement des planifications...
                  </div>
                ) : planificationsDisponibles.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-800">
                      Aucune planification disponible
                    </p>
                    <p className="mt-1 text-sm text-amber-700">
                      Vous devez d'abord créer une planification avant de
                      soumettre un plan de prévention.
                    </p>
                    {/*<button
                      type="button"
                      onClick={() => navigate('/planning/new')}
                      className="mt-2 text-sm font-medium text-blue-600 hover:underline"
                    >
                      Créer une planification →
                    </button>*/}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Planification *
                    </label>
                    <select
                      value={selectedPlanifId ?? ""}
                      onChange={(e) =>
                        handlePlanifSelect(
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      disabled={!canEdit}
                    >
                      <option value="">
                        — Sélectionner une planification —
                      </option>
                      {planificationsDisponibles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.process} — {p.siteCode} (
                          {p.expectedStartDate?.slice(0, 10)} →{" "}
                          {p.expectedEndDate?.slice(0, 10)})
                        </option>
                      ))}
                    </select>
                    {!selectedPlanifId && (
                      <p className="mt-1 text-xs text-red-600">
                        Sélectionnez une planification pour continuer
                      </p>
                    )}
                  </div>
                )}

                {/* Autofill badge */}
                {autofillSource && (
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      isManuallyModified
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {isManuallyModified
                      ? "Modifié manuellement"
                      : `Pré-rempli depuis : ${autofillSource}`}
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Code site *"
                {...register("codeSite")}
                error={errors.codeSite?.message}
                placeholder="Ex. : ANT-001"
                disabled={!canEdit}
              />
              <Input
                label="Localité *"
                {...register("localite")}
                error={errors.localite?.message}
                placeholder="Ex. : Antananarivo"
                disabled={!canEdit}
              />
            </div>
            <Input
              label="Activité planifiée *"
              {...register("activitePlanifiee")}
              error={errors.activitePlanifiee?.message}
              placeholder="Ex. : Maintenance préventive équipements télécoms"
              disabled={!canEdit}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date de début *"
                type="date"
                {...register("dateDebut")}
                error={errors.dateDebut?.message}
                disabled={!canEdit}
              />
              <Input
                label="Date de fin *"
                type="date"
                {...register("dateFin")}
                error={errors.dateFin?.message}
                disabled={!canEdit}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            {activePlan && <PlanReference reference={activePlan.reference} />}
            <RisqueMatrice
              rows={localRisques}
              onChange={setLocalRisques}
              disabled={!canEdit}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {activePlan && <PlanReference reference={activePlan.reference} />}
            <KmzImportButton
              planId={activePlan?.id ?? ""}
              sites={currentSites}
              onImport={handleKmzImport}
              onImportSuccess={handleImportSuccess}
              onPreview={handleKmzPreview}
              disabled={!canEdit}
            />
            <SitesKmzMap
              sites={mapSites}
              height="380px"
              readonly={false}
              onDeleteSite={canEdit ? handleDeleteSite : undefined}
            />

            {kmzError && currentSites.length === 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  Completez tous les informations avant de soumettre le plan
                </p>
              </div>
            )}

            {currentSites.length > 0 && (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700">
                    {currentSites.length} site
                    {currentSites.length > 1 ? "s" : ""} importé
                    {currentSites.length > 1 ? "s" : ""}
                  </p>
                </div>
                <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {currentSites.map((site) => {
                    const meta = kmzMetadata[site.nom];
                    return (
                      <li
                        key={site.id}
                        className="flex items-center gap-2 px-4 py-2"
                      >
                        <span className="text-sm font-medium text-gray-900 shrink-0">
                          {site.nom}
                        </span>
                        {meta &&
                          (meta.fokontany || meta.commune || meta.district) && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {meta.fokontany && (
                                <span className="rounded bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                  {meta.fokontany}
                                </span>
                              )}
                              {meta.commune && (
                                <span className="rounded bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                  {meta.commune}
                                </span>
                              )}
                              {meta.district && (
                                <span className="rounded bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                  {meta.district}
                                </span>
                              )}
                            </div>
                          )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {activePlan && <PlanReference reference={activePlan.reference} />}
            {missingDocuments.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Documents manquants :
                  </p>
                  <ul className="mt-1 list-disc list-inside text-sm text-red-700">
                    {missingDocuments.map((t) => (
                      <li key={t}>
                        {TYPES_DOCUMENT_LABELS[t as TypeDocumentPrevention] ??
                          t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <DocumentUploadZone
              planId={activePlan?.id ?? ""}
              uploadedDocuments={currentDocuments}
              onUpload={handleDocumentUpload}
              missingTypes={missingDocuments}
              disabled={!canEdit}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {activePlan && <PlanReference reference={activePlan.reference} />}

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Liste des installations et matériels utilisés{" "}
                <span className="text-red-500 font-normal">
                  (minimum 1 requis)
                </span>
              </h3>
              {installationsMinError && (
                <p className="mb-2 text-xs text-red-600">
                  Ajoutez au moins une installation pour continuer.
                </p>
              )}
              <InstallationsTable
                value={localInstallations}
                onChange={(rows) => {
                  setLocalInstallations(rows);
                  setInstallationsErrors({});
                  if (rows.length > 0) setInstallationsMinError(false);
                }}
                errors={installationsErrors}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Liste des matériels, équipements et outillages{" "}
                <span className="text-gray-400 font-normal">(optionnel)</span>
              </h3>
              <EquipementsTable
                value={localEquipements}
                onChange={(rows) => {
                  setLocalEquipements(rows);
                  setEquipementsErrors({});
                }}
                errors={equipementsErrors}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {activePlan && (
              <PlanReference
                reference={activePlan.reference}
                className="mb-2"
              />
            )}

            {/* General info recap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                { label: "Code site", value: activePlan?.codeSite },
                { label: "Localité", value: activePlan?.localite },
                {
                  label: "Activité planifiée",
                  value: activePlan?.activitePlanifiee,
                },
                {
                  label: "Date de début",
                  value: activePlan?.dateDebut
                    ? new Date(activePlan.dateDebut).toLocaleDateString("fr-FR")
                    : "",
                },
                {
                  label: "Date de fin",
                  value: activePlan?.dateFin
                    ? new Date(activePlan.dateFin).toLocaleDateString("fr-FR")
                    : "",
                },
                { label: "Statut", value: activePlan?.statut },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {value ?? "—"}
                  </p>
                </div>
              ))}
            </div>

            {/* Risques recap */}
            {activePlan?.risques && activePlan.risques.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Risques identifiés ({activePlan.risques.length})
                </h3>
                <RisqueMatrice
                  rows={activePlan.risques.map((r) => ({
                    localId: r.id,
                    description: r.description,
                    gravite: r.gravite,
                    probabilite: r.probabilite,
                    mesuresPreventives: r.mesuresPreventives,
                  }))}
                  onChange={() => {}}
                  disabled
                />
              </div>
            )}

            {/* Sites recap */}
            {currentSites.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Sites ({currentSites.length})
                </h3>
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {currentSites.map((site) => (
                    <li
                      key={site.id}
                      className="px-4 py-2 text-sm flex justify-between"
                    >
                      <span className="font-medium">{site.nom}</span>
                      <span className="text-gray-500 font-mono text-xs">
                        {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Installations recap */}
            {localInstallations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Installations ({localInstallations.length})
                </h3>
                <InstallationsTable
                  value={localInstallations}
                  onChange={() => {}}
                  readonly
                />
              </div>
            )}

            {/* Équipements recap */}
            {localEquipements.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Équipements ({localEquipements.length})
                </h3>
                <EquipementsTable
                  value={localEquipements}
                  onChange={() => {}}
                  readonly
                />
              </div>
            )}

            {/* Documents recap */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Documents obligatoires
              </h3>
              <DocumentUploadZone
                planId={activePlan?.id ?? ""}
                uploadedDocuments={currentDocuments}
                onUpload={handleDocumentUpload}
                missingTypes={missingDocuments}
                disabled
              />
            </div>

            {/* Motif de correction (edit mode only) */}
            {isEditMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif de correction{" "}
                  <span className="text-gray-400 font-normal">(optionnel)</span>
                </label>
                <textarea
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Décrivez les corrections apportées suite au refus HSE..."
                />
              </div>
            )}

            {missingDocuments.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  Completez tous les informations avant de soumettre le plan
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const isLastStep = step === STEPS.length - 1;

  const handleNext = async () => {
    if (step === 0) {
      if (isPrestataire && !selectedPlanifId) return;
      await handleStep0Next();
    } else if (step === 1) {
      await handleStep1Next();
    } else if (step === 2) {
      if (currentSites.length === 0) {
        setKmzError(true);
        return;
      }
      setStep((s) => s + 1);
    } else if (step === 4) {
      await handleStep4Next();
    } else if (!isLastStep) {
      setStep((s) => s + 1);
    }
  };

  const isPending = isEditMode
    ? isUpdating || isSavingRisques || isSavingInstallations || isResoumetting
    : isCreating || isSavingRisques || isSavingInstallations || isSubmitting;

  const isStep4Invalid =
    step === 4 &&
    (localInstallations.length === 0 ||
      localInstallations.some((r) => !r.description.trim()) ||
      localEquipements.some((r) => !r.description.trim()));

  // ── Loading state for edit mode ───────────────────────────────────────────────
  if (isEditMode && isLoadingEdit) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <svg
          className="mr-2 h-5 w-5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Chargement du plan...
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode
            ? "Modifier le plan de prévention"
            : "Nouveau plan de prévention"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEditMode
            ? "Corrigez les informations demandées puis resoumettez votre plan"
            : "Renseignez les informations en suivant les étapes"}
        </p>
      </div>

      {/* Bandeau refus (edit mode, when there is a refuse decision) */}
      {isEditMode && lastRefusDecision && (
        <BandeauRefus decision={lastRefusDecision} />
      )}

      <StepIndicator current={step} />

      {/* Step card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{STEPS[step].title}</CardTitle>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Historique versions (edit mode only) */}
      {isEditMode && versions.length > 0 && (
        <HistoriqueVersions versions={versions} />
      )}

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0 || isPending}
          size="lg"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>

        {isLastStep ? (
          canSubmit && (
            <Button
              onClick={handleSoumettre}
              disabled={isPending}
              loading={hasBeenRefused ? isResoumetting : isSubmitting}
              size="lg"
            >
              {hasBeenRefused ? "Resoumettre le plan" : "Soumettre le plan"}
            </Button>
          )
        ) : (
          <Button
            onClick={handleNext}
            disabled={
              isPending ||
              (isPrestataire && step === 0 && !selectedPlanifId) ||
              (isPrestataire &&
                step === 0 &&
                planificationsDisponibles.length === 0) ||
              isStep4Invalid
            }
            loading={isPending}
            size="lg"
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
