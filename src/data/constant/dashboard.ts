import { FileText, Clock, CheckCircle, Users, Calendar, Shield, Clipboard } from "lucide-react"

export const stats = [
  {
    label: "Permis actifs",
    value: "—",
    icon: FileText,
    gradient: "from-blue-500 to-blue-600",
    bgLight: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "En attente",
    value: "—",
    icon: Clock,
    gradient: "from-amber-500 to-amber-600",
    bgLight: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    label: "Validés ce mois",
    value: "—",
    icon: CheckCircle,
    gradient: "from-emerald-500 to-emerald-600",
    bgLight: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Intervenants",
    value: "—",
    icon: Users,
    gradient: "from-violet-500 to-violet-600",
    bgLight: "bg-violet-50",
    iconColor: "text-violet-600",
  },
]

export const quickLinks = [
  {
    label: "Planification",
    icon: Calendar,
    route: "/planning",
    desc: "Gérer le planning des activités",
  },
  {
    label: "Permis de travail",
    icon: FileText,
    route: "/permits",
    desc: "Consulter et créer des permis",
  },
  {
    label: "Prévention",
    icon: Shield,
    route: "/prevention",
    desc: "Plans de prévention",
  },
  {
    label: "Interventions",
    icon: Clipboard,
    route: "/permits",
    desc: "Suivi des interventions",
  },
  {
    label: "Utilisateurs",
    icon: Users,
    route: "/users",
    desc: "Gestion des comptes",
  },
]
