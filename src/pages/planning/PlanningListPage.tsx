import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useActivityPlannings,
  useDeleteActivityPlanning,
} from "@/features/planning/hooks/useActivityPlanning";
import { useUiStore } from "@/store/ui.store";
import { usePermissions } from "@/features/menus/hooks/usePermissions";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  CalendarCheck,
  Clock,
  CheckCircle,
  FileText,
  MapPin,
  PauseCircle,
} from "lucide-react";
import { formatDate } from "@/utils/date";
import { STATUS_CONFIG, statusFilterOptions } from "@/data/constant/planning";
import GanttChart from "@/features/planning/components/GanttChart";

export default function PlanningListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  const { mutate: deletePlanning } = useDeleteActivityPlanning();
  const perms = usePermissions("/planning");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const itemsPerPage = 10;
  const { data: hydraData, isLoading } = useActivityPlannings(
    page,
    itemsPerPage,
  );
  const allPlannings = hydraData?.member ?? [];
  const totalItems = hydraData?.totalItems ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const isBackendPaginated = allPlannings.length <= itemsPerPage;
  const plannings = isBackendPaginated
    ? allPlannings
    : allPlannings.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const filtered = (plannings ?? []).filter((p) => {
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

  const stats = {
    total: totalItems,
    planifie: plannings?.filter((p) => p.status === "planifie").length ?? 0,
    en_cours: plannings?.filter((p) => p.status === "en_cours").length ?? 0,
    valide: plannings?.filter((p) => p.status === "valide").length ?? 0,
    brouillon: plannings?.filter((p) => p.status === "brouillon").length ?? 0,
  };

  // Gantt height: fit all valid rows (max 10) without internal vertical scroll
  // const validCount = plannings.filter(
  //   (p) => p.expectedStartDate && p.expectedEndDate,
  // ).length;
  // const ganttH = Math.min(Math.max(validCount, 1), 15) * 44 + 32 + 44;
  const ganttH = 516;

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
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("planning.title")}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t("planning.description")}
          </p>
        </div>
        {perms?.canCreate && (
          <Link to="/planning/new" className="self-start sm:self-auto">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl px-5 py-2.5">
              <Plus className="h-5 w-5 mr-2" />
              {t("planning.newPlanning")}
            </Button>
          </Link>
        )}
      </div>

      {/* Gantt — height fits all rows, timeline scrolls internally */}
      <div className="overflow-hidden" style={{ height: ganttH }}>
        <GanttChart activities={plannings} />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {t("planning.stats.total")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {t("planning.stats.planifie")}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.planifie}
                </p>
              </div>
              <CalendarCheck className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {t("planning.stats.en_cours")}
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.en_cours}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {t("planning.stats.valide")}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.valide}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {t("planning.stats.brouillon")}
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.brouillon}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + filter */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              placeholder={t("planning.filterStatus")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Activity list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">
            {t("planning.title")} ({filtered.length})
          </CardTitle>
          <CardDescription>{t("planning.description")}</CardDescription>
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
                        {t("planning.table.activity")}
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
                    {filtered.map((p) => {
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
                                <p className="text-xs text-gray-500">
                                  {p.region}
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
                              {p.siteCode} - N°{p.siteNumber}
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
                                {config.label}
                              </Badge>
                            ) : (
                              <Badge>{p.status}</Badge>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {perms?.canEdit && (
                                <button
                                  onClick={() =>
                                    navigate(`/planning/${p.id}/edit`)
                                  }
                                  className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title={t("common.edit")}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {perms?.canDelete && (
                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      id: p.id,
                                      name: p.process,
                                    })
                                  }
                                  className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title={t("common.delete")}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
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
                {filtered.map((p) => {
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
                            <p className="text-xs text-gray-500 truncate">
                              {p.region}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {perms?.canEdit && (
                            <button
                              onClick={() => navigate(`/planning/${p.id}/edit`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                              title={t("common.edit")}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {perms?.canDelete && (
                            <button
                              onClick={() =>
                                setDeleteTarget({ id: p.id, name: p.process })
                              }
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                              title={t("common.delete")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{p.siteName}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {p.siteCode} - N°{p.siteNumber}
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
                          <Badge variant={config.variant}>{config.label}</Badge>
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
