import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Plus, Clipboard, Loader2, CheckCircle, XCircle } from 'lucide-react'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import SiteCodeAutocomplete from '@/components/planning/SiteCodeAutocomplete'
import { referentielApi } from '@/api/referentielApi'
import { INTERVENTION_TYPES } from '@/data/constant/planning'
import type { PlanSite } from '@/types'

interface PlanSiteRow extends PlanSite {
  found: boolean | null
}

interface SiteSelectorBlockProps {
  typeIntervention: string
  onTypeChange: (t: string) => void
  siteCode: string
  siteName: string
  onSiteCodeChange: (c: string) => void
  onSiteNameChange: (n: string) => void
  planSites: PlanSiteRow[]
  onPlanSitesChange: (s: PlanSiteRow[]) => void
  errors: Record<string, string>
  disabled?: boolean
}

export type { PlanSiteRow }

export default function SiteSelectorBlock({
  typeIntervention,
  onTypeChange,
  siteCode,
  siteName,
  onSiteCodeChange,
  onSiteNameChange,
  planSites,
  onPlanSitesChange,
  errors,
  disabled = false,
}: SiteSelectorBlockProps) {
  const { t } = useTranslation()
  const isNewSite = typeIntervention === 'Nouveau site'
  const isMulti = typeIntervention !== '' && !isNewSite

  const [addCode, setAddCode] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [resolving, setResolving] = useState(false)

  const interventionTypeOptions = useMemo(
    () => [
      { value: '', label: t('planning.interventionTypes.choose') },
      ...INTERVENTION_TYPES.map((type) => ({
        value: type,
        label: t(`planning.interventionTypes.values.${type}`),
      })),
    ],
    [t],
  )

  const lookupCode = async (code: string): Promise<PlanSiteRow> => {
    try {
      const result = await referentielApi.fetchSiteByCode(code)
      return { codeSite: result.codeSite, nomSite: result.nomSite, found: true }
    } catch {
      return { codeSite: code, nomSite: '', found: false }
    }
  }

  const handleAddSingle = async () => {
    const code = addCode.trim().toUpperCase()
    if (!code) return
    if (planSites.some((s) => s.codeSite.toUpperCase() === code)) {
      setAddCode('')
      return
    }
    setResolving(true)
    const row = await lookupCode(code)
    setResolving(false)
    onPlanSitesChange([...planSites, row])
    setAddCode('')
  }

  const handlePasteImport = async () => {
    const codes = pasteText
      .split(';')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
    const newCodes = codes.filter(
      (c) => !planSites.some((s) => s.codeSite.toUpperCase() === c),
    )
    if (!newCodes.length) {
      setPasteText('')
      return
    }
    setResolving(true)
    const rows = await Promise.all(newCodes.map(lookupCode))
    setResolving(false)
    onPlanSitesChange([...planSites, ...rows])
    setPasteText('')
  }

  const handleRemoveSite = (idx: number) => {
    onPlanSitesChange(planSites.filter((_, i) => i !== idx))
  }

  const handleUpdateNomSite = (idx: number, nom: string) => {
    const updated = [...planSites]
    updated[idx] = { ...updated[idx], nomSite: nom }
    onPlanSitesChange(updated)
  }

  const handleSingleCodeBlur = async () => {
    const code = siteCode.trim()
    if (!code || siteName.trim()) return
    try {
      const result = await referentielApi.fetchSiteByCode(code)
      onSiteNameChange(result.nomSite)
    } catch {
      // not found — leave siteName editable
    }
  }

  return (
    <div className="space-y-4">
      <Select
        label={t('planning.siteSelector.typeInterventionLabel')}
        options={interventionTypeOptions}
        value={typeIntervention}
        onChange={(e) => onTypeChange(e.target.value)}
        error={errors.typeIntervention}
        disabled={disabled}
      />

      {isNewSite && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SiteCodeAutocomplete
            label={t('planning.siteSelector.codeSiteLabel')}
            value={siteCode}
            onChange={onSiteCodeChange}
            onSelect={(site) => {
              onSiteCodeChange(site.codeSite)
              onSiteNameChange(site.nomSite)
            }}
            onBlur={handleSingleCodeBlur}
            error={errors.siteCode}
            placeholder={t('planning.siteSelector.codeSitePlaceholder')}
            required
            disabled={disabled}
          />
          <Input
            label={t('planning.siteSelector.nomSiteLabel')}
            value={siteName}
            onChange={(e) => onSiteNameChange(e.target.value)}
            error={errors.siteName}
            placeholder={t('planning.siteSelector.nomSitePlaceholder')}
            required
            disabled={disabled}
          />
        </div>
      )}

      {isMulti && (
        <div className="space-y-3">
          {planSites.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium text-gray-600">{t('planning.siteSelector.codeSiteHeader')}</th>
                    <th className="px-4 py-2 font-medium text-gray-600">{t('planning.siteSelector.nomSiteHeader')}</th>
                    <th className="px-4 py-2 text-center font-medium text-gray-600 w-16">{t('planning.siteSelector.statutHeader')}</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {planSites.map((site, idx) => (
                    <tr key={`${site.codeSite}-${idx}`} className="bg-white">
                      <td className="px-4 py-2 font-mono text-gray-800">{site.codeSite}</td>
                      <td className="px-4 py-2">
                        {site.found === false ? (
                          <input
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                            value={site.nomSite}
                            placeholder={t('planning.siteSelector.nomSitePlaceholderShort')}
                            onChange={(e) => handleUpdateNomSite(idx, e.target.value)}
                            disabled={disabled}
                          />
                        ) : (
                          <span className="text-gray-800">{site.nomSite || '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {site.found === true && (
                          <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                        )}
                        {site.found === false && (
                          <XCircle className="mx-auto h-4 w-4 text-red-400" />
                        )}
                        {site.found === null && (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveSite(idx)}
                          disabled={disabled}
                          className="text-red-400 hover:text-red-600 disabled:opacity-40"
                          title={t('planning.siteSelector.remove')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-gray-200 py-4 text-center text-sm text-gray-400 italic">
              {t('planning.siteSelector.emptySites')}
            </p>
          )}

          {errors.planSites && (
            <p className="text-xs text-red-500">{errors.planSites}</p>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <SiteCodeAutocomplete
                label={t('planning.siteSelector.addCodeLabel')}
                value={addCode}
                onChange={setAddCode}
                onSelect={(site) => {
                  if (!planSites.some((s) => s.codeSite.toUpperCase() === site.codeSite.toUpperCase())) {
                    onPlanSitesChange([...planSites, { ...site, found: true }])
                  }
                  setAddCode('')
                }}
                placeholder={t('planning.siteSelector.addCodePlaceholder')}
                disabled={disabled || resolving}
              />
            </div>
            <button
              type="button"
              onClick={() => void handleAddSingle()}
              disabled={disabled || resolving || !addCode.trim()}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-40 mb-0.5"
            >
              {resolving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t('planning.siteSelector.addButton')}
            </button>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('planning.siteSelector.pasteLabel')}
            </label>
            <div className="flex gap-2">
              <textarea
                className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={2}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={t('planning.siteSelector.pastePlaceholder')}
                disabled={disabled || resolving}
              />
              <button
                type="button"
                onClick={() => void handlePasteImport()}
                disabled={disabled || resolving || !pasteText.trim()}
                className="self-end flex items-center gap-1 rounded-lg bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-40"
              >
                {resolving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
                {t('planning.siteSelector.importButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
