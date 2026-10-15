import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, BookOpen, Camera } from 'lucide-react'
import { ClickableCard } from '@/components/ui/ClickableCard'
import { PageHeader } from '@/components/layout/PageHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import StatutPermitBadge from '@/components/permitTravail/StatutPermitBadge'
import SuiviDocumentUploadZone from '@/components/intervention/SuiviDocumentUploadZone'
import { usePlanPreventionDetail } from '@/features/planPrevention/hooks/usePlanPrevention'
import { usePermission } from '@/features/auth/usePermission'
import { useTerrainData } from '@/features/terrain/useTerrainData'
import { chantierKey, dayState } from '@/features/terrain/model'
import { useToday } from '@/features/terrain/useToday'
import { TerrainSyncStatus } from '@/features/terrain/TerrainSyncStatus'

export default function ChantierNotebookPage() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const data = useTerrainData()
  const today = useToday()
  const canCreate = usePermission('suivi_journalier.create')
  const anchor = data.interventions.find((i) => i.id === id)
  const permit = anchor && data.permitMap.get(anchor.permitTravailId)
  const { data: plan, isLoading: loadingPlan, isError: planError, refetch: refetchPlan } = usePlanPreventionDetail(permit?.planPreventionId ?? '')
  const retry = () => { data.retry(); if (permit?.planPreventionId) void refetchPlan() }
  const [tab, setTab] = useState<'journal' | 'phases' | 'photos' | 'permits'>('journal')
  const [phaseFilter, setPhaseFilter] = useState('all')
  const relatedPermits = permit ? data.permits.filter((p) => chantierKey(p) === chantierKey(permit)) : []
  const permitIds = new Set(relatedPermits.map((p) => p.id))
  const interventions = data.interventions.filter((i) => permitIds.has(i.permitTravailId) || i.id === id)
  const journal = interventions.flatMap((intervention) => (data.suiviMap.get(intervention.id) ?? []).map((suivi) => ({ intervention, suivi })))
    .sort((a, b) => b.suivi.date.localeCompare(a.suivi.date) || b.suivi.createdAt.localeCompare(a.suivi.createdAt))
  const phases = new Map((plan?.sections ?? plan?.planificationSections ?? []).slice().sort((a, b) => a.ordre - b.ordre).map((phase) => [phase.id, { id: phase.id, libelle: phase.libelle, tasks: phase.taches.map((task) => task.tache) }]))
  journal.forEach(({ suivi }) => suivi.phasesAvancement?.forEach((phase) => {
    if (!phases.has(phase.phaseId)) phases.set(phase.phaseId, { id: phase.phaseId, libelle: phase.libelle, tasks: [] })
  }))
  const entries = journal.filter(({ suivi }) => phaseFilter === 'all' || (tab === 'photos'
    ? suivi.documents?.some((document) => document.phaseId === phaseFilter)
    : suivi.phasesAvancement?.some((p) => p.phaseId === phaseFilter)))
  const photoCount = journal.reduce((count, { suivi }) => count + (suivi.documents?.filter((d) => d.mimeType.startsWith('image/')).length ?? 0), 0)

  if (data.isLoading || loadingPlan) return <ListPageSkeleton />
  if (data.isError || !anchor) return <div className="space-y-3"><p role="alert">{t('terrain.loadError')}</p><Button onClick={retry}>{t('terrain.retry')}</Button><Link className="block text-blue-700" to="/dashboard">{t('terrain.myDay')}</Link></div>

  return <div className="space-y-5">
    <Link to="/dashboard" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-blue-700"><ArrowLeft className="h-4 w-4" />{t('terrain.myDay')}</Link>
    <PageHeader title={`${t('terrain.notebook')} · ${permit?.codeSite ?? '—'}`} description={plan ? `${plan.reference} · ${plan.activitePlanifiee}` : permit?.descriptionTravaux || t('terrain.teamScope')} actions={<TerrainSyncStatus />} />
    {(data.isPartial || planError) && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t('terrain.partial')} <button className="underline" onClick={retry}>{t('terrain.retry')}</button></p>}
    <section className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white" aria-label={t('terrain.dailyFollowups')}>
      {interventions.map((intervention) => {
        const currentPermit = data.permitMap.get(intervention.permitTravailId)
        const state = dayState(intervention, currentPermit, data.suiviMap.get(intervention.id), today)
        const url = state === 'todo' && canCreate ? `/interventions/${intervention.id}/suivis?new=1` : ['done', 'pending', 'closed'].includes(state) ? `/interventions/${intervention.id}/suivis` : currentPermit ? `/permits-travail/${currentPermit.id}` : `/interventions/${intervention.id}`
        return <ClickableCard key={intervention.id} to={url} label={currentPermit?.reference ?? intervention.id} chevron={false} className="flex-wrap items-center justify-between gap-3 rounded-none border-0"><div><p className="text-sm font-semibold text-gray-900">{currentPermit?.reference ?? intervention.id}</p><p className="mt-1 text-sm text-gray-600">{currentPermit?.descriptionTravaux}</p><p className="mt-2 text-sm text-gray-600">{t(`terrain.state.${state}`)}</p></div><Link className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-medium text-blue-800" to={url}>{state === 'todo' && canCreate ? t('terrain.enterToday') : ['done', 'pending'].includes(state) ? t('terrain.completeToday') : state === 'closed' ? t('terrain.history') : t('terrain.checkPermit')}<ArrowRight className="h-4 w-4" /></Link></ClickableCard>
      })}
    </section>

    <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 pb-2" aria-label={t('terrain.notebookSections')}>
      {(['journal', 'phases', 'photos', 'permits'] as const).map((value) => <Button key={value} variant={tab === value ? 'primary' : 'ghost'} aria-pressed={tab === value} onClick={() => setTab(value)} className="min-h-11 shrink-0">{t(`terrain.tab.${value}`)} ({value === 'journal' ? journal.length : value === 'phases' ? phases.size : value === 'photos' ? photoCount : relatedPermits.length})</Button>)}
    </nav>

    {(tab === 'journal' || tab === 'photos') && <>
      {phases.size > 0 && <label className="flex flex-wrap items-center gap-3 text-sm text-gray-700">{t('terrain.filterPhase')}<select className="min-h-11 max-w-full rounded-lg border border-gray-300 bg-white px-3" value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)}><option value="all">{t('terrain.allPhases')}</option>{[...phases.values()].map((phase) => <option key={phase.id} value={phase.id}>{phase.libelle}</option>)}</select></label>}
      <div className="space-y-4">{entries.filter(({ suivi }) => tab !== 'photos' || suivi.documents?.some((d) => d.mimeType.startsWith('image/') && (phaseFilter === 'all' || d.phaseId === phaseFilter))).map(({ intervention, suivi }) => <ClickableCard key={suivi.id} to={`/interventions/${intervention.id}/suivis`} label={`${suivi.date.slice(0, 10)} ${suivi.nomResponsable}`} chevron={false} className="block p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-gray-900">{new Date(`${suivi.date.slice(0, 10)}T12:00:00`).toLocaleDateString(i18n.language === 'mg' ? 'mg-MG' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2><Badge variant={suivi.pendingSync ? 'warning' : suivi.realise ? 'success' : 'secondary'}>{suivi.pendingSync ? t('terrain.state.pending') : suivi.realise ? t('terrain.realised') : t('terrain.notRealised')}</Badge></div>
        <p className="mt-1 text-sm text-gray-500">{suivi.nomResponsable} · {data.permitMap.get(intervention.permitTravailId)?.reference}</p>
        {tab === 'journal' && <><p className="mt-3 text-sm font-medium">{t('terrain.progress')} : {suivi.avancementPourcentage} %</p><div className="mt-2 flex flex-wrap gap-2">{suivi.phasesAvancement?.map((phase) => <Badge key={phase.phaseId} variant="secondary">{phase.libelle} · {phase.avancementPourcentage} %</Badge>)}</div>{suivi.motifNonRealisation && <p className="mt-3 text-sm text-amber-800">{suivi.motifNonRealisation}</p>}{suivi.commentaire && <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{suivi.commentaire}</p>}{suivi.dangersMaitrises === false && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{t('terrain.hazardReported')} : {suivi.detailsDangers}</p>}</>}
        {!!suivi.documents?.length && <div className="mt-4"><SuiviDocumentUploadZone suiviId={suivi.id} phases={suivi.phasesAvancement ?? []} documents={tab === 'photos' ? suivi.documents.filter((d) => d.mimeType.startsWith('image/') && (phaseFilter === 'all' || d.phaseId === phaseFilter)) : suivi.documents} onUpload={async () => undefined} onDelete={async () => undefined} disabled /></div>}
        <Link className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-blue-700" to={`/interventions/${intervention.id}/suivis`}>{t('terrain.openReport')}<ArrowRight className="h-4 w-4" /></Link>
      </ClickableCard>)}</div>
      {entries.filter(({ suivi }) => tab !== 'photos' || suivi.documents?.some((d) => d.mimeType.startsWith('image/') && (phaseFilter === 'all' || d.phaseId === phaseFilter))).length === 0 && <div className="py-12 text-center text-gray-500">{tab === 'photos' ? <Camera className="mx-auto mb-3 h-8 w-8" /> : <BookOpen className="mx-auto mb-3 h-8 w-8" />}<p>{t(tab === 'photos' ? 'terrain.noPhotos' : 'terrain.noJournal')}</p></div>}
    </>}

    {tab === 'phases' && <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">{phases.size === 0 && <p className="p-6 text-sm text-gray-600">{t('terrain.noPhases')}</p>}{[...phases.values()].map((phase, index) => {
      const reports = journal.filter(({ suivi }) => suivi.phasesAvancement?.some((p) => p.phaseId === phase.id))
      const latest = reports[0]?.suivi.phasesAvancement?.find((p) => p.phaseId === phase.id)
      return <ClickableCard key={phase.id} onOpen={latest ? () => { setPhaseFilter(phase.id); setTab('journal') } : undefined} label={phase.libelle} chevron={false} className={`block rounded-none border-0 p-5 ${latest ? '' : 'cursor-default hover:bg-white'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('terrain.phase')} {index + 1}</p><h2 className="mt-1 font-semibold text-gray-900">{phase.libelle}</h2></div><Badge variant={latest?.avancementPourcentage === 100 ? 'success' : 'secondary'}>{latest ? `${latest.avancementPourcentage} %` : t('terrain.notReported')}</Badge></div>{phase.tasks.length > 0 && <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-gray-600">{phase.tasks.map((task, i) => <li key={i}>{task}</li>)}</ul>}{latest && <button type="button" onClick={() => { setPhaseFilter(phase.id); setTab('journal') }} className="mt-3 min-h-11 text-sm font-medium text-blue-700">{t('terrain.phaseReports', { count: reports.length })} →</button>}</ClickableCard>
    })}</div>}

    {tab === 'permits' && <section className="space-y-4">
      {plan && <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-blue-700" to={`/prevention/${plan.id}`}>{t('terrain.preventionPlan')} · {plan.reference}<ArrowRight className="h-4 w-4" /></Link>}
      <p className="text-sm text-gray-600">{t('terrain.closureHint')}</p>
      {relatedPermits.map((p) => <ClickableCard key={p.id} to={`/permits-travail/${p.id}`} label={p.reference} chevron={false} className="block p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-gray-900">{p.reference}</h2><StatutPermitBadge statut={p.statut} /></div><p className="mt-2 text-sm text-gray-600">{t(`terrain.permitType.${p.typePermis}`)} · {p.descriptionTravaux}</p><p className="mt-2 text-sm text-gray-500">{p.dateDebutPrevue?.slice(0, 10)} → {p.dateFinPrevue?.slice(0, 10)}</p><Link to={`/permits-travail/${p.id}`} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-blue-700">{t('terrain.permitAndClosure')}<ArrowRight className="h-4 w-4" /></Link></ClickableCard>)}
    </section>}
  </div>
}
