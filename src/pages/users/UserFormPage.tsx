import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  usePermission,
  useHasPermissions,
} from "@/features/auth/usePermission";
import {
  useUser,
  useCreateUser,
  useUpdateUser,
  useUploadSignature,
} from "@/features/users/hooks/useUsers";
import { usersApi } from "@/api/usersApi";
import { useUiStore } from "@/store/ui.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import {
  ArrowLeft,
  Save,
  UserPlus,
  Shield,
  Building2,
  Eye,
  EyeOff,
  Upload,
  PenLine,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { parseApiFieldErrors } from "@/lib/apiErrors";
import { useRoles } from "@/features/roles/hooks/useRoles";
import { useEntreprises } from "@/features/referentiel/hooks/useEntreprises";
import { usePrestataireEntrepriseScope } from "@/features/users/hooks/usePrestataireEntrepriseScope";

// Maps API propertyPath / error_key values → form field names
const PROPERTY_TO_FIELD: Record<string, string> = {
  email: "email",
  name: "name",
  firstname: "firstname",
  plainPassword: "plainPassword",
  entrepriseName: "entrepriseName",
  numeroRegistreCommerce: "numeroRegistreCommerce",
  siegeSocial: "siegeSocial",
  qualiteRepresentant: "qualiteRepresentant",
  email_already_used: "email",
  email_invalid: "email",
  email_required: "email",
  name_required: "name",
  password_required: "plainPassword",
  entreprise_name_not_allowed_for_role: "entrepriseName",
};

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canEditUsers = usePermission("edit_users");
  const canCreateUsers = usePermission("create_users");
  const hasPermissions = useHasPermissions();
  const { t } = useTranslation();
  const addToast = useUiStore((s) => s.addToast);
  const { data: existingUser } = useUser(id ? Number(id) : 0);
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: uploadSignature, isPending: isUploadingSignature } = useUploadSignature();
  const { data: rolesData, isLoading: rolesLoading } = useRoles(1, 200);
  const allRoles = rolesData?.member ?? [];
  const {
    isScoped: isPrestataireScoped,
    profile: prestataireProfile,
    isProfileLoading: isPrestataireProfileLoading,
    canManageUser,
    hasEntreprise,
    entrepriseIri: scopedEntrepriseIri,
    entrepriseName: scopedEntrepriseName,
  } = usePrestataireEntrepriseScope();
  // GET /api/roles exige ROLE_SUPER_ADMIN : un prestataire scoped reçoit un
  // 403, allRoles reste vide. Son rôle est de toute façon toujours forcé à
  // ROLE_PRESTATAIRE, donc on n'a pas besoin de la liste complète ici.
  const dynamicRoleOptions = isPrestataireScoped
    ? [{ value: "ROLE_PRESTATAIRE", label: t("roles.prestataire") }]
    : allRoles.map((r) => ({ value: r.name, label: r.label }));

  const isEditMode = !!id;

  const nameRef = useRef<HTMLInputElement>(null);
  const firstnameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const plainPasswordRef = useRef<HTMLInputElement>(null);

  const fieldRefs: Record<string, React.RefObject<HTMLInputElement | null>> = {
    name: nameRef,
    firstname: firstnameRef,
    email: emailRef,
    plainPassword: plainPasswordRef,
  };

  const handleApiError = (error: unknown) => {
    const rawErrors = parseApiFieldErrors(error, PROPERTY_TO_FIELD);
    if (Object.keys(rawErrors).length === 0) {
      addToast({ message: t("users.toast.createError"), type: "error" });
      return;
    }
    const translated: Record<string, string> = {};
    for (const [field, key] of Object.entries(rawErrors)) {
      // Use string-fallback form (t(key, fallback)) which works in i18next v26
      translated[field] = t(`errors.${key}`, key);
    }
    setErrors((prev) => ({ ...prev, ...translated }));
    const firstField = Object.keys(rawErrors)[0];
    const el = fieldRefs[firstField]?.current;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    }
  };

  const [formData, setFormData] = useState({
    firstname: "",
    name: "",
    email: "",
    role: "ROLE_PRESTATAIRE",
    entrepriseName: "",
    entrepriseId: "",
    numeroRegistreCommerce: "",
    siegeSocial: "",
    qualiteRepresentant: "",
    actif: true,
    plainPassword: "",
    confirmPassword: "",
  });

  const { data: entreprises = [] } = useEntreprises();
  const selectableEntreprises = isPrestataireScoped && scopedEntrepriseIri
    ? entreprises.filter((ent) => ent["@id"] === scopedEntrepriseIri)
    : entreprises;
  const canHaveEntreprise = (role: string) =>
    role === "ROLE_PRESTATAIRE" || role === "ROLE_HSE";

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [existingSignatureUrl, setExistingSignatureUrl] = useState<string | null>(null);

  // The download endpoint requires the Authorization header, which a plain
  // <img src="..."> can't send — fetch it as an authenticated blob instead.
  useEffect(() => {
    if (!existingUser?.id || !existingUser.signaturePath) {
      setExistingSignatureUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    usersApi.getSignatureBlob(existingUser.id).then((blob) => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setExistingSignatureUrl(objectUrl);
    }).catch(() => {
      if (!cancelled) setExistingSignatureUrl(null);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [existingUser?.id, existingUser?.signaturePath]);

  useEffect(() => {
    if (existingUser) {
      setFormData({
        firstname: existingUser.firstname,
        name: existingUser.name,
        email: existingUser.email,
        role:
          existingUser.roles.find((r) => r.startsWith("ROLE_")) ??
          "ROLE_PRESTATAIRE",
        entrepriseName: existingUser.entrepriseName ?? "",
        entrepriseId: existingUser.entreprise?.['@id'] ?? "",
        numeroRegistreCommerce: existingUser.numeroRegistreCommerce ?? "",
        siegeSocial: existingUser.siegeSocial ?? "",
        qualiteRepresentant: existingUser.qualiteRepresentant ?? "",
        actif: existingUser.isActive,
        plainPassword: "",
        confirmPassword: "",
      });
    }
  }, [existingUser]);

  useEffect(() => {
    if (hasPermissions && !(isEditMode ? canEditUsers : canCreateUsers)) {
      navigate("/users");
      addToast({ message: t("users.toast.permissionDenied"), type: "error" });
    }
  }, [
    isEditMode,
    navigate,
    addToast,
    canEditUsers,
    canCreateUsers,
    hasPermissions,
    t,
  ]);

  useEffect(() => {
    if (!isPrestataireScoped || isPrestataireProfileLoading) return;

    if (isEditMode && existingUser && !canManageUser(existingUser)) {
      navigate("/users");
      addToast({ message: t("users.toast.permissionDenied"), type: "error" });
    }
  }, [
    isPrestataireScoped,
    isPrestataireProfileLoading,
    isEditMode,
    existingUser,
    canManageUser,
    navigate,
    addToast,
    t,
  ]);

  useEffect(() => {
    if (!isPrestataireScoped || isPrestataireProfileLoading || isEditMode) return;

    if (!hasEntreprise) {
      navigate("/mon-entreprise");
      addToast({
        message: t("users.entreprise.requiredBeforeUsers"),
        type: "warning",
      });
    }
  }, [
    isPrestataireScoped,
    isPrestataireProfileLoading,
    isEditMode,
    hasEntreprise,
    navigate,
    addToast,
    t,
  ]);

  useEffect(() => {
    if (!isPrestataireScoped || isEditMode || !prestataireProfile) return;

    setFormData((prev) => ({
      ...prev,
      role: "ROLE_PRESTATAIRE",
      entrepriseId: prestataireProfile.entreprise?.["@id"] ?? prev.entrepriseId,
      entrepriseName:
        prestataireProfile.entrepriseName ??
        prestataireProfile.entreprise?.nom ??
        prev.entrepriseName,
      numeroRegistreCommerce:
        prestataireProfile.numeroRegistreCommerce ?? prev.numeroRegistreCommerce,
      siegeSocial: prestataireProfile.siegeSocial ?? prev.siegeSocial,
      qualiteRepresentant:
        prestataireProfile.qualiteRepresentant ?? prev.qualiteRepresentant,
    }));
  }, [isPrestataireScoped, isEditMode, prestataireProfile]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.role || formData.role === "all")
      newErrors.role = t("users.validation.roleRequired");
    if (!formData.name.trim())
      newErrors.name = t("users.validation.nameRequired");
    if (!formData.firstname.trim())
      newErrors.firstname = t("users.validation.firstnameRequired");

    if (!formData.email.trim()) {
      newErrors.email = t("users.validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("users.validation.emailInvalid");
    }

    if (!isEditMode) {
      if (!formData.plainPassword) {
        newErrors.plainPassword = t("users.validation.passwordRequired");
      } else if (formData.plainPassword.length < 6) {
        newErrors.plainPassword = t("users.validation.passwordMin");
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = t("users.validation.confirmRequired");
      } else if (formData.plainPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = t("users.validation.confirmMismatch");
      }
    } else if (formData.plainPassword) {
      if (formData.plainPassword.length < 6) {
        newErrors.plainPassword = t("users.validation.passwordMin");
      }
      if (formData.plainPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = t("users.validation.confirmMismatch");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast({
        message: t("users.validation.formErrors"),
        type: "error",
      });
      return;
    }

    const roles = [formData.role];

    const hasEntreprise = canHaveEntreprise(formData.role);
    const entrepriseName = hasEntreprise
      ? formData.entrepriseName.trim() || null
      : null;
    const entreprise = hasEntreprise
      ? formData.entrepriseId || null
      : null;
    const numeroRegistreCommerce =
      formData.role === "ROLE_PRESTATAIRE"
        ? formData.numeroRegistreCommerce.trim() || null
        : null;
    const siegeSocial =
      formData.role === "ROLE_PRESTATAIRE"
        ? formData.siegeSocial.trim() || null
        : null;
    const qualiteRepresentant =
      formData.role === "ROLE_PRESTATAIRE"
        ? formData.qualiteRepresentant.trim() || null
        : null;

    if (isEditMode && existingUser) {
      updateUser(
        {
          id: existingUser.id,
          data: {
            email: formData.email.trim().toLowerCase(),
            name: formData.name.trim(),
            firstname: formData.firstname.trim(),
            roles,
            isActive: formData.actif,
            entrepriseName,
            entreprise,
            numeroRegistreCommerce,
            siegeSocial,
            qualiteRepresentant,
            ...(formData.plainPassword
              ? { plainPassword: formData.plainPassword }
              : {}),
          },
        },
        {
          onSuccess: () =>
            addToast({
              message: t("users.toast.updated"),
              type: "success",
            }),
          onError: (error) => handleApiError(error),
        },
      );
    } else {
      createUser(
        {
          email: formData.email.trim().toLowerCase(),
          name: formData.name.trim(),
          firstname: formData.firstname.trim(),
          plainPassword: formData.plainPassword,
          roles,
          isActive: formData.actif,
          entrepriseName,
          entreprise,
          numeroRegistreCommerce,
          siegeSocial,
          qualiteRepresentant,
        },
        {
          onSuccess: () =>
            addToast({
              message: t("users.toast.created"),
              type: "success",
            }),
          onError: (error) => handleApiError(error),
        },
      );
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isPrestataireScoped) return;
    const newRole = e.target.value;
    const isPrestataire = newRole === "ROLE_PRESTATAIRE";
    const hasEnt = canHaveEntreprise(newRole);
    setFormData({
      ...formData,
      role: newRole,
      entrepriseName: isPrestataire ? formData.entrepriseName : "",
      entrepriseId: hasEnt ? formData.entrepriseId : "",
      numeroRegistreCommerce: isPrestataire ? formData.numeroRegistreCommerce : "",
      siegeSocial: isPrestataire ? formData.siegeSocial : "",
      qualiteRepresentant: isPrestataire ? formData.qualiteRepresentant : "",
    });
  };

  if (isPrestataireProfileLoading && isPrestataireScoped) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">{t("common.loading")}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isEditMode
                ? t("users.form.editTitle")
                : t("users.form.createTitle")}
            </h2>
            <p className="mt-1 text-gray-600">
              {isEditMode
                ? t("users.form.editDesc")
                : t("users.form.createDesc")}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">
              {" "}
              {t("users.form.personalInfo")}{" "}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                ref={nameRef}
                label={t("users.form.name")}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={errors.name}
                placeholder={t("users.form.namePlaceholder")}
                required
              />
              <Input
                ref={firstnameRef}
                label={t("users.form.firstname")}
                value={formData.firstname}
                onChange={(e) =>
                  setFormData({ ...formData, firstname: e.target.value })
                }
                error={errors.firstname}
                placeholder={t("users.form.firstnamePlaceholder")}
                required
              />
            </div>
            <Input
              ref={emailRef}
              label={t("users.form.email")}
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
              placeholder={t("users.form.emailPlaceholder")}
              required
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Shield className="h-5 w-5 text-blue-600" />
              {t("users.form.roleAndPermissions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label={t("users.form.role")}
              options={rolesLoading ? [{ value: "", label: t("common.loading") }] : dynamicRoleOptions}
              value={formData.role}
              onChange={handleRoleChange}
              error={errors.role}
              required
              disabled={rolesLoading || isPrestataireScoped}
            />

            {isPrestataireScoped && scopedEntrepriseName && (
              <p className="text-sm text-gray-600">
                {t("users.form.entrepriseScopeHint", { entreprise: scopedEntrepriseName })}
              </p>
            )}

            {canHaveEntreprise(formData.role) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-2">
                      {t("users.form.entreprise")}
                    </h4>
                    <Select
                      label={t("users.form.entreprise")}
                      value={formData.entrepriseId}
                      onChange={(e) => {
                        if (isPrestataireScoped) return;
                        const iri = e.target.value
                        const ent = entreprises.find((x) => x['@id'] === iri)
                        setFormData({
                          ...formData,
                          entrepriseId: iri,
                          entrepriseName: ent ? (ent.nom ?? '') : '',
                          numeroRegistreCommerce: ent ? (ent.numeroRegistreCommerce ?? '') : '',
                          siegeSocial: ent ? (ent.siegeSocial ?? '') : '',
                          qualiteRepresentant: ent ? (ent.qualiteRepresentant ?? '') : '',
                        })
                      }}
                      disabled={isPrestataireScoped}
                      options={[
                        { value: "", label: "— Sélectionner une entreprise —" },
                        ...selectableEntreprises.map((ent) => ({
                          value: ent['@id'],
                          label: ent.nom,
                        })),
                      ]}
                    />
                    {canHaveEntreprise(formData.role) && !isPrestataireScoped && (
                      <>
                        <div className="mt-3">
                          <Input
                            label={t("users.form.entreprise") + " (nom libre)"}
                            value={formData.entrepriseName}
                            onChange={(e) =>
                              setFormData({ ...formData, entrepriseName: e.target.value })
                            }
                            error={errors.entrepriseName}
                            placeholder={t("users.form.entreprisePlaceholder")}
                          />
                        </div>
                        <div className="mt-3">
                          <Input
                            label={t("users.form.numeroRegistreCommerce")}
                            value={formData.numeroRegistreCommerce}
                            onChange={(e) =>
                              setFormData({ ...formData, numeroRegistreCommerce: e.target.value })
                            }
                            error={errors.numeroRegistreCommerce}
                            placeholder={t("users.form.numeroRegistreCommercePlaceholder")}
                          />
                        </div>
                        <div className="mt-3">
                          <Input
                            label={t("users.form.siegeSocial")}
                            value={formData.siegeSocial}
                            onChange={(e) =>
                              setFormData({ ...formData, siegeSocial: e.target.value })
                            }
                            error={errors.siegeSocial}
                            placeholder={t("users.form.siegeSocialPlaceholder")}
                          />
                        </div>
                        <div className="mt-3">
                          <Input
                            label={t("users.form.qualiteRepresentant")}
                            value={formData.qualiteRepresentant}
                            onChange={(e) =>
                              setFormData({ ...formData, qualiteRepresentant: e.target.value })
                            }
                            error={errors.qualiteRepresentant}
                            placeholder={t("users.form.qualiteRepresentantPlaceholder")}
                            maxLength={100}
                          />
                        </div>
                      </>
                    )}

                    <div className="mt-4 border-t border-blue-200 pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <PenLine className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900 text-sm">
                          {t("users.form.signatureElectronique")}
                        </span>
                      </div>

                      {isEditMode && existingSignatureUrl && !signaturePreview && (
                        <div className="mb-3">
                          <p className="text-xs text-blue-700 mb-1">{t("users.form.signatureActuelle")}</p>
                          <img
                            src={existingSignatureUrl}
                            alt="signature actuelle"
                            className="h-16 border border-blue-200 rounded bg-white object-contain"
                          />
                        </div>
                      )}

                      {signaturePreview && (
                        <div className="mb-3">
                          <p className="text-xs text-blue-700 mb-1">{t("users.form.signatureApercu")}</p>
                          <img
                            src={signaturePreview}
                            alt="aperçu signature"
                            className="h-16 border border-blue-300 rounded bg-white object-contain"
                          />
                        </div>
                      )}

                      {isEditMode ? (
                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer">
                            <input
                              type="file"
                              accept="image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                setSignatureFile(file);
                                if (file) {
                                  setSignaturePreview(URL.createObjectURL(file));
                                } else {
                                  setSignaturePreview(null);
                                }
                              }}
                            />
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-blue-300 bg-white text-sm text-blue-700 hover:bg-blue-50 transition-colors">
                              <Upload className="h-4 w-4" />
                              {signatureFile ? signatureFile.name : t("users.form.signatureChoisir")}
                            </span>
                          </label>
                          {signatureFile && (
                            <Button
                              type="button"
                              size="sm"
                              isLoading={isUploadingSignature}
                              onClick={() => {
                                if (!existingUser) return;
                                uploadSignature(
                                  { id: existingUser.id, file: signatureFile },
                                  {
                                    onSuccess: () => {
                                      addToast({ message: t("users.toast.signatureUploaded"), type: "success" });
                                      setSignatureFile(null);
                                    },
                                    onError: () => {
                                      addToast({ message: t("users.toast.signatureError"), type: "error" });
                                    },
                                  }
                                );
                              }}
                            >
                              {t("users.form.signatureUpload")}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-blue-600 italic">
                          {t("users.form.signatureApresCreation")}
                        </p>
                      )}
                      <p className="text-xs text-blue-500 mt-1">{t("users.form.signatureHint")}</p>
                    </div>

                    <p className="text-xs text-blue-700 mt-2">
                      {t("users.form.prestataireInfo")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {allRoles.find((r) => r.name === formData.role)?.description && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-1">
                  {t("users.form.rolePermissions")}
                </h4>
                <p className="text-sm text-gray-700">
                  {allRoles.find((r) => r.name === formData.role)!.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">
              {" "}
              {t("users.form.security")} {!isEditMode && "*"}{" "}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditMode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  {t("users.form.keepPassword")}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                ref={plainPasswordRef}
                label={`${t("users.form.password")} ${!isEditMode ? "*" : ""}`}
                type={showPassword ? "text" : "password"}
                value={formData.plainPassword}
                onChange={(e) =>
                  setFormData({ ...formData, plainPassword: e.target.value })
                }
                error={errors.plainPassword}
                placeholder={t("users.form.passwordPlaceholder")}
                required={!isEditMode}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
              />
              <Input
                label={`${t("users.form.confirmPassword")} ${!isEditMode ? "*" : ""}`}
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                error={errors.confirmPassword}
                placeholder={t("users.form.confirmPasswordPlaceholder")}
                required={!isEditMode}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">
              {" "}
              {t("users.form.accountStatus")}{" "}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Checkbox
              label={t("users.form.activeAccount")}
              description={t("users.form.activeAccountDesc")}
              checked={formData.actif}
              onChange={(e) =>
                setFormData({ ...formData, actif: e.target.checked })
              }
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4 pt-4 border-t">
          <Link to="/users">
            <Button type="button" variant="outline">
              {" "}
              {t("common.cancel")}{" "}
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
                <UserPlus className="h-4 w-4 mr-2" />
                {t("users.form.create")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
