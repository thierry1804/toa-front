import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ArrowRight, BookOpen, Check, ChevronDown, MapPin, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import { usePermission } from '@/features/auth/usePermission'
import { useTerrainData } from '@/features/terrain/useTerrainData'
import { dayState, groupTasks, permitClosureNote, taskTarget, type DayState } from '@/features/terrain/model'
import { useToday } from '@/features/terrain/useToday'
import { TerrainSyncStatus } from '@/features/terrain/TerrainSyncStatus'
import { latestInterventionProgress } from '@/features/intervention/presentation'
import type { Intervention, SuiviJournalier } from '@/types/intervention'
import type { PermitTravail } from '@/types/permitTravail'


interface TaskRow {
  intervention: Intervention
  permit: PermitTravail | undefined
  suivis: SuiviJournalier[] | undefined
  state: DayState
}

const BADGE_VARIANT: Record<DayState, 'success' | 'primary' | 'warning' | 'secondary'> = {
  done: 'success',
  todo: 'primary',
  pending: 'warning',
  prepare: 'warning',
  unknown: 'warning',
  closed: 'secondary',
}

function Progress({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3" role="img" aria-label={`${value} %`}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="w-10 text-right text-sm font-semibold tabular-nums text-gray-800">{value} %</span>
    </div>
  )
}

