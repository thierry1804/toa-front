import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import {
  useUser,
  useCreateUser,
  useUpdateUser,
} from "@/features/users/hooks/useUsers";
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
} from "lucide-react";
import { roleOptions, ROLE_PERMISSIONS } from "@/data/constant/roles";
import { useTranslation } from "react-i18next";

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canAccessFeature } = useAuthStore();
  const { t } = useTranslation();
  const addToast = useUiStore((s) => s.addToast);
  const { data: existingUser } = useUser(id ? Number(id) : 0);
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();

  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    firstname: "",
    name: "",
    email: "",
    role: "ROLE_PRESTATAIRE",
    entreprise: "",
    actif: true,
    plainPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingUser) {
      setFormData({
        firstname: existingUser.firstname,
        name: existingUser.name,
        email: existingUser.email,
        role:
          existingUser.roles.find((r) => r.startsWith("ROLE_")) ??
          "ROLE_PRESTATAIRE",
        entreprise: "",
        actif: existingUser.roles.length > 0,
        plainPassword: "",
        confirmPassword: "",
      });
    }
  }, [existingUser]);

  useEffect(() => {
    if (!canAccessFeature(isEditMode ? "edit_users" : "create_users")) {
      navigate("/users");
      addToast({ message: t('users.toast.permissionDenied'), type: "error" });
    }
  }, [isEditMode, navigate, addToast, canAccessFeature]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = t('users.validation.nameRequired');
    if (!formData.firstname.trim())
      newErrors.firstname = t('users.validation.firstnameRequired');

    if (!formData.email.trim()) {
      newErrors.email = t('users.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('users.validation.emailInvalid');
    }

    if (!isEditMode) {
      if (!formData.plainPassword) {
        newErrors.plainPassword = t('users.validation.passwordRequired');
      } else if (formData.plainPassword.length < 6) {
        newErrors.plainPassword =
          t('users.validation.passwordMin');
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = t('users.validation.confirmRequired');
      } else if (formData.plainPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = t('users.validation.confirmMismatch');
      }
    } else if (formData.plainPassword) {
      if (formData.plainPassword.length < 6) {
        newErrors.plainPassword =
          t('users.validation.passwordMin');
      }
      if (formData.plainPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = t('users.validation.confirmMismatch');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast({
        message: t('users.validation.formErrors'),
        type: "error",
      });
      return;
    }

    const roles = [formData.role];

    if (isEditMode && existingUser) {
      updateUser(
        {
          id: existingUser.id,
          data: {
            email: formData.email.trim().toLowerCase(),
            name: formData.name.trim(),
            firstname: formData.firstname.trim(),
            roles,
            ...(formData.plainPassword
              ? { plainPassword: formData.plainPassword }
              : {}),
          },
        },
        {
          onSuccess: () =>
            addToast({
              message: t('users.toast.updated'),
              type: "success",
            }),
          onError: () =>
            addToast({
              message: t('users.toast.updateError'),
              type: "error",
            }),
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
        },
        {
          onSuccess: () =>
            addToast({
              message: t('users.toast.created'),
              type: "success",
            }),
          onError: () =>
            addToast({ message: t('users.toast.createError'), type: "error" }),
        },
      );
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, role: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {isEditMode ? t('users.form.editTitle') : t('users.form.createTitle')}
            </h2>
            <p className="mt-1 text-gray-600">
              {isEditMode
                ? t('users.form.editDesc')
                : t('users.form.createDesc')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">
              {" "}
              {t('users.form.personalInfo')}{" "}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('users.form.name')}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={errors.name}
                placeholder={t('users.form.namePlaceholder')}
                required
              />
              <Input
                label={t('users.form.firstname')}
                value={formData.firstname}
                onChange={(e) =>
                  setFormData({ ...formData, firstname: e.target.value })
                }
                error={errors.firstname}
                placeholder={t('users.form.firstnamePlaceholder')}
                required
              />
            </div>
            <Input
              label={t('users.form.email')}
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
              placeholder={t('users.form.emailPlaceholder')}
              required
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Shield className="h-5 w-5 text-blue-600" />
              {t('users.form.roleAndPermissions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label={t('users.form.role')}
              options={roleOptions}
              value={formData.role}
              onChange={handleRoleChange}
              error={errors.role}
              required
            />

            {formData.role === "ROLE_PRESTATAIRE" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-2">
                      {" "}
                      {t('users.form.entreprise')}
                    </h4>
                    <Input
                      label={t('users.form.entreprise')}
                      value={formData.entreprise}
                      onChange={(e) =>
                        setFormData({ ...formData, entreprise: e.target.value })
                      }
                      error={errors.entreprise}
                      placeholder={t('users.form.entreprisePlaceholder')}
                      required
                    />
                    <p className="text-xs text-blue-700 mt-2">
                      {t('users.form.prestataireInfo')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                {" "}
                {t('users.form.rolePermissions')}{" "}
              </h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                {(ROLE_PERMISSIONS[formData.role] ?? []).map((perm, i) => (
                  <li key={i}> {perm} </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">
              {" "}
              {t('users.form.security')} {!isEditMode && "*"}{" "}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditMode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  {t('users.form.keepPassword')}
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label={`${t('users.form.password')} ${!isEditMode ? "*" : ""}`}
                  type={showPassword ? "text" : "password"}
                  value={formData.plainPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, plainPassword: e.target.value })
                  }
                  error={errors.plainPassword}
                  placeholder={t('users.form.passwordPlaceholder')}
                  required={!isEditMode}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Input
                label={`${t('users.form.confirmPassword')} ${!isEditMode ? "*" : ""}`}
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                error={errors.confirmPassword}
                placeholder={t('users.form.confirmPasswordPlaceholder')}
                required={!isEditMode}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900"> {t('users.form.accountStatus')} </CardTitle>
          </CardHeader>
          <CardContent>
            <Checkbox
              label={t('users.form.activeAccount')}
              description={t('users.form.activeAccountDesc')}
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
                <UserPlus className="h-4 w-4 mr-2" />
                {t('users.form.create')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
