import { PageHeader } from '@/components/layout/PageHeader'

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Vue d'ensemble de l'activité" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Permis actifs</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">—</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">En attente</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">—</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Validés ce mois</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">—</p>
        </div>
      </div>
    </div>
  )
}
