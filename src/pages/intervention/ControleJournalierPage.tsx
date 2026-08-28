import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, X, Loader2, AlertTriangle, CheckCircle2, Wind, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Checkbox from '@/components/ui/Checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import { usePermitTravailDetail } from '@/features/permitTravail/hooks/usePermitTravail'
import {
  useInterventionDetail,
  useInterventionControlesJournaliers,
  useControleJournalier,
} from '@/features/intervention/hooks/useIntervention'
import { usePermission } from '@/features/auth/usePermission'
import type { ControleJournalier } from '@/types/intervention'

const TODAY = new Date().toISOString().slice(0, 10)

export default function ControleJournalierPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const canCreate = usePermission('controle_journalier.create')
  const canEdit = usePermission('controle_journalier.edit')

  const { data: intervention, isLoading: loadingIntervention } = useInterventionDetail(id ?? '')
  const { data: permit, isLoading: loadingPermit } = usePermitTravailDetail(intervention?.permitTravailId ?? '')
  const { data: controles = [], isLoading: loadingControles } = useInterventionControlesJournaliers(id ?? '')
  const { createControleJournalier, updateControleJournalier, isCreating, isUpdating, createError } = useControleJournalier(id ?? '')

  const [showForm, setShowForm] = useState(false)
  const [intervenants, setIntervenants] = useState<string[]>([''])
  const [confirmationMesures, setConfirmationMesures] = useState(false)
  const [vitesseVent, setVitesseVent] = useState('')
  const [signatureDemandeur, setSignatureDemandeur] = useState('')
  const [signatureIntervenant, setSignatureIntervenant] = useState('')
  const [clotureId, setClotureId] = useState<string | null>(null)
  const [clotureDemandeur, setClotureDemandeur] = useState('')
  const [clotureIntervenant, setClotureIntervenant] = useState('')

  const isLoading = loadingIntervention || loadingPermit || loadingControles
  const typePermis = permit?.typePermis
  const isApplicable = typePermis === 'ELECTRIQUE' || typePermis === 'HAUTEUR'
  const hasTodayControle = controles.some((c) => c.date === TODAY)

  const resetForm = () => {
    setIntervenants([''])
    setConfirmationMesures(false)
    setVitesseVent('')
    setSignatureDemandeur('')
    setSignatureIntervenant('')
  }

  const isFormValid =
    intervenants.some((i) => i.trim() !== '') &&
    confirmationMesures &&
    signatureDemandeur.trim() !== '' &&
    signatureIntervenant.trim() !== '' &&
    (typePermis !== 'HAUTEUR' || (vitesseVent !== '' && Number(vitesseVent) > 0))

  const handleSubmit = async () => {
    if (!id || !isFormValid) return
    await createControleJournalier({
      intervention: `/api/interventions/${id}`,
      date: TODAY,
      intervenants: intervenants.filter((i) => i.trim() !== ''),
      confirmationMesures,
      vitesseVent: typePermis === 'HAUTEUR' ? Number(vitesseVent) : null,
      signatureDemandeur,
      signatureIntervenant,
    })
    resetForm()
    setShowForm(false)
  }

  const handleCloture = async (controleId: string) => {
    if (!clotureDemandeur.trim() || !clotureIntervenant.trim()) return
    await updateControleJournalier(controleId, {
      signatureClotureDemandeur: clotureDemandeur,
      signatureClotureIntervenant: clotureIntervenant,
    })
    setClotureId(null)
    setClotureDemandeur('')
    setClotureIntervenant('')
  }

  if (isLoading) {
    return <ListPageSkeleton withStatStrip={false} />
  }

  if (!intervention) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-500">
        <AlertTriangle className="h-10 w-10 text-gray-300" />
        <p>{t('intervention.pages.controleJournalier.notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/interventions')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('intervention.pages.controleJournalier.backToIntervention')}
        </Button>
      </div>
    )
  }

  const apiDetail = createError
    ? ((createError as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? '')
    : ''
  const resolvedApiError = apiDetail.includes('doublon')
    ? t('intervention.pages.controleJournalier.doublonError')
    : apiDetail

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('intervention.pages.controleJournalier.title')}
        description={t('intervention.pages.controleJournalier.description')}
        actions={
          <Button variant="outline" onClick={() => navigate(`/interventions/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('intervention.pages.controleJournalier.backToIntervention')}
          </Button>
        }
      />

      {intervention.statut !== 'EVALUATION_COMPLETE' ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t('intervention.pages.controleJournalier.notReady')}</span>
        </div>
      ) : !isApplicable ? (
        <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t('intervention.pages.controleJournalier.notApplicable')}</span>
        </div>
      ) : (
        <>
          {canCreate && !showForm && !hasTodayControle && (
            <div className="flex justify-end">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('intervention.pages.controleJournalier.newButton')}
              </Button>
            </div>
          )}

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('intervention.pages.controleJournalier.newButton')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input label={t('intervention.pages.controleJournalier.form.date')} type="date" value={TODAY} disabled />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t('intervention.pages.controleJournalier.form.intervenants')} <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {intervenants.map((intervenant, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          value={intervenant}
                          onChange={(e) => setIntervenants((arr) => arr.map((v, idx) => (idx === i ? e.target.value : v)))}
                          placeholder={t('intervention.pages.controleJournalier.form.intervenantPlaceholder', { number: i + 1 })}
                        />
                        {intervenants.length > 1 && (
                          <Button type="button" variant="outline" size="sm" onClick={() => setIntervenants((arr) => arr.filter((_, idx) => idx !== i))}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setIntervenants((arr) => [...arr, ''])}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {t('intervention.pages.controleJournalier.form.addIntervenant')}
                  </Button>
                </div>

                {typePermis === 'HAUTEUR' && (
                  <div>
                    <Input
                      label={t('intervention.pages.controleJournalier.form.vitesseVent')}
                      type="number"
                      min={0}
                      max={100}
                      value={vitesseVent}
                      onChange={(e) => setVitesseVent(e.target.value)}
                      required
                    />
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <Wind className="h-3.5 w-3.5" />
                      {t('intervention.pages.controleJournalier.form.vitesseVentHint')}
                    </p>
                  </div>
                )}

                <Checkbox
                  label={t('intervention.pages.controleJournalier.form.confirmationMesures')}
                  checked={confirmationMesures}
                  onChange={(e) => setConfirmationMesures(e.target.checked)}
                />

                <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 md:grid-cols-2">
                  <Input
                    label={t('intervention.pages.controleJournalier.form.signatureDemandeur')}
                    value={signatureDemandeur}
                    onChange={(e) => setSignatureDemandeur(e.target.value)}
                    placeholder={t('intervention.pages.controleJournalier.form.signaturePlaceholder')}
                    required
                  />
                  <Input
                    label={t('intervention.pages.controleJournalier.form.signatureIntervenant')}
                    value={signatureIntervenant}
                    onChange={(e) => setSignatureIntervenant(e.target.value)}
                    placeholder={t('intervention.pages.controleJournalier.form.signaturePlaceholder')}
                    required
                  />
                </div>

                {resolvedApiError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{resolvedApiError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                  <Button type="button" variant="outline" onClick={() => { resetForm(); setShowForm(false) }} disabled={isCreating}>
                    {t('intervention.pages.controleJournalier.cancel')}
                  </Button>
                  <Button onClick={() => void handleSubmit()} disabled={!isFormValid || isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('intervention.pages.controleJournalier.submit')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {t('intervention.pages.controleJournalier.history.title', { count: controles.length })}
              </CardTitle>
            </CardHeader>
            <CardContent className={controles.length === 0 ? undefined : 'p-0'}>
              {controles.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">{t('intervention.pages.controleJournalier.history.empty')}</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {controles.map((c: ControleJournalier) => {
                    const isToday = c.date === TODAY
                    const isClotured = !!c.signatureClotureDemandeur && !!c.signatureClotureIntervenant
                    return (
                      <div key={c.id} className="px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(c.date).toLocaleDateString('fr-FR')}
                              {c.vitesseVent != null && (
                                <span className="ml-2 text-xs font-normal text-gray-500">
                                  <Wind className="mr-0.5 inline h-3 w-3" />
                                  {c.vitesseVent} km/h
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">{c.intervenants.join(', ')}</p>
                          </div>
                          {isClotured ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                              <CheckCircle2 className="h-3 w-3" />
                              {t('intervention.pages.controleJournalier.cloture.done')}
                            </span>
                          ) : (
                            isToday &&
                            canEdit && (
                              <Button variant="outline" size="sm" onClick={() => setClotureId(clotureId === c.id ? null : c.id)}>
                                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                {t('intervention.pages.controleJournalier.cloture.button')}
                              </Button>
                            )
                          )}
                        </div>

                        {clotureId === c.id && (
                          <div className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <p className="text-sm font-medium text-gray-700">{t('intervention.pages.controleJournalier.cloture.title')}</p>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <Input
                                label={t('intervention.pages.controleJournalier.cloture.signatureDemandeur')}
                                value={clotureDemandeur}
                                onChange={(e) => setClotureDemandeur(e.target.value)}
                                placeholder={t('intervention.pages.controleJournalier.form.signaturePlaceholder')}
                              />
                              <Input
                                label={t('intervention.pages.controleJournalier.cloture.signatureIntervenant')}
                                value={clotureIntervenant}
                                onChange={(e) => setClotureIntervenant(e.target.value)}
                                placeholder={t('intervention.pages.controleJournalier.form.signaturePlaceholder')}
                              />
                            </div>
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => void handleCloture(c.id)}
                                disabled={isUpdating || !clotureDemandeur.trim() || !clotureIntervenant.trim()}
                              >
                                {isUpdating && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                                {t('intervention.pages.controleJournalier.cloture.submit')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
