import { List } from 'lucide-react'

export default function GestionListesPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
          <List className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gestion de liste</h1>
          <p className="text-sm text-gray-500">À implémenter</p>
        </div>
      </div>
    </div>
  )
}
