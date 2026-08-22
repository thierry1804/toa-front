import { useMemo, useState, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useMenuStore } from "@/store/menu.store";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatStrip } from "@/components/ui/StatStrip";
import { ArrowRight, Activity, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { quickLinks } from "@/data/constant/dashboard";
import { useTranslation } from "react-i18next";
import type { MenuNode } from "@/types";
import ReferentielSitesMap from "@/components/referentiel/ReferentielSitesMap";
import { useDashboardMap } from "@/features/dashboard/hooks/useDashboardMap";
import { useDashboardKpis } from "@/features/dashboard/hooks/useDashboardKpis";

function flattenMenu(nodes: MenuNode[]): MenuNode[] {
  const out: MenuNode[] = [];
  const walk = (items: MenuNode[]) => {
    for (const n of items) {
      out.push(n);
      walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

function SectionPanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-200 bg-white ${className}`}
    >
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h2 className="text-sm font-medium text-gray-700">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const roles = useAuthStore((s) => s.roles);
  const menuItems = useMenuStore((s) => s.items);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isAdmin =
    roles.includes("ROLE_ADMIN") || roles.includes("ROLE_SUPER_ADMIN");

  const [filterProvider, setFilterProvider] = useState("");
  const [filterProcess, setFilterProcess] = useState("");

  const { filteredGeoJson, prestataires, processTypes, isLoading: mapLoading } =
    useDashboardMap(filterProvider, filterProcess, { enabled: isAdmin });

  const { data: kpis } = useDashboardKpis(undefined, { enabled: isAdmin });

  const statItems = [
    { label: t("dashboard.kpis.plansValides"), value: kpis?.nbPlansValides ?? "—" },
    { label: t("dashboard.kpis.permisValides"), value: kpis?.nbPermisValides ?? "—" },
    { label: t("dashboard.kpis.permisClotures"), value: kpis?.nbPermisClotures ?? "—" },
    {
      label: t("dashboard.kpis.tauxCloture"),
      value: kpis ? `${Math.round(kpis.tauxCloture * 100)}%` : "—",
    },
  ];

  const visibleQuickLinks = useMemo(() => {
    if (menuItems.length === 0) return quickLinks;
    const flat = flattenMenu(menuItems);
    const viewable = new Set(
      flat
        .filter((n) => n.route && (n.canView ?? true))
        .map((n) => n.route as string),
    );
    return quickLinks.filter((l) => viewable.has(l.route));
  }, [menuItems]);

  const userName = user
    ? `${user.prenom ? `${user.prenom} ` : ""}${user.nom}`
    : "";

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={`${t("dashboard.greeting")}${userName ? `, ${userName}` : ""}`}
        description={t("dashboard.description")}
      />

      {isAdmin && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
              <h2 className="text-sm font-medium text-gray-700">
                {t("dashboard.mapTitle")}
              </h2>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto sm:min-w-[10rem]"
                aria-label={t("dashboard.filterProvider")}
              >
                <option value="">{t("dashboard.allProviders")}</option>
                {prestataires.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                value={filterProcess}
                onChange={(e) => setFilterProcess(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto sm:min-w-[10rem]"
                aria-label={t("dashboard.filterProject")}
              >
                <option value="">{t("dashboard.allProjects")}</option>
                {processTypes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {(filterProvider || filterProcess) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterProvider("");
                    setFilterProcess("");
                  }}
                  className="self-start text-xs text-blue-600 hover:text-blue-700 sm:self-center"
                >
                  {t("dashboard.resetFilters")}
                </button>
              )}
            </div>
          </div>
          {mapLoading ? (
            <div className="flex h-52 items-center justify-center text-sm text-gray-400 sm:h-72 lg:h-[420px]">
              {t("dashboard.mapLoading")}
            </div>
          ) : (
            <div className="h-52 sm:h-72 lg:h-[420px]">
              <ReferentielSitesMap
                geoJson={filteredGeoJson}
                embedded
                showSummary={false}
              />
            </div>
          )}
        </div>
      )}

      {isAdmin && <StatStrip items={statItems} />}

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        <div className="lg:col-span-2">
          <SectionPanel title={t("dashboard.quickAccess")}>
            {visibleQuickLinks.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">
                {t("dashboard.noQuickAccess")}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {visibleQuickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.route}>
                      <button
                        type="button"
                        onClick={() => navigate(link.route)}
                        className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                      >
                        <Icon
                          className="h-4 w-4 shrink-0 text-gray-400"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {t(link.labelKey)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t(link.descKey)}
                          </p>
                        </div>
                        <ArrowRight
                          className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-blue-600"
                          aria-hidden
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionPanel>
        </div>

        <SectionPanel title={t("dashboard.recentActivity")}>
          <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
            <Activity className="h-6 w-6 text-gray-300" aria-hidden />
            <p className="mt-2 text-sm text-gray-500">
              {t("dashboard.noActivity")}
            </p>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}

export default DashboardPage;
