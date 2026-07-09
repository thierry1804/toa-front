import { Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import MenuMatrix from '@/components/menus/MenuMatrix'
import { useRoleManagement } from '@/features/roles/hooks/useRoleManagement'

export default function RolesManagementPage() {
  const { menuItems, roles, entries, toggling, toggle, isLoading } = useRoleManagement()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Gestion des rôles</h2>
        <p className="mt-1 text-gray-600">Gérez les accès aux menus par rôle</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Shield className="h-5 w-5 text-blue-600" />
            Matrice des permissions
          </CardTitle>
        </CardHeader>
        {/* CardContent has no overflow — scroll is contained inside MenuMatrix */}
        <CardContent>
          <MenuMatrix
            menuItems={menuItems}
            roles={roles}
            entries={entries}
            toggling={toggling}
            onToggle={toggle}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
