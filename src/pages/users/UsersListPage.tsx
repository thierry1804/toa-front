import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { useUsers, useDeleteUser } from "@/features/users/hooks/useUsers";
import { usePrestataireEntrepriseScope } from "@/features/users/hooks/usePrestataireEntrepriseScope";
import { useUiStore } from "@/store/ui.store";
import { usePermissions } from "@/features/menus/hooks/usePermissions";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import { TableIconButton } from "@/components/ui/TableIconButton";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { StatStrip } from "@/components/ui/StatStrip";
import ListPageSkeleton from "@/components/ui/ListPageSkeleton";
import { listFiltersContainerClass } from "@/components/ui/ListTable";
import { cn } from "@/lib/utils";
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
  const {
    isScoped: isPrestataireScoped,
    isProfileLoading: isPrestataireProfileLoading,
    matchesEntreprise,
    hasEntreprise,
    entrepriseName: scopedEntrepriseName,
  } = usePrestataireEntrepriseScope();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const itemsPerPage = 10;
  const { data: hydraData, isLoading } = useUsers(1, 1000);
  const allUsers = hydraData?.member ?? [];
  const visibleUsers = isPrestataireScoped
    ? allUsers.filter(matchesEntreprise)
    : allUsers;

  const filteredUsers = visibleUsers.filter((user) => {
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
    total: visibleUsers.length,
    actifs: visibleUsers.filter((u) => u.isActive).length,
    inactifs: visibleUsers.filter((u) => !u.isActive).length,
    prestataires: visibleUsers.filter((u) => u.roles.includes("ROLE_PRESTATAIRE"))
      .length,
    toa: visibleUsers.filter((u) => !u.roles.includes("ROLE_PRESTATAIRE")).length,
  };

  const prestataireRoleOptions = [
    { value: "all", label: t("users.filters.allRoles") },
    { value: "ROLE_PRESTATAIRE", label: t("roles.prestataire") },
    { value: "ROLE_HSE", label: t("roles.hse") },
    { value: "ROLE_AGENT_TERRAIN", label: t("roles.agent_terrain") },
  ];

  const handleDelete = () => {
    if (!deleteTarget) return;
    const targetUser = visibleUsers.find((u) => u.id === deleteTarget.id);
    if (!targetUser || !matchesEntreprise(targetUser)) {
      addToast({ message: t("users.toast.permissionDenied"), type: "error" });
      setDeleteTarget(null);
      return;
    }
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

  const renderRoleBadge = (role: string) => {
    const config = ROLE_CONFIG[role];
    const Icon = config?.icon ?? Users;
    if (config) {
      return (
        <Badge variant={config.variant}>
          <Icon className="mr-1 h-3 w-3 shrink-0" aria-hidden />
          {t(config.labelKey)}
        </Badge>
      );
    }
    return <Badge>{role}</Badge>;
  };

  const renderStatusBadge = (isActive: boolean) =>
    isActive ? (
      <Badge variant="success">
        <UserCheck className="mr-1 h-3 w-3 shrink-0" aria-hidden />
        {t("users.status.active")}
      </Badge>
    ) : (
      <Badge variant="danger">
        <UserX className="mr-1 h-3 w-3 shrink-0" aria-hidden />
        {t("users.status.inactive")}
      </Badge>
    );

  if (isLoading || isPrestataireProfileLoading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={t("users.title")}
        description={t("users.description")}
        actions={
          perms?.canCreate && (!isPrestataireScoped || hasEntreprise) ? (
            <Link to="/users/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-5 w-5" />
                {t("users.newUser")}
              </Button>
            </Link>
          ) : undefined
        }
      />

      {isPrestataireScoped && !hasEntreprise && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 sm:px-4">
          <p className="text-sm font-medium text-amber-900">
            {t("users.entreprise.missingTitle")}
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {t("users.entreprise.missingBody")}{" "}
            <Link
              to="/mon-entreprise"
              className="font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
            >
              {t("nav.myEntreprise")}
            </Link>
            .
          </p>
        </div>
      )}

      {isPrestataireScoped && hasEntreprise && perms && !perms.canCreate && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 sm:px-4">
          <p className="text-sm font-medium text-amber-900">
            {t("users.entreprise.creationDisabledTitle")}
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {t("users.entreprise.creationDisabledBody")}
          </p>
        </div>
      )}

      <StatStrip
        items={
          isPrestataireScoped
            ? [
                { label: t("users.stats.total"), value: stats.total },
                { label: t("users.stats.active"), value: stats.actifs },
                { label: t("users.stats.inactive"), value: stats.inactifs },
              ]
            : [
                { label: t("users.stats.total"), value: stats.total },
                { label: t("users.stats.active"), value: stats.actifs },
                { label: t("users.stats.inactive"), value: stats.inactifs },
                { label: t("users.stats.prestataires"), value: stats.prestataires },
                { label: t("users.stats.teamToa"), value: stats.toa },
              ]
        }
      />

      <div className={cn('rounded-lg border border-gray-200 bg-white', listFiltersContainerClass)}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Input
            placeholder={t("users.search")}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="min-h-[44px]"
          />
          <Select
            options={isPrestataireScoped ? prestataireRoleOptions : roleOptions}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t("users.filterRole")}
            className="min-h-[44px]"
          />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            placeholder={t("users.filterStatus")}
            className="min-h-[44px]"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-3 py-3 sm:px-4">
          <h2 className="text-sm font-medium text-gray-700">
            {t("users.listTitle", { count: filteredUsers.length })}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {isPrestataireScoped
              ? t("users.listSubtitleEntreprise", {
                  entreprise: scopedEntrepriseName ?? "—",
                })
              : t("users.listSubtitle", { count: stats.prestataires })}
          </p>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="px-3 py-10 text-center sm:px-4">
            <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" aria-hidden />
            <p className="text-sm text-gray-500">
              {isPrestataireScoped && !hasEntreprise
                ? t("users.entreprise.emptyNoEntreprise")
                : t("users.empty")}
            </p>
            {perms?.canCreate && (!isPrestataireScoped || hasEntreprise) && (
              <Link to="/users/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-5 w-5" />
                  {t("users.createAction")}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      {t("users.table.user")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      {t("users.table.contact")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      {t("users.table.role")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      {t("users.table.status")}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      {t("users.table.createdAt")}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {t("users.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pagedUsers.map((user) => {
                    const role = getDisplayRole(user.roles);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                              <span className="text-sm font-semibold text-blue-700">
                                {user.firstname.charAt(0)}
                                {user.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatUserDisplayName(user)}
                                {String(user.id) === currentUser?.id && (
                                  <span className="ml-1 text-xs text-blue-600">
                                    ({t("users.you")})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-4 py-3">{renderRoleBadge(role)}</td>
                        <td className="px-4 py-3">
                          {renderStatusBadge(user.isActive)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {perms?.canEdit && (
                              <TableIconButton
                                title={t("common.edit")}
                                onClick={() =>
                                  navigate(`/users/${user.id}/edit`)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </TableIconButton>
                            )}
                            {perms?.canDelete && (
                              <TableIconButton
                                title={
                                  String(user.id) === currentUser?.id
                                    ? t("users.cannotDeleteSelf")
                                    : t("common.delete")
                                }
                                variant="danger"
                                disabled={String(user.id) === currentUser?.id}
                                onClick={() =>
                                  setDeleteTarget({
                                    id: user.id,
                                    name: formatUserDisplayName(user),
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

            <ul className="divide-y divide-gray-100 lg:hidden">
              {pagedUsers.map((user) => {
                const role = getDisplayRole(user.roles);
                return (
                  <li key={user.id} className="px-3 py-3 sm:px-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <span className="text-sm font-semibold text-blue-700">
                          {user.firstname.charAt(0)}
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {formatUserDisplayName(user)}
                              {String(user.id) === currentUser?.id && (
                                <span className="text-xs text-blue-600">
                                  {" "}
                                  ({t("users.you")})
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {user.email}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5">
                            {perms?.canEdit && (
                              <TableIconButton
                                title={t("common.edit")}
                                onClick={() =>
                                  navigate(`/users/${user.id}/edit`)
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </TableIconButton>
                            )}
                            {perms?.canDelete && (
                              <TableIconButton
                                title={t("common.delete")}
                                variant="danger"
                                disabled={String(user.id) === currentUser?.id}
                                onClick={() =>
                                  setDeleteTarget({
                                    id: user.id,
                                    name: formatUserDisplayName(user),
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </TableIconButton>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {renderRoleBadge(role)}
                          {renderStatusBadge(user.isActive)}
                          <span className="text-xs text-gray-400">
                            {formatDate(user.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-gray-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <p className="text-sm text-gray-600">
                  Page {page} / {totalPages} ({totalItems}{" "}
                  {t("users.stats.total")})
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="min-h-[44px] rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("common.previous")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="min-h-[44px] rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("common.next")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 sm:px-4">
        <div className="flex gap-3">
          <Shield
            className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 sm:h-5 sm:w-5"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-blue-900">
              {t("users.iso.title")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-blue-800 sm:text-sm">
              {t("users.iso.body")}
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("users.deleteConfirm.title")}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t("users.deleteConfirm.message")}{" "}
            <strong>{deleteTarget?.name}</strong>.{" "}
            {t("users.deleteConfirm.irreversible")}
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
