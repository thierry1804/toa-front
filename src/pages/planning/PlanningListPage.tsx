import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
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
} from "lucide-react";
import { formatDate } from "@/utils/date";
import { STATUS_CONFIG, statusFilterOptions } from "@/data/constant/planning";

export default function PlanningListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canAccessFeature } = useAuthStore();
  const addToast = useUiStore((s) => s.addToast);
  const { data: plannings, isLoading } = useActivityPlannings();
  const { mutate: deletePlanning } = useDeleteActivityPlanning();
  const perms = usePermissions("/planning");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

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
    total: plannings?.length ?? 0,
    planifie: plannings?.filter((p) => p.status === "planifie").length ?? 0,
    en_cours: plannings?.filter((p) => p.status === "en_cours").length ?? 0,
    valide: plannings?.filter((p) => p.status === "valide").length ?? 0,
    brouillon: plannings?.filter((p) => p.status === "brouillon").length ?? 0,
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deletePlanning(deleteTarget.id, {
      onSuccess: () => {
        addToast({
          message: "Planification supprimée avec succès",
          type: "success",
        });
        setDeleteTarget(null);
      },
      onError: () => {
        addToast({ message: "Erreur lors de la suppression", type: "error" });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500"> {t("common.loading")} </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {" "}
            Planification des activités{" "}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Gestion du calendrier des interventions sur sites
          </p>
        </div>
        {perms?.canCreate && (
          <Link to="/planning/new" className="self-start sm:self-auto">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl px-5 py-2.5">
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle planification
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600"> Total </p>
                <p className="text-2xl font-bold text-gray-900">
                  {" "}
                  {stats.total}{" "}
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
                <p className="text-sm text-gray-600"> Planifiées </p>
                <p className="text-2xl font-bold text-blue-600">
                  {" "}
                  {stats.planifie}{" "}
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
                <p className="text-sm text-gray-600"> En cours </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {" "}
                  {stats.en_cours}{" "}
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
                <p className="text-sm text-gray-600"> Validées </p>
                <p className="text-2xl font-bold text-green-600">
                  {" "}
                  {stats.valide}{" "}
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
                <p className="text-sm text-gray-600"> Brouillons </p>
                <p className="text-2xl font-bold text-orange-600">
                  {" "}
                  {stats.brouillon}{" "}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Rechercher par procédé, prestataire, site..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Filtrer par statut"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">
            {" "}
            Activités({filtered.length}){" "}
          </CardTitle>
          <CardDescription>
            Liste des activités planifiées sur les sites TowerCo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500"> Aucune activité trouvée </p>
              {perms?.canCreate && (
                <Link to="/planning/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-5 w-5 mr-2" />
                    Planifier une activité
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {" "}
                        Activité{" "}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {" "}
                        Site{" "}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {" "}
                        Prestataire{" "}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {" "}
                        Dates{" "}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {" "}
                        Statut{" "}
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {" "}
                        Actions{" "}
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
                                  {" "}
                                  {p.process}{" "}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {" "}
                                  {p.region}{" "}
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
                              {" "}
                              {p.siteCode} - N°{p.siteNumber}{" "}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-900">
                              {" "}
                              {p.provider}{" "}
                            </p>
                            {p.providerEmail && (
                              <p className="text-xs text-gray-500">
                                {" "}
                                {p.providerEmail}{" "}
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
                                {" "}
                                {config.label}{" "}
                              </Badge>
                            ) : (
                              <Badge>{p.status} </Badge>
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
                                  title="Modifier"
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
                                  title="Supprimer"
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
                              title="Modifier"
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
                              title="Supprimer"
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
                        <div className="flex items-center gap-2 text-sm">
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
        </CardContent>
      </Card>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmer la suppression"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes - vous sûr de vouloir supprimer la planification{" "}
            <strong> {deleteTarget?.name} </strong> ? Cette action est
            irréversible.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
