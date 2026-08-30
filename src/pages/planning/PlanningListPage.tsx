import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSearchParamState } from "@/hooks/useSearchParamState";
import {
  useActivityPlannings,
  useDeleteActivityPlanning,
} from "@/features/planning/hooks/useActivityPlanning";
import { useUiStore } from "@/store/ui.store";
import { usePermissions } from "@/features/menus/hooks/usePermissions";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { TableIconButton } from "@/components/ui/TableIconButton";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { StatStrip } from "@/components/ui/StatStrip";
import ListPageSkeleton from "@/components/ui/ListPageSkeleton";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  FileText,
  MapPin,
} from "lucide-react";
import { formatDate } from "@/utils/date";
import { STATUS_CONFIG, STATUS_VALUES } from "@/data/constant/planning";
import GanttChart from "@/features/planning/components/GanttChart";
import { listFiltersContainerClass } from "@/components/ui/ListTable";
import { cn } from "@/lib/utils";
import { sortNewestFirst } from "@/lib/listOrder";

const GANTT_ROW_H = 44;
const GANTT_TIMELINE_HEADER_H = 32;
const GANTT_MAX_ROWS = 10;
const GANTT_CHROME_H = 120;

export default function PlanningListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  const { mutate: deletePlanning } = useDeleteActivityPlanning();
  const perms = usePermissions("/planning");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilterParam] = useSearchParamState("statut");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const statusFilterOptions = useMemo(
    () => [
      { value: "all", label: t("planning.status.all") },
      ...STATUS_VALUES.map((v) => ({ value: v, label: t(`planning.status.${v}`) })),
    ],
    [t],
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const itemsPerPage = 10;
  // Fetch the full collection once and filter/paginate client-side — the API
  // has no server-side search/status filter, so paginating server-side first
  // would filter only whatever 10 rows happened to land on the current page.
  const { data: hydraData, isLoading } = useActivityPlannings(1, 1000);
  const allPlannings = hydraData?.member ?? [];

  const filtered = allPlannings.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      q === "" ||
      p.process.toLowerCase().includes(q) ||
      p.provider.toLowerCase().includes(q) ||
      p.siteName.toLowerCase().includes(q) ||
      p.siteCode.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const sorted = sortNewestFirst(filtered);

  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const plannings = sorted.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const stats = {
    total: allPlannings.length,
    planifie: allPlannings.filter((p) => p.status === "planifie").length,
    en_cours: allPlannings.filter((p) => p.status === "en_cours").length,
    valide: allPlannings.filter((p) => p.status === "valide").length,
    brouillon: allPlannings.filter((p) => p.status === "brouillon").length,
  };

  const ganttActivities = filtered.filter(
    (p) => p.expectedStartDate && p.expectedEndDate,
  );
  const ganttVisibleRows = Math.min(ganttActivities.length, GANTT_MAX_ROWS);
  const ganttHeight =
    GANTT_CHROME_H +
    GANTT_TIMELINE_HEADER_H +
    ganttVisibleRows * GANTT_ROW_H;

  const handleDelete = () => {
    if (!deleteTarget) return;
    deletePlanning(deleteTarget.id, {
      onSuccess: () => {
        addToast({ message: t("planning.toast.deleted"), type: "success" });
        setDeleteTarget(null);
      },
      onError: () => {
        addToast({ message: t("planning.toast.deleteError"), type: "error" });
      },
    });
  };

  if (isLoading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("planning.title")}
        description={t("planning.description")}
        actions={
          perms?.canCreate ? (
            <Link to="/planning/new">
              <Button>
                <Plus className="mr-2 h-5 w-5" />
                {t("planning.newPlanning")}
              </Button>
            </Link>
          ) : undefined
        }
      />

      <StatStrip
        items={[
          { label: t("planning.stats.total"), value: stats.total, href: "/planning" },
          { label: t("planning.stats.planifie"), value: stats.planifie, href: "/planning?statut=planifie" },
          { label: t("planning.stats.en_cours"), value: stats.en_cours, href: "/planning?statut=en_cours" },
          { label: t("planning.stats.valide"), value: stats.valide, href: "/planning?statut=valide" },
          { label: t("planning.stats.brouillon"), value: stats.brouillon, href: "/planning?statut=brouillon" },
        ]}
      />

      <div className={cn('rounded-lg border border-gray-200 bg-white', listFiltersContainerClass)}>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <Input
            placeholder={t("planning.search")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
          <Select
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilterParam(e.target.value);
              setPage(1);
            }}
            placeholder={t("planning.filterStatus")}
          />
        </div>
      </div>

      {ganttActivities.length > 0 && (
        <div className="overflow-hidden" style={{ height: ganttHeight }}>
          <GanttChart activities={ganttActivities} />
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">
            {t("planning.listTitle", { count: filtered.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t("planning.empty")}</p>
              {perms?.canCreate && (
                <Link to="/planning/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-5 w-5 mr-2" />
                    {t("planning.createAction")}
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t("planning.table.project")}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t("planning.table.site")}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t("planning.table.provider")}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t("planning.table.dates")}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t("planning.table.status")}
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {t("planning.table.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {plannings.map((p) => {
                      const config = STATUS_CONFIG[p.status];
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <FileText className="h-5 w-5 text-blue-700" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {p.process}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1 text-sm text-gray-900">
                              <MapPin className="h-3.5 w-3.5 text-gray-400" />
                              {p.siteName}
                            </div>
                            <p className="text-xs text-gray-500">
                              {p.siteCode}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-900">
                              {p.provider}
                            </p>
                            {p.providerEmail && (
                              <p className="text-xs text-gray-500">
                                {p.providerEmail}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-900">
                              {formatDate(p.expectedStartDate)}
                            </p>
                            <p className="text-xs text-gray-500">
                              → {formatDate(p.expectedEndDate)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            {config ? (
                              <Badge variant={config.variant}>
                                {t(`planning.status.${p.status}`)}
                              </Badge>
                            ) : (
                              <Badge>{p.status}</Badge>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {perms?.canEdit && (
                                <TableIconButton
                                  title={t("common.edit")}
                                  onClick={() => navigate(`/planning/${p.id}/edit`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </TableIconButton>
                              )}
                              {perms?.canDelete && (
                                <TableIconButton
                                  title={t("common.delete")}
                                  variant="danger"
                                  onClick={() =>
                                    setDeleteTarget({
                                      id: p.id,
                                      name: p.process,
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </TableIconButton>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden space-y-3">
                {plannings.map((p) => {
                  const config = STATUS_CONFIG[p.status];
                  return (
                    <div
                      key={p.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-blue-700" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {p.process}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {perms?.canEdit && (
                            <TableIconButton
                              title={t("common.edit")}
                              onClick={() => navigate(`/planning/${p.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </TableIconButton>
                          )}
                          {perms?.canDelete && (
                            <TableIconButton
                              title={t("common.delete")}
                              variant="danger"
                              onClick={() =>
                                setDeleteTarget({ id: p.id, name: p.process })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </TableIconButton>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{p.siteName}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {p.siteCode}
                        </p>
                        <p className="text-gray-900">{p.provider}</p>
                        {p.providerEmail && (
                          <p className="text-xs text-gray-500">
                            {p.providerEmail}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">
                            {formatDate(p.expectedStartDate)}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-gray-900">
                            {formatDate(p.expectedEndDate)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        {config ? (
                          <Badge variant={config.variant}>{t(`planning.status.${p.status}`)}</Badge>
                        ) : (
                          <Badge>{p.status}</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm text-gray-600">
                Page {page} / {totalPages} ({totalItems}{" "}
                {t("planning.stats.total")})
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 border border-gray-200"
                >
                  {t("common.previous")}
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 border border-gray-200"
                >
                  {t("common.next")}
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("planning.deleteConfirm.title")}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t("planning.deleteConfirm.message")}{" "}
            <strong>{deleteTarget?.name}</strong> ?{" "}
            {t("planning.deleteConfirm.irreversible")}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              {t("common.delete")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
