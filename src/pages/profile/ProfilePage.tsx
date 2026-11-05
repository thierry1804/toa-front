import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, KeyRound, Upload, User as UserIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuthStore } from "@/store/auth.store";
import { useUiStore } from "@/store/ui.store";
import { usePermission } from "@/features/auth/usePermission";
import { formatRoleLabel } from "@/data/constant/roles";
import { useMyProfile, useChangeMyPassword } from "@/features/auth/useMe";
import { useUploadSignature } from "@/features/users/hooks/useUsers";
import { usersApi } from "@/api/usersApi";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/utils/validation";

function errorCodeFrom(err: unknown): string | null {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (!data) return null;
  const text = [data.detail, data["hydra:description"], data.message]
    .filter((v): v is string => typeof v === "string")
    .join(" ");
  return text || null;
}

function PasswordSection() {
  const { t } = useTranslation();
  const addToast = useUiStore((s) => s.addToast);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const { mutate: changePassword, isPending } = useChangeMyPassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    changePassword(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          reset();
          addToast({ message: t("profile.password.success"), type: "success" });
        },
        onError: (err) => {
          const code = errorCodeFrom(err);
          const message =
            code?.includes("current_password_invalid")
              ? t("profile.password.wrongCurrent")
              : t("profile.password.error");
          addToast({ message, type: "error" });
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4 text-gray-400" aria-hidden />
          {t("profile.password.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4">
          <Input
            label={t("profile.password.current")}
            type={showCurrent ? "text" : "password"}
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
            rightElement={
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <Input
            label={t("profile.password.new")}
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register("newPassword")}
            rightElement={
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <Input
            label={t("profile.password.confirm")}
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" isLoading={isPending}>
            {t("profile.password.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SignatureSection({ userId, hasSignature }: { userId: number; hasSignature: boolean }) {
  const { t } = useTranslation();
  const addToast = useUiStore((s) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existingUrl, setExistingUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { mutate: uploadSignature, isPending } = useUploadSignature();

  useEffect(() => {
    if (!hasSignature) {
      setExistingUrl(null);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    usersApi
      .getSignatureBlob(userId)
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setExistingUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setExistingUrl(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [userId, hasSignature]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    uploadSignature(
      { id: userId, file },
      {
        onSuccess: () => addToast({ message: t("profile.signature.success"), type: "success" }),
        onError: () => addToast({ message: t("profile.signature.error"), type: "error" }),
      },
    );
    e.target.value = "";
  };

  const displayUrl = previewUrl ?? existingUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4 text-gray-400" aria-hidden />
          {t("profile.signature.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-36 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50">
            {displayUrl ? (
              <img src={displayUrl} alt="" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-xs italic text-gray-400">{t("profile.signature.none")}</span>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              isLoading={isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {t("profile.signature.upload")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);
  const roles = useAuthStore((s) => s.roles);
  const canUploadSignature = usePermission("user.upload_signature");
  const { data: me, isLoading } = useMyProfile();

  const fullName = `${authUser?.prenom ?? ""} ${authUser?.nom ?? ""}`.trim();
  const roleLabel = formatRoleLabel(roles);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={t("profile.title")} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="h-4 w-4 text-gray-400" aria-hidden />
            {t("profile.identity.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">{t("profile.identity.name")}</dt>
              <dd className="text-sm text-gray-900">{fullName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">{t("profile.identity.email")}</dt>
              <dd className="text-sm text-gray-900">{authUser?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">{t("profile.identity.role")}</dt>
              <dd className="text-sm text-gray-900">{roleLabel || "—"}</dd>
            </div>
            {!isLoading && me?.entrepriseName && (
              <div>
                <dt className="text-xs font-medium text-gray-500">{t("profile.identity.entreprise")}</dt>
                <dd className="text-sm text-gray-900">{me.entrepriseName}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <PasswordSection />

      {canUploadSignature && me?.id && (
        <SignatureSection userId={me.id} hasSignature={!!me.signaturePath} />
      )}
    </div>
  );
}
