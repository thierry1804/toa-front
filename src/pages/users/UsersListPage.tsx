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
import {
  Users,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Building2,
  Shield,
  Briefcase,
} from "lucide-react";
import { formatDate } from "@/utils/date";

const ROLE_CONFIG: Record<
  string,
  {
    labelKey: string;
    variant: "danger" | "warning" | "success" | "secondary" | "info";
    icon: typeof Shield;
  }
> = {
  ROLE_SUPER_ADMIN: {
    labelKey: "roles.super_admin",
    variant: "danger",
    icon: Shield,
  },
  ROLE_ADMIN: { labelKey: "roles.admin", variant: "warning", icon: Shield },
  ROLE_CHEF_PROJET: {
    labelKey: "roles.chef_projet",
    variant: "info",
    icon: Briefcase,
  },
  ROLE_HSE: { labelKey: "roles.hse", variant: "success", icon: Shield },
  ROLE_PRESTATAIRE: {
    labelKey: "roles.prestataire",
    variant: "secondary",
    icon: Building2,
  },
  ROLE_DG: { labelKey: "roles.dg", variant: "info", icon: Briefcase },
};

function getDisplayRole(roles: string[]): string {
  return roles.find((r) => r.startsWith("ROLE_")) ?? "ROLE_PRESTATAIRE";
}

const roleOptions = [
  { value: "all", label: "Tous les rôles" },
  { value: "ROLE_SUPER_ADMIN", label: "Super Admin" },
  { value: "ROLE_ADMIN", label: "Admin" },
  { value: "ROLE_CHEF_PROJET", label: "Chef de Projet" },
  { value: "ROLE_HSE", label: "HSE" },
  { value: "ROLE_PRESTATAIRE", label: "Prestataire" },
  { value: "ROLE_DG", label: "DG" },
];

const statusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "actif", label: "Actifs" },
  { value: "inactif", label: "Inactifs" },
];

export default function UsersListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser, canAccessFeature } = useAuthStore();
  const addToast = useUiStore((s) => s.addToast);
  const { data: users, isLoading } = useUsers();
  const { mutate: deleteUser } = useDeleteUser();
  const perms = usePermissions('/users');

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const filteredUsers = (users ?? []).filter((user) => {
    const fullName = `${user.firstname} ${user.name}`.toLowerCase();
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

  const stats = {
    total: users?.length ?? 0,
    actifs: users?.filter((u) => u.roles.length > 0).length ?? 0,
    inactifs: users?.filter((u) => u.roles.length === 0).length ?? 0,
    prestataires:
      users?.filter((u) => u.roles.includes("ROLE_PRESTATAIRE")).length ?? 0,
    toa:
      users?.filter((u) => !u.roles.includes("ROLE_PRESTATAIRE")).length ?? 0,
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser(deleteTarget.id, {
      onSuccess: () => {
        addToast({
          message: "Utilisateur supprimé avec succès",
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {" "}
            {t("users.title")}{" "}
          </h2>
          <p className="mt-1 text-gray-600">
            Gestion des utilisateurs et des accès à la plateforme
          </p>
        </div>
        {perms?.canCreate && (
          <Link to="/users/new">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              Nouvel utilisateur
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
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600"> Actifs </p>
                <p className="text-2xl font-bold text-green-600">
                  {" "}
                  {stats.actifs}{" "}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600"> Inactifs </p>
                <p className="text-2xl font-bold text-red-600">
                  {" "}
                  {stats.inactifs}{" "}
                </p>
              </div>
              <UserX className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600"> Prestataires </p>
                <p className="text-2xl font-bold text-blue-600">
                  {" "}
                  {stats.prestataires}{" "}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600"> Équipe TOA </p>
                <p className="text-2xl font-bold text-purple-600">
                  {" "}
                  {stats.toa}{" "}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Rechercher par nom, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select
              options={roleOptions}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              placeholder="Filtrer par rôle"
            />
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Filtrer par statut"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs({filteredUsers.length}) </CardTitle>
          <CardDescription>
            {stats.prestataires} prestataires sur les entreprises partenaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500"> Aucun utilisateur trouvé </p>
              {perms?.canCreate && (
                <Link to="/users/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-5 w-5 mr-2" />
                    Créer un utilisateur
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      {" "}
                      Utilisateur{" "}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      {" "}
                      Contact{" "}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      {" "}
                      Rôle{" "}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      {" "}
                      Statut{" "}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      {" "}
                      Créé le{" "}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {" "}
                      Actions{" "}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
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
                                {user.firstname} {user.name}
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
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {perms?.canDelete && (
                              <button
                                onClick={() =>
                                  setDeleteTarget({
                                    id: user.id,
                                    name: `${user.firstname} ${user.name}`,
                                  })
                                }
                                disabled={String(user.id) === currentUser?.id}
                                className="p-1.5 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-40 enabled:text-gray-600 enabled:hover:text-red-600 enabled:hover:bg-red-50"
                                title={
                                  String(user.id) === currentUser?.id
                                    ? "Vous ne pouvez pas supprimer votre propre compte"
                                    : "Supprimer"
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
        title="Confirmer la suppression"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes - vous sûr de vouloir supprimer l'utilisateur{" "}
            <strong>{deleteTarget?.name}</strong> ? Cette action est
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
