import { useMemo, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useMenuStore } from "@/store/menu.store";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatStrip } from "@/components/ui/StatStrip";
import Badge from "@/components/ui/Badge";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DASHBOARD_EXCERPT_LIMIT, DASHBOARD_KPI_SCAN_LIMIT, quickLinks } from "@/data/constant/dashboard";
import { useTranslation } from "react-i18next";
import type { MenuNode } from "@/types";
import type { Intervention } from "@/types/intervention";
import ReferentielSitesMap from "@/components/referentiel/ReferentielSitesMap";
import { useDashboardMap } from "@/features/dashboard/hooks/useDashboardMap";
import { useDashboardKpis } from "@/features/dashboard/hooks/useDashboardKpis";
import { usePermitsTravail } from "@/features/permitTravail/hooks/usePermitTravail";
import { usePermitTravailLabels } from "@/features/permitTravail/usePermitTravailLabels";
import { usePlanPreventionCollection } from "@/features/planPrevention/hooks/usePlanPrevention";
import { useRecentInterventions } from "@/features/intervention/hooks/useIntervention";
import { useActivityPlannings } from "@/features/planning/hooks/useActivityPlanning";
import { useUsers } from "@/features/users/hooks/useUsers";
import StatutPermitBadge from "@/components/permitTravail/StatutPermitBadge";
import StatutBadge from "@/components/planPrevention/StatutBadge";
import { formatUserDisplayName } from "@/utils/format";
import { STATUS_CONFIG } from "@/data/constant/planning";
import { sortNewestFirst } from "@/lib/listOrder";
import { buildProfileKpis, PROFILE_KPI_HREF } from "@/features/dashboard/buildProfileKpis";
import {
  DashboardExcerptPanel,
  DashboardExcerptRow,
} from "@/pages/dashboard/DashboardExcerptPanel";

const INTERVENTION_STATUT_I18N: Record<string, string> = {
  EN_PREPARATION: "planifiee",
  EVALUATION_COMPLETE: "planifiee",
  EN_COURS: "en_cours",
  TERMINEE: "terminee",
};

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

function interventionReference(intervention: Intervention): string {
  if (intervention.permitTravail && typeof intervention.permitTravail === "object") {
    return intervention.permitTravail.reference;
  }
  return intervention.id;
}

function interventionSite(intervention: Intervention): string {
  if (intervention.permitTravail && typeof intervention.permitTravail === "object") {
    return intervention.permitTravail.codeSite;
  }
  return "";
}

