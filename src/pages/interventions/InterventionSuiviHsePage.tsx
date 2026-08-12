import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardSectionHeader } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import AvancementBadge from '@/components/intervention/AvancementBadge'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import { StatStrip } from '@/components/ui/StatStrip'
import { usePermission } from '@/features/auth/usePermission'
import {
  useInterventionDashboard,
  useInterventionStatsJournalieres,
} from '@/features/intervention/hooks/useIntervention'
import { useKpisIntervention } from '@/features/permitTravail/hooks/usePermitTravail'
import type { InterventionSuiviFilters, StatutIntervention } from '@/types/intervention'

type SortKey = 'permitReference' | 'codeSite' | 'statut' | 'avancementMoyen' | 'dernierSuivi' | 'nbSuivis'
type SortDir = 'asc' | 'desc'

const STATUT_STYLE: Record<StatutIntervention, string> = {
  EN_PREPARATION: 'bg-gray-100 text-gray-700',
  EVALUATION_COMPLETE: 'bg-blue-100 text-blue-700',
  EN_COURS: 'bg-amber-100 text-amber-800',
  TERMINEE: 'bg-green-100 text-green-700',
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />
  return dir === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5 text-blue-600" />
    : <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
}

function StatutBadge({ statut }: { statut: StatutIntervention }) {
  const { t } = useTranslation()
  const labelKey: Record<StatutIntervention, string> = {
    EN_PREPARATION: 'intervention.pages.shared.statut.enPreparation',
    EVALUATION_COMPLETE: 'intervention.pages.shared.statut.evaluationComplete',
    EN_COURS: 'intervention.pages.shared.statut.enCours',
    TERMINEE: 'intervention.pages.shared.statut.terminee',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUT_STYLE[statut] ?? 'bg-gray-100 text-gray-700'}`}
    >
      {t(labelKey[statut] ?? 'intervention.pages.shared.statut.enPreparation')}
    </span>
  )
}

function relativeDays(dateStr: string | null, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (diff === 0) return t('interventions.suiviHse.relativeDays.today')
  if (diff === 1) return t('interventions.suiviHse.relativeDays.oneDay')
  return t('interventions.suiviHse.relativeDays.days', { count: diff })
}

export default function InterventionSuiviHsePage() {
  const { t } = useTranslation()
  const canDashboard = usePermission('intervention.suivi.dashboard')
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const [draft, setDraft] = useState<InterventionSuiviFilters>({
    codeSite: searchParams.get('codeSite') ?? '',
    statut: (searchParams.get('statut') as StatutIntervention | '') ?? '',
    dateDebut: searchParams.get('dateDebut') ?? '',
    dateFin: searchParams.get('dateFin') ?? '',
  })

  const activeFilters: InterventionSuiviFilters = useMemo(
    () => ({
      codeSite: searchParams.get('codeSite') || undefined,
      statut: (searchParams.get('statut') as StatutIntervention) || undefined,
      dateDebut: searchParams.get('dateDebut') || undefined,
      dateFin: searchParams.get('dateFin') || undefined,
    }),
    [searchParams],
  )

  const { data: dashboard, isLoading } = useInterventionDashboard(activeFilters)
  const { data: statsJour } = useInterventionStatsJournalieres(activeFilters.codeSite, undefined)
  const { data: kpis } = useKpisIntervention(activeFilters.codeSite || undefined)

  const [sortKey, setSortKey] = useState<SortKey>('dernierSuivi')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const statutOptions = useMemo(
    () => [
      { value: '', label: t('interventions.suiviHse.filters.allStatuts') },
      { value: 'EN_PREPARATION', label: t('intervention.pages.shared.statut.enPreparation') },
      { value: 'EVALUATION_COMPLETE', label: t('intervention.pages.shared.statut.evaluationComplete') },
      { value: 'EN_COURS', label: t('intervention.pages.shared.statut.enCours') },
      { value: 'TERMINEE', label: t('intervention.pages.shared.statut.terminee') },
    ],
    [t],
  )

  const sorted = useMemo(() => {
    const items = dashboard?.interventions ?? []
    return [...items].sort((a, b) => {
      const va = String(a[sortKey] ?? '')
      const vb = String(b[sortKey] ?? '')
      if (sortKey === 'avancementMoyen' || sortKey === 'nbSuivis') {
        const na = Number(a[sortKey] ?? 0)
        const nb = Number(b[sortKey] ?? 0)
        return sortDir === 'asc' ? na - nb : nb - na
      }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
  }, [dashboard, sortKey, sortDir])

  const tableHeaders = useMemo(
    () =>
      [
        ['permitReference', 'interventions.suiviHse.table.headers.reference'],
        ['codeSite', 'interventions.suiviHse.table.headers.site'],
        ['statut', 'interventions.suiviHse.table.headers.statut'],
        ['avancementMoyen', 'interventions.suiviHse.table.headers.avancement'],
        ['dernierSuivi', 'interventions.suiviHse.table.headers.dernierSuivi'],
        ['nbSuivis', 'interventions.suiviHse.table.headers.nbSuivis'],
      ] as [SortKey, string][],
    [],
  )

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const applyFilters = () => {
    const p: Record<string, string> = {}
    if (draft.codeSite) p.codeSite = draft.codeSite
    if (draft.statut) p.statut = draft.statut
    if (draft.dateDebut) p.dateDebut = draft.dateDebut
    if (draft.dateFin) p.dateFin = draft.dateFin
    setSearchParams(p, { replace: true })
  }

  const resetFilters = () => {
    setDraft({ codeSite: '', statut: '', dateDebut: '', dateFin: '' })
    setSearchParams({}, { replace: true })
  }

  if (!canDashboard) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        {t('interventions.suiviHse.accessDenied')}
      </div>
    )
  }

  const parStatut = dashboard?.parStatut ?? ({} as Record<StatutIntervention, number>)
  const avancementMoyen =
    dashboard?.avancementMoyen !== undefined ? Math.round(dashboard.avancementMoyen) : undefined

  if (isLoading && !dashboard) {
    return <ListPageSkeleton rows={8} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('interventions.suiviHse.title')}
        description={t('interventions.suiviHse.description')}
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
              <Input
                label={t('interventions.suiviHse.filters.site')}
                type="text"
                value={draft.codeSite ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, codeSite: e.target.value }))}
                placeholder={t('interventions.suiviHse.filters.sitePlaceholder')}
                className="shadow-none"
              />
              <Select
                label={t('interventions.suiviHse.filters.statut')}
                value={draft.statut ?? ''}
                options={statutOptions}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, statut: e.target.value as StatutIntervention | '' }))
                }
              />
              <Input
                label={t('interventions.suiviHse.filters.dateDebut')}
                type="date"
                value={draft.dateDebut ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, dateDebut: e.target.value }))}
                className="shadow-none"
              />
              <Input
                label={t('interventions.suiviHse.filters.dateFin')}
                type="date"
                value={draft.dateFin ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, dateFin: e.target.value }))}
                className="shadow-none"
              />
            </div>
            <div className="flex shrink-0 gap-2">
              <Button onClick={applyFilters}>{t('interventions.suiviHse.filters.apply')}</Button>
              <Button variant="outline" onClick={resetFilters}>
                {t('interventions.suiviHse.filters.reset')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <StatStrip
        items={[
          { label: t('interventions.suiviHse.stats.total'), value: dashboard?.totalInterventions ?? '—' },
          {
            label: t('interventions.suiviHse.stats.avancementMoyen'),
            value: avancementMoyen !== undefined ? `${avancementMoyen}%` : '—',
          },
          { label: t('interventions.suiviHse.stats.enCours'), value: parStatut.EN_COURS ?? 0 },
          { label: t('interventions.suiviHse.stats.terminees'), value: parStatut.TERMINEE ?? 0 },
        ]}
      />

      <StatStrip
        items={[
          { label: t('interventions.suiviHse.stats.pvValides'), value: kpis?.nbPermisCloturesValides ?? '—' },
          {
            label: t('interventions.suiviHse.stats.tauxCloture'),
            value: kpis !== undefined ? `${Math.round(kpis.tauxCloture * 100)}%` : '—',
          },
          {
            label: t('interventions.suiviHse.stats.delaiCdp'),
            value: kpis !== undefined ? `${Math.round(kpis.delaiMoyenValidationCdp)} j` : '—',
          },
        ]}
      />

      {activeFilters.codeSite && statsJour && (
        <Card>
          <CardSectionHeader>
            <h3 className="text-sm font-semibold text-gray-900">
              {t('interventions.suiviHse.statsJournalieres.title', {
                site: statsJour.codeSite,
                date: statsJour.date,
              })}
            </h3>
          </CardSectionHeader>
          <CardContent className="p-0">
            <StatStrip
              items={[
                {
                  label: t('interventions.suiviHse.statsJournalieres.actives'),
                  value: statsJour.nbInterventionsActives,
                },
                {
                  label: t('interventions.suiviHse.statsJournalieres.avancementMoyen'),
                  value: `${Math.round(statsJour.avancementMoyen)}%`,
                },
                {
                  label: t('interventions.suiviHse.statsJournalieres.suivisJour'),
                  value: statsJour.nbSuivisJour,
                },
              ]}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardSectionHeader>
          <h2 className="text-sm font-semibold text-gray-900">
            {t('interventions.suiviHse.table.title', {
              count: dashboard?.totalInterventions ?? 0,
            })}
          </h2>
        </CardSectionHeader>
        <div className="overflow-x-auto">
          {isLoading ? (
            <ListPageSkeleton rows={6} withStatStrip={false} bare />
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              {t('interventions.suiviHse.table.empty')}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  {tableHeaders.map(([key, labelKey]) => (
                    <th
                      key={key}
                      className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600 hover:text-gray-900"
                      onClick={() => toggleSort(key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {t(labelKey)}
                        <SortIcon active={sortKey === key} dir={sortDir} />
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                    onClick={() => navigate(`/interventions/${item.id}/suivi-hse`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">
                      {item.permitReference ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.codeSite ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={item.statut} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-blue-600 transition-all"
                            style={{ width: `${Math.min(item.avancementMoyen, 100)}%` }}
                          />
                        </div>
                        <AvancementBadge pct={Math.round(item.avancementMoyen)} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {relativeDays(item.dernierSuivi, t)}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700">
                      {item.nbSuivis}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/interventions/${item.id}/suivi-hse`)}
                      >
                        {t('interventions.suiviHse.table.detail')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
