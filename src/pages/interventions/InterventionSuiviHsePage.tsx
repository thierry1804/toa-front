import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Activity, TrendingUp, Play, CheckCircle, ChevronUp, ChevronDown, ChevronsUpDown, FileCheck, BarChart2, Clock } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import AvancementBadge from '@/components/intervention/AvancementBadge'
import { usePermission } from '@/features/auth/usePermission'
import {
  useInterventionDashboard,
  useInterventionStatsJournalieres,
} from '@/features/intervention/hooks/useIntervention'
import { useKpisIntervention } from '@/features/permitTravail/hooks/usePermitTravail'
import type { InterventionSuiviFilters, StatutIntervention } from '@/types/intervention'

const STATUT_OPTIONS = [
  { value: '',                   label: 'Tous les statuts' },
  { value: 'EN_PREPARATION',     label: 'En préparation' },
  { value: 'EVALUATION_COMPLETE', label: 'Évaluation complète' },
  { value: 'EN_COURS',           label: 'En cours' },
  { value: 'TERMINEE',           label: 'Terminée' },
]

const STATUT_LABELS: Record<StatutIntervention, string> = {
  EN_PREPARATION:      'En préparation',
  EVALUATION_COMPLETE: 'Évaluation complète',
  EN_COURS:            'En cours',
  TERMINEE:            'Terminée',
}

type SortKey = 'permitReference' | 'codeSite' | 'statut' | 'avancementMoyen' | 'dernierSuivi' | 'nbSuivis'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="h-3.5 w-3.5 text-gray-400" />
  return dir === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5 text-blue-600" />
    : <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
}

