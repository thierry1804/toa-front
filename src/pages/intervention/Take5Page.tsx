import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Shield,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Checkbox from '@/components/ui/Checkbox'
import Select from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import { useInterventionDetail, useInterventionTake5Records, useTake5Record } from '@/features/intervention/hooks/useIntervention'
import { usePermission } from '@/features/auth/usePermission'
import type {
  Take5Etape1Arreter,
  Take5Etape2Observer,
  Take5Etape3Analyser,
  Take5Etape4Controler,
  Take5Etape5Proceder,
  Take5Mesure,
  Take5MesureType,
  Take5Risque,
} from '@/types/intervention'

const DANGERS_COMMUNS = [
  { value: 'Travail en hauteur', labelKey: 'travailHauteur' },
  { value: 'Risque électrique', labelKey: 'risqueElectrique' },
  { value: "Chute d'objets", labelKey: 'chuteObjets' },
  { value: 'Risque chimique', labelKey: 'risqueChimique' },
  { value: 'Manutention manuelle', labelKey: 'manutentionManuelle' },
  { value: 'Conditions météo', labelKey: 'conditionsMeteo' },
  { value: 'Circulation véhicules', labelKey: 'circulationVehicules' },
  { value: 'Espaces confinés', labelKey: 'espacesConfines' },
  { value: 'Machines en mouvement', labelKey: 'machinesMouvement' },
  { value: 'Surfaces glissantes', labelKey: 'surfacesGlissantes' },
]

const MESURE_TYPES: Take5MesureType[] = ['elimination', 'substitution', 'controle_ingenierie', 'controle_administratif', 'epi']

const EMPTY_ETAPE1: Take5Etape1Arreter = { complete: false, observations: '' }
const EMPTY_ETAPE2: Take5Etape2Observer = { complete: false, dangersIdentifies: [], autresDangers: '' }
const EMPTY_ETAPE3: Take5Etape3Analyser = { complete: false, risquesEvalues: [] }
const EMPTY_ETAPE4: Take5Etape4Controler = { complete: false, mesuresControle: [] }
const EMPTY_ETAPE5: Take5Etape5Proceder = { complete: false, securiteConfirmee: false, autorisationProceder: false }
const EMPTY_RISQUE: Take5Risque = { danger: '', probabilite: 1, gravite: 1, niveauRisque: 1 }
const EMPTY_MESURE: Take5Mesure = { type: 'epi', description: '', responsable: '', miseEnPlace: false }

