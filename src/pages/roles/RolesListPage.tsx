import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRoles, useDeleteRole } from "@/features/roles/hooks/useRoles";
import { usePermissions } from "@/features/menus/hooks/usePermissions";
import { useUiStore } from "@/store/ui.store";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { StatStrip } from "@/components/ui/StatStrip";
import ListPageSkeleton from "@/components/ui/ListPageSkeleton";
import { ShieldCheck, Plus, Edit, Trash2, Lock } from "lucide-react";
import { formatDate } from "@/utils/date";

export default function RolesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  const { mutate: deleteRole } = useDeleteRole();
  const perms = usePermissions("/roles");

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    label: string;
  } | null>(null);

  const { data: hydraData, isLoading } = useRoles(1, 100);
  const roles = hydraData?.member ?? [];
  const totalItems = hydraData?.totalItems ?? 0;

  const filtered = roles.filter((role) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      role.name.toLowerCase().includes(q) ||
      role.label.toLowerCase().includes(q) ||
      (role.description ?? "").toLowerCase().includes(q)
    );
  });

  const stats = {
    total: totalItems,
    system: roles.filter((r) => r.isSystem).length,
    custom: roles.filter((r) => !r.isSystem).length,
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteRole(deleteTarget.id, {
      onSuccess: () => {
        addToast({ message: t("roles.toast.deleted"), type: "success" });
        setDeleteTarget(null);
      },
      onError: (err: any) => {
        const key = err?.response?.data?.error_key;
        if (key === "role_in_use") {
          addToast({ message: t("roles.toast.deleteErrorInUse"), type: "error" });
        } else {
          addToast({ message: t("roles.toast.deleteError"), type: "error" });
        }
        setDeleteTarget(null);
      },
    });
  };

  if (isLoading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("roles.title")}
          </h2>
          <p className="mt-1 text-sm text-gray-600">{t("roles.description")}</p>
        </div>
        {perms?.canCreate && (
          <Link to="/roles/new" className="self-start sm:self-auto">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              {t("roles.newRole")}
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <StatStrip
        items={[
          { label: t("roles.stats.total"), value: stats.total },
          { label: t("roles.stats.system"), value: stats.system },
          { label: t("roles.stats.custom"), value: stats.custom },
        ]}
      />

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <Input
            placeholder={t("roles.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("roles.title")} ({filtered.length})</CardTitle>
          <CardDescription>{t("roles.tableDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t("roles.empty")}</p>
              {perms?.canCreate && (
                <Link to="/roles/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-5 w-5 mr-2" />
                    {t("roles.createAction")}
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
                        {t("roles.table.label")}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t("roles.table.name")}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t("roles.table.type")}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t("roles.table.description")}
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
                    {filtered.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900">
                              {role.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                            {role.name}
                          </code>
                        </td>
                        <td className="px-4 py-4">
                          {role.isSystem ? (
                            <Badge variant="info">
                              <Lock className="h-3 w-3 mr-1" />
                              {t("roles.badge.system")}
                            </Badge>
                          ) : (
                            <Badge variant="success">
                              {t("roles.badge.custom")}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-500">
                            {role.description ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {formatDate(role.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {perms?.canEdit && (
                              <button
                                onClick={() => navigate(`/roles/${role.id}/edit`)}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title={t("common.edit")}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {perms?.canDelete && (
                              <button
                                onClick={() =>
                                  setDeleteTarget({ id: role.id, label: role.label })
                                }
                                disabled={role.isSystem}
                                className="p-1.5 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-30 enabled:text-gray-600 enabled:hover:text-red-600 enabled:hover:bg-red-50"
                                title={
                                  role.isSystem
                                    ? t("roles.systemRoleProtected")
                                    : t("common.delete")
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden space-y-3">
                {filtered.map((role) => (
                  <div
                    key={role.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <p className="text-sm font-semibold text-gray-900">
                            {role.label}
                          </p>
                        </div>
                        <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                          {role.name}
                        </code>
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        {perms?.canEdit && (
                          <button
                            onClick={() => navigate(`/roles/${role.id}/edit`)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {perms?.canDelete && (
                          <button
                            onClick={() =>
                              setDeleteTarget({ id: role.id, label: role.label })
                            }
                            disabled={role.isSystem}
                            className="p-1.5 rounded-md disabled:cursor-not-allowed disabled:opacity-30 enabled:text-gray-400 enabled:hover:text-red-600 enabled:hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {role.isSystem ? (
                        <Badge variant="info">
                          <Lock className="h-3 w-3 mr-1" />
                          {t("roles.badge.system")}
                        </Badge>
                      ) : (
                        <Badge variant="success">{t("roles.badge.custom")}</Badge>
                      )}
                      {role.description && (
                        <span className="text-xs text-gray-500">{role.description}</span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {formatDate(role.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t("roles.deleteConfirm.title")}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t("roles.deleteConfirm.message")}{" "}
            <strong>{deleteTarget?.label}</strong> ?{" "}
            {t("roles.deleteConfirm.irreversible")}
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
