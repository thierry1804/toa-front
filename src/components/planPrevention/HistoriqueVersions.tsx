import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import type { VersionPlanPrevention } from '@/types/planPrevention'

interface HistoriqueVersionsProps {
  versions: VersionPlanPrevention[]
}

export default function HistoriqueVersions({ versions }: HistoriqueVersionsProps) {
  const [open, setOpen] = useState(false)

  if (versions.length === 0) return null

  return (
    <Card>
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            Historique des resoumissions ({versions.length})
          </CardTitle>
          {open ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </CardHeader>
      {open && (
        <CardContent>
          <ol className="space-y-3">
            {versions.map((v) => {
              const createdBy = `${v.createdBy.firstname ?? ''} ${v.createdBy.name}`.trim()
              const date = new Date(v.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
              return (
                <li key={v.id} className="border-l-2 border-blue-200 pl-4 py-1">
                  <p className="text-sm font-medium text-gray-800">Version {v.numeroVersion}</p>
                  <p className="text-xs text-gray-500">
                    {date} — par {createdBy}
                  </p>
                  {v.motifResoumission && (
                    <p className="mt-1 text-xs text-gray-600 italic">{v.motifResoumission}</p>
                  )}
                </li>
              )
            })}
          </ol>
        </CardContent>
      )}
    </Card>
  )
}
