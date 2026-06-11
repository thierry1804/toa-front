import api from '@/lib/axios'
import type { MenuNode } from '@/types'

export async function fetchUserMenu(): Promise<MenuNode[]> {
  const { data } = await api.get<MenuNode[]>('/api/my-menu', {
    headers: { Accept: 'application/json' },
  })
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && 'member' in data) return (data as { member: MenuNode[] }).member
  return []
}

export function fetchMenus() {
  return api.get('/api/menus').then((r) => r.data)
}
