import { Shield, Building2, Briefcase } from "lucide-react";

export type Feature =
  | "view_users"
  | "create_users"
  | "edit_users"
  | "delete_users"
  | "view_planning"
  | "create_planning"
  | "edit_planning"
  | "delete_planning"
  | "manage_menus"
  | "edit_permits"
  | "validate_permits_chef"
  | "validate_permits_hse"
  | "validate_interventions"
  | "start_interventions"
  | "suspend_interventions"
  | "resume_interventions"
  | "close_interventions"
  | "validate_prevention_plans_chef"
  | "validate_prevention_plans_hse";

export const ROLE_FEATURES: Record<string, Feature[]> = {
  super_admin: [
    "view_users",
    "create_users",
    "edit_users",
    "delete_users",
    "view_planning",
    "create_planning",
    "edit_planning",
    "delete_planning",
    "manage_menus",
  ],
  admin: [
    "view_users",
    "create_users",
    "edit_users",
    "delete_users",
    "view_planning",
    "create_planning",
    "edit_planning",
    "delete_planning",
  ],
  chef_projet: [
    "view_users",
    "view_planning",
    "create_planning",
    "edit_planning",
    "delete_planning",
  ],
  hse: ["view_users", "view_planning"],
  prestataire: ["view_planning"],
  dg: ["view_users", "view_planning"],
};

export const ROLE_MAP: Record<string, string> = {
  ROLE_SUPER_ADMIN: "super_admin",
  ROLE_ADMIN: "admin",
  ROLE_CHEF_PROJET: "chef_projet",
  ROLE_HSE: "hse",
  ROLE_PRESTATAIRE: "prestataire",
  ROLE_AGENT_TERRAIN: "agent_terrain",
  ROLE_DG: "dg",
};

export const ROLE_LABELS: Record<string, string> = {
  ROLE_SUPER_ADMIN: "Super Admin",
  ROLE_ADMIN: "Admin",
  ROLE_CHEF_PROJET: "Chef de Projet",
  ROLE_HSE: "HSE",
  ROLE_PRESTATAIRE: "Prestataire",
  ROLE_AGENT_TERRAIN: "Agent de terrain",
  ROLE_DG: "DG",
};

export const ROLES = [
  "ROLE_SUPER_ADMIN",
  "ROLE_ADMIN",
  "ROLE_CHEF_PROJET",
  "ROLE_HSE",
  "ROLE_PRESTATAIRE",
  "ROLE_AGENT_TERRAIN",
  "ROLE_DG",
];

export const ROLE_CONFIG: Record<
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
  ROLE_AGENT_TERRAIN: {
    labelKey: "roles.agent_terrain",
    variant: "secondary",
    icon: Building2,
  },
  ROLE_DG: { labelKey: "roles.dg", variant: "info", icon: Briefcase },
};

export const roleOptions = [
  { value: "all", label: "Tous les rôles" },
  { value: "ROLE_SUPER_ADMIN", label: "Super Admin" },
  { value: "ROLE_ADMIN", label: "Admin" },
  { value: "ROLE_CHEF_PROJET", label: "Chef de Projet" },
  { value: "ROLE_HSE", label: "HSE" },
  { value: "ROLE_PRESTATAIRE", label: "Prestataire" },
  { value: "ROLE_AGENT_TERRAIN", label: "Agent de terrain" },
  { value: "ROLE_DG", label: "DG" },
];

export const statusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "actif", label: "Actifs" },
  { value: "inactif", label: "Inactifs" },
];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
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
    "Planification des tâches",
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
  ROLE_AGENT_TERRAIN: [
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