function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const roles = useAuthStore((s) => s.roles);
  const menuItems = useMenuStore((s) => s.items);
  const menuLoaded = useMenuStore((s) => s.loaded);
  const menuError = useMenuStore((s) => s.error);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { typeLabel } = usePermitTravailLabels();

  const isSuperAdmin = roles.includes("ROLE_SUPER_ADMIN");
  const isAdmin =
    isSuperAdmin || roles.includes("ROLE_ADMIN");

  const [filterProvider, setFilterProvider] = useState("");
  const [filterProcess, setFilterProcess] = useState("");

  const { filteredGeoJson, prestataires, processTypes, isLoading: mapLoading } =
    useDashboardMap(filterProvider, filterProcess, { enabled: isAdmin });

  const { data: kpis } = useDashboardKpis(undefined, { enabled: isSuperAdmin });

  const viewableRoutes = useMemo(() => {
    if (menuError && menuItems.length === 0) {
      return new Set(quickLinks.map((l) => l.route));
    }
    return new Set(
      flattenMenu(menuItems)
        .filter((n) => n.route && (n.canView ?? true))
        .map((n) => n.route as string),
    );
  }, [menuItems, menuError]);

  const showPermits = viewableRoutes.has("/permits-travail");
  const showPlans = viewableRoutes.has("/prevention");
  const showInterventions = viewableRoutes.has("/interventions");
  const showPlanning = viewableRoutes.has("/planning");
  const showUsers = viewableRoutes.has("/users");

  const listPageSize = isSuperAdmin
    ? DASHBOARD_EXCERPT_LIMIT
    : DASHBOARD_KPI_SCAN_LIMIT;

  const excerptParams = {
    page: "1",
    itemsPerPage: String(listPageSize),
  };

  const { data: permitsData, isLoading: permitsLoading, isError: permitsError } =
    usePermitsTravail(excerptParams, { enabled: showPermits });

  const { data: plansData, isLoading: plansLoading, isError: plansError } =
    usePlanPreventionCollection(excerptParams, { enabled: showPlans });

  const {
    data: interventionsData,
    isLoading: interventionsLoading,
    isError: interventionsError,
  } = useRecentInterventions(listPageSize, {
    enabled: showInterventions,
  });

  const {
    data: planningData,
    isLoading: planningLoading,
    isError: planningError,
  } = useActivityPlannings(1, listPageSize, {
    enabled: showPlanning,
  });

  const { data: usersData, isLoading: usersLoading, isError: usersError } =
    useUsers(1, listPageSize, { enabled: showUsers });

  const recentPermits = useMemo(
    () => sortNewestFirst(permitsData?.member ?? []).slice(0, DASHBOARD_EXCERPT_LIMIT),
    [permitsData?.member],
  );
  const recentPlans = useMemo(
    () => sortNewestFirst(plansData?.member ?? []).slice(0, DASHBOARD_EXCERPT_LIMIT),
    [plansData?.member],
  );
  const recentInterventions = useMemo(
    () =>
      sortNewestFirst(interventionsData?.member ?? []).slice(
        0,
        DASHBOARD_EXCERPT_LIMIT,
      ),
    [interventionsData?.member],
  );
  const recentPlannings = useMemo(
    () => sortNewestFirst(planningData?.member ?? []).slice(0, DASHBOARD_EXCERPT_LIMIT),
    [planningData?.member],
  );
  const recentUsers = useMemo(
    () => sortNewestFirst(usersData?.member ?? []).slice(0, DASHBOARD_EXCERPT_LIMIT),
    [usersData?.member],
  );

  const superAdminStatItems = [
    { label: t("dashboard.kpis.plansValides"), value: kpis?.nbPlansValides ?? "—", href: "/prevention?statut=valides" },
    { label: t("dashboard.kpis.nbPermis"), value: kpis?.nbPermisTotal ?? "—", href: "/permits-travail" },
    { label: t("dashboard.kpis.permisValides"), value: kpis?.nbPermisValides ?? "—", href: "/permits-travail?statut=valides" },
    { label: t("dashboard.kpis.permisClotures"), value: kpis?.nbPermisClotures ?? "—", href: "/permits-travail?statut=clotures" },
    {
      label: t("dashboard.kpis.tauxCloture"),
      value: kpis ? `${Math.round(kpis.tauxCloture * 100)}%` : "—",
      href: "/permits-travail?statut=clotures",
    },
  ];

  const profileKpis = useMemo(
    () =>
      buildProfileKpis(
        {
          permits: showPermits,
          plans: showPlans,
          interventions: showInterventions,
          planning: showPlanning,
          users: showUsers,
        },
        {
          permits: showPermits && !permitsLoading ? permitsData?.member : undefined,
          plans: showPlans && !plansLoading ? plansData?.member : undefined,
          interventions:
            showInterventions && !interventionsLoading
              ? interventionsData?.member
              : undefined,
          plannings:
            showPlanning && !planningLoading ? planningData?.member : undefined,
          users: showUsers && !usersLoading ? usersData?.member : undefined,
        },
      ),
    [
      showPermits,
      showPlans,
      showInterventions,
      showPlanning,
      showUsers,
      permitsLoading,
      plansLoading,
      interventionsLoading,
      planningLoading,
      usersLoading,
      permitsData?.member,
      plansData?.member,
      interventionsData?.member,
      planningData?.member,
      usersData?.member,
    ],
  );

  const profileStatItems = profileKpis.map((item) => ({
    label: t(`dashboard.kpis.${item.key}`),
    value: item.value ?? "—",
    href: PROFILE_KPI_HREF[item.key],
  }));

  const userName = user
    ? `${user.prenom ? `${user.prenom} ` : ""}${user.nom}`
    : "";

  const locale = i18n.language?.startsWith("mg") ? "mg-MG" : "fr-FR";
  const formatDay = (iso: string) => new Date(iso).toLocaleDateString(locale);

  const excerptCount = [
    showPermits,
    showPlans,
    showInterventions,
    showPlanning,
    showUsers,
  ].filter(Boolean).length;

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
                  className="cursor-pointer self-start text-xs text-blue-600 hover:text-blue-700 sm:self-center"
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

      {isSuperAdmin && <StatStrip items={superAdminStatItems} />}
      {!isSuperAdmin && profileStatItems.length > 0 && (
        <StatStrip items={profileStatItems} />
      )}

      {!menuLoaded ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardExcerptPanel
            title={t("dashboard.recentPermits")}
            seeAllLabel={t("dashboard.seeAll")}
            onSeeAll={() => undefined}
            loading
            error={false}
            errorMessage=""
            empty={false}
            emptyMessage=""
          >
            {null}
          </DashboardExcerptPanel>
          <DashboardExcerptPanel
            title={t("dashboard.recentPlans")}
            seeAllLabel={t("dashboard.seeAll")}
            onSeeAll={() => undefined}
            loading
            error={false}
            errorMessage=""
            empty={false}
            emptyMessage=""
          >
            {null}
          </DashboardExcerptPanel>
        </div>
      ) : excerptCount === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
          {t("dashboard.noActivity")}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {showPermits && (
            <DashboardExcerptPanel
              title={t("dashboard.recentPermits")}
              seeAllLabel={t("dashboard.seeAll")}
              onSeeAll={() => navigate("/permits-travail")}
              loading={permitsLoading}
              error={permitsError}
              errorMessage={t("dashboard.excerptLoadError")}
              empty={recentPermits.length === 0}
              emptyMessage={t("dashboard.noPermits")}
            >
              <ul className="divide-y divide-gray-100">
                {recentPermits.map((permit) => (
                  <DashboardExcerptRow
                    key={permit.id}
                    title={permit.reference}
                    meta={`${permit.codeSite} · ${typeLabel(permit.typePermis)} · ${formatDay(permit.createdAt)}`}
                    badge={<StatutPermitBadge statut={permit.statut} />}
                    onClick={() => navigate(`/permits-travail/${permit.id}`)}
                  />
                ))}
              </ul>
            </DashboardExcerptPanel>
          )}

          {showPlans && (
            <DashboardExcerptPanel
              title={t("dashboard.recentPlans")}
              seeAllLabel={t("dashboard.seeAll")}
              onSeeAll={() => navigate("/prevention")}
              loading={plansLoading}
              error={plansError}
              errorMessage={t("dashboard.excerptLoadError")}
              empty={recentPlans.length === 0}
              emptyMessage={t("dashboard.noPlans")}
            >
              <ul className="divide-y divide-gray-100">
                {recentPlans.map((plan) => (
                  <DashboardExcerptRow
                    key={plan.id}
                    title={plan.reference}
                    meta={`${plan.codeSite} · ${formatDay(plan.createdAt)}`}
                    badge={<StatutBadge statut={plan.statut} />}
                    onClick={() => navigate(`/prevention/${plan.id}`)}
                  />
                ))}
              </ul>
            </DashboardExcerptPanel>
          )}

          {showInterventions && (
            <DashboardExcerptPanel
              title={t("dashboard.recentInterventions")}
              seeAllLabel={t("dashboard.seeAll")}
              onSeeAll={() => navigate("/interventions")}
              loading={interventionsLoading}
              error={interventionsError}
              errorMessage={t("dashboard.excerptLoadError")}
              empty={recentInterventions.length === 0}
              emptyMessage={t("dashboard.noInterventions")}
            >
              <ul className="divide-y divide-gray-100">
                {recentInterventions.map((intervention) => {
                  const site = interventionSite(intervention);
                  const statutKey =
                    INTERVENTION_STATUT_I18N[intervention.statut] ?? "planifiee";
                  return (
                    <DashboardExcerptRow
                      key={intervention.id}
                      title={interventionReference(intervention)}
                      meta={`${site ? `${site} · ` : ""}${formatDay(intervention.createdAt)}`}
                      badge={
                        <Badge variant="secondary">
                          {t(`interventions.list.status.${statutKey}`)}
                        </Badge>
                      }
                      onClick={() => navigate(`/interventions/${intervention.id}`)}
                    />
                  );
                })}
              </ul>
            </DashboardExcerptPanel>
          )}

          {showPlanning && (
            <DashboardExcerptPanel
              title={t("dashboard.recentPlanning")}
              seeAllLabel={t("dashboard.seeAll")}
              onSeeAll={() => navigate("/planning")}
              loading={planningLoading}
              error={planningError}
              errorMessage={t("dashboard.excerptLoadError")}
              empty={recentPlannings.length === 0}
              emptyMessage={t("dashboard.noPlanning")}
            >
              <ul className="divide-y divide-gray-100">
                {recentPlannings.map((planning) => (
                  <DashboardExcerptRow
                    key={planning.id}
                    title={planning.process}
                    meta={`${planning.siteCode} · ${formatDay(planning.createdAt)}`}
                    badge={
                      <Badge
                        variant={STATUS_CONFIG[planning.status]?.variant ?? "default"}
                      >
                        {t(`planning.status.${planning.status}`)}
                      </Badge>
                    }
                    mono={false}
                    onClick={() => navigate(`/planning/${planning.id}/edit`)}
                  />
                ))}
              </ul>
            </DashboardExcerptPanel>
          )}

          {showUsers && (
            <DashboardExcerptPanel
              title={t("dashboard.recentUsers")}
              seeAllLabel={t("dashboard.seeAll")}
              onSeeAll={() => navigate("/users")}
              loading={usersLoading}
              error={usersError}
              errorMessage={t("dashboard.excerptLoadError")}
              empty={recentUsers.length === 0}
              emptyMessage={t("dashboard.noUsers")}
            >
              <ul className="divide-y divide-gray-100">
                {recentUsers.map((u) => (
                  <DashboardExcerptRow
                    key={u.id}
                    title={formatUserDisplayName(u)}
                    meta={`${u.email} · ${formatDay(u.createdAt)}`}
                    badge={
                      <Badge variant={u.isActive ? "success" : "default"}>
                        {u.isActive
                          ? t("users.status.active")
                          : t("users.status.inactive")}
                      </Badge>
                    }
                    mono={false}
                    onClick={() => navigate(`/users/${u.id}/edit`)}
                  />
                ))}
              </ul>
            </DashboardExcerptPanel>
          )}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
