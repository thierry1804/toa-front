import { FileText, Users, Calendar, Shield, Clipboard } from "lucide-react"

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
    route: "/permits-travail",
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
    route: "/interventions",
    desc: "Suivi des interventions",
  },
  {
    label: "Utilisateurs",
    icon: Users,
    route: "/users",
    desc: "Gestion des comptes",
  },
]
