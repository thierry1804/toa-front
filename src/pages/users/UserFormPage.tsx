import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
} from "@/features/users/hooks/useUsers";
import { useUiStore } from "@/store/ui.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Checkbox from "@/components/ui/Checkbox";
import {
  ArrowLeft,
  Save,
  UserPlus,
  Shield,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react";

const roleOptions = [
  { value: "ROLE_SUPER_ADMIN", label: "Super Admin" },
  { value: "ROLE_ADMIN", label: "Admin" },
  { value: "ROLE_CHEF_PROJET", label: "Chef de Projet" },
  { value: "ROLE_HSE", label: "HSE" },
  { value: "ROLE_PRESTATAIRE", label: "Prestataire" },
  { value: "ROLE_DG", label: "DG" },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ROLE_SUPER_ADMIN: [
    "Accès complet à toutes les fonctionnalités",
    "Gestion des utilisateurs et des rôles",
    "Configuration système",
  ],
  ROLE_ADMIN: [
    "Gestion des permis et plans de prévention",
    "Gestion des utilisateurs",
    "Accès aux statistiques",
  ],
  ROLE_CHEF_PROJET: [
    "Examen et validation des demandes de permis",
    "Ajout de commentaires sur les permis",
    "Suivi des interventions",
    "Consultation des statistiques",
  ],
  ROLE_HSE: [
    "Attribution des références aux permis validés",
    "Vérification des plans de prévention",
    "Suivi quotidien des interventions",
    "Validation des Take 5",
    "Maîtrise des risques et incidents",
    "Clôture des interventions",
  ],
  ROLE_PRESTATAIRE: [
    "Création de plans de prévention",
    "Demande de permis de travail",
    "Suivi de ses propres interventions",
    "Soumission de validations journalières",
    "Réalisation de Take 5",
    "Signalement d'incidents",
  ],
  ROLE_DG: [
    "Vue d'ensemble de tous les permis et interventions",
    "Accès aux tableaux de bord et KPI",
    "Consultation des statistiques globales",
  ],
};

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canAccessFeature } = useAuthStore();
  const addToast = useUiStore((s) => s.addToast);
  const { data: users } = useUsers();
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();

  const isEditMode = !!id;
  const existingUser = isEditMode
    ? users?.find((u) => String(u.id) === id)
    : null;

  const [formData, setFormData] = useState({
    firstname: "",
    name: "",
    email: "",
    role: "ROLE_PRESTATAIRE",
    entreprise: "",
    actif: true,
    plainPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existingUser) {
      setFormData({
        firstname: existingUser.firstname,
        name: existingUser.name,
        email: existingUser.email,
        role:
          existingUser.roles.find((r) => r.startsWith("ROLE_")) ??
          "ROLE_PRESTATAIRE",
        entreprise: "",
        actif: existingUser.roles.length > 0,
        plainPassword: "",
        confirmPassword: "",
      });
    }
  }, [existingUser]);

  useEffect(() => {
    if (!canAccessFeature(isEditMode ? "edit_users" : "create_users")) {
      navigate("/users");
      addToast({ message: "Permission refusée", type: "error" });
    }
  }, [isEditMode, navigate, addToast, canAccessFeature]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Le nom est obligatoire";
    if (!formData.firstname.trim())
      newErrors.firstname = "Le prénom est obligatoire";

    if (!formData.email.trim()) {
      newErrors.email = "L'email est obligatoire";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    } else if (!isEditMode && users) {
      const exists = users.some(
        (u) =>
          u.email.toLowerCase() === formData.email.toLowerCase() &&
          String(u.id) !== id,
      );
      if (exists) newErrors.email = "Cet email est déjà utilisé";
    }

    if (!isEditMode) {
      if (!formData.plainPassword) {
        newErrors.plainPassword = "Le mot de passe est obligatoire";
      } else if (formData.plainPassword.length < 6) {
        newErrors.plainPassword =
          "Le mot de passe doit contenir au moins 6 caractères";
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Veuillez confirmer le mot de passe";
      } else if (formData.plainPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
      }
    } else if (formData.plainPassword) {
      if (formData.plainPassword.length < 6) {
        newErrors.plainPassword =
          "Le mot de passe doit contenir au moins 6 caractères";
      }
      if (formData.plainPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast({
        message: "Veuillez corriger les erreurs du formulaire",
        type: "error",
      });
      return;
    }

    const roles = [formData.role];

    if (isEditMode && existingUser) {
      updateUser(
        {
          id: existingUser.id,
          data: {
            email: formData.email.trim().toLowerCase(),
            name: formData.name.trim(),
            firstname: formData.firstname.trim(),
            roles,
            ...(formData.plainPassword
              ? { plainPassword: formData.plainPassword }
              : {}),
          },
        },
        {
          onSuccess: () =>
            addToast({
              message: "Utilisateur modifié avec succès",
              type: "success",
            }),
          onError: () =>
            addToast({
              message: "Erreur lors de la modification",
              type: "error",
            }),
        },
      );
    } else {
      createUser(
        {
          email: formData.email.trim().toLowerCase(),
          name: formData.name.trim(),
          firstname: formData.firstname.trim(),
          plainPassword: formData.plainPassword,
          roles,
        },
        {
          onSuccess: () =>
            addToast({
              message: "Utilisateur créé avec succès",
              type: "success",
            }),
          onError: () =>
            addToast({ message: "Erreur lors de la création", type: "error" }),
        },
      );
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, role: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {isEditMode ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
            </h2>
            <p className="mt-1 text-gray-600">
              {isEditMode
                ? "Modifier les informations de l'utilisateur"
                : "Créer un nouveau compte utilisateur"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">
              {" "}
              Informations personnelles{" "}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom *"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={errors.name}
                placeholder="Ex: RAKOTO"
                required
              />
              <Input
                label="Prénom *"
                value={formData.firstname}
                onChange={(e) =>
                  setFormData({ ...formData, firstname: e.target.value })
                }
                error={errors.firstname}
                placeholder="Ex: Jean"
                required
              />
            </div>
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
              placeholder="exemple@entreprise.mg"
              required
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Shield className="h-5 w-5 text-blue-600" />
              Rôle et permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Rôle *"
              options={roleOptions}
              value={formData.role}
              onChange={handleRoleChange}
              error={errors.role}
              required
            />

            {formData.role === "ROLE_PRESTATAIRE" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-2">
                      {" "}
                      Informations prestataire
                    </h4>
                    <Input
                      label="Entreprise *"
                      value={formData.entreprise}
                      onChange={(e) =>
                        setFormData({ ...formData, entreprise: e.target.value })
                      }
                      error={errors.entreprise}
                      placeholder="Ex: eTech Consulting"
                      required
                    />
                    <p className="text-xs text-blue-700 mt-2">
                      TOA travaille avec des prestataires partenaires.Chaque
                      prestataire doit remplir un plan de prévention et obtenir
                      un permis avant chaque intervention.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                {" "}
                Permissions de ce rôle:{" "}
              </h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                {(ROLE_PERMISSIONS[formData.role] ?? []).map((perm, i) => (
                  <li key={i}> {perm} </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">
              {" "}
              Sécurité {!isEditMode && "*"}{" "}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditMode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  Laissez les champs vides pour conserver le mot de passe
                  actuel.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  label={`Mot de passe ${!isEditMode ? "*" : ""}`}
                  type={showPassword ? "text" : "password"}
                  value={formData.plainPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, plainPassword: e.target.value })
                  }
                  error={errors.plainPassword}
                  placeholder="Minimum 6 caractères"
                  required={!isEditMode}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Input
                label={`Confirmer le mot de passe ${!isEditMode ? "*" : ""}`}
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                error={errors.confirmPassword}
                placeholder="Retaper le mot de passe"
                required={!isEditMode}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900"> Statut du compte </CardTitle>
          </CardHeader>
          <CardContent>
            <Checkbox
              label="Compte actif"
              description="Un compte inactif ne pourra pas se connecter à la plateforme"
              checked={formData.actif}
              onChange={(e) =>
                setFormData({ ...formData, actif: e.target.checked })
              }
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4 pt-4 border-t">
          <Link to="/users">
            <Button type="button" variant="outline">
              {" "}
              Annuler{" "}
            </Button>
          </Link>
          <Button type="submit" isLoading={isCreating || isUpdating}>
            {isEditMode ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les modifications
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Créer l'utilisateur
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
