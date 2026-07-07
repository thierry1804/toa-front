import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { usePermission, useHasPermissions } from "@/features/auth/usePermission";
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
import Textarea from "@/components/ui/Textarea";
import type { ActivityPlanning } from "@/types";
import { formatUserDisplayName } from "@/utils/format";
import {
  ArrowLeft,
  Save,
  CalendarPlus,
  MapPin,
  Building2,
  Clock,
} from "lucide-react";
import { statusOptions } from "@/data/constant/planning";

function toLocalDatetimeInput(isoString: string): string {
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function PlanningFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEditPlanning = usePermission('edit_planning');
  const canCreatePlanning = usePermission('create_planning');
  const hasPermissions = useHasPermissions();
  const addToast = useUiStore((s) => s.addToast);
  const { data: existing } = useActivityPlanning(id ? Number(id) : 0);
  const { mutate: createPlanning, isPending: isCreating } =
    useCreateActivityPlanning();
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
        "siteNumber",
        "siteName",
        "region",
        "expectedStartDate",
        "expectedEndDate",
      );
    if (existing.permitValidated) fields.push("provider", "projectDescription");
    return fields;
  })();

  const [formData, setFormData] = useState({
    process: "",
    provider: "",
    providerEmail: "",
    projectDescription: "",
    siteCode: "",
    siteNumber: "",
    siteName: "",
    region: "",
    expectedStartDate: "",
    expectedEndDate: "",
    status: "brouillon",
  });

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
        projectDescription: existing.projectDescription,
        siteCode: existing.siteCode,
        siteNumber: existing.siteNumber,
        siteName: existing.siteName,
        region: existing.region,
        expectedStartDate: toLocalDatetimeInput(existing.expectedStartDate),
        expectedEndDate: toLocalDatetimeInput(existing.expectedEndDate),
        status: existing.status,
      });
    }
  }, [existing]);

  useEffect(() => {
    if (hasPermissions && !(isEditMode ? canEditPlanning : canCreatePlanning)) {
      navigate("/planning");
      addToast({ message: t('planning.toast.permissionDenied'), type: "error" });
    }
  }, [isEditMode, navigate, addToast, canEditPlanning, canCreatePlanning, hasPermissions]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.process.trim())
      newErrors.process = t('planning.validation.processRequired');
    if (!formData.provider.trim())
      newErrors.provider = t('planning.validation.providerRequired');
    if (!formData.projectDescription.trim())
      newErrors.projectDescription = t('planning.validation.descriptionRequired');
    if (!formData.siteCode.trim())
      newErrors.siteCode = t('planning.validation.siteCodeRequired');
    if (!formData.siteNumber.trim())
      newErrors.siteNumber = t('planning.validation.siteNumberRequired');
    if (!formData.siteName.trim())
      newErrors.siteName = t('planning.validation.siteNameRequired');
    if (!formData.region.trim()) newErrors.region = t('planning.validation.regionRequired');
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

    const payload = {
      process: formData.process.trim(),
      provider: formData.provider.trim(),
      providerEmail: formData.providerEmail.trim() || undefined,
      projectDescription: formData.projectDescription.trim(),
      siteCode: formData.siteCode.trim(),
      siteNumber: formData.siteNumber.trim(),
      siteName: formData.siteName.trim(),
      region: formData.region.trim(),
      expectedStartDate: new Date(formData.expectedStartDate).toISOString(),
      expectedEndDate: new Date(formData.expectedEndDate).toISOString(),
      status: formData.status as ActivityPlanning["status"],
    };

    if (isEditMode && existing) {
      // Override locked fields with original values so they're never sent modified
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
        onError: () =>
          addToast({ message: t('planning.toast.createError'), type: "error" }),
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
            <Textarea
              className="text-gray-900"
              label={t('planning.form.projectDescription')}
              value={formData.projectDescription}
              onChange={(e) => set("projectDescription", e.target.value)}
              error={errors.projectDescription}
              placeholder={t('planning.form.projectDescriptionPlaceholder')}
              required
              disabled={lockedFields.includes("projectDescription")}
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
              {t('planning.form.site')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label={t('planning.form.siteCode')}
                value={formData.siteCode}
                onChange={(e) => set("siteCode", e.target.value)}
                error={errors.siteCode}
                placeholder={t('planning.form.siteCodePlaceholder')}
                required
                disabled={lockedFields.includes("siteCode")}
              />
              <Input
                label={t('planning.form.siteNumber')}
                value={formData.siteNumber}
                onChange={(e) => set("siteNumber", e.target.value)}
                error={errors.siteNumber}
                placeholder={t('planning.form.siteNumberPlaceholder')}
                required
                disabled={lockedFields.includes("siteNumber")}
              />
              <Input
                label={t('planning.form.siteName')}
                value={formData.siteName}
                onChange={(e) => set("siteName", e.target.value)}
                error={errors.siteName}
                placeholder={t('planning.form.siteNamePlaceholder')}
                required
                disabled={lockedFields.includes("siteName")}
              />
            </div>
            <Input
              label={t('planning.form.region')}
              value={formData.region}
              onChange={(e) => set("region", e.target.value)}
              error={errors.region}
              placeholder={t('planning.form.regionPlaceholder')}
              required
              disabled={lockedFields.includes("region")}
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
              {" "}
              {t('common.cancel')}{" "}
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
