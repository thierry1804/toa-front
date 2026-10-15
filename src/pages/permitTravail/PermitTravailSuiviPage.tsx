import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Activity, Clock, BarChart2, AlertTriangle, ChevronUp, ChevronDown, ChevronsUpDown,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import StatutPermitBadge from '@/components/permitTravail/StatutPermitBadge'
import ExpirationBadge from '@/components/permitTravail/ExpirationBadge'
import LogsDrawer from '@/components/permitTravail/LogsDrawer'
import { listFiltersContainerClass } from '@/components/ui/ListTable'
import { usePermitTravailSuivi, usePermitTravailStatsJournalieres, usePermitsTravail } from '@/features/permitTravail/hooks/usePermitTravail'
import { usePermitTravailLabels } from '@/features/permitTravail/usePermitTravailLabels'
import { usePermission } from '@/features/auth/usePermission'
import type { PermitTravail, StatutPermitTravail, TypePermit, PermitTravailSuiviFilters } from '@/types/permitTravail'

const ITEMS_PER_PAGE = 10

const STATUT_FILTER_VALUES = ['', 'BROUILLON', 'SOUMIS', 'EN_COURS', 'VALIDE', 'VALIDE_HSE', 'REJETE', 'REFUSE_HSE'] as const
const TYPE_FILTER_VALUES = ['', 'GENERAL', 'ELECTRIQUE', 'HAUTEUR'] as const

type SortKey = 'reference' | 'typePermis' | 'codeSite' | 'statut' | 'soumisAt'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />
  return dir === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5 text-blue-600" />
    : <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
}

function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string
  value: number | undefined
  icon: React.ElementType
  color: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function BarGroup({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 shrink-0 truncate text-gray-600">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-medium text-gray-700">{value}</span>
    </div>
  )
}

