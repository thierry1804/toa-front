import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BookOpen, Check, MapPin, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import { usePermission } from '@/features/auth/usePermission'
import { useTerrainData } from '@/features/terrain/useTerrainData'
import { chantierKey, dayState, permitAction, type DayState } from '@/features/terrain/model'
import { useToday } from '@/features/terrain/useToday'
import { TerrainSyncStatus } from '@/features/terrain/TerrainSyncStatus'
import { latestInterventionProgress } from '@/features/intervention/presentation'
import type { Intervention } from '@/types/intervention'

export default function TerrainDashboardPage() {
  const { t, i18n } = useTranslation()
  const data = useTerrainData()
  const today = useToday()
  const [view, setView] = useState<'day' | 'sites'>('day')
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all')
  const [search, setSearch] = useState('')
  const canCreate = usePermission('suivi_journalier.create')
  const canViewSuivi = usePermission('suivi_journalier.view')
  const rows = data.interventions.map((intervention) => ({
    intervention,
    permit: data.permitMap.get(intervention.permitTravailId),
    suivis: data.suiviMap.get(intervention.id),
    state: dayState(intervention, data.permitMap.get(intervention.permitTravailId), data.suiviMap.get(intervention.id), today),
  }))
  const order: Record<DayState, number> = { todo: 0, unknown: 1, prepare: 2, review: 3, pending: 4, done: 5, future: 6, closed: 7 }
  const activeRows = rows.filter((row) => row.state !== 'closed')
  const countTodo = activeRows.filter((row) => row.state === 'todo').length
  const countDone = activeRows.filter((row) => ['done', 'pending'].includes(row.state)).length
  const filtered = activeRows.filter((row) => {
    if (filter === 'todo' && row.state !== 'todo') return false
    if (filter === 'done' && !['done', 'pending'].includes(row.state)) return false
    return [row.permit?.codeSite, row.permit?.reference, row.permit?.descriptionTravaux].join(' ').toLocaleLowerCase().includes(search.toLocaleLowerCase())
  }).sort((a, b) => order[a.state] - order[b.state])
  const groups = new Map<string, typeof rows>()
  rows.forEach((row) => {
    const key = row.permit ? chantierKey(row.permit) : row.intervention.id
    groups.set(key, [...(groups.get(key) ?? []), row])
  })
  const actions = data.permits.map((permit) => ({ permit, action: permitAction(permit, today) })).filter((item) => item.action)
  const carnetUrl = (i: Intervention) => `/interventions/${i.id}/carnet`

  if (data.isLoading) return <ListPageSkeleton />
  if (data.isError) return <div role="alert" className="space-y-3"><p>{t('terrain.loadError')}</p><Button onClick={data.retry}>{t('terrain.retry')}</Button></div>

  return <div className="space-y-5">
    <PageHeader title={t('terrain.myDay')} description={`${new Date(`${today}T12:00:00`).toLocaleDateString(i18n.language === 'mg' ? 'mg-MG' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${t('terrain.teamScope')}`} actions={<TerrainSyncStatus />} />
    {data.isPartial && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p>{t('terrain.partial')}</p><Button variant="outline" onClick={data.retry}>{t('terrain.retry')}</Button></div>}

    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3" aria-label={t('terrain.views')}>
      <Button variant={view === 'day' ? 'primary' : 'ghost'} aria-pressed={view === 'day'} onClick={() => setView('day')}>{t('terrain.today')}</Button>
      <Button variant={view === 'sites' ? 'primary' : 'ghost'} aria-pressed={view === 'sites'} onClick={() => setView('sites')}><BookOpen className="mr-2 h-4 w-4" />{t('terrain.notebooks')} ({groups.size})</Button>
      <Link className="ml-auto inline-flex min-h-11 items-center gap-2 text-sm font-medium text-blue-700" to="/interventions">{t('terrain.allInterventions')}<ArrowRight className="h-4 w-4" /></Link>
    </div>

    {view === 'day' ? <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <section className="min-w-0" aria-labelledby="workday-title">
        <h2 id="workday-title" className="text-lg font-semibold text-gray-900">{t('terrain.dailyFollowups')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('terrain.dayHint')}</p>
        <div className="my-4 flex flex-wrap gap-2">
          {(['all', 'todo', 'done'] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 rounded-lg border px-3 text-sm ${filter === value ? 'border-blue-200 bg-blue-50 font-medium text-blue-800' : 'border-gray-200 bg-white text-gray-600'}`}>{t(`terrain.filter.${value}`)} ({value === 'all' ? activeRows.length : value === 'todo' ? countTodo : countDone})</button>)}
        </div>
        <label className="mb-4 flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3"><Search className="h-4 w-4 text-gray-500" /><input aria-label={t('terrain.search')} placeholder={t('terrain.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="min-h-11 w-full bg-transparent text-sm outline-none focus:ring-2 focus:ring-blue-500" /></label>
        <div className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white">
          {filtered.length === 0 && <p className="p-6 text-sm text-gray-600">{t('terrain.emptyDay')}</p>}
          {filtered.map(({ intervention, permit, suivis, state }) => {
            const entry = suivis?.find((s) => s.date.slice(0, 10) === today)
            const latest = [...(suivis ?? [])].sort((a, b) => b.date.localeCompare(a.date))[0]
            const reference = permit?.reference ?? (typeof intervention.permitTravail === 'object' ? intervention.permitTravail.reference : intervention.id)
            return <article key={intervention.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900"><MapPin className="h-4 w-4 text-gray-500" />{permit?.codeSite ?? (typeof intervention.permitTravail === 'object' ? intervention.permitTravail.codeSite : '—')}</h3>
                <Badge variant={state === 'done' ? 'success' : state === 'todo' ? 'primary' : ['prepare', 'review', 'pending', 'unknown'].includes(state) ? 'warning' : 'secondary'}>{state === 'done' && <Check className="mr-1 h-3 w-3" />}{t(`terrain.state.${state}`)}</Badge>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-800">{permit?.descriptionTravaux || t('terrain.works')}</p>
              <p className="mt-1 break-words text-xs text-gray-500">{reference}{permit?.planProcess ? ` · ${permit.planProcess}` : ''}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                <span>{t('terrain.progress')} : {suivis ? `${latestInterventionProgress(suivis)} %` : '—'}</span>
                {entry ? <span>{t('terrain.reportedBy', { name: entry.nomResponsable })}</span> : latest ? <span>{t('terrain.lastReport', { date: new Date(`${latest.date.slice(0, 10)}T12:00:00`).toLocaleDateString(i18n.language === 'mg' ? 'mg-MG' : 'fr-FR') })}</span> : <span>{t('terrain.noReport')}</span>}
              </div>
              {['prepare', 'review', 'unknown'].includes(state) && <p className="mt-2 text-sm text-amber-800">{t(`terrain.hint.${state}`)}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {state === 'todo' && canCreate && <Link className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700" to={`/interventions/${intervention.id}/suivis?new=1`}>{t('terrain.enterToday')}<ArrowRight className="ml-2 h-4 w-4" /></Link>}
                {['done', 'pending'].includes(state) && canViewSuivi && <Link className="inline-flex min-h-11 items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-800 hover:bg-gray-50" to={`/interventions/${intervention.id}/suivis`}>{t('terrain.completeToday')}</Link>}
                <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-blue-700" to={carnetUrl(intervention)}><BookOpen className="h-4 w-4" />{t('terrain.openNotebook')}</Link>
              </div>
            </article>
          })}
        </div>
      </section>
      <aside className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">{t('terrain.permitActions')}</h2><p className="mt-1 text-sm text-gray-500">{t('terrain.permitActionsHint')}</p>
        <div className="mt-3 divide-y divide-gray-100">{actions.length === 0 && <p className="py-3 text-sm text-gray-600">{t('terrain.noPermitActions')}</p>}{actions.map(({ permit, action }) => <Link key={permit.id} to={`/permits-travail/${permit.id}`} className="block py-4 hover:text-blue-700"><p className="text-sm font-medium">{permit.codeSite}</p><p className="mt-1 text-xs text-gray-500">{permit.reference}</p><p className="mt-2 text-sm font-medium text-blue-700">{t(`terrain.permitAction.${action}`)} →</p></Link>)}</div>
      </aside>
    </div> : <section className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white" aria-label={t('terrain.notebooks')}>
      {groups.size === 0 && <p className="p-6 text-gray-600">{t('terrain.noNotebooks')}</p>}
      {[...groups.entries()].map(([key, group]) => <Link key={key} to={carnetUrl(group[0].intervention)} className="flex min-h-24 items-center justify-between gap-4 p-5 hover:bg-gray-50"><div><h2 className="font-semibold text-gray-900">{group[0].permit?.codeSite ?? '—'} · {group[0].permit?.planProcess || group[0].permit?.descriptionTravaux || t('terrain.works')}</h2><p className="mt-1 text-sm text-gray-500">{group.map((r) => r.permit?.reference ?? r.intervention.id).join(' · ')}</p><p className="mt-2 text-sm text-gray-700">{t('terrain.notebookCount', { count: group.length })}</p></div><ArrowRight className="h-5 w-5 shrink-0 text-blue-600" /></Link>)}
    </section>}
  </div>
}
