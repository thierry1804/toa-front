import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SectionPlanifieeItem } from '@/types'
import type { PhaseAvancement } from '@/types/intervention'

export function PhaseProgressFields({ sections, value, onChange }: { sections: SectionPlanifieeItem[]; value: PhaseAvancement[]; onChange: (phases: PhaseAvancement[]) => void }) {
  const { t } = useTranslation()
  const [custom, setCustom] = useState('')
  const options = new Map(sections.map((s) => [s.id, { phaseId: s.id, libelle: s.libelle, avancementPourcentage: 0 }]))
  value.forEach((phase) => options.set(phase.phaseId, phase))
  return <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4">
    <legend className="px-1 text-sm font-semibold text-gray-900">{t('terrain.phasesToday')}</legend>
    <p className="text-sm text-gray-500">{t('terrain.phasesHint')}</p>
    {[...options.values()].map((phase) => {
      const selected = value.find((p) => p.phaseId === phase.phaseId)
      return <div key={phase.phaseId} className="flex flex-wrap items-center justify-between gap-2"><label className="flex min-h-11 flex-1 items-center gap-3 text-sm text-gray-800"><input type="checkbox" checked={!!selected} onChange={(e) => onChange(e.target.checked ? [...value, phase] : value.filter((p) => p.phaseId !== phase.phaseId))} className="h-5 w-5 accent-blue-600" />{phase.libelle}</label>{selected && <label className="flex items-center gap-2 text-sm"><span className="sr-only">{t('terrain.progress')} {phase.libelle}</span><input type="number" min={0} max={100} step={1} required value={selected.avancementPourcentage} onChange={(e) => onChange(value.map((p) => p.phaseId === phase.phaseId ? { ...p, avancementPourcentage: Number(e.target.value) } : p))} className="min-h-11 w-20 rounded-lg border border-gray-300 px-2" />%</label>}</div>
    })}
    <div className="flex flex-wrap gap-2"><input aria-label={t('terrain.newPhase')} placeholder={t('terrain.newPhase')} maxLength={200} value={custom} onChange={(e) => setCustom(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm" /><button type="button" disabled={!custom.trim()} onClick={() => {
      const phaseId = `custom:${custom.trim().toLocaleLowerCase()}`
      if (!value.some((p) => p.phaseId === phaseId)) onChange([...value, { phaseId, libelle: custom.trim(), avancementPourcentage: 0 }])
      setCustom('')
    }} className="min-h-11 rounded-lg border border-gray-300 px-3 text-sm font-medium disabled:opacity-40">{t('terrain.addPhase')}</button></div>
  </fieldset>
}