export default function PermitTravailSuiviPage() {
  const { t, i18n } = useTranslation()
  const { typeLabel, statutLabel } = usePermitTravailLabels()
  const locale = i18n.language === 'mg' ? 'mg-MG' : 'fr-FR'
  const canSuivi = usePermission('permit_travail.suivi')
  const canLogs  = usePermission('permit_travail.logs')
  const navigate = useNavigate()

  const statutOptions = useMemo(
    () =>
      STATUT_FILTER_VALUES.map((value) => ({
        value,
        label: value
          ? statutLabel(value)
          : t('permitTravail.list.filters.allStatuts'),
      })),
    [t, statutLabel],
  )

  const typeOptions = useMemo(
    () =>
      TYPE_FILTER_VALUES.map((value) => ({
        value,
        label: value
          ? typeLabel(value as TypePermit)
          : t('permitTravail.list.filters.allTypes'),
      })),
    [t, typeLabel],
  )

  const [searchParams, setSearchParams] = useSearchParams()
  const [draft, setDraft] = useState<PermitTravailSuiviFilters>({
    codeSite:   searchParams.get('codeSite')   ?? '',
    typePermis: (searchParams.get('typePermis') as TypePermit | '') ?? '',
    statut:     (searchParams.get('statut')     as StatutPermitTravail | '') ?? '',
    dateDebut:  searchParams.get('dateDebut')   ?? '',
    dateFin:    searchParams.get('dateFin')     ?? '',
  })

  const activeFilters: PermitTravailSuiviFilters = useMemo(() => ({
    codeSite:   searchParams.get('codeSite')   ?? undefined,
    typePermis: (searchParams.get('typePermis') as TypePermit) || undefined,
    statut:     (searchParams.get('statut')     as StatutPermitTravail) || undefined,
    dateDebut:  searchParams.get('dateDebut')  ?? undefined,
    dateFin:    searchParams.get('dateFin')    ?? undefined,
  }), [searchParams])

  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('soumisAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [drawerPermit, setDrawerPermit] = useState<PermitTravail | null>(null)

  const listParams = useMemo(() => {
    const p: Record<string, string> = {
      page: String(page),
      itemsPerPage: String(ITEMS_PER_PAGE),
    }
    if (activeFilters.codeSite)   p.codeSite   = activeFilters.codeSite
    if (activeFilters.typePermis) p.typePermis  = activeFilters.typePermis
    if (activeFilters.statut)     p.statut      = activeFilters.statut
    return p
  }, [activeFilters, page])

  const { data: suiviData, isLoading: loadingSuivi } = usePermitTravailSuivi(activeFilters)
  const { data: stats } = usePermitTravailStatsJournalieres(
    undefined,
    activeFilters.codeSite,
    activeFilters.typePermis,
  )
  const { data: permitsData, isLoading: loadingPermits } = usePermitsTravail(listParams)
  const permits = useMemo(() => permitsData?.member ?? [], [permitsData?.member])
  const totalItems = permitsData?.totalItems ?? 0
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  const sorted = useMemo(() => {
    return [...permits].sort((a, b) => {
      let va: string, vb: string
      if (sortKey === 'soumisAt') {
        va = a.soumisAt ?? a.createdAt
        vb = b.soumisAt ?? b.createdAt
      } else {
        va = (a[sortKey] as string) ?? ''
        vb = (b[sortKey] as string) ?? ''
      }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
  }, [permits, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const applyFilters = () => {
    const p: Record<string, string> = {}
    if (draft.codeSite)   p.codeSite   = draft.codeSite
    if (draft.typePermis) p.typePermis  = draft.typePermis
    if (draft.statut)     p.statut      = draft.statut
    if (draft.dateDebut)  p.dateDebut   = draft.dateDebut
    if (draft.dateFin)    p.dateFin     = draft.dateFin
    setPage(1)
    setSearchParams(p, { replace: true })
  }

  const resetFilters = () => {
    setDraft({ codeSite: '', typePermis: '', statut: '', dateDebut: '', dateFin: '' })
    setPage(1)
    setSearchParams({}, { replace: true })
  }

  if (!canSuivi) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        {t('permitTravail.suivi.noAccess')}
      </div>
    )
  }

  const parStatutEntries = Object.entries(suiviData?.parStatut ?? {}) as [StatutPermitTravail, number][]
  const parTypeEntries   = Object.entries(suiviData?.parType  ?? {}) as [TypePermit, number][]
  const parSiteEntries   = Object.entries(suiviData?.parSite  ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxSite  = parSiteEntries[0]?.[1] ?? 1
  const maxStatut = Math.max(...parStatutEntries.map(([, v]) => v), 1)

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('permitTravail.suivi.title')}
        description={t('permitTravail.suivi.description')}
      />

      {/* Filters */}
      <Card>
        <CardContent className={listFiltersContainerClass}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <Input
              label={t('permitTravail.suivi.siteLabel')}
              type="text"
              value={draft.codeSite ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, codeSite: e.target.value }))}
              placeholder={t('permitTravail.suivi.sitePlaceholder')}
            />
            <Select
              label={t('permitTravail.suivi.typeLabel')}
              value={draft.typePermis ?? ''}
              options={typeOptions}
              onChange={(e) => setDraft((d) => ({ ...d, typePermis: e.target.value as TypePermit | '' }))}
            />
            <Select
              label={t('permitTravail.suivi.statutLabel')}
              value={draft.statut ?? ''}
              options={statutOptions}
              onChange={(e) => setDraft((d) => ({ ...d, statut: e.target.value as StatutPermitTravail | '' }))}
            />
            <Input
              label={t('permitTravail.suivi.dateStartLabel')}
              type="date"
              value={draft.dateDebut ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, dateDebut: e.target.value }))}
            />
            <Input
              label={t('permitTravail.suivi.dateEndLabel')}
              type="date"
              value={draft.dateFin ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, dateFin: e.target.value }))}
            />
          </div>
          <div className="mt-2 flex gap-2">
            <Button onClick={applyFilters}>{t('permitTravail.suivi.applyFilters')}</Button>
            <Button variant="outline" onClick={resetFilters}>{t('permitTravail.suivi.resetFilters')}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t('permitTravail.suivi.stats.actifs')}
          value={stats?.permisActifs}
          icon={Activity}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          label={t('permitTravail.suivi.stats.consultations')}
          value={stats?.nbConsultations}
          icon={Clock}
          color="bg-purple-100 text-purple-700"
        />
        <StatCard
          label={t('permitTravail.suivi.stats.changements')}
          value={stats?.nbChangementsStatut}
          icon={BarChart2}
          color="bg-orange-100 text-orange-700"
        />
        <StatCard
          label={t('permitTravail.suivi.stats.expiring')}
          value={suiviData?.expirantSous7j?.length}
          icon={AlertTriangle}
          color="bg-red-100 text-red-700"
        />
      </div>

      {/* Permits table */}
      <Card>
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {t('permitTravail.suivi.tableTitle', { count: totalItems })}
          </h2>
        </div>
        <div className="overflow-x-auto">
          {loadingPermits ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">{t('permitTravail.suivi.loading')}</div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">{t('permitTravail.suivi.empty')}</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  {(
                    [
                      ['reference', t('permitTravail.suivi.headers.reference')],
                      ['typePermis', t('permitTravail.suivi.headers.type')],
                      ['codeSite', t('permitTravail.suivi.headers.site')],
                      ['statut', t('permitTravail.suivi.headers.statut')],
                    ] as [SortKey, string][]
                  ).map(([key, label]) => (
                    <th
                      key={key}
                      className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600 hover:text-gray-900"
                      onClick={() => toggleSort(key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <SortIcon active={sortKey === key} dir={sortDir} />
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium text-gray-600">{t('permitTravail.suivi.headers.expiration')}</th>
                  <th
                    className="cursor-pointer select-none px-4 py-3 font-medium text-gray-600 hover:text-gray-900"
                    onClick={() => toggleSort('soumisAt')}
                  >
                    <span className="inline-flex items-center gap-1">
                      {t('permitTravail.suivi.headers.submittedAt')}
                      <SortIcon active={sortKey === 'soumisAt'} dir={sortDir} />
                    </span>
                  </th>
                  {canLogs && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((permit) => {
                  return (
                    <tr
                      key={permit.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => navigate(`/permits-travail/${permit.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-blue-700">
                        {permit.reference}
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {typeLabel(permit.typePermis)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{permit.codeSite}</td>
                      <td className="px-4 py-3">
                        <StatutPermitBadge statut={permit.statut} />
                      </td>
                      <td className="px-4 py-3">
                        {permit.statut === 'VALIDE_HSE' && permit.dateFinPrevue ? (
                          <ExpirationBadge expiresAt={permit.dateFinPrevue} />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {permit.soumisAt
                          ? new Date(permit.soumisAt).toLocaleString(locale)
                          : <span className="text-gray-400">—</span>}
                      </td>
                      {canLogs && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDrawerPermit(permit)}
                          >
                            {t('permitTravail.suivi.actions.logs')}
                          </Button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-600">
              Page {page} / {totalPages} ({totalItems}{' '}
              {t('permitTravail.suivi.paginationPermits')})
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('common.previous')}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Aggregates */}
      {!loadingSuivi && suiviData && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Par statut */}
          <Card>
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">{t('permitTravail.suivi.byStatut')}</h3>
            </div>
            <CardContent className="space-y-3 pt-4">
              {parStatutEntries.length === 0 ? (
                <p className="text-xs text-gray-400">{t('permitTravail.suivi.noData')}</p>
              ) : parStatutEntries.map(([statut, count]) => (
                <BarGroup
                  key={statut}
                  label={statutLabel(statut)}
                  value={count}
                  max={maxStatut}
                />
              ))}
            </CardContent>
          </Card>

          {/* Par type */}
          <Card>
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">{t('permitTravail.suivi.byType')}</h3>
            </div>
            <CardContent className="space-y-3 pt-4">
              {parTypeEntries.length === 0 ? (
                <p className="text-xs text-gray-400">{t('permitTravail.suivi.noData')}</p>
              ) : parTypeEntries.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{typeLabel(type)}</span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Par site (top 5) */}
          <Card>
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">{t('permitTravail.suivi.topSites')}</h3>
            </div>
            <CardContent className="space-y-3 pt-4">
              {parSiteEntries.length === 0 ? (
                <p className="text-xs text-gray-400">{t('permitTravail.suivi.noData')}</p>
              ) : parSiteEntries.map(([site, count]) => (
                <BarGroup key={site} label={site} value={count} max={maxSite} />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {canLogs && (
        <LogsDrawer
          permit={drawerPermit}
          isOpen={drawerPermit !== null}
          onClose={() => setDrawerPermit(null)}
        />
      )}
    </div>
  )
}
