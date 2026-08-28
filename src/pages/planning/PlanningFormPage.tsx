import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { usePermissions } from "@/features/menus/hooks/usePermissions";
import { useTranslation } from "react-i18next";
import {
  useActivityPlanning,
  useCreateActivityPlanning,
  useUpdateActivityPlanning,
  usePrestataires,
} from "@/features/planning/hooks/useActivityPlanning";
import { useUiStore } from "@/store/ui.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { ActivityPlanning, SectionRow } from "@/types";
import { formatUserDisplayName } from "@/utils/format";
import {
  ArrowLeft,
  Save,
  CalendarPlus,
  MapPin,
  Building2,
  Clock,
  ListChecks,
} from "lucide-react";
import { STATUS_VALUES } from "@/data/constant/planning";
import PlanningSectionManager from "@/features/planning/components/PlanningSectionManager";
import SiteSelectorBlock from "@/components/planning/SiteSelectorBlock";
import type { PlanSiteRow } from "@/components/planning/SiteSelectorBlock";

function toLocalDatetimeInput(isoString: string): string {
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function PlanningFormPage() {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language?.startsWith('mg') ? 'mg' : 'fr') as 'fr' | 'mg';
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const perms = usePermissions('/planning');
  const canCreatePlanning = perms?.canCreate ?? false;
  const canEditPlanning = perms?.canEdit ?? false;
  const permsLoaded = perms !== null;
  const addToast = useUiStore((s) => s.addToast);
  const { data: existing } = useActivityPlanning(id ? Number(id) : 0);
  const { mutate: createPlanning, isPending: isCreating } =
    useCreateActivityPlanning();
  const statusOptions = useMemo(
    () => STATUS_VALUES.map((v) => ({ value: v, label: t(`planning.status.${v}`) })),
    [t],
  );
  const { mutate: updatePlanning, isPending: isUpdating } =
    useUpdateActivityPlanning();
  const { data: prestataires = [] } = usePrestataires();

  const isEditMode = !!id;

  const lockedFields = (() => {
    if (!existing) return [] as string[];
    const fields: string[] = [];
    const isLocked =
      existing.status === "en_cours" || existing.status === "valide";
    if (isLocked)
      fields.push(
        "process",
        "siteCode",
        "siteName",
        "expectedStartDate",
        "expectedEndDate",
        "typeIntervention",
        "sites",
      );
    if (existing.permitValidated) fields.push("provider");
    return fields;
  })();

  const sitesLocked = lockedFields.includes("sites");

  const [formData, setFormData] = useState({
    process: "",
    provider: "",
    providerEmail: "",
    siteCode: "",
    siteName: "",
    typeIntervention: "",
    expectedStartDate: "",
    expectedEndDate: "",
    status: "planifie",
  });

  const [planSites, setPlanSites] = useState<PlanSiteRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const prestataireOptions = prestataires.map((p) => ({
    value: `${p.firstname} ${p.name}`,
    label: formatUserDisplayName(p),
  }));

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    set("provider", selected);
    const matched = prestataires.find(
      (p) => `${p.firstname} ${p.name}` === selected,
    );
    set("providerEmail", matched?.email ?? "");
  };

  useEffect(() => {
    if (existing) {
      setFormData({
        process: existing.process,
        provider: existing.provider,
        providerEmail: existing.providerEmail ?? "",
        siteCode: existing.siteCode,
        siteName: existing.siteName,
        typeIntervention: existing.typeIntervention ?? "",
        expectedStartDate: toLocalDatetimeInput(existing.expectedStartDate),
        expectedEndDate: toLocalDatetimeInput(existing.expectedEndDate),
        status: existing.status,
      });
      if (existing.sites && existing.sites.length > 0) {
        setPlanSites(existing.sites.map((s) => ({ ...s, found: null })))
      }
      setSections(
        (existing.sections ?? []).map((s) => ({
          localId: s.id,
          libelle: s.libelle,
          libelleMg: '',
          taches: s.taches.map((tk) => ({
            localId: tk.id,
            tache: tk.tache,
            materiel: tk.materiel ?? '',
            qui: tk.qui ?? '',
          })),
        }))
      );
    }
  }, [existing]);

  useEffect(() => {
    if (permsLoaded && !(isEditMode ? canEditPlanning : canCreatePlanning)) {
      navigate("/planning");
      addToast({ message: t('planning.toast.permissionDenied'), type: "error" });
    }
  }, [isEditMode, permsLoaded, canEditPlanning, canCreatePlanning, navigate, addToast]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.process.trim())
      newErrors.process = t('planning.validation.processRequired');
    if (!formData.provider.trim())
      newErrors.provider = t('planning.validation.providerRequired');

    if (!formData.typeIntervention)
      newErrors.typeIntervention = "Type d'intervention requis";

    if (formData.typeIntervention === 'Nouveau site') {
      if (!formData.siteCode.trim())
        newErrors.siteCode = t('planning.validation.siteCodeRequired');
      if (!formData.siteName.trim())
        newErrors.siteName = t('planning.validation.siteNameRequired');
    } else if (formData.typeIntervention) {
      if (planSites.length === 0)
        newErrors.planSites = "Au moins un site est requis";
    }

    if (!formData.expectedStartDate)
      newErrors.expectedStartDate = t('planning.validation.expectedStartDateRequired');
    if (!formData.expectedEndDate)
      newErrors.expectedEndDate = t('planning.validation.expectedEndDateRequired');

    if (formData.expectedStartDate && formData.expectedEndDate) {
      if (new Date(formData.expectedEndDate) < new Date(formData.expectedStartDate)) {
        newErrors.expectedEndDate = t('planning.validation.endBeforeStart');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast({
        message: t('planning.validation.formErrors'),
        type: "error",
      });
      return;
    }

    const isNewSite = formData.typeIntervention === 'Nouveau site';

    // Compute siteCode/siteName for backward compat
    const primaryCode = isNewSite
      ? formData.siteCode.trim()
      : (planSites[0]?.codeSite ?? '')
    const primaryName = isNewSite
      ? formData.siteName.trim()
      : (planSites[0]?.nomSite ?? '')

    const sectionsPayload = sections.map((s, si) => ({
      libelle: s.libelle,
      ordre: si,
      taches: s.taches.map((tk, ti) => ({
        ordre: ti,
        tache: tk.tache,
        materiel: tk.materiel || undefined,
        qui: tk.qui || undefined,
      })),
    }));

    const payload = {
      process: formData.process.trim(),
      provider: formData.provider.trim(),
      providerEmail: formData.providerEmail.trim() || undefined,
      siteCode: primaryCode,
      siteName: primaryName,
      typeIntervention: formData.typeIntervention || undefined,
      sites: isNewSite ? undefined : planSites.map(({ codeSite, nomSite }) => ({ codeSite, nomSite })),
      expectedStartDate: new Date(formData.expectedStartDate).toISOString(),
      expectedEndDate: new Date(formData.expectedEndDate).toISOString(),
      status: formData.status as ActivityPlanning["status"],
      sections: sectionsPayload,
    };

    if (isEditMode && existing) {
      for (const field of lockedFields) {
        (payload as any)[field] = (existing as any)[field];
      }

      updatePlanning(
        { id: existing.id, data: payload },
        {
          onSuccess: () =>
            addToast({
              message: t('planning.toast.updated'),
              type: "success",
            }),
          onError: () =>
            addToast({
              message: t('planning.toast.updateError'),
              type: "error",
            }),
        },
      );
    } else {
      createPlanning(payload, {
        onSuccess: () =>
          addToast({
            message: t('planning.toast.created'),
            type: "success",
          }),
        onError: (error: unknown) => {
          const response = (error as { response?: { status?: number; data?: { error_key?: string; detail?: string } } }).response;
          if (response?.status === 409) {
            const key = response.data?.error_key ?? response.data?.detail;
            const message = key
              ? t(`errors.${key}`, t('planning.toast.createConflict'))
              : t('planning.toast.createConflict');
            addToast({ message, type: "error" });
            return;
          }
          addToast({ message: t('planning.toast.createError'), type: "error" });
        },
      });
    }
  };

  const set = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/planning">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isEditMode
                ? t('planning.form.editTitle')
                : t('planning.form.createTitle')}
            </h2>
            <p className="mt-1 text-gray-600">
              {isEditMode
                ? t('planning.form.editDesc')
                : t('planning.form.createDesc')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Building2 className="h-5 w-5 text-blue-600" />
              {t('planning.form.generalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t('planning.form.process')}
              value={formData.process}
              onChange={(e) => set("process", e.target.value)}
              error={errors.process}
              placeholder={t('planning.form.processPlaceholder')}
              required
              disabled={lockedFields.includes("process")}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label={t('planning.form.provider')}
                options={prestataireOptions}
                value={formData.provider}
                onChange={handleProviderChange}
                error={errors.provider}
                placeholder={t('planning.form.providerPlaceholder')}
                required
                disabled={lockedFields.includes("provider")}
              />
              <Input
                label={t('planning.form.providerEmail')}
                type="email"
                value={formData.providerEmail}
                onChange={(e) => set("providerEmail", e.target.value)}
                placeholder={t('planning.form.providerEmailPlaceholder')}
                disabled={lockedFields.includes("provider")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <MapPin className="h-5 w-5 text-blue-600" />
              Type d'intervention &amp; Sites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SiteSelectorBlock
              typeIntervention={formData.typeIntervention}
              onTypeChange={(t) => set("typeIntervention", t)}
              siteCode={formData.siteCode}
              siteName={formData.siteName}
              onSiteCodeChange={(c) => set("siteCode", c)}
              onSiteNameChange={(n) => set("siteName", n)}
              planSites={planSites}
              onPlanSitesChange={setPlanSites}
              errors={errors}
              disabled={sitesLocked}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Clock className="h-5 w-5 text-blue-600" />
              {t('planning.form.dates')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                {t('planning.form.dateInfo')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('planning.form.expectedStartDate')}
                type="datetime-local"
                value={formData.expectedStartDate}
                onChange={(e) => set("expectedStartDate", e.target.value)}
                error={errors.expectedStartDate}
                required
                disabled={lockedFields.includes("expectedStartDate")}
              />
              <Input
                label={t('planning.form.expectedEndDate')}
                type="datetime-local"
                value={formData.expectedEndDate}
                onChange={(e) => set("expectedEndDate", e.target.value)}
                error={errors.expectedEndDate}
                required
                disabled={lockedFields.includes("expectedEndDate")}
              />
            </div>
            {isEditMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <Input
                  label={t('planning.form.actualStartDate')}
                  type={existing?.actualStartDate ? "datetime-local" : "text"}
                  value={existing?.actualStartDate ? toLocalDatetimeInput(existing.actualStartDate) : "—"}
                  disabled
                />
                <Input
                  label={t('planning.form.actualEndDate')}
                  type={existing?.actualEndDate ? "datetime-local" : "text"}
                  value={existing?.actualEndDate ? toLocalDatetimeInput(existing.actualEndDate) : "—"}
                  disabled
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <ListChecks className="h-5 w-5 text-blue-600" />
              {t('planning.sections.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlanningSectionManager
              value={sections}
              onChange={setSections}
              lang={currentLang}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <CalendarPlus className="h-5 w-5 text-blue-600" />
              {t('planning.form.status')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              label={t('planning.form.status')}
              options={statusOptions}
              value={formData.status}
              onChange={(e) => set("status", e.target.value)}
            />
            {formData.status === "brouillon" && (
              <p className="mt-2 text-xs text-gray-500">
                {t('planning.form.draftNote')}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4 pt-4 border-t">
          <Link to="/planning">
            <Button type="button" variant="outline">
              {t('common.cancel')}
            </Button>
          </Link>
          <Button type="submit" isLoading={isCreating || isUpdating}>
            {isEditMode ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('common.saveChanges')}
              </>
            ) : (
              <>
                <CalendarPlus className="h-4 w-4 mr-2" />
                {t('planning.form.create')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
