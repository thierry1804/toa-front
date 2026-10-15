import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Search,
  AlertTriangle,
  Info,
  MapPin,
  CalendarDays,
  Wrench,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import PermitDocumentUploadZone from '@/components/permitTravail/PermitDocumentUploadZone'
import EngagementSection, { emptyEvaluation, type EvaluationData } from '@/components/permitTravail/EngagementSection'
import SiteCodeAutocomplete from '@/components/planning/SiteCodeAutocomplete'
import { usePermitTravail, usePermitDocumentsRequis } from '@/features/permitTravail/hooks/usePermitTravail'
import { useCategoriesRisqueAll } from '@/features/referentiel/hooks/useCategorieRisque'
import { usePermission, useHasRole } from '@/features/auth/usePermission'
import { useUiStore } from '@/store/ui.store'
import { planPreventionApi } from '@/api/planPreventionApi'
import { getPermitCreationTransition } from './permitCreationTransition'
import { getDangersFormIssue } from '@/features/permitTravail/utils/dangersEvaluation'
import type {
  PermitTravail,
  TypePermit,
  TypeDocumentPermitTravail,
  DocumentPermitTravail,
} from '@/types/permitTravail'
import type { PlanBySiteResult, RisqueRow } from '@/types/planPrevention'
import {
  TYPE_PERMIT_LABELS,
  getMissingDocumentTypes,
  getRequiredDocumentTypes,
} from '@/types/permitTravail'

// ─── Steps ────────────────────────────────────────────────────────────────────
// R-18 : l'aperçu du plan est la dernière étape, juste avant la soumission.
const STEPS = [
  { title: 'Site & Plan' },
  { title: 'Informations travaux' },
  { title: 'Documents & Engagements' },
  { title: 'Aperçu du plan' },
]

