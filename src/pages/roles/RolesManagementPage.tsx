import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardSectionHeader } from '@/components/ui/Card'
import MenuMatrix from '@/components/menus/MenuMatrix'
import { useRoleManagement } from '@/features/roles/hooks/useRoleManagement'

export default function RolesManagementPage() {
  const { t } = useTranslation()
  const { menuItems, roles, entries, toggling, toggle, isLoading } = useRoleManagement()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('roles.title')}
        description={t('roles.management.description')}
      />

      <Card>
        <CardSectionHeader>
          <h2 className="text-sm font-semibold text-gray-900">
            {t('roles.management.permissionsMatrix')}
          </h2>
        </CardSectionHeader>
        <CardContent className="p-4">
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