export default function Take5Page() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const canCreate = usePermission('take5_record.create')

  const { data: intervention, isLoading: loadingIntervention } = useInterventionDetail(id ?? '')
  const { data: records = [], isLoading: loadingRecords } = useInterventionTake5Records(id ?? '')
  const { createTake5Record, isCreating, createError } = useTake5Record(id ?? '')

  const [showForm, setShowForm] = useState(false)
  const [responsableNom, setResponsableNom] = useState('')
  const [equipe, setEquipe] = useState<string[]>([])
  const [nouveauMembre, setNouveauMembre] = useState('')
  const [localisation, setLocalisation] = useState('')
  const [tacheDescription, setTacheDescription] = useState('')
  const [etape1, setEtape1] = useState<Take5Etape1Arreter>(EMPTY_ETAPE1)
  const [etape2, setEtape2] = useState<Take5Etape2Observer>(EMPTY_ETAPE2)
  const [etape3, setEtape3] = useState<Take5Etape3Analyser>(EMPTY_ETAPE3)
  const [etape4, setEtape4] = useState<Take5Etape4Controler>(EMPTY_ETAPE4)
  const [etape5, setEtape5] = useState<Take5Etape5Proceder>(EMPTY_ETAPE5)
  const [nouveauRisque, setNouveauRisque] = useState<Take5Risque>(EMPTY_RISQUE)
  const [nouvelleMesure, setNouvelleMesure] = useState<Take5Mesure>(EMPTY_MESURE)

  const isLoading = loadingIntervention || loadingRecords

  const resetForm = () => {
    setResponsableNom('')
    setEquipe([])
    setNouveauMembre('')
    setLocalisation('')
    setTacheDescription('')
    setEtape1(EMPTY_ETAPE1)
    setEtape2(EMPTY_ETAPE2)
    setEtape3(EMPTY_ETAPE3)
    setEtape4(EMPTY_ETAPE4)
    setEtape5(EMPTY_ETAPE5)
    setNouveauRisque(EMPTY_RISQUE)
    setNouvelleMesure(EMPTY_MESURE)
  }

  const addMembre = () => {
    if (nouveauMembre.trim()) {
      setEquipe((e) => [...e, nouveauMembre.trim()])
      setNouveauMembre('')
    }
  }

  const toggleDanger = (danger: string) => {
    setEtape2((s) => ({
      ...s,
      dangersIdentifies: s.dangersIdentifies.includes(danger)
        ? s.dangersIdentifies.filter((d) => d !== danger)
        : [...s.dangersIdentifies, danger],
    }))
  }

  const addRisque = () => {
    if (!nouveauRisque.danger.trim()) return
    setEtape3((s) => ({ ...s, risquesEvalues: [...s.risquesEvalues, nouveauRisque] }))
    setNouveauRisque(EMPTY_RISQUE)
  }

  const removeRisque = (index: number) => {
    setEtape3((s) => ({ ...s, risquesEvalues: s.risquesEvalues.filter((_, i) => i !== index) }))
  }

  const addMesure = () => {
    if (!nouvelleMesure.description.trim()) return
    setEtape4((s) => ({ ...s, mesuresControle: [...s.mesuresControle, nouvelleMesure] }))
    setNouvelleMesure(EMPTY_MESURE)
  }

  const removeMesure = (index: number) => {
    setEtape4((s) => ({ ...s, mesuresControle: s.mesuresControle.filter((_, i) => i !== index) }))
  }

  const isFormValid =
    responsableNom.trim() !== '' &&
    equipe.length > 0 &&
    localisation.trim() !== '' &&
    tacheDescription.trim() !== '' &&
    etape1.complete &&
    etape2.complete &&
    etape3.complete &&
    etape4.complete &&
    etape5.complete &&
    etape5.securiteConfirmee &&
    etape5.autorisationProceder

  const handleSubmit = async () => {
    if (!id || !isFormValid) return
    await createTake5Record({
      intervention: `/api/interventions/${id}`,
      responsableNom,
      equipe,
      localisation,
      tacheDescription,
      etape1Arreter: etape1,
      etape2Observer: etape2,
      etape3Analyser: etape3,
      etape4Controler: etape4,
      etape5Proceder: etape5,
    })
    resetForm()
    setShowForm(false)
  }

  if (isLoading) {
    return <ListPageSkeleton withStatStrip={false} />
  }

  if (!intervention) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-500">
        <AlertTriangle className="h-10 w-10 text-gray-300" />
        <p>{t('intervention.pages.take5.notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/interventions')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('intervention.pages.take5.backToIntervention')}
        </Button>
      </div>
    )
  }

  const apiDetail = createError
    ? ((createError as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? '')
    : ''

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('intervention.pages.take5.title')}
        description={t('intervention.pages.take5.description')}
        actions={
          <Button variant="outline" onClick={() => navigate(`/interventions/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('intervention.pages.take5.backToIntervention')}
          </Button>
        }
      />

      {intervention.statut !== 'EVALUATION_COMPLETE' ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t('intervention.pages.take5.notReady')}</span>
        </div>
      ) : (
        <>
          {canCreate && !showForm && (
            <div className="flex justify-end">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('intervention.pages.take5.newButton')}
              </Button>
            </div>
          )}

          {showForm && (
            <div className="space-y-4">
              <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-blue-600" />
                    {t('intervention.pages.take5.generalInfo.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      label={t('intervention.pages.take5.generalInfo.responsable')}
                      value={responsableNom}
                      onChange={(e) => setResponsableNom(e.target.value)}
                      placeholder={t('intervention.pages.take5.generalInfo.responsablePlaceholder')}
                      required
                    />
                    <Input
                      label={t('intervention.pages.take5.generalInfo.localisation')}
                      value={localisation}
                      onChange={(e) => setLocalisation(e.target.value)}
                      placeholder={t('intervention.pages.take5.generalInfo.localisationPlaceholder')}
                      required
                    />
                  </div>
                  <Textarea
                    label={t('intervention.pages.take5.generalInfo.tache')}
                    value={tacheDescription}
                    onChange={(e) => setTacheDescription(e.target.value)}
                    placeholder={t('intervention.pages.take5.generalInfo.tachePlaceholder')}
                    rows={3}
                    required
                  />
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t('intervention.pages.take5.generalInfo.equipe')} <span className="text-red-500">*</span>
                    </label>
                    <div className="mb-2 flex gap-2">
                      <Input
                        value={nouveauMembre}
                        onChange={(e) => setNouveauMembre(e.target.value)}
                        placeholder={t('intervention.pages.take5.generalInfo.equipePlaceholder')}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMembre() } }}
                      />
                      <Button type="button" variant="outline" onClick={addMembre}>
                        {t('intervention.pages.take5.generalInfo.addMember')}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {equipe.map((membre, i) => (
                        <span key={i} className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                          {membre}
                          <button type="button" onClick={() => setEquipe((e) => e.filter((_, idx) => idx !== i))}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('intervention.pages.take5.step1.title')}</CardTitle>
                  <p className="text-sm text-gray-500">{t('intervention.pages.take5.step1.description')}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    label={t('intervention.pages.take5.step1.observations')}
                    value={etape1.observations}
                    onChange={(e) => setEtape1((s) => ({ ...s, observations: e.target.value }))}
                    placeholder={t('intervention.pages.take5.step1.observationsPlaceholder')}
                    rows={2}
                  />
                  <Checkbox
                    label={t('intervention.pages.take5.step1.checkbox')}
                    checked={etape1.complete}
                    onChange={(e) => setEtape1((s) => ({ ...s, complete: e.target.checked }))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('intervention.pages.take5.step2.title')}</CardTitle>
                  <p className="text-sm text-gray-500">{t('intervention.pages.take5.step2.description')}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('intervention.pages.take5.step2.dangers')}
                  </label>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {DANGERS_COMMUNS.map((d) => (
                      <label
                        key={d.value}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors ${
                          etape2.dangersIdentifies.includes(d.value)
                            ? 'border-orange-400 bg-orange-50 text-orange-900'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={etape2.dangersIdentifies.includes(d.value)}
                          onChange={() => toggleDanger(d.value)}
                          className="rounded border-gray-300"
                        />
                        {t(`intervention.pages.take5.step2.dangersList.${d.labelKey}`)}
                      </label>
                    ))}
                  </div>
                  <Textarea
                    label={t('intervention.pages.take5.step2.autresDangers')}
                    value={etape2.autresDangers}
                    onChange={(e) => setEtape2((s) => ({ ...s, autresDangers: e.target.value }))}
                    placeholder={t('intervention.pages.take5.step2.autresDangersPlaceholder')}
                    rows={2}
                  />
                  <Checkbox
                    label={t('intervention.pages.take5.step2.checkbox')}
                    checked={etape2.complete}
                    onChange={(e) => setEtape2((s) => ({ ...s, complete: e.target.checked }))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('intervention.pages.take5.step3.title')}</CardTitle>
                  <p className="text-sm text-gray-500">{t('intervention.pages.take5.step3.description')}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3 rounded-lg bg-yellow-50 p-4">
                    <Input
                      label={t('intervention.pages.take5.step3.danger')}
                      value={nouveauRisque.danger}
                      onChange={(e) => setNouveauRisque((r) => ({ ...r, danger: e.target.value }))}
                      placeholder={t('intervention.pages.take5.step3.dangerPlaceholder')}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        label={t('intervention.pages.take5.step3.probabilite')}
                        options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
                        value={String(nouveauRisque.probabilite)}
                        onChange={(e) =>
                          setNouveauRisque((r) => ({
                            ...r,
                            probabilite: Number(e.target.value),
                            niveauRisque: Number(e.target.value) * r.gravite,
                          }))
                        }
                      />
                      <Select
                        label={t('intervention.pages.take5.step3.gravite')}
                        options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
                        value={String(nouveauRisque.gravite)}
                        onChange={(e) =>
                          setNouveauRisque((r) => ({
                            ...r,
                            gravite: Number(e.target.value),
                            niveauRisque: r.probabilite * Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <Button type="button" variant="outline" className="w-full" onClick={addRisque}>
                      {t('intervention.pages.take5.step3.addButton')}
                    </Button>
                  </div>
                  {etape3.risquesEvalues.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">{t('intervention.pages.take5.step3.empty')}</p>
                  ) : (
                    <div className="space-y-2">
                      {etape3.risquesEvalues.map((r, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
                          <div>
                            <span className="font-medium">{r.danger}</span>
                            <span className="ml-2 text-gray-500">
                              {t('intervention.pages.take5.step3.probabilite')}: {r.probabilite} · {t('intervention.pages.take5.step3.gravite')}: {r.gravite} · {t('intervention.pages.take5.step3.niveau')}: {r.niveauRisque}
                            </span>
                          </div>
                          <button type="button" onClick={() => removeRisque(i)} className="text-red-600 hover:text-red-700">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Checkbox
                    label={t('intervention.pages.take5.step3.checkbox')}
                    checked={etape3.complete}
                    onChange={(e) => setEtape3((s) => ({ ...s, complete: e.target.checked }))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('intervention.pages.take5.step4.title')}</CardTitle>
                  <p className="text-sm text-gray-500">{t('intervention.pages.take5.step4.description')}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3 rounded-lg bg-blue-50 p-4">
                    <Select
                      label={t('intervention.pages.take5.step4.type')}
                      options={MESURE_TYPES.map((mt) => ({ value: mt, label: t(`intervention.pages.take5.step4.typeOptions.${mt}`) }))}
                      value={nouvelleMesure.type}
                      onChange={(e) => setNouvelleMesure((m) => ({ ...m, type: e.target.value as Take5MesureType }))}
                    />
                    <Textarea
                      label={t('intervention.pages.take5.step4.description')}
                      value={nouvelleMesure.description}
                      onChange={(e) => setNouvelleMesure((m) => ({ ...m, description: e.target.value }))}
                      placeholder={t('intervention.pages.take5.step4.descriptionPlaceholder')}
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label={t('intervention.pages.take5.step4.responsable')}
                        value={nouvelleMesure.responsable}
                        onChange={(e) => setNouvelleMesure((m) => ({ ...m, responsable: e.target.value }))}
                        placeholder={t('intervention.pages.take5.step4.responsablePlaceholder')}
                      />
                      <div className="flex items-end">
                        <Checkbox
                          label={t('intervention.pages.take5.step4.miseEnPlace')}
                          checked={nouvelleMesure.miseEnPlace}
                          onChange={(e) => setNouvelleMesure((m) => ({ ...m, miseEnPlace: e.target.checked }))}
                        />
                      </div>
                    </div>
                    <Button type="button" variant="outline" className="w-full" onClick={addMesure}>
                      {t('intervention.pages.take5.step4.addButton')}
                    </Button>
                  </div>
                  {etape4.mesuresControle.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">{t('intervention.pages.take5.step4.empty')}</p>
                  ) : (
                    <div className="space-y-2">
                      {etape4.mesuresControle.map((m, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm">
                          <div>
                            <span className="mr-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                              {t(`intervention.pages.take5.step4.typeOptions.${m.type}`)}
                            </span>
                            {m.miseEnPlace && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-green-600" />}
                            {m.description}
                          </div>
                          <button type="button" onClick={() => removeMesure(i)} className="text-red-600 hover:text-red-700">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Checkbox
                    label={t('intervention.pages.take5.step4.checkbox')}
                    checked={etape4.complete}
                    onChange={(e) => setEtape4((s) => ({ ...s, complete: e.target.checked }))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('intervention.pages.take5.step5.title')}</CardTitle>
                  <p className="text-sm text-gray-500">{t('intervention.pages.take5.step5.description')}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3 rounded-lg bg-green-50 p-4">
                    <Checkbox
                      label={<span className="font-medium">{t('intervention.pages.take5.step5.securiteConfirmee')}</span>}
                      checked={etape5.securiteConfirmee}
                      onChange={(e) => setEtape5((s) => ({ ...s, securiteConfirmee: e.target.checked }))}
                    />
                    <Checkbox
                      label={<span className="font-medium">{t('intervention.pages.take5.step5.autorisationProceder')}</span>}
                      checked={etape5.autorisationProceder}
                      onChange={(e) => setEtape5((s) => ({ ...s, autorisationProceder: e.target.checked }))}
                    />
                  </div>
                  <Checkbox
                    label={t('intervention.pages.take5.step5.checkbox')}
                    checked={etape5.complete}
                    onChange={(e) => setEtape5((s) => ({ ...s, complete: e.target.checked }))}
                  />
                </CardContent>
              </Card>

              {apiDetail && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{apiDetail}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" onClick={() => { resetForm(); setShowForm(false) }} disabled={isCreating}>
                  {t('intervention.pages.take5.cancel')}
                </Button>
                <div className="flex items-center gap-3">
                  {!isFormValid && (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {t('intervention.pages.take5.incompleteWarning')}
                    </span>
                  )}
                  <Button onClick={() => void handleSubmit()} disabled={!isFormValid || isCreating}>
                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('intervention.pages.take5.submit')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {t('intervention.pages.take5.history.title', { count: records.length })}
              </CardTitle>
            </CardHeader>
            <CardContent className={records.length === 0 ? undefined : 'p-0'}>
              {records.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">{t('intervention.pages.take5.history.empty')}</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {records.map((r) => (
                    <div key={r.id} className="px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{r.tacheDescription}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {r.localisation} · {t('intervention.pages.take5.history.by', { name: r.responsableNom })}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          <CheckCircle2 className="h-3 w-3" />
                          {new Date(r.createdAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