const DANGERS_ISSUE_MESSAGES = {
  empty: "Renseignez au moins un danger pour pouvoir soumettre la demande.",
  incomplete: "Complétez tous les champs du formulaire : dangers, évaluation préliminaire, moyens de maîtrise et évaluation finale.",
  no_reduction: "L'évaluation finale doit traduire une réduction du niveau de risque par rapport à l'évaluation préliminaire.",
} as const

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
function PermitTravailCreateForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  // R-23 : l'agent de terrain crée, soumet et clôture ses permis.
  const canSubmitByAction = usePermission('permit_travail.submit')
  const isAgentTerrain = useHasRole('ROLE_AGENT_TERRAIN')
  const canSubmit = canSubmitByAction || isAgentTerrain
  const addToast = useUiStore((s) => s.addToast)

  const {
    createPermit,
    updatePermit,
    uploadDocument,
    deleteDocument,
    setDocumentNonApplicable,
    soumettrePermit,
    isCreating,
    isSubmitting,
  } = usePermitTravail()

  // ── Step 0 state ─────────────────────────────────────────────────────────────
  // Pré-remplissage depuis la fiche d'un plan de prévention validé
  // (bouton "Créer un permis" → /permits-travail/new?planId=...&codeSite=...).
  const prefilledPlanId = searchParams.get('planId')
  const prefilledCodeSite = searchParams.get('codeSite')
  const autoAdvancedRef = useRef(false)

  const [codeSiteInput, setCodeSiteInput] = useState(prefilledCodeSite ?? '')
  const [codeSiteSearched, setCodeSiteSearched] = useState(prefilledCodeSite ?? '')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [typePermis, setTypePermis] = useState<TypePermit>('ELECTRIQUE')

  // ── Step navigation ───────────────────────────────────────────────────────────
  const [step, setStep] = useState(0)

  // ── Step 3 state ─────────────────────────────────────────────────────────────
  const [permit, setPermit] = useState<PermitTravail | null>(null)
  const { data: requis, isLoading: requisLoading } = usePermitDocumentsRequis(permit?.id ?? '')
  const [companionDocs, setCompanionDocs] = useState<DocumentPermitTravail[]>([])
  const [engagementChecked, setEngagementChecked] = useState(false)
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([emptyEvaluation()])
  // R-22 : « Les dangers sont-ils efficacement maîtrisés ? »
  const [dangersMaitrises, setDangersMaitrises] = useState<'oui' | 'non' | null>(null)

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
  const allCategories = useMemo(() => categoriesData?.member ?? [], [categoriesData?.member])

  // ── Derived ───────────────────────────────────────────────────────────────────
  const isNouveauSite = selectedPlan?.typeIntervention === 'Nouveau site'
  const generalPermitId = selectedPlan?.permitGeneralId ?? null
  const generalRequisAvant = isNouveauSite && !generalPermitId
  const generalObligatoireAutres = !!selectedPlan && !isNouveauSite && !generalPermitId && typePermis !== 'GENERAL'

  const typePermisOptions: TypePermit[] = generalPermitId
    ? ['ELECTRIQUE', 'HAUTEUR']
    : isNouveauSite
      ? ['GENERAL']
      : ['GENERAL', 'ELECTRIQUE', 'HAUTEUR']

  const matchingCatNames = useMemo(
    () => new Set(allCategories.filter((c) => c.typePermis === typePermis).map((c) => c.nom)),
    [allCategories, typePermis],
  )

  const showAllRisks = isNouveauSite || typePermis === 'GENERAL' || matchingCatNames.size === 0

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

  const siteInfo = useMemo(
    () =>
      selectedPlan?.planificationSites.find((s) => s.codeSite === codeSiteSearched) ?? {
        codeSite: codeSiteSearched,
        nomSite: '',
      },
    [selectedPlan, codeSiteSearched],
  )

  // ── Document upload handlers ──────────────────────────────────────────────────
  const withoutMarker = (docs: DocumentPermitTravail[], type: TypeDocumentPermitTravail) =>
    docs.filter((d) => !(d.type === type && d.nonApplicable))

  const applyNotApplicable = (
    docs: DocumentPermitTravail[],
    type: TypeDocumentPermitTravail,
    next: boolean,
    marker?: DocumentPermitTravail,
  ) => [
    ...docs.filter((d) => d.type !== type || (!next && !d.nonApplicable)),
    ...(next && marker ? [marker] : []),
  ]

  const handleMainDocUpload = async (type: TypeDocumentPermitTravail, file: File, capturedAt?: string) => {
    if (!permit) return
    const saved = await uploadDocument(permit.id, type, file, capturedAt)
    setPermit((prev) => (prev ? { ...prev, documents: [...withoutMarker(prev.documents, type), saved] } : prev))
  }

  const handleMainDocDelete = async (documentId: string) => {
    if (!permit) return
    await deleteDocument(permit.id, documentId)
    setPermit((prev) => (prev ? { ...prev, documents: prev.documents.filter((d) => d.id !== documentId) } : prev))
  }

  const handleMainDocNotApplicable = async (type: TypeDocumentPermitTravail, next: boolean) => {
    if (!permit) return
    const marker = await setDocumentNonApplicable(permit.id, type, next)
    setPermit((prev) => (prev ? { ...prev, documents: applyNotApplicable(prev.documents, type, next, marker) } : prev))
  }

  const handleCompanionDocUpload = async (type: TypeDocumentPermitTravail, file: File, capturedAt?: string) => {
    const companionId = permit?.permitsGroupe?.[0]?.id
    if (!companionId) return
    const saved = await uploadDocument(companionId, type, file, capturedAt)
    setCompanionDocs((prev) => [...withoutMarker(prev, type), saved])
  }

  const handleCompanionDocDelete = async (documentId: string) => {
    const companionId = permit?.permitsGroupe?.[0]?.id
    if (!companionId) return
    await deleteDocument(companionId, documentId)
    setCompanionDocs((prev) => prev.filter((d) => d.id !== documentId))
  }

  const handleCompanionDocNotApplicable = async (type: TypeDocumentPermitTravail, next: boolean) => {
    const companionId = permit?.permitsGroupe?.[0]?.id
    if (!companionId) return
    const marker = await setDocumentNonApplicable(companionId, type, next)
    setCompanionDocs((prev) => applyNotApplicable(prev, type, next, marker))
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  const resetPermitDraftState = () => {
    setPermit(null)
    setCompanionDocs([])
    setEngagementChecked(false)
    setEvaluations([emptyEvaluation()])
    setDangersMaitrises(null)
  }

  const nonEmptyEvaluations = (list: EvaluationData[]) =>
    list.filter((e) => e.dangers || e.moyensMaitrise || e.evaluationPreliminaire || e.evaluationFinale)

  const handleSoumettre = async () => {
    if (!permit) return
    // R-22 : « Oui » → aucune saisie complémentaire ; « Non » → formulaire d'évaluation renseigné.
    const dangers = dangersMaitrises === 'non' ? nonEmptyEvaluations(evaluations) : []
    await updatePermit(permit.id, {
      engagementAccepte: true,
      dangers: dangers.length > 0 ? dangers : null,
    })

    const companionId = permit.permitsGroupe?.[0]?.id

    // Nouveau site : le permis Général seul ne peut pas être soumis tant que
    // son binôme (Électrique/Hauteur) n'existe pas — le backend refuse avec
    // "deux_permis_requis". On enregistre l'engagement et on enchaîne sur la
    // création du second permis SANS naviguer : /permits-travail/new est déjà
    // la route courante, donc react-router ne remonte pas le composant sur un
    // simple changement de query string — le state du wizard resterait figé.
    // On réinitialise l'état localement à la place, en gardant le site et le
    // plan déjà sélectionnés, et on invalide le cache "plans par site" pour
    // que permitGeneralId reflète le Général qu'on vient de créer.
    if (permit.processus === 'NOUVEAU_SITE' && permit.typePermis === 'GENERAL' && !companionId) {
      const generalDocuments = permit.documents
      addToast({
        message: 'Permis Général enregistré. Créez maintenant le permis Électrique ou Hauteur.',
        type: 'info',
      })
      await queryClient.invalidateQueries({
        queryKey: ['plans-prevention', 'by-site', codeSiteSearched],
      })
      resetPermitDraftState()
      setCompanionDocs(generalDocuments)
      setTypePermis('ELECTRIQUE')
      setStep(0)
      return
    }

    // Le backend soumet le binôme Nouveau site en un seul appel : soumettre
    // l'un des deux permis fait aussi passer l'autre à SOUMIS. Un second
    // appel /soumettre échouerait avec "statut_not_brouillon" puisque le
    // permis n'est déjà plus en BROUILLON.
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
    setTypePermis(!plan?.permitGeneralId ? 'GENERAL' : 'ELECTRIQUE')
  }

  // Une fois le plan pré-rempli chargé, sélection automatique — une seule
  // fois, pour ne pas bloquer un retour manuel à l'étape 0. On ne saute
  // directement à l'étape suivante que si le type de permis est déterminé
  // sans ambiguïté (Nouveau site sans Général existant) ; sinon (binôme
  // Électrique/Hauteur à choisir, ou processus Maintenance) on reste à
  // l'étape 0 pour laisser l'utilisateur choisir le type.
  useEffect(() => {
    if (autoAdvancedRef.current || !prefilledPlanId) return
    const plan = suggestedPlans.find((p) => p.id === prefilledPlanId)
    if (!plan) return
    autoAdvancedRef.current = true
    handleSelectPlan(plan.id)
    const nouveauSite = plan.typeIntervention === 'Nouveau site'
    const singleTypeChoice = nouveauSite && !plan.permitGeneralId
    if (singleTypeChoice) setStep(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledPlanId, suggestedPlans])

  // ── Step 1 → 2: create permit ────────────────────────────────────────────────
  const handleCreatePermit = async () => {
    // Retour depuis l'étape suivante : le permis existe déjà, rien à recréer.
    if (permit) {
      setStep(2)
      return
    }
    // NOUVEAU_SITE pour un plan "Nouveau site", MAINTENANCE pour les 4 autres
    // processus — RENOUVELLEMENT est réservé au renouvellement d'un permis
    // existant (pas encore de flux dédié dans l'assistant de création).
    const processus = isNouveauSite ? 'NOUVEAU_SITE' : 'MAINTENANCE'
    // R-19 : les dates sont réelles et non saisissables — début = validation
    // du permis, fin = clôture effective — elles sont posées par le serveur.
    const created = await createPermit({
      processus,
      typePermis,
      planPreventionId: selectedPlanId,
      codeSite: codeSiteSearched,
      descriptionTravaux: selectedPlan?.activitePlanifiee ?? '',
    })

    const transition = getPermitCreationTransition(processus, typePermis)
    setPermit(created)
    // Reprend les risques identifiés du plan de prévention (description +
    // mesures préventives) pour pré-remplir le champ "dangers" du permis —
    // l'utilisateur peut toujours le modifier, ce n'est qu'un point de
    // départ pour éviter une ressaisie complète.
    const risqueSummary = filteredRisqueRows
      .filter((r) => r.description)
      .map((r) => (r.mesuresPreventives ? `${r.description} — ${r.mesuresPreventives}` : r.description))
      .join('\n')
    if (risqueSummary) {
      setEvaluations((prev) => [{ ...prev[0], dangers: risqueSummary }, ...prev.slice(1)])
    }
    setStep(transition.step)
  }

  // ── Navigation ────────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (step === 0) {
      if (codeSiteSearched && selectedPlanId && !generalObligatoireAutres) setStep(1)
    } else if (step === 1) {
      await handleCreatePermit()
    } else if (step === 2) {
      setStep(3)
    }
  }

  const canGoNext =
    step === 0 ? !!(codeSiteSearched && selectedPlanId && !generalObligatoireAutres) : step < 3

  const isPending = isCreating || isSubmitting
  const apnApi = requis?.apnApi ?? false
  const mainDocTypes = permit
    ? (requis?.soumission ?? getRequiredDocumentTypes(permit.planProcess ?? selectedPlan?.typeIntervention, permit.typePermis, permit.processus, apnApi))
    : []
  const companionPermit = permit?.permitsGroupe?.[0]
  const companionDocTypes = companionPermit
    ? getRequiredDocumentTypes(permit?.planProcess ?? selectedPlan?.typeIntervention, companionPermit.typePermis, permit?.processus ?? 'NOUVEAU_SITE', apnApi)
    : []
  const mainMissingDocTypes = permit
    ? getMissingDocumentTypes(mainDocTypes, permit.documents)
    : []
  const companionMissingDocTypes = companionPermit
    ? getMissingDocumentTypes(companionDocTypes, companionDocs)
    : []
  const hasMissingDocuments = mainMissingDocTypes.length > 0 || companionMissingDocTypes.length > 0
  const dangersIssue = dangersMaitrises === 'non' ? getDangersFormIssue(evaluations) : null
  const canSoumettre =
    engagementChecked && !hasMissingDocuments && !requisLoading && dangersMaitrises !== null && dangersIssue === null
  const isGeneralNouveauSiteSansBinome =
    permit?.processus === 'NOUVEAU_SITE' && permit.typePermis === 'GENERAL' && !companionPermit

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
                <div className="flex-1">
                  <SiteCodeAutocomplete
                    value={codeSiteInput}
                    onChange={setCodeSiteInput}
                    onSelect={(site) => {
                      setCodeSiteInput(site.codeSite)
                      setCodeSiteSearched(site.codeSite)
                      setSelectedPlanId('')
                    }}
                    placeholder="Ex: AND-001"
                  />
                </div>
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
                {generalObligatoireAutres && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Le permis Général doit avoir été créé pour ce site avant tout permis Électrique ou Hauteur.
                      Il n'est pas nécessaire d'attendre sa validation : chaque permis suit ensuite son propre circuit.
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

      // ── Step 1: Informations travaux ────────────────────────────────────────
      case 1:
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

            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 space-y-1">
              <p>
                <span className="text-gray-500">Travaux :</span>{' '}
                <span className="font-medium text-gray-900">{selectedPlan?.activitePlanifiee ?? '—'}</span>
              </p>
              <p className="text-xs text-gray-500">
                Les dates ne sont pas saisissables : la date de début réelle est la date de validation du permis,
                la date de fin réelle est celle de sa clôture effective. Le permis est valable{' '}
                {isNouveauSite ? '7 jours' : '3 jours'} à compter de sa validation.
              </p>
            </div>
          </div>
        )

      // ── Step 2: Documents + Engagements ────────────────────────────────────
      case 2:
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
                    missingTypes={mainMissingDocTypes}
                    onUpload={handleMainDocUpload}
                    onDelete={handleMainDocDelete}
                    onToggleNotApplicable={handleMainDocNotApplicable}
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
                    missingTypes={companionMissingDocTypes}
                    onUpload={handleCompanionDocUpload}
                    onDelete={handleCompanionDocDelete}
                    onToggleNotApplicable={handleCompanionDocNotApplicable}
                  />
                </div>
              </>
            ) : (
              <PermitDocumentUploadZone
                permitId={permit?.id ?? ''}
                documentTypes={mainDocTypes}
                uploadedDocuments={permit?.documents ?? []}
                missingTypes={mainMissingDocTypes}
                onUpload={handleMainDocUpload}
                onDelete={handleMainDocDelete}
                onToggleNotApplicable={handleMainDocNotApplicable}
              />
            )}

            {/* Engagement */}
            <EngagementSection
              checked={engagementChecked}
              onChange={setEngagementChecked}
              statut={permit?.statut}
              evaluations={evaluations}
              onEvaluationsChange={setEvaluations}
              showEvaluation={false}
            />
          </div>
        )

      // ── Step 3: Aperçu du plan (dernière étape)  ─────────────────────────────────────────────────
      case 3:
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
              {selectedPlan?.typeIntervention && (
                <>
                  <span className="text-sm text-gray-600 ml-2">Processus :</span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5">
                    {selectedPlan.typeIntervention}
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

            {/* Récapitulatif de la demande (R-22) */}
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Récapitulatif de la demande</h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex gap-2"><dt className="text-gray-500">Permis :</dt><dd className="font-medium text-gray-900">{TYPE_PERMIT_LABELS[typePermis]}{permit?.reference ? ` (${permit.reference})` : ''}</dd></div>
                <div className="flex gap-2"><dt className="text-gray-500">Site :</dt><dd className="font-medium text-gray-900">{codeSiteSearched}</dd></div>
                <div className="flex gap-2"><dt className="text-gray-500">Plan :</dt><dd className="font-medium text-gray-900">{selectedPlan?.reference}</dd></div>
                <div className="flex gap-2"><dt className="text-gray-500">Processus :</dt><dd className="font-medium text-gray-900">{selectedPlan?.typeIntervention ?? '—'}</dd></div>
                <div className="flex gap-2 sm:col-span-2"><dt className="text-gray-500">Travaux :</dt><dd className="font-medium text-gray-900">{selectedPlan?.activitePlanifiee ?? '—'}</dd></div>
                <div className="flex gap-2 sm:col-span-2"><dt className="text-gray-500">Documents joints :</dt><dd className="font-medium text-gray-900">{permit?.documents.filter((d) => !d.nonApplicable).length ?? 0}</dd></div>
              </dl>
            </div>

            {/* Question de contrôle avant soumission (R-22) */}
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50/40 px-4 py-4">
              <p className="mb-3 text-sm font-semibold text-gray-900">Les dangers sont-ils efficacement maîtrisés ?</p>
              <div className="flex gap-3">
                {(['oui', 'non'] as const).map((answer) => (
                  <button
                    key={answer}
                    type="button"
                    aria-pressed={dangersMaitrises === answer}
                    onClick={() => setDangersMaitrises(answer)}
                    className={`min-w-24 rounded-lg border px-5 py-2 text-sm font-medium transition-colors ${
                      dangersMaitrises === answer
                        ? answer === 'oui'
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-red-500 bg-red-500 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {answer === 'oui' ? 'Oui' : 'Non'}
                  </button>
                ))}
              </div>
              {dangersMaitrises === 'oui' && (
                <p className="mt-3 text-xs text-gray-600">Aucune saisie complémentaire : vous pouvez soumettre directement la demande.</p>
              )}
            </div>

            {/* Formulaire d'évaluation des dangers — réponse « Non » (R-22) */}
            {dangersMaitrises === 'non' && (
              <EngagementSection
                checked={engagementChecked}
                onChange={setEngagementChecked}
                statut={permit?.statut}
                evaluations={evaluations}
                onEvaluationsChange={setEvaluations}
                showCertification={false}
                evaluationError={dangersIssue ? DANGERS_ISSUE_MESSAGES[dangersIssue] : null}
                onSaveEvaluation={async () => {
                  if (!permit) return
                  const dangers = nonEmptyEvaluations(evaluations)
                  await updatePermit(permit.id, { dangers: dangers.length > 0 ? dangers : null })
                }}
                evaluationExtra={
                  permit ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Insérer image</p>
                      <PermitDocumentUploadZone
                        permitId={permit.id}
                        documentTypes={['PHOTO_DANGERS']}
                        uploadedDocuments={permit.documents}
                        onUpload={handleMainDocUpload}
                        onDelete={handleMainDocDelete}
                      />
                    </div>
                  ) : null
                }
              />
            )}
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
          // Une fois le permis créé, on ne revient pas changer le site ni le plan.
          disabled={step === 0 || (step === 1 && !!permit) || isPending}
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
              disabled={isPending || !canSoumettre}
              loading={isSubmitting}
              size="lg"
            >
              {isGeneralNouveauSiteSansBinome ? 'Enregistrer et créer le second permis' : 'Soumettre le permis'}
            </Button>
          )
        )}
      </div>
    </div>
  )
}

export default function PermitTravailCreatePage() {
  const canCreate = usePermission('permit_travail.create')
  return canCreate ? <PermitTravailCreateForm /> : <Navigate to="/permits-travail" replace />
}
