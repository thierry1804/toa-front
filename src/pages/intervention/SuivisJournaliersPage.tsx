import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AvancementBadge from '@/components/intervention/AvancementBadge'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import { StatStrip } from '@/components/ui/StatStrip'
import { useQuery } from '@tanstack/react-query'
import { interventionApi } from '@/api/interventionApi'
import { INTERVENTION_KEY, SUIVI_JOURNALIER_KEY } from '@/data/constant/query'

function AvancementCell({ interventionId }: { interventionId: string }) {
  const { data } = useQuery({
    queryKey: [...SUIVI_JOURNALIER_KEY, interventionId],
    queryFn: () => interventionApi.getSuivis(interventionId),
    select: (d) => {
      const items = d.member ?? []
      if (items.length === 0) return 0
      const sum = items.reduce((acc, s) => acc + (s.avancementPourcentage ?? 0), 0)
      return Math.round(sum / items.length)
    },
  })
  return <AvancementBadge pct={data ?? 0} />
}

export default function SuivisJournaliersPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: INTERVENTION_KEY,
    queryFn: () => interventionApi.getAll(),
    select: (d) =>
      (d.member ?? []).filter((i) => i.statut === 'EVALUATION_COMPLETE'),
  })

  const interventions = data ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return interventions
    return interventions.filter((intervention) => {
      const permit = typeof intervention.permitTravail === 'object' ? intervention.permitTravail : null
      const ref = (permit?.reference ?? intervention.permitTravailId ?? '').toLowerCase()
      const site = (permit?.codeSite ?? '').toLowerCase()
      return ref.includes(q) || site.includes(q)
    })
  }, [interventions, search])

  const withSuivi = useMemo(
    () => filtered.filter((i) => i.statut === 'EVALUATION_COMPLETE').length,
    [filtered],
  )

  if (isLoading) {
    return <ListPageSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('intervention.pages.suivisJournaliers.title')}
        description={t('intervention.pages.suivisJournaliers.description')}
      />

      <StatStrip
        items={[
          { label: t('intervention.pages.suivisJournaliers.stats.total'), value: filtered.length },
          { label: t('intervention.pages.suivisJournaliers.stats.ready'), value: withSuivi },
        ]}
      />

      <Card>
        <CardHeader className="space-y-3 pb-4">
          <div>
            <CardTitle>
              {t('intervention.pages.suivisJournaliers.listTitle', { count: filtered.length })}
            </CardTitle>
            <CardDescription>{t('intervention.pages.suivisJournaliers.listDescription')}</CardDescription>
          </div>
          <Input
            placeholder={t('intervention.pages.suivisJournaliers.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full shadow-none"
          />
        </CardHeader>
        <CardContent className={filtered.length === 0 ? undefined : 'p-0'}>
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-medium text-gray-600">
                {search
                  ? t('intervention.pages.suivisJournaliers.emptySearch')
                  : t('intervention.pages.suivisJournaliers.empty.title')}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? t('intervention.pages.suivisJournaliers.emptySearchHint')
                  : t('intervention.pages.suivisJournaliers.empty.description')}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t('intervention.pages.suivisJournaliers.headers.reference')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t('intervention.pages.suivisJournaliers.headers.site')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t('intervention.pages.suivisJournaliers.headers.avancement')}
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {t('intervention.pages.suivisJournaliers.headers.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((intervention) => {
                      const permit =
                        typeof intervention.permitTravail === 'object' ? intervention.permitTravail : null
                      const ref = permit?.reference ?? intervention.permitTravailId ?? '—'
                      const site = permit?.codeSite ?? '—'

                      return (
                        <tr key={intervention.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium font-mono text-gray-900">{ref}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                              {site}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <AvancementCell interventionId={intervention.id} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/interventions/${intervention.id}/suivis`)}
                            >
                              {t('intervention.pages.suivisJournaliers.viewButton')}
                              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-gray-200 lg:hidden">
                {filtered.map((intervention) => {
                  const permit =
                    typeof intervention.permitTravail === 'object' ? intervention.permitTravail : null
                  const ref = permit?.reference ?? intervention.permitTravailId ?? '—'
                  const site = permit?.codeSite ?? '—'

                  return (
                    <div key={intervention.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium font-mono text-gray-900">{ref}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{site}</span>
                        </p>
                        <div className="mt-2">
                          <AvancementCell interventionId={intervention.id} />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => navigate(`/interventions/${intervention.id}/suivis`)}
                      >
                        {t('intervention.pages.suivisJournaliers.viewButton')}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
