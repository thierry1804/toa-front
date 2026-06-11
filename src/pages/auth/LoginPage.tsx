import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Shield, Globe, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { loginSchema, type LoginFormData } from "@/utils/validation";
import { useLogin } from "@/features/auth/useAuth";

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    setApiError(null);
    login(data, {
      onSuccess: () => navigate("/dashboard"),
      onError: (error: unknown) => {
        const msg =
          error instanceof Error ? error.message : "Identifiants incorrects";
        setApiError(msg);
      },
    });
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "fr" ? "mg" : "fr");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 p-4">
      <div className="w-full max-w-md">
        {/* Language toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors"
          >
            <Globe className="h-5 w-5" />
            <span className="font-medium">
              {i18n.language === "fr" ? "FR" : "MG"}
            </span>
          </button>
        </div>

        <Card>
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-black">TowerCo of Africa</CardTitle>
              <CardDescription className="mt-2">
                Plateforme de gestion HSE
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {apiError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {apiError}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label={t("auth.email")}
                type="email"
                autoComplete="email"
                placeholder="exemple@toa.mg"
                error={errors.email?.message}
                {...register("email")}
              />

              <div className="space-y-1">
                <Input
                  label={t("auth.password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register("password")}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  }
                />
                <div className="flex justify-end">
                  <a
                    href="#"
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {t("auth.forgotPassword")}
                  </a>
                </div>
              </div>

              <Button type="submit" className="w-full" isLoading={isPending}>
                {t("auth.login")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
