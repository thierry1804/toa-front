import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { TableIconButton } from '@/components/ui/TableIconButton'
import { ClickableCard } from '@/components/ui/ClickableCard'
import Input from '@/components/ui/Input'
import AvancementBadge from '@/components/intervention/AvancementBadge'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import { StatStrip } from '@/components/ui/StatStrip'
import { listFilterControlClass } from '@/components/ui/ListTable'
import { useQuery } from '@tanstack/react-query'
import { interventionApi } from '@/api/interventionApi'
import { INTERVENTION_KEY, SUIVI_JOURNALIER_KEY } from '@/data/constant/query'
import { sortNewestFirst } from '@/lib/listOrder'

function AvancementCell({ interventionId }: { interventionId: string }) {
  // Dernier avancement enregistré (pas une moyenne des jours, cf. le même
  // bug déjà corrigé sur l'écran de saisie du suivi journalier).
  const { data } = useQuery({
    queryKey: [...SUIVI_JOURNALIER_KEY, interventionId],
    queryFn: () => interventionApi.getSuivis(interventionId),
    select: (d) => {
      const items = [...(d.member ?? [])].sort((a, b) => b.date.localeCompare(a.date))
      return items[0]?.avancementPourcentage ?? 0
    },
  })
  return <AvancementBadge pct={data ?? 0} />
}

export default function SuivisJournaliersPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  // Interventions où la saisie du suivi journalier est possible : évaluation
  // validée (pas encore commencé) ou déjà en cours. Une fois le statut passé
  // à EN_COURS (premier suivi avec un avancement > 0%), l'intervention doit
  // rester dans cette liste, pas en disparaître.
  const { data, isLoading } = useQuery({
    queryKey: INTERVENTION_KEY,
    queryFn: () => interventionApi.getAll(),
    select: (d) =>
      sortNewestFirst(
        (d.member ?? []).filter((i) => i.statut === 'EVALUATION_COMPLETE' || i.statut === 'EN_COURS'),
      ),
  })

  const filtered = useMemo(() => {
    const interventions = data ?? []
    const q = search.trim().toLowerCase()
    if (!q) return interventions
    return interventions.filter((intervention) => {
      const permit = typeof intervention.permitTravail === 'object' ? intervention.permitTravail : null
      const ref = (permit?.reference ?? intervention.permitTravailId ?? '').toLowerCase()
      const site = (permit?.codeSite ?? '').toLowerCase()
      return ref.includes(q) || site.includes(q)
    })
  }, [data, search])

  const withSuivi = useMemo(
    () => filtered.filter((i) => i.statut === 'EVALUATION_COMPLETE' || i.statut === 'EN_COURS').length,
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
        <CardHeader className="space-y-2 p-4 pb-2">
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
            className={listFilterControlClass}
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
                            <TableIconButton
                              title={t('intervention.pages.suivisJournaliers.viewButton')}
                              onClick={() => navigate(`/interventions/${intervention.id}/suivis`)}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </TableIconButton>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-3 lg:hidden">
                {filtered.map((intervention) => {
                  const permit =
                    typeof intervention.permitTravail === 'object' ? intervention.permitTravail : null
                  const ref = permit?.reference ?? intervention.permitTravailId ?? '—'
                  const site = permit?.codeSite ?? '—'

                  return (
                    <ClickableCard
                      key={intervention.id}
                      to={`/interventions/${intervention.id}/suivis`}
                      label={`${t('intervention.pages.suivisJournaliers.viewButton')} ${ref}`}
                    >
                      <p className="truncate text-sm font-semibold font-mono text-gray-900">{ref}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{site}</span>
                      </p>
                      <div className="mt-2">
                        <AvancementCell interventionId={intervention.id} />
                      </div>
                    </ClickableCard>
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
