import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { useUsers, useDeleteUser } from "@/features/users/hooks/useUsers";
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
import { StatStrip } from "@/components/ui/StatStrip";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
} from "lucide-react";
import { formatDate } from "@/utils/date";
import { formatUserDisplayName } from "@/utils/format";
import { ROLE_CONFIG, roleOptions, statusOptions } from "@/data/constant/roles";

function getDisplayRole(roles: string[]): string {
  return roles.find((r) => r.startsWith("ROLE_")) ?? "ROLE_PRESTATAIRE";
}

export default function UsersListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const addToast = useUiStore((s) => s.addToast);
  const { mutate: deleteUser } = useDeleteUser();
  const perms = usePermissions("/users");

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const itemsPerPage = 10;
  // Fetch the full collection once and filter/paginate client-side — the API
  // has no server-side search, so paginating server-side first would filter
  // only whatever 10 rows happened to land on the current page.
  const { data: hydraData, isLoading } = useUsers(1, 1000);
  const allUsers = hydraData?.member ?? [];

  const filteredUsers = allUsers.filter((user) => {
    const fullName = formatUserDisplayName(user).toLowerCase();
    const matchSearch =
      searchQuery === "" ||
      fullName.includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const role = getDisplayRole(user.roles);
    const matchRole = roleFilter === "all" || role === roleFilter;

    const actif = user.roles.length > 0;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "actif" && actif) ||
      (statusFilter === "inactif" && !actif);

    return matchSearch && matchRole && matchStatus;
  });

  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const pagedUsers = filteredUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const stats = {
    total: allUsers.length,
    actifs: allUsers.filter((u) => u.isActive).length,
    inactifs: allUsers.filter((u) => !u.isActive).length,
    prestataires: allUsers.filter((u) => u.roles.includes("ROLE_PRESTATAIRE"))
      .length,
    toa: allUsers.filter((u) => !u.roles.includes("ROLE_PRESTATAIRE")).length,
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser(deleteTarget.id, {
      onSuccess: () => {
        addToast({
          message: t("users.toast.deleted"),
          type: "success",
        });
        setDeleteTarget(null);
      },
      onError: () => {
        addToast({ message: t("users.toast.deleteError"), type: "error" });
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
            {t("users.title")}{" "}
          </h2>
          <p className="mt-1 text-sm text-gray-600">{t("users.description")}</p>
        </div>
        {perms?.canCreate && (
          <Link to="/users/new" className="self-start sm:self-auto">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 rounded-xl px-5 py-2.5">
              <Plus className="h-5 w-5 mr-2" />
              {t("users.newUser")}
            </Button>
          </Link>
        )}
      </div>

      <StatStrip
        items={[
          { label: t("users.stats.total"), value: stats.total },
          { label: t("users.stats.active"), value: stats.actifs },
          { label: t("users.stats.inactive"), value: stats.inactifs },
          { label: t("users.stats.prestataires"), value: stats.prestataires },
          { label: t("users.stats.teamToa"), value: stats.toa },
        ]}
      />

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder={t("users.search")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
            <Select
              options={roleOptions}
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              placeholder={t("users.filterRole")}
            />
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              placeholder={t("users.filterStatus")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("users.title")} ({filteredUsers.length}){" "}
          </CardTitle>
          <CardDescription>
            {stats.prestataires} prestataires sur les entreprises partenaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500"> {t("users.empty")} </p>
              {perms?.canCreate && (
                <Link to="/users/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-5 w-5 mr-2" />
                    {t("users.createAction")}
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
                        {t("users.table.user")}{" "}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {" "}
                        {t("users.table.contact")}{" "}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {" "}
                        {t("users.table.role")}{" "}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {" "}
                        {t("users.table.status")}{" "}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {" "}
                        {t("users.table.createdAt")}{" "}
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {" "}
                        {t("users.table.actions")}{" "}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pagedUsers.map((user) => {
                      const role = getDisplayRole(user.roles);
                      const config = ROLE_CONFIG[role];
                      const Icon = config?.icon ?? Users;
                      const actif = user.roles.length > 0;

                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-700 font-semibold text-sm">
                                  {user.firstname.charAt(0)}
                                  {user.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatUserDisplayName(user)}
                                </p>
                                {String(user.id) === currentUser?.id && (
                                  <span className="text-xs text-blue-600">
                                    {" "}
                                    (Vous){" "}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-900">
                              {" "}
                              {user.email}{" "}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            {config ? (
                              <Badge variant={config.variant}>
                                <Icon className="h-3 w-3 mr-1" />
                                {t(config.labelKey)}
                              </Badge>
                            ) : (
                              <Badge>{role} </Badge>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {user.isActive ? (
                              <Badge variant="success">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="danger">
                                <UserX className="h-3 w-3 mr-1" />
                                Inactif
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {perms?.canEdit && (
                                <button
                                  onClick={() =>
                                    navigate(`/users/${user.id}/edit`)
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
                                      id: user.id,
                                      name: formatUserDisplayName(user),
                                    })
                                  }
                                  disabled={String(user.id) === currentUser?.id}
                                  className="p-1.5 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40 enabled:text-gray-600 enabled:hover:text-red-600 enabled:hover:bg-red-50"
                                  title={
                                    String(user.id) === currentUser?.id
                                      ? "Vous ne pouvez pas supprimer votre propre compte"
                                      : t("common.delete")
                                  }
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
                {pagedUsers.map((user) => {
                  const role = getDisplayRole(user.roles);
                  const config = ROLE_CONFIG[role];
                  const Icon = config?.icon ?? Users;
                  const actif = user.isActive;

                  return (
                    <div
                      key={user.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-700 font-semibold text-sm">
                              {user.firstname.charAt(0)}
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {formatUserDisplayName(user)}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                            {String(user.id) === currentUser?.id && (
                              <span className="text-xs text-blue-600">
                                (Vous)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {perms?.canEdit && (
                            <button
                              onClick={() => navigate(`/users/${user.id}/edit`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                              title={t("common.edit")}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {perms?.canDelete && (
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  id: user.id,
                                  name: formatUserDisplayName(user),
                                })
                              }
                              disabled={String(user.id) === currentUser?.id}
                              className="p-1.5 rounded-md disabled:cursor-not-allowed disabled:opacity-40 enabled:text-gray-400 enabled:hover:text-red-600 enabled:hover:bg-red-50"
                              title={t("common.delete")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {config ? (
                          <Badge variant={config.variant}>
                            <Icon className="h-3 w-3 mr-1" />
                            {t(config.labelKey)}
                          </Badge>
                        ) : (
                          <Badge>{role}</Badge>
                        )}
                        {actif ? (
                          <Badge variant="success">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="danger">
                            <UserX className="h-3 w-3 mr-1" />
                            Inactif
                          </Badge>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">
                          {formatDate(user.createdAt)}
                        </span>
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
                {t("users.stats.total")})
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

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">
                {" "}
                Certification ISO 14001{" "}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                TowerCo of Africa est certifiée ISO 14001(Management
                environnemental) et ISO 45001 (Santé et sécurité au travail).La
                gestion des utilisateurs et des accès fait partie intégrante du
                système de maîtrise des risques HSE.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("users.deleteConfirm.title")}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes - vous sûr de vouloir supprimer l'utilisateur{" "}
            <strong>{deleteTarget?.name}</strong> ? Cette action est
            irréversible.
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