function StatCard({
  label, value, icon: Icon, color, suffix = '',
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

function StatutBadge({ statut }: { statut: StatutIntervention }) {
  const styles: Record<StatutIntervention, string> = {
    EN_PREPARATION:      'bg-gray-100 text-gray-700',
    EVALUATION_COMPLETE: 'bg-blue-100 text-blue-700',
    EN_COURS:            'bg-orange-100 text-orange-700',
    TERMINEE:            'bg-green-100 text-green-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[statut] ?? 'bg-gray-100 text-gray-700'}`}>
      {STATUT_LABELS[statut] ?? statut}
    </span>
  )
}

function relativeDays(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Il y a 1 jour'
  return `Il y a ${diff} jours`
}

export default function InterventionSuiviHsePage() {
  const canDashboard = usePermission('intervention.suivi.dashboard')
  const navigate     = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const [draft, setDraft] = useState<InterventionSuiviFilters>({
    codeSite:  searchParams.get('codeSite')  ?? '',
    statut:    (searchParams.get('statut') as StatutIntervention | '') ?? '',
    dateDebut: searchParams.get('dateDebut') ?? '',
    dateFin:   searchParams.get('dateFin')   ?? '',
  })

  const activeFilters: InterventionSuiviFilters = useMemo(() => ({
    codeSite:  searchParams.get('codeSite')  || undefined,
    statut:    (searchParams.get('statut') as StatutIntervention) || undefined,
    dateDebut: searchParams.get('dateDebut') || undefined,
    dateFin:   searchParams.get('dateFin')   || undefined,
  }), [searchParams])

  const { data: dashboard, isLoading } = useInterventionDashboard(activeFilters)
  const { data: statsJour }            = useInterventionStatsJournalieres(
    activeFilters.codeSite,
    undefined,
  )
  const { data: kpis } = useKpisIntervention(activeFilters.codeSite || undefined)

  const [sortKey, setSortKey] = useState<SortKey>('dernierSuivi')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

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

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const applyFilters = () => {
    const p: Record<string, string> = {}
    if (draft.codeSite)  p.codeSite  = draft.codeSite
    if (draft.statut)    p.statut    = draft.statut
    if (draft.dateDebut) p.dateDebut = draft.dateDebut
    if (draft.dateFin)   p.dateFin   = draft.dateFin
    setSearchParams(p, { replace: true })
  }

  const resetFilters = () => {
    setDraft({ codeSite: '', statut: '', dateDebut: '', dateFin: '' })
    setSearchParams({}, { replace: true })
  }

  if (!canDashboard) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Accès non autorisé
      </div>
    )
  }

  const parStatut = dashboard?.parStatut ?? {} as Record<StatutIntervention, number>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suivi avancements — Interventions"
        description="Tableau de bord HSE / Chef de Projet, actualisé toutes les 60 secondes"
      />

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Site"
              type="text"
              value={draft.codeSite ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, codeSite: e.target.value }))}
              placeholder="Code site…"
            />
            <Select
              label="Statut"
              value={draft.statut ?? ''}
              options={STATUT_OPTIONS}
              onChange={(e) => setDraft((d) => ({ ...d, statut: e.target.value as StatutIntervention | '' }))}
            />
            <Input
              label="Début"
              type="date"
              value={draft.dateDebut ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, dateDebut: e.target.value }))}
            />
            <Input
              label="Fin"
              type="date"
              value={draft.dateFin ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, dateFin: e.target.value }))}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={applyFilters}>Appliquer</Button>
            <Button variant="outline" onClick={resetFilters}>Réinitialiser</Button>
          </div>
        </CardContent>
      </Card>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total interventions"
          value={dashboard?.totalInterventions}
          icon={Activity}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          label="Avancement moyen"
          value={dashboard?.avancementMoyen !== undefined ? Math.round(dashboard.avancementMoyen) : undefined}
          icon={TrendingUp}
          color="bg-indigo-100 text-indigo-700"
          suffix="%"
        />
        <StatCard
          label="En cours"
          value={parStatut.EN_COURS}
          icon={Play}
          color="bg-orange-100 text-orange-700"
        />
        <StatCard
          label="Terminées"
          value={parStatut.TERMINEE}
          icon={CheckCircle}
          color="bg-green-100 text-green-700"
        />
      </div>

      {/* KPI PV — mois courant */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="PV validés ce mois"
          value={kpis?.nbPermisCloturesValides}
          icon={FileCheck}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          label="Taux de clôture"
          value={kpis !== undefined ? Math.round(kpis.tauxCloture * 100) : undefined}
          icon={BarChart2}
          color={kpis !== undefined && kpis.tauxCloture >= 0.8 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
          suffix="%"
        />
        <StatCard
          label="Délai moyen validation CdP"
          value={kpis !== undefined ? Math.round(kpis.delaiMoyenValidationCdp) : undefined}
          icon={Clock}
          color="bg-purple-100 text-purple-700"
          suffix=" j"
        />
      </div>

      {/* Stats journalières site (si codeSite actif) */}
      {activeFilters.codeSite && statsJour && (
        <Card>
          <div className="border-b px-6 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Stats journalières — {statsJour.codeSite} ({statsJour.date})
            </h3>
          </div>
          <CardContent className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{statsJour.nbInterventionsActives}</p>
              <p className="text-xs text-gray-500">Interventions actives</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{Math.round(statsJour.avancementMoyen)}%</p>
              <p className="text-xs text-gray-500">Avancement moyen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{statsJour.nbSuivisJour}</p>
              <p className="text-xs text-gray-500">Suivis renseignés aujourd'hui</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau */}
      <Card>
        <div className="border-b px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Interventions ({dashboard?.totalInterventions ?? 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">Chargement…</div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">Aucune intervention correspondante</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  {(
                    [
                      ['permitReference', 'Référence permis'],
                      ['codeSite',        'Site'],
                      ['statut',          'Statut'],
                      ['avancementMoyen', 'Avancement'],
                      ['dernierSuivi',    'Dernier suivi'],
                      ['nbSuivis',        'Nb suivis'],
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
                    <td className="px-4 py-3 font-mono text-xs font-medium text-blue-700">
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
                            className="h-2 rounded-full bg-blue-500 transition-all"
                            style={{ width: `${Math.min(item.avancementMoyen, 100)}%` }}
                          />
                        </div>
                        <AvancementBadge pct={Math.round(item.avancementMoyen)} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {relativeDays(item.dernierSuivi)}
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
                        Détail
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
