import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useRole, useCreateRole, useUpdateRole } from "@/features/roles/hooks/useRoles";
import { useUiStore } from "@/store/ui.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ArrowLeft, Save, ShieldCheck, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { parseApiFieldErrors } from "@/lib/apiErrors";
import Badge from "@/components/ui/Badge";

const PROPERTY_TO_FIELD: Record<string, string> = {
  name: "name",
  label: "label",
  description: "description",
  role_name_required: "name",
  role_label_required: "label",
  role_name_invalid_format: "name",
  role_name_already_exists: "name",
};

export default function RoleFormPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const addToast = useUiStore((s) => s.addToast);

  const { data: existingRole } = useRole(id ? Number(id) : 0);
  const { mutate: createRole, isPending: isCreating } = useCreateRole();
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRole();

  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: "",
    label: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingRole) {
      setFormData({
        name: existingRole.name,
        label: existingRole.label,
        description: existingRole.description ?? "",
      });
    }
  }, [existingRole]);

  const handleApiError = (error: unknown) => {
    const rawErrors = parseApiFieldErrors(error, PROPERTY_TO_FIELD);
    if (Object.keys(rawErrors).length === 0) {
      addToast({ message: t("roles.toast.saveError"), type: "error" });
      return;
    }
    const translated: Record<string, string> = {};
    for (const [field, key] of Object.entries(rawErrors)) {
      translated[field] = t(`errors.${key}`, key);
    }
    setErrors((prev) => ({ ...prev, ...translated }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.label.trim()) {
      newErrors.label = t("roles.validation.labelRequired");
    }
    if (!isEditMode && !formData.name.trim()) {
      newErrors.name = t("roles.validation.nameRequired");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditMode && existingRole) {
      const data: Record<string, string | null | undefined> = {
        label: formData.label.trim(),
        description: formData.description.trim() || null,
      };
      if (!existingRole.isSystem) {
        data.name = formData.name.trim();
      }

      updateRole(
        { id: existingRole.id, data },
        {
          onSuccess: () =>
            addToast({ message: t("roles.toast.updated"), type: "success" }),
          onError: handleApiError,
        },
      );
    } else {
      createRole(
        {
          name: formData.name.trim(),
          label: formData.label.trim(),
          description: formData.description.trim() || null,
        },
        {
          onSuccess: () =>
            addToast({ message: t("roles.toast.created"), type: "success" }),
          onError: handleApiError,
        },
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/roles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isEditMode ? t("roles.form.editTitle") : t("roles.form.createTitle")}
            </h2>
            <p className="mt-1 text-gray-600">
              {isEditMode ? t("roles.form.editDesc") : t("roles.form.createDesc")}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              {t("roles.form.roleInfo")}
              {isEditMode && existingRole?.isSystem && (
                <Badge variant="info" className="ml-2">
                  <Lock className="h-3 w-3 mr-1" />
                  {t("roles.badge.system")}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Label — always editable */}
            <Input
              label={t("roles.form.label")}
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              error={errors.label}
              placeholder={t("roles.form.labelPlaceholder")}
              required
            />

            {/* Technical name — readonly for system roles */}
            {isEditMode && existingRole?.isSystem ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("roles.form.name")}
                </label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <code className="text-sm font-mono text-gray-700">
                    {formData.name}
                  </code>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t("roles.form.nameSystemNote")}
                </p>
              </div>
            ) : (
              <Input
                label={t("roles.form.name")}
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                  })
                }
                error={errors.name}
                placeholder={t("roles.form.namePlaceholder")}
                required={!isEditMode}
              />
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("roles.form.description")}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder={t("roles.form.descriptionPlaceholder")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {!isEditMode && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">{t("roles.form.nameInfo")}</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {t("roles.form.nameInfoDesc")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between gap-4 pt-4 border-t">
          <Link to="/roles">
            <Button type="button" variant="outline">
              {t("common.cancel")}
            </Button>
          </Link>
          <Button type="submit" isLoading={isCreating || isUpdating}>
            {isEditMode ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t("common.saveChanges")}
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                {t("roles.form.create")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
