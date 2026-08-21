import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
  AlertTriangle,
  Info,
  MapPin,
  CalendarDays,
  ShieldAlert,
  Wrench,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import PermitDocumentUploadZone from '@/components/permitTravail/PermitDocumentUploadZone'
import EngagementSection, { type EvaluationData } from '@/components/permitTravail/EngagementSection'
import AnalyseRisquesPlanning from '@/components/planPrevention/AnalyseRisquesPlanning'
import { usePermitTravail } from '@/features/permitTravail/hooks/usePermitTravail'
import { useCategoriesRisqueAll } from '@/features/referentiel/hooks/useCategorieRisque'
import { usePermission } from '@/features/auth/usePermission'
import { planPreventionApi } from '@/api/planPreventionApi'
import type {
  PermitTravail,
  TypePermit,
  TypeDocumentPermitTravail,
  DocumentPermitTravail,
} from '@/types/permitTravail'
import type { PlanBySiteResult, RisqueRow } from '@/types/planPrevention'
import { TYPE_PERMIT_LABELS, getRequiredDocumentTypes } from '@/types/permitTravail'

// ─── Step 2 schema ────────────────────────────────────────────────────────────
const step2Schema = z
  .object({
    dateDebutPrevue: z.string().min(1, 'Date de début requise'),
    dateFinPrevue: z.string().min(1, 'Date de fin requise'),
  })
  .refine((d) => !d.dateDebutPrevue || !d.dateFinPrevue || d.dateFinPrevue >= d.dateDebutPrevue, {
    message: 'La date de fin doit être ≥ à la date de début',
    path: ['dateFinPrevue'],
  })

type Step2Data = z.infer<typeof step2Schema>

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  { title: 'Site & Plan' },
  { title: 'Aperçu plan' },
  { title: 'Informations travaux' },
  { title: 'Documents & Engagements' },
]

