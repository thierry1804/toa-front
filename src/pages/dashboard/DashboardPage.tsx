import { useMemo, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useMenuStore } from "@/store/menu.store";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatStrip } from "@/components/ui/StatStrip";
import { ArrowRight, Activity, MapPin, Filter } from "lucide-react";
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

function WelcomePage({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-blue-50 p-6 mb-6">
        <Activity className="h-12 w-12 text-blue-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        Bienvenue, {name}
      </h1>
      <p className="text-gray-500 max-w-md">
        Votre espace de travail est prêt. Utilisez le menu de navigation pour
        accéder à vos fonctionnalités.
      </p>
    </div>
  );
}

export default function DashboardPage() {
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
    useDashboardMap(filterProvider, filterProcess);

  const { data: kpis } = useDashboardKpis();
  const statItems = [
    { label: "Plans validés", value: kpis?.nbPlansValides ?? "—" },
    { label: "Permis validés", value: kpis?.nbPermisValides ?? "—" },
    { label: "Permis clôturés", value: kpis?.nbPermisClotures ?? "—" },
    {
      label: "Taux de clôture",
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

  if (!isAdmin) {
    return <WelcomePage name={userName} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${t("dashboard.greeting")}${userName ? `, ${userName}` : ""}`}
        description={t("dashboard.description")}
      />

      {/* Map section */}
      <div className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
            <h2 className="text-base font-semibold text-gray-900">
              Carte des sites
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les prestataires</option>
              {prestataires.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              value={filterProcess}
              onChange={(e) => setFilterProcess(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les projets</option>
              {processTypes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {(filterProvider || filterProcess) && (
              <button
                onClick={() => {
                  setFilterProvider("");
                  setFilterProcess("");
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
        {mapLoading ? (
          <div className="flex items-center justify-center h-[500px] text-gray-400 text-sm">
            Chargement de la carte…
          </div>
        ) : (
          <ReferentielSitesMap geoJson={filteredGeoJson} height="500px" />
        )}
      </div>

      {/* Stats */}
      <StatStrip items={statItems} />

      {/* Quick access + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick access */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dashboard.quickAccess")}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleQuickLinks.map((link) => {
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
              {t("dashboard.recentActivity")}
            </h2>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-8 w-8 text-gray-200" />
              <p className="mt-3 text-sm text-gray-400">
                {t("dashboard.noActivity")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
