import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, Clock, TrendingUp, BarChart2, ChevronUp, ChevronDown, ChevronsUpDown,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar, Cell,
  PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AvancementBadge from '@/components/intervention/AvancementBadge'
import { usePermission } from '@/features/auth/usePermission'
import {
  useDashboardKpis,
  useDashboardKpisSites,
  useDashboardKpisEvolution,
} from '@/features/dashboard/hooks/useDashboardKpis'
import { usePermitTravailSuivi } from '@/features/permitTravail/hooks/usePermitTravail'
import type { DashboardKpisFilters, DashboardKpisSiteItem } from '@/types/dashboard'
import type { StatutPermitTravail } from '@/types/permitTravail'

// ---------- helpers ----------

function formatPeriode(p: string): string {
  const [y, m] = p.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric',
  })
}

function tauxColor(taux: number): string {
  if (taux > 20) return 'bg-red-100 text-red-700'
  if (taux > 10) return 'bg-orange-100 text-orange-700'
  return 'bg-green-100 text-green-700'
}

function barFill(pct: number): string {
  if (pct >= 76) return '#2563eb'
  if (pct >= 26) return '#ca8a04'
  return '#dc2626'
}

// ---------- sub-components ----------

type SortKey =
  | 'classement'
  | 'codeSite'
  | 'nbPermisClotures'
  | 'tauxCloture'
  | 'avancementMoyen'
  | 'tauxIncidents'
  | 'delaiMoyen'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />
  return dir === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5 text-blue-600" />
    : <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  suffix = '',
}: {
  label: string
  value: number | undefined
  icon: React.ElementType
  color: string
  suffix?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {value !== undefined ? `${value}${suffix}` : '—'}
          </p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// CLOTURE/PV_VALIDE keep a distinct hue outside the DESIGN.md semantic tokens:
// 5 statuses share only 4 tokens (neutral/primary/success), so these two need
// a hue of their own to stay visually distinguishable from VALIDE_HSE.
const STATUT_PIE_CONFIG: Partial<Record<StatutPermitTravail, { label: string; color: string }>> = {
  BROUILLON:  { label: 'Brouillon',   color: '#9ca3af' },
  SOUMIS:     { label: 'Soumis',      color: '#2563eb' },
  VALIDE_HSE: { label: 'Validé HSE',  color: '#16a34a' },
  CLOTURE:    { label: 'Clôturé',     color: '#f97316' },
  PV_VALIDE:  { label: 'PV validé',   color: '#22c55e' },
}

// ---------- main page ----------

export default function DashboardKpisPage() {
  const { t } = useTranslation()
  const canView = usePermission('dashboard.kpis.view')

  const [searchParams, setSearchParams] = useSearchParams()
  const [draft, setDraft] = useState<DashboardKpisFilters>({
    codeSite:  searchParams.get('codeSite')  ?? '',
    periode:   searchParams.get('periode')   ?? '',
    dateDebut: searchParams.get('dateDebut') ?? '',
    dateFin:   searchParams.get('dateFin')   ?? '',
  })

  const activeFilters: DashboardKpisFilters = useMemo(
    () => ({
      codeSite:  searchParams.get('codeSite')  || undefined,
      periode:   searchParams.get('periode')   || undefined,
      dateDebut: searchParams.get('dateDebut') || undefined,
      dateFin:   searchParams.get('dateFin')   || undefined,
    }),
    [searchParams],
  )

  const siteFilters = useMemo(
    () => ({
      periode:   activeFilters.periode,
      dateDebut: activeFilters.dateDebut,
      dateFin:   activeFilters.dateFin,
    }),
    [activeFilters.periode, activeFilters.dateDebut, activeFilters.dateFin],
  )

  const { data: global, isLoading: loadingGlobal } = useDashboardKpis(activeFilters)
  const { data: sites,  isLoading: loadingSites }  = useDashboardKpisSites(siteFilters)
  const { data: evolution }                        = useDashboardKpisEvolution(activeFilters.codeSite, 6)
  const { data: suiviData }                        = usePermitTravailSuivi(activeFilters)

  // ---------- sort state (table) ----------
  const [sortKey, setSortKey] = useState<SortKey>('classement')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sortedSites = useMemo(() => {
    const rows = sites ?? []
    return [...rows].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      switch (sortKey) {
        case 'classement':       return mul * (a.classement - b.classement)
        case 'codeSite':         return mul * a.codeSite.localeCompare(b.codeSite)
        case 'nbPermisClotures': return mul * (a.kpis.nbPermisCloturesTotal - b.kpis.nbPermisCloturesTotal)
        case 'tauxCloture':      return mul * (a.kpis.tauxCloture - b.kpis.tauxCloture)
        case 'avancementMoyen':  return mul * ((a.kpis.avancementMoyen ?? 0) - (b.kpis.avancementMoyen ?? 0))
        case 'tauxIncidents':    return mul * ((a.kpis.tauxIncidents ?? 0) - (b.kpis.tauxIncidents ?? 0))
        case 'delaiMoyen':       return mul * (a.kpis.delaiMoyenValidationCdp - b.kpis.delaiMoyenValidationCdp)
        default: return 0
      }
    })
  }, [sites, sortKey, sortDir])

  // ---------- chart transforms ----------

  const lineData = useMemo(
    () =>
      (evolution ?? []).map((item) => ({
        name:            formatPeriode(item.periode),
        'Taux incidents': item.kpis.tauxIncidents ?? 0,
        'Avancement %':   item.kpis.avancementMoyen ?? 0,
        'Taux clôture %': Number(((item.kpis.tauxCloture ?? 0) * 100).toFixed(1)),
      })),
    [evolution],
  )

  const barData = useMemo(
    () =>
      (sites ?? []).map((s) => ({
        site:       s.codeSite,
        Avancement: s.kpis.avancementMoyen ?? 0,
      })),
    [sites],
  )

  const pieData = useMemo(() => {
    const parStatut = suiviData?.parStatut ?? {}
    return (Object.keys(STATUT_PIE_CONFIG) as StatutPermitTravail[])
      .map((key) => ({
        name:  STATUT_PIE_CONFIG[key]!.label,
        value: parStatut[key] ?? 0,
        color: STATUT_PIE_CONFIG[key]!.color,
      }))
      .filter((d) => d.value > 0)
  }, [suiviData])

  // ---------- filter handlers ----------

  const applyFilters = () => {
    const p: Record<string, string> = {}
    if (draft.codeSite)  p.codeSite  = draft.codeSite
    if (draft.periode)   p.periode   = draft.periode
    if (draft.dateDebut) p.dateDebut = draft.dateDebut
    if (draft.dateFin)   p.dateFin   = draft.dateFin
    setSearchParams(p, { replace: true })
  }

  const resetFilters = () => {
    setDraft({ codeSite: '', periode: '', dateDebut: '', dateFin: '' })
    setSearchParams({}, { replace: true })
  }

  // ---------- guard ----------

  if (!canView) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        {t('dashboardKpis.accessDenied')}
      </div>
    )
  }

  // ---------- derived values for KPI cards ----------

  const tauxIncidents   = global?.tauxIncidents
  const avancementMoyen = global?.avancementMoyen !== undefined ? Math.round(global.avancementMoyen) : undefined
  const tauxCloture     = global?.tauxCloture !== undefined ? Math.round(global.tauxCloture * 100) : undefined
  const tmpPlan         = global?.tempsMoyenValidationPlan !== undefined ? Math.round(global.tempsMoyenValidationPlan) : undefined
  const tmpPermis       = global?.tempsMoyenValidationPermis !== undefined ? Math.round(global.tempsMoyenValidationPermis) : undefined
  const tmpPv           = global?.tempsMoyenValidationPv !== undefined ? Math.round(global.tempsMoyenValidationPv) : undefined

  const suffixJ = t('dashboardKpis.kpis.suffixJours')

  const columns: [SortKey, string][] = [
    ['classement',       t('dashboardKpis.table.rank')],
    ['codeSite',         t('dashboardKpis.table.site')],
    ['nbPermisClotures', t('dashboardKpis.table.nbPermis')],
    ['tauxCloture',      t('dashboardKpis.table.tauxCloture')],
    ['avancementMoyen',  t('dashboardKpis.table.avancement')],
    ['tauxIncidents',    t('dashboardKpis.table.tauxIncidents')],
    ['delaiMoyen',       t('dashboardKpis.table.delai')],
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboardKpis.title')}
        description={t('dashboardKpis.description')}
      />

      {/* ── Filtres ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label={t('dashboardKpis.filters.site')}
              type="text"
              value={draft.codeSite ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, codeSite: e.target.value }))}
            />
            <Input
              label={t('dashboardKpis.filters.periode')}
              type="month"
              value={draft.periode ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, periode: e.target.value }))}
            />
            <Input
              label={t('dashboardKpis.filters.debut')}
              type="date"
              value={draft.dateDebut ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, dateDebut: e.target.value }))}
            />
            <Input
              label={t('dashboardKpis.filters.fin')}
              type="date"
              value={draft.dateFin ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, dateFin: e.target.value }))}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={applyFilters}>{t('dashboardKpis.filters.apply')}</Button>
            <Button variant="outline" onClick={resetFilters}>{t('dashboardKpis.filters.reset')}</Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 6 cartes KPI ── */}
      {loadingGlobal ? (
        <div className="flex items-center justify-center py-8 text-sm text-gray-400">
          {t('dashboardKpis.loading')}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard
            label={t('dashboardKpis.kpis.tauxIncidents')}
            value={tauxIncidents !== undefined ? Math.round(tauxIncidents) : undefined}
            icon={AlertTriangle}
            color={tauxIncidents !== undefined ? tauxColor(tauxIncidents) : 'bg-gray-100 text-gray-600'}
            suffix="%"
          />
          <StatCard
            label={t('dashboardKpis.kpis.delaiPlan')}
            value={tmpPlan}
            icon={Clock}
            color="bg-blue-100 text-blue-700"
            suffix={suffixJ}
          />
          <StatCard
            label={t('dashboardKpis.kpis.delaiPermis')}
            value={tmpPermis}
            icon={Clock}
            color="bg-indigo-100 text-indigo-700"
            suffix={suffixJ}
          />
          <StatCard
            label={t('dashboardKpis.kpis.delaiPv')}
            value={tmpPv}
            icon={Clock}
            color="bg-purple-100 text-purple-700"
            suffix={suffixJ}
          />
          <StatCard
            label={t('dashboardKpis.kpis.avancement')}
            value={avancementMoyen}
            icon={TrendingUp}
            color="bg-orange-100 text-orange-700"
            suffix="%"
          />
          <StatCard
            label={t('dashboardKpis.kpis.tauxCloture')}
            value={tauxCloture}
            icon={BarChart2}
            color={tauxCloture !== undefined && tauxCloture >= 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
            suffix="%"
          />
        </div>
      )}

      {/* ── Graphiques ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Évolution temporelle */}
        <Card>
          <div className="border-b px-6 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {t('dashboardKpis.charts.evolution', { nbMois: 6 })}
              {activeFilters.codeSite
                ? t('dashboardKpis.charts.evolutionSite', { site: activeFilters.codeSite })
                : t('dashboardKpis.charts.evolutionAllSites')}
            </h3>
          </div>
          <CardContent className="pt-4">
            {lineData.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-xs text-gray-400">
                {t('dashboardKpis.charts.noEvolution')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v) => v != null ? `${(v as number).toFixed(1)} %` : ''} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="Taux incidents"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Avancement %"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="Taux clôture %"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Comparaison par site */}
        <Card>
          <div className="border-b px-6 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {t('dashboardKpis.charts.barSite')}
            </h3>
          </div>
          <CardContent className="pt-4">
            {loadingSites || barData.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-xs text-gray-400">
                {loadingSites ? t('dashboardKpis.loading') : t('dashboardKpis.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="site" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v) => v != null ? `${(v as number).toFixed(1)} %` : ''} />
                  <Bar dataKey="Avancement" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, idx) => (
                      <Cell key={idx} fill={barFill(entry.Avancement)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Répartition statuts permis */}
      <Card>
        <div className="border-b px-6 py-3">
          <h3 className="text-sm font-semibold text-gray-900">
            {t('dashboardKpis.charts.pie')}
          </h3>
        </div>
        <CardContent className="pt-4">
          {pieData.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-xs text-gray-400">
              {t('dashboardKpis.noData')}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <ResponsiveContainer width={220} height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={40}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1.5 text-sm">
                {pieData.map((d) => (
                  <li key={d.name} className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-gray-700">{d.name}</span>
                    <span className="font-semibold text-gray-900">{d.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Tableau par site ── */}
      <Card>
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            {t('dashboardKpis.table.title', { nb: sites?.length ?? 0 })}
          </h2>
        </div>
        <div className="overflow-x-auto">
          {loadingSites ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              {t('dashboardKpis.loading')}
            </div>
          ) : sortedSites.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              {t('dashboardKpis.noData')}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  {columns.map(([key, label]) => (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedSites.map((row) => (
                  <SiteRow key={row.codeSite} row={row} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}

function SiteRow({ row }: { row: DashboardKpisSiteItem }) {
  const { t } = useTranslation()
  const av = row.kpis.avancementMoyen ?? 0
  const ti = row.kpis.tauxIncidents   ?? 0
  const tc = Math.round(row.kpis.tauxCloture * 100)

  return (
    <tr className="transition-colors hover:bg-gray-50">
      <td className="px-4 py-3 text-center font-semibold text-gray-500">
        {row.classement}
      </td>
      <td className="px-4 py-3 font-medium text-gray-900">{row.codeSite}</td>
      <td className="px-4 py-3 text-center text-gray-700">
        {row.kpis.nbPermisCloturesTotal}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tc >= 80 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {tc} %
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-16 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${Math.min(av, 100)}%`, backgroundColor: barFill(av) }}
            />
          </div>
          <AvancementBadge pct={Math.round(av)} />
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tauxColor(ti)}`}>
          {ti.toFixed(1)} %
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600">
        {row.kpis.delaiMoyenValidationCdp.toFixed(1)}{t('dashboardKpis.kpis.suffixJours')}
      </td>
    </tr>
  )
}