// ─── StepIndicator ────────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="w-full mb-6">
      <div className="flex items-start w-full">
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex items-start flex-1">
            <div className="flex flex-col items-center flex-1 min-w-0 px-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  i < current
                    ? 'bg-green-500 text-white'
                    : i === current
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < current ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <p
                className={`mt-2 text-xs text-center leading-tight px-1 ${
                  i <= current ? 'text-gray-900 font-medium' : 'text-gray-400'
                }`}
              >
                {s.title}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mt-4 ${i < current ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
        <div
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PermitTravailCreatePage() {
  const navigate = useNavigate()
  const canSubmit = usePermission('permit_travail.submit')

  const { createPermit, updatePermit, uploadDocument, soumettrePermit, isCreating, isSubmitting } =
    usePermitTravail()

  // ── Step 0 state ─────────────────────────────────────────────────────────────
  const [codeSiteInput, setCodeSiteInput] = useState('')
  const [codeSiteSearched, setCodeSiteSearched] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [typePermis, setTypePermis] = useState<TypePermit>('ELECTRIQUE')

  // ── Step navigation ───────────────────────────────────────────────────────────
  const [step, setStep] = useState(0)

  // ── Step 3 state ─────────────────────────────────────────────────────────────
  const [permit, setPermit] = useState<PermitTravail | null>(null)
  const [companionDocs, setCompanionDocs] = useState<DocumentPermitTravail[]>([])
  const [engagementChecked, setEngagementChecked] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationData>({
    dangers: '',
    evaluationPreliminaire: '',
    moyensMaitrise: '',
    evaluationFinale: '',
  })

  // ── Plans by site ─────────────────────────────────────────────────────────────
  const { data: plansBySiteData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['plans-prevention', 'by-site', codeSiteSearched],
    queryFn: () => planPreventionApi.getPlansBySite(codeSiteSearched),
    enabled: codeSiteSearched.length > 0,
    staleTime: 30_000,
  })
  const suggestedPlans: PlanBySiteResult[] = plansBySiteData?.plans ?? []
  const selectedPlan = suggestedPlans.find((p) => p.id === selectedPlanId) ?? null

  // ── Categories for risk filter ────────────────────────────────────────────────
  const { data: categoriesData } = useCategoriesRisqueAll()
  const allCategories = categoriesData?.member ?? []

  // ── Derived ───────────────────────────────────────────────────────────────────
  const isNouveauSite = selectedPlan?.typeIntervention === 'NOUVEAU_SITE'
  const generalPermitId = selectedPlan?.permitGeneralId ?? null
  const generalRequisAvant = isNouveauSite && !generalPermitId

  const typePermisOptions: TypePermit[] = isNouveauSite
    ? (generalPermitId ? ['ELECTRIQUE', 'HAUTEUR'] : ['GENERAL'])
    : ['ELECTRIQUE', 'HAUTEUR']

  const matchingCatNames = useMemo(
    () => new Set(allCategories.filter((c) => c.typePermis === typePermis).map((c) => c.nom)),
    [allCategories, typePermis],
  )

  const showAllRisks = isNouveauSite || typePermis === 'GENERAL' || matchingCatNames.size === 0
  const unconfiguredWarning = !isNouveauSite && typePermis !== 'GENERAL' && matchingCatNames.size === 0

  const allRisqueRows = useMemo((): RisqueRow[] =>
    (selectedPlan?.risques ?? []).map((r) => ({
      localId: r.id,
      tachePlanifieeId: r.tachePlanifieeId ?? null,
      description: r.description ?? '',
      gravite: r.gravite ?? 1,
      probabilite: r.probabilite ?? 1,
      mesuresPreventives: r.mesuresPreventives ?? '',
      risqueResiduel: r.risqueResiduel ?? null,
    })),
    [selectedPlan],
  )

  const filteredRisqueRows = useMemo((): RisqueRow[] => {
    if (showAllRisks) return allRisqueRows
    return allRisqueRows
      .filter((r) => {
        const names = r.description.split(', ').filter(Boolean)
        return names.some((n) => matchingCatNames.has(n))
      })
      .map((r) => ({
        ...r,
        description: r.description
          .split(', ')
          .filter((n) => matchingCatNames.has(n))
          .join(', '),
      }))
  }, [allRisqueRows, showAllRisks, matchingCatNames])

  const filteredSections = useMemo(() => {
    const sections = selectedPlan?.planificationSections ?? []
    if (showAllRisks) return sections
    const matchingTacheIds = new Set(filteredRisqueRows.map((r) => r.tachePlanifieeId).filter(Boolean))
    return sections
      .map((s) => ({ ...s, taches: s.taches.filter((t) => matchingTacheIds.has(t.id)) }))
      .filter((s) => s.taches.length > 0)
  }, [selectedPlan, showAllRisks, filteredRisqueRows])

  const siteInfo = useMemo(
    () =>
      selectedPlan?.planificationSites.find((s) => s.codeSite === codeSiteSearched) ?? {
        codeSite: codeSiteSearched,
        nomSite: '',
      },
    [selectedPlan, codeSiteSearched],
  )

  // ── Step 2 form ───────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })

  useEffect(() => {
    if (!selectedPlan) return
    setValue('dateDebutPrevue', selectedPlan.dateDebut?.slice(0, 10) ?? '')
    setValue('dateFinPrevue', selectedPlan.dateFin?.slice(0, 10) ?? '')
  }, [selectedPlan, setValue])

  // ── Document upload handlers ──────────────────────────────────────────────────
  const handleMainDocUpload = async (type: TypeDocumentPermitTravail, file: File) => {
    if (!permit) return
    await uploadDocument(permit.id, type, file)
    setPermit((prev) =>
      prev
        ? {
            ...prev,
            documents: [
              ...prev.documents.filter((d) => d.type !== type),
              { id: crypto.randomUUID(), type, filePath: '', mimeType: file.type, uploadedAt: new Date().toISOString() },
            ],
          }
        : prev,
    )
  }

  const handleCompanionDocUpload = async (type: TypeDocumentPermitTravail, file: File) => {
    const companionId = permit?.permitsGroupe?.[0]?.id
    if (!companionId) return
    await uploadDocument(companionId, type, file)
    setCompanionDocs((prev) => [
      ...prev.filter((d) => d.type !== type),
      { id: crypto.randomUUID(), type, filePath: '', mimeType: file.type, uploadedAt: new Date().toISOString() },
    ])
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSoumettre = async () => {
    if (!permit) return
    await updatePermit(permit.id, {
      engagementAccepte: true,
      dangers: evaluation.dangers || null,
      evaluationPreliminaire: evaluation.evaluationPreliminaire || null,
      moyensMaitrise: evaluation.moyensMaitrise || null,
      evaluationFinale: evaluation.evaluationFinale || null,
    })
    const companionId = permit.permitsGroupe?.[0]?.id
    if (companionId) {
      await updatePermit(companionId, { engagementAccepte: true })
    }
    await soumettrePermit(permit.id)
    navigate('/permits-travail')
  }

  // ── Step 0: search ────────────────────────────────────────────────────────────
  const handleSearch = () => {
    const trimmed = codeSiteInput.trim()
    if (trimmed) {
      setCodeSiteSearched(trimmed)
      setSelectedPlanId('')
    }
  }

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId)
    const plan = suggestedPlans.find((p) => p.id === planId)
    const nouveauSite = plan?.typeIntervention === 'NOUVEAU_SITE'
    setTypePermis(nouveauSite && !plan?.permitGeneralId ? 'GENERAL' : 'ELECTRIQUE')
  }

  // ── Step 2 → 3: create permit ────────────────────────────────────────────────
  const handleStep2Next = handleSubmit(async (data) => {
    const processus = isNouveauSite ? 'NOUVEAU_SITE' : 'RENOUVELLEMENT'
    const created = await createPermit({
      processus,
      typePermis,
      planPreventionId: selectedPlanId,
      codeSite: codeSiteSearched,
      descriptionTravaux: selectedPlan?.activitePlanifiee ?? '',
      dateDebutPrevue: data.dateDebutPrevue,
      dateFinPrevue: data.dateFinPrevue,
    })
    setPermit(created)
    setStep(3)
  })

  // ── Navigation ────────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (step === 0) {
      if (codeSiteSearched && selectedPlanId) setStep(1)
    } else if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      await handleStep2Next()
    }
  }

  const canGoNext =
    step === 0 ? !!(codeSiteSearched && selectedPlanId) : step < 3

  const isPending = isCreating || isSubmitting
  const mainDocTypes = permit
    ? getRequiredDocumentTypes(permit.planProcess ?? selectedPlan?.process, permit.typePermis, permit.processus)
    : []
  const companionPermit = permit?.permitsGroupe?.[0]
  const companionDocTypes = companionPermit
    ? getRequiredDocumentTypes(permit?.planProcess ?? selectedPlan?.process, companionPermit.typePermis, permit?.processus ?? 'NOUVEAU_SITE')
    : []

  // ── Render steps ──────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── Step 0: Site & Plan ─────────────────────────────────────────────────
      case 0:
        return (
          <div className="space-y-5">
            {/* Code site input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code site *</label>
              <div className="flex gap-2">
                <Input
                  value={codeSiteInput}
                  onChange={(e) => setCodeSiteInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                  placeholder="Ex: AND-001"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearch}
                  disabled={!codeSiteInput.trim()}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Rechercher
                </Button>
              </div>
            </div>

            {/* Loading */}
            {isLoadingPlans && codeSiteSearched && (
              <p className="text-sm text-gray-500 italic">Chargement des plans...</p>
            )}

            {/* No plans */}
            {!isLoadingPlans && codeSiteSearched && suggestedPlans.length === 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Aucun plan de prévention validé disponible pour le site{' '}
                  <strong>{codeSiteSearched}</strong>.
                </p>
              </div>
            )}

            {/* Plans list */}
            {suggestedPlans.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan de prévention *
                </label>
                <div className="space-y-2">
                  {suggestedPlans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                        selectedPlanId === plan.id
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-400'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{plan.reference}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{plan.activitePlanifiee}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {plan.dateDebut} → {plan.dateFin}
                          </p>
                        </div>
                        {selectedPlanId === plan.id && (
                          <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Type permis */}
            {selectedPlanId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de permis *
                </label>
                <select
                  value={typePermis}
                  onChange={(e) => setTypePermis(e.target.value as TypePermit)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {typePermisOptions.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_PERMIT_LABELS[t]}
                    </option>
                  ))}
                </select>
                {generalRequisAvant && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Plan Nouveau site — le permis Général doit être demandé en premier. Le permis
                      Électrique ou Hauteur pourra être demandé sur ce même plan une fois le Général créé.
                    </p>
                  </div>
                )}
                {isNouveauSite && generalPermitId && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                    <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800">
                      Permis Général déjà demandé sur ce plan — complétez avec le permis Électrique ou Hauteur.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      // ── Step 1: Aperçu plan ─────────────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-5">
            {/* Plan header */}
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">{selectedPlan?.reference}</p>
                <p className="text-sm text-blue-700 mt-0.5">{selectedPlan?.activitePlanifiee}</p>
                <p className="text-xs text-blue-500 mt-1">
                  {selectedPlan?.dateDebut} → {selectedPlan?.dateFin}
                </p>
              </div>
            </div>

            {/* Type de permis */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Type sélectionné :</span>
              <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5">
                {TYPE_PERMIT_LABELS[typePermis]}
              </span>
              {selectedPlan?.process && (
                <>
                  <span className="text-sm text-gray-600 ml-2">Processus :</span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5">
                    {selectedPlan.process}
                  </span>
                </>
              )}
            </div>

            {/* Site concerné */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700">Site concerné</h3>
              </div>
              <div className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm">
                <span className="font-medium text-gray-900">{siteInfo.codeSite}</span>
                {siteInfo.nomSite && (
                  <span className="text-gray-500 ml-2">— {siteInfo.nomSite}</span>
                )}
              </div>
            </div>

            {/* Risques */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Analyse des risques
                  {!isNouveauSite && typePermis !== 'GENERAL' && !unconfiguredWarning && (
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      (filtrés : {TYPE_PERMIT_LABELS[typePermis]})
                    </span>
                  )}
                </h3>
              </div>
              {unconfiguredWarning && (
                <div className="mb-2 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Catégories non configurées — tous les risques sont affichés.
                    Configurer dans <strong>Référentiel &gt; Gestion de risques</strong>.
                  </span>
                </div>
              )}
              <AnalyseRisquesPlanning
                sections={filteredSections}
                rows={filteredRisqueRows}
                onChange={() => {}}
                categories={[]}
                disabled={true}
              />
            </div>

            {/* Installations */}
            {(selectedPlan?.installations ?? []).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700">Installations et matériels</h3>
                </div>
                <ul className="space-y-1">
                  {selectedPlan!.installations.map((inst, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                      <span className="font-medium">{inst.description}</span>
                      {inst.conditionsUtilisation && (
                        <span className="text-gray-500">— {inst.conditionsUtilisation}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Matériels, équipements et outillages */}
            {(selectedPlan?.equipements ?? []).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    Matériels, équipements et outillages
                  </h3>
                </div>
                <ul className="space-y-1">
                  {selectedPlan!.equipements.map((eq, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                      <span className="font-medium">{eq.description}</span>
                      {eq.conditionsUtilisation && (
                        <span className="text-gray-500">— {eq.conditionsUtilisation}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )

      // ── Step 2: Informations travaux ────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
              <CalendarDays className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-800">{selectedPlan?.reference}</p>
                <p className="mt-0.5">Site : <span className="font-medium">{codeSiteSearched}</span></p>
                <p className="mt-0.5">
                  Permis : <span className="font-medium">{TYPE_PERMIT_LABELS[typePermis]}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date de début prévue *"
                type="date"
                {...register('dateDebutPrevue')}
                error={errors.dateDebutPrevue?.message}
              />
              <Input
                label="Date de fin prévue *"
                type="date"
                {...register('dateFinPrevue')}
                error={errors.dateFinPrevue?.message}
              />
            </div>
          </div>
        )

      // ── Step 3: Documents + Engagements ────────────────────────────────────
      case 3:
        return (
          <div className="space-y-6">
            {/* Documents */}
            {permit?.processus === 'NOUVEAU_SITE' && companionPermit ? (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Documents — Permis {TYPE_PERMIT_LABELS[permit.typePermis]} ({permit.reference})
                  </h3>
                  <PermitDocumentUploadZone
                    permitId={permit.id}
                    documentTypes={mainDocTypes}
                    uploadedDocuments={permit.documents}
                    onUpload={handleMainDocUpload}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Documents — Permis {TYPE_PERMIT_LABELS[companionPermit.typePermis]} ({companionPermit.reference})
                  </h3>
                  <PermitDocumentUploadZone
                    permitId={companionPermit.id}
                    documentTypes={companionDocTypes}
                    uploadedDocuments={companionDocs}
                    onUpload={handleCompanionDocUpload}
                  />
                </div>
              </>
            ) : (
              <PermitDocumentUploadZone
                permitId={permit?.id ?? ''}
                documentTypes={mainDocTypes}
                uploadedDocuments={permit?.documents ?? []}
                onUpload={handleMainDocUpload}
              />
            )}

            {/* Engagement */}
            <EngagementSection
              checked={engagementChecked}
              onChange={setEngagementChecked}
              statut={permit?.statut}
              evaluation={evaluation}
              onEvaluationChange={setEvaluation}
              onSaveEvaluation={async () => {
                if (!permit) return
                await updatePermit(permit.id, {
                  dangers: evaluation.dangers || null,
                  evaluationPreliminaire: evaluation.evaluationPreliminaire || null,
                  moyensMaitrise: evaluation.moyensMaitrise || null,
                  evaluationFinale: evaluation.evaluationFinale || null,
                })
              }}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau permis de travail</h1>
        <p className="text-sm text-gray-500 mt-1">Renseignez les informations en suivant les étapes</p>
      </div>

      <StepIndicator current={step} />

      <Card className="w-full">
        <CardHeader>
          <CardTitle>{STEPS[step].title}</CardTitle>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 0 || step === 3 || isPending}
          size="lg"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>

        {step < 3 ? (
          <Button
            onClick={handleNext}
            disabled={!canGoNext || isPending}
            loading={isPending}
            size="lg"
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          canSubmit && (
            <Button
              onClick={handleSoumettre}
              disabled={isPending || !engagementChecked}
              loading={isSubmitting}
              size="lg"
            >
              Soumettre le permis
            </Button>
          )
        )}
      </div>
    </div>
  )
}
