import { useAuthStore } from "@/store/auth.store";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArrowRight, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { stats, quickLinks } from "@/data/constant/dashboard";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${t('dashboard.greeting')}${user?.nom ? `, ${user.nom}` : ""}`}
        description={t('dashboard.description')}
      />

      {/* Stats grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div
                className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${s.gradient}`}
              />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg ${s.bgLight} p-2.5`}>
                    <Icon className={`h-5 w-5 ${s.iconColor}`} />
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold text-gray-900">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-gray-500">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick access + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick access */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t('dashboard.quickAccess')}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.label}
                  onClick={() => navigate(link.route)}
                  className="group flex items-start gap-4 rounded-xl bg-white p-4 text-left shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <div className="rounded-lg bg-gray-50 p-2.5 text-gray-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        {link.label}
                      </p>
                      <ArrowRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-blue-500" />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">{link.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent activity placeholder */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t('dashboard.recentActivity')}
            </h2>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-8 w-8 text-gray-200" />
              <p className="mt-3 text-sm text-gray-400">
                {t('dashboard.noActivity')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
