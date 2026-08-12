import { FileText, Users, Calendar, Shield, Clipboard, type LucideIcon } from "lucide-react"

export interface QuickLink {
  labelKey: string
  descKey: string
  icon: LucideIcon
  route: string
}

export const quickLinks: QuickLink[] = [
  {
    labelKey: "dashboard.quickLinks.planning",
    descKey: "dashboard.quickLinks.planningDesc",
    icon: Calendar,
    route: "/planning",
  },
  {
    labelKey: "dashboard.quickLinks.permits",
    descKey: "dashboard.quickLinks.permitsDesc",
    icon: FileText,
    route: "/permits-travail",
  },
  {
    labelKey: "dashboard.quickLinks.prevention",
    descKey: "dashboard.quickLinks.preventionDesc",
    icon: Shield,
    route: "/prevention",
  },
  {
    labelKey: "dashboard.quickLinks.interventions",
    descKey: "dashboard.quickLinks.interventionsDesc",
    icon: Clipboard,
    route: "/interventions",
  },
  {
    labelKey: "dashboard.quickLinks.users",
    descKey: "dashboard.quickLinks.usersDesc",
    icon: Users,
    route: "/users",
  },
]
