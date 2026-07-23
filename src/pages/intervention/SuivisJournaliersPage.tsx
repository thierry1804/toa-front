import { useNavigate } from 'react-router-dom'
import { ClipboardList, ArrowRight, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import AvancementBadge from '@/components/intervention/AvancementBadge'
import { useQuery } from '@tanstack/react-query'
import { interventionApi } from '@/api/interventionApi'
import { INTERVENTION_KEY } from '@/data/constant/query'

export default function SuivisJournaliersPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: INTERVENTION_KEY,
    queryFn: () => interventionApi.getAll(),
    select: (d) =>
      (d.member ?? []).filter((i) => i.statut === 'EVALUATION_COMPLETE'),
  })

  const interventions = data ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Chargement…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-gray-400" />
            Suivis journaliers
          </span>
        }
        description="Interventions dont l'évaluation est complète — saisissez vos suivis quotidiens"
      />

      {interventions.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucune intervention en cours de suivi</p>
            <p className="text-sm text-gray-400 mt-1">
              Seules les interventions dont l'évaluation des risques est validée apparaissent ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {interventions.map((intervention) => {
            const permit = typeof intervention.permitTravail === 'object'
              ? intervention.permitTravail
              : null
            const ref = permit?.reference ?? intervention.permitTravailId ?? '—'
            const site = permit?.codeSite ?? '—'

            return (
              <Card key={intervention.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-blue-700 font-mono truncate">{ref}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{site}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <AvancementBadge pct={0} />
                    <Button
                      size="sm"
                      onClick={() => navigate(`/interventions/${intervention.id}/suivis`)}
                    >
                      Suivis
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