function TaskCard({ row, today }: { row: TaskRow; today: string }) {
  const { t, i18n } = useTranslation()
  const canCreate = usePermission('suivi_journalier.create')
  const canViewSuivi = usePermission('suivi_journalier.view')
  const { intervention, permit, suivis, state } = row
  const embedded = typeof intervention.permitTravail === 'object' ? intervention.permitTravail : null
  const site = permit?.codeSite ?? embedded?.codeSite ?? '—'
  const reference = permit?.reference ?? embedded?.reference ?? intervention.id
  const entry = suivis?.find((s) => s.date.slice(0, 10) === today)
  const latest = [...(suivis ?? [])].sort((a, b) => b.date.localeCompare(a.date))[0]
  const progress = suivis ? latestInterventionProgress(suivis) : null
  const locale = i18n.language === 'mg' ? 'mg-MG' : 'fr-FR'
  const target = taskTarget(state, intervention, !!permit)

  const cta: { to: string; label: string; primary: boolean } | null =
    target === 'enter' && canCreate
      ? { to: `/interventions/${intervention.id}/suivis?new=1`, label: t('terrain.enterToday'), primary: true }
      : target === 'complete' && canViewSuivi
        ? { to: `/interventions/${intervention.id}/suivis`, label: t('terrain.completeToday'), primary: false }
        : target === 'intervention'
          ? { to: `/interventions/${intervention.id}`, label: t('terrain.openIntervention'), primary: false }
          : target === 'permit' && permit
            ? { to: `/permits-travail/${permit.id}`, label: t('terrain.viewPermit'), primary: false }
            : null

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex min-w-0 items-center gap-2 text-lg font-semibold text-gray-900">
          <MapPin className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
          <span className="truncate">{site}</span>
        </h3>
        <Badge variant={BADGE_VARIANT[state]}>
          {state === 'done' && <Check className="mr-1 h-3 w-3" aria-hidden />}
          {t(`terrain.state.${state}`)}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-gray-800">{permit?.descriptionTravaux || t('terrain.works')}</p>
      <p className="mt-0.5 break-words text-xs text-gray-500">{reference}{permit?.planProcess ? ` · ${permit.planProcess}` : ''}</p>

      {progress !== null && <div className="mt-3"><Progress value={progress} /></div>}
      <p className="mt-2 text-xs text-gray-600">
        {entry
          ? t('terrain.reportedBy', { name: entry.nomResponsable })
          : latest
            ? t('terrain.lastReport', { date: new Date(`${latest.date.slice(0, 10)}T12:00:00`).toLocaleDateString(locale) })
            : t('terrain.noReport')}
      </p>

      {['prepare', 'unknown'].includes(state) && (
        <p className="mt-2 flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t(`terrain.hint.${state}`)}
        </p>
      )}

      {permitClosureNote(permit) && (
        <p className="mt-2 flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t('terrain.permitClosedNote')}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {cta && (
          <Link
            to={cta.to}
            className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold sm:w-auto ${
              cta.primary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
            }`}
          >
            {cta.label}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
        <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-blue-700" to={`/interventions/${intervention.id}/carnet`}>
          <BookOpen className="h-4 w-4" aria-hidden />
          {t('terrain.openNotebook')}
        </Link>
      </div>
    </article>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export default function TerrainDashboardPage() {
  const { t, i18n } = useTranslation()
  const data = useTerrainData()
  const today = useToday()
  const [search, setSearch] = useState('')

  if (data.isLoading) return <ListPageSkeleton />
  if (data.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>{t('terrain.loadError')}</p>
        <Button onClick={data.retry}>{t('terrain.retry')}</Button>
      </div>
    )
  }

  const rows: TaskRow[] = data.interventions.map((intervention) => {
    const permit = data.permitMap.get(intervention.permitTravailId)
    const suivis = data.suiviMap.get(intervention.id)
    return { intervention, permit, suivis, state: dayState(intervention, permit, suivis, today) }
  })
  const open = rows.filter((row) => row.state !== 'closed')
  const q = search.trim().toLocaleLowerCase()
  // Recherche par code site (et, par commodité, référence du permis ou intitulé des travaux).
  const siteOf = (row: TaskRow) => row.permit?.codeSite ?? (typeof row.intervention.permitTravail === 'object' ? row.intervention.permitTravail.codeSite : '')
  const visible = q
    ? open.filter((row) => [siteOf(row), row.permit?.reference, row.permit?.descriptionTravaux].join(' ').toLocaleLowerCase().includes(q))
    : open
  const { todo, waiting, done } = groupTasks(visible)
  const allGroups = groupTasks(open)
  const todoCount = allGroups.todo.length
  const doneCount = allGroups.done.length
  const locale = i18n.language === 'mg' ? 'mg-MG' : 'fr-FR'

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title={t('terrain.myDay')}
        description={new Date(`${today}T12:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
        actions={<TerrainSyncStatus />}
      />

      {data.isPartial && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>{t('terrain.partial')}</p>
          <Button variant="outline" onClick={data.retry}>{t('terrain.retry')}</Button>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-base font-semibold text-gray-900">{t('terrain.summaryTodo', { count: todoCount })} · {t('terrain.summaryDone', { count: doneCount })}</p>
        {todoCount + doneCount > 0 && (
          <div className="mt-3"><Progress value={Math.round((doneCount / (todoCount + doneCount)) * 100)} /></div>
        )}
      </div>

      {open.length > 0 && (
        <label className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3">
          <Search className="h-4 w-4 text-gray-500" aria-hidden />
          <input
            aria-label={t('terrain.search')}
            placeholder={t('terrain.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-11 w-full bg-transparent text-sm outline-none"
          />
        </label>
      )}

      {open.length > 0 && visible.length === 0 && (
        <p role="status" className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">{t('terrain.noSiteMatch', { query: search.trim() })}</p>
      )}

      {open.length === 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="font-semibold text-gray-900">{t('terrain.emptyDay')}</p>
          <p className="mt-1 text-sm text-gray-600">{t('terrain.emptyDayHelp')}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/permits-travail" className="inline-flex min-h-12 items-center rounded-lg bg-blue-600 px-5 text-base font-semibold text-white hover:bg-blue-700">{t('terrain.myPermits')}</Link>
            <Link to="/interventions" className="inline-flex min-h-12 items-center rounded-lg border border-gray-300 bg-white px-5 text-base font-semibold text-gray-800 hover:bg-gray-50">{t('terrain.myInterventions')}</Link>
          </div>
        </section>
      )}
      {open.length > 0 && todoCount === 0 && waiting.length === 0 && <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">{t('terrain.allDone')}</p>}

      {todo.length > 0 && (
        <Section title={t('terrain.sectionTodo')}>
          {todo.map((row) => <TaskCard key={row.intervention.id} row={row} today={today} />)}
        </Section>
      )}

      {waiting.length > 0 && (
        <Section title={t('terrain.sectionWaiting')}>
          {waiting.map((row) => <TaskCard key={row.intervention.id} row={row} today={today} />)}
        </Section>
      )}

      {done.length > 0 && (
        <details className="group rounded-lg border border-gray-200 bg-white">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-base font-semibold text-gray-900">
            {t('terrain.sectionDone', { count: done.length })}
            <ChevronDown className="h-4 w-4 text-gray-500 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="space-y-3 border-t border-gray-100 p-3">
            {done.map((row) => <TaskCard key={row.intervention.id} row={row} today={today} />)}
          </div>
        </details>
      )}
    </div>
  )
}
