import type { MenuNode } from '@/types'
import { isPrestataireEntrepriseScoped } from '@/features/users/utils/entrepriseScope'

export const PRESTATAIRE_ENTREPRISE_ROUTE = '/mon-entreprise'

function flattenMenu(nodes: MenuNode[]): MenuNode[] {
  const out: MenuNode[] = []
  const walk = (items: MenuNode[]) => {
    for (const node of items) {
      out.push(node)
      walk(node.children)
    }
  }
  walk(nodes)
  return out
}

export function injectPrestataireEntrepriseMenu(
  items: MenuNode[],
  label: string,
  roles: string[],
): MenuNode[] {
  if (!isPrestataireEntrepriseScoped(roles)) return items

  if (flattenMenu(items).some((n) => n.route === PRESTATAIRE_ENTREPRISE_ROUTE)) {
    return items
  }

  const entrepriseItem: MenuNode = {
    id: -9001,
    name: label,
    icon: 'Building2',
    route: PRESTATAIRE_ENTREPRISE_ROUTE,
    children: [],
    canView: true,
  }

  const usersIndex = items.findIndex((n) => n.route === '/users')
  if (usersIndex >= 0) {
    return [...items.slice(0, usersIndex), entrepriseItem, ...items.slice(usersIndex)]
  }

  return [...items, entrepriseItem]
}
