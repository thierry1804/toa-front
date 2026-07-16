import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, ChevronRight, Check, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import PermitDocumentUploadZone from '@/components/permitTravail/PermitDocumentUploadZone'
import EngagementSection from '@/components/permitTravail/EngagementSection'
import { usePermitTravail } from '@/features/permitTravail/hooks/usePermitTravail'
import { usePlanPreventions } from '@/features/planPrevention/hooks/usePlanPrevention'
import { usePermission } from '@/features/auth/usePermission'
import { useAuthStore } from '@/store/auth.store'
import type {
  PermitTravail,
  ProcessusPermit,
  TypePermit,
  TypeDocumentPermitTravail,
  DocumentPermitTravail,
} from '@/types/permitTravail'
import {
  PROCESSUS_LABELS,
  TYPE_PERMIT_LABELS,
  DOCUMENT_TYPES_BY_PERMIT,
} from '@/types/permitTravail'

// ─── Zod schema step 2 ────────────────────────────────────────────────────────
const step2Schema = z
  .object({
    codeSite: z.string().min(1, 'Code site requis'),
    descriptionTravaux: z.string().min(3, 'Description requise (min 3 caractères)'),
    dateDebutPrevue: z.string().min(1, 'Date de début requise'),
    dateFinPrevue: z.string().min(1, 'Date de fin requise'),
  })
  .refine((d) => !d.dateDebutPrevue || !d.dateFinPrevue || d.dateFinPrevue >= d.dateDebutPrevue, {
    message: 'La date de fin doit être postérieure ou égale à la date de début',
    path: ['dateFinPrevue'],
  })

type Step2FormData = z.infer<typeof step2Schema>

// ─── Steps definition ─────────────────────────────────────────────────────────
const STEPS = [
  { title: 'Type et processus' },
  { title: 'Plan de prévention' },
  { title: 'Informations travaux' },
  { title: 'Documents obligatoires' },
  { title: 'Engagements et soumission' },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="w-full mb-6">
      <div className="flex items-start w-full">
        {STEPS.map((step, index) => (
          <div key={step.title} className="flex items-start flex-1">
            <div className="flex flex-col items-center flex-1 min-w-0 px-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index < current
                    ? 'bg-green-500 text-white'
                    : index === current
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < current ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <p
                className={`mt-2 text-xs text-center leading-tight px-1 ${
                  index <= current ? 'text-gray-900 font-medium' : 'text-gray-400'
                }`}
              >
                {step.title}
              </p>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mt-4 ${index < current ? 'bg-green-500' : 'bg-gray-200'}`}
              />
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

// ─── Navigation helpers ───────────────────────────────────────────────────────
function getNextStep(current: number, processus: ProcessusPermit): number {
  if (current === 0 && processus === 'MAINTENANCE') return 2
  return current + 1
}

function getPrevStep(current: number, processus: ProcessusPermit): number {
  if (current === 2 && processus === 'MAINTENANCE') return 0
  return current - 1
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PermitTravailCreatePage() {
  const navigate = useNavigate()
  const canSubmit = usePermission('permit_travail.submit')
  const user = useAuthStore((s) => s.user)

  const { createPermit, updatePermit, uploadDocument, soumettrePermit, isCreating, isSubmitting } =
    usePermitTravail()

  const { data: plansValidesHSE = [] } = usePlanPreventions()
  const plansValides = plansValidesHSE.filter((p) => p.statut === 'VALIDE_HSE')

  // ── Step 0 state ─────────────────────────────────────────────────────────────
  const [processus, setProcessus] = useState<ProcessusPermit>('NOUVEAU_SITE')
  // Default to ELECTRIQUE because default processus is NOUVEAU_SITE (no GENERAL option)
  const [typePermis, setTypePermis] = useState<TypePermit>('ELECTRIQUE')

  // ── Step 1 state ─────────────────────────────────────────────────────────────
  const [planPreventionId, setPlanPreventionId] = useState<string>('')

  // ── Step navigation ───────────────────────────────────────────────────────────
  const [step, setStep] = useState(0)

  // ── Created permit ────────────────────────────────────────────────────────────
  const [permit, setPermit] = useState<PermitTravail | null>(null)
  // Track companion permit docs locally (for NOUVEAU_SITE dual-upload)
  const [companionDocs, setCompanionDocs] = useState<DocumentPermitTravail[]>([])

  // ── Step 4 state ─────────────────────────────────────────────────────────────
  const [engagementChecked, setEngagementChecked] = useState(false)
  const [planRequiredError, setPlanRequiredError] = useState(false)

  // ── Step 2 form ───────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Step2FormData>({ resolver: zodResolver(step2Schema) })

  useEffect(() => {
    if (!planPreventionId) return
    const plan = plansValides.find((p) => String(p.id) === String(planPreventionId))
    if (!plan) return
    setValue('codeSite', plan.codeSite)
    setValue('descriptionTravaux', plan.activitePlanifiee)
    setValue('dateDebutPrevue', plan.dateDebut ? plan.dateDebut.slice(0, 10) : '')
    setValue('dateFinPrevue', plan.dateFin ? plan.dateFin.slice(0, 10) : '')
  }, [planPreventionId, plansValides, setValue])

  // ── Step 2 → 3: create permit ────────────────────────────────────────────────
  const handleStep2Next = handleSubmit(async (data) => {
    const created = await createPermit({
      processus,
      typePermis,
      planPreventionId: planPreventionId || undefined,
      ...data,
    })
    setPermit(created)
    setStep(3)
  })

  // ── Document upload: main permit ──────────────────────────────────────────────
  const handleMainDocUpload = async (type: TypeDocumentPermitTravail, file: File) => {
    if (!permit) return
    await uploadDocument(permit.id, type, file)
    setPermit((prev) =>
      prev
        ? {
            ...prev,
            documents: [
              ...prev.documents.filter((d) => d.type !== type),
              {
                id: crypto.randomUUID(),
                type,
                filePath: '',
                mimeType: file.type,
                uploadedAt: new Date().toISOString(),
              },
            ],
          }
        : prev,
    )
  }

  // ── Document upload: companion permit (NOUVEAU_SITE) ──────────────────────────
  const handleCompanionDocUpload = async (type: TypeDocumentPermitTravail, file: File) => {
    const companionId = permit?.permitsGroupe?.[0]?.id
    if (!companionId) return
    await uploadDocument(companionId, type, file)
    setCompanionDocs((prev) => [
      ...prev.filter((d) => d.type !== type),
      {
        id: crypto.randomUUID(),
        type,
        filePath: '',
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
      },
    ])
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSoumettre = async () => {
    if (!permit) return
    try {
      await updatePermit(permit.id, { engagementAccepte: true })
      const companionId = permit.permitsGroupe?.[0]?.id
      if (companionId) {
        await updatePermit(companionId, { engagementAccepte: true })
      }
      await soumettrePermit(permit.id)
      navigate('/permits-travail')
    } catch (err: unknown) {
      const msg = (err as Error).message
      if (msg === 'plan_prevention_required') {
        setPlanRequiredError(true)
        setStep(1)
      }
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const isLastStep = step === STEPS.length - 1
  const isPending = isCreating || isSubmitting

  const companionPermit = permit?.permitsGroupe?.[0]
  // For NOUVEAU_SITE: main permit has typePermis (ELECTRIQUE/HAUTEUR), companion is GENERAL
  // For other processus: single permit
  const mainDocTypes = permit ? DOCUMENT_TYPES_BY_PERMIT[permit.typePermis] : []
  const companionDocTypes =
    permit?.processus === 'NOUVEAU_SITE' && companionPermit
      ? DOCUMENT_TYPES_BY_PERMIT[companionPermit.typePermis]
      : []

  // ── Render steps ──────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5">
            {/* NOUVEAU_SITE bandeau */}
            {processus === 'NOUVEAU_SITE' && (
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">2 permis requis pour un Nouveau Site</p>
                  <p className="mt-0.5">
                    Général + Électrique <em>ou</em> Général + Hauteur selon les risques identifiés.
                    Sélectionnez le type secondaire ci-dessous — le permis Général sera créé automatiquement.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Processus *</label>
              <select
                value={processus}
                onChange={(e) => {
                  setProcessus(e.target.value as ProcessusPermit)
                  // Reset typePermis when changing processus
                  if (e.target.value === 'NOUVEAU_SITE') setTypePermis('ELECTRIQUE')
                  else setTypePermis('GENERAL')
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {(['NOUVEAU_SITE', 'MAINTENANCE', 'RENOUVELLEMENT'] as ProcessusPermit[]).map((p) => (
                  <option key={p} value={p}>{PROCESSUS_LABELS[p]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de permis *</label>
              <select
                value={typePermis}
                onChange={(e) => setTypePermis(e.target.value as TypePermit)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {(
                  processus === 'NOUVEAU_SITE'
                    ? (['ELECTRIQUE', 'HAUTEUR'] as TypePermit[])
                    : (['GENERAL', 'ELECTRIQUE', 'HAUTEUR'] as TypePermit[])
                ).map((t) => (
                  <option key={t} value={t}>{TYPE_PERMIT_LABELS[t]}</option>
                ))}
              </select>
              {processus === 'NOUVEAU_SITE' && (
                <p className="mt-1 text-xs text-gray-500">
                  Pour Nouveau Site, sélectionnez le type secondaire. Le permis Général est auto-créé.
                </p>
              )}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            {planRequiredError && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  Un plan de prévention validé HSE est requis pour soumettre ce permis.
                </p>
              </div>
            )}

            {plansValides.length === 0 ? (
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Aucun plan de prévention validé</p>
                  <p className="mt-0.5">
                    Vous devez disposer d'un plan validé HSE avant de créer un permis.{' '}
                    <Link to="/prevention/new" className="underline font-medium hover:text-amber-900">
                      Créer un plan de prévention
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan de prévention associé *
                </label>
                <select
                  value={planPreventionId}
                  onChange={(e) => setPlanPreventionId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">— Sélectionnez un plan —</option>
                  {plansValides.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.reference} — {p.codeSite} — {p.activitePlanifiee}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <Input
              label="Code site *"
              {...register('codeSite')}
              error={errors.codeSite?.message}
              placeholder="Ex. : ANT-001"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description des travaux *
              </label>
              <textarea
                {...register('descriptionTravaux')}
                rows={4}
                placeholder="Décrivez les travaux à réaliser..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              {errors.descriptionTravaux && (
                <p className="mt-1 text-xs text-red-600">{errors.descriptionTravaux.message}</p>
              )}
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

      case 3:
        return (
          <div className="space-y-6">
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
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            {/* Reference */}
            {permit?.reference && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Référence</span>
                <span className="font-mono text-sm font-semibold text-blue-800">{permit.reference}</span>
              </div>
            )}

            {/* Recap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Type de permis', value: permit ? TYPE_PERMIT_LABELS[permit.typePermis] : '' },
                { label: 'Processus', value: permit ? PROCESSUS_LABELS[permit.processus] : '' },
                { label: 'Code site', value: permit?.codeSite },
                { label: 'Description travaux', value: permit?.descriptionTravaux },
                {
                  label: 'Date de début prévue',
                  value: permit?.dateDebutPrevue
                    ? new Date(permit.dateDebutPrevue).toLocaleDateString('fr-FR')
                    : '',
                },
                {
                  label: 'Date de fin prévue',
                  value: permit?.dateFinPrevue
                    ? new Date(permit.dateFinPrevue).toLocaleDateString('fr-FR')
                    : '',
                },
                { label: 'Statut', value: permit?.statut },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{value ?? '—'}</p>
                </div>
              ))}
            </div>

            <EngagementSection
              planPreventionId={planPreventionId || null}
              checked={engagementChecked}
              onChange={setEngagementChecked}
              statut={permit?.statut}
            />
          </div>
        )

      default:
        return null
    }
  }

  // ── handleNext ────────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (step === 2) {
      await handleStep2Next()
    } else if (!isLastStep) {
      setStep(getNextStep(step, processus))
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau permis de travail</h1>
        <p className="text-sm text-gray-500 mt-1">
          Renseignez les informations en suivant les étapes
        </p>
      </div>

      <StepIndicator current={step} />

      <Card className="w-full">
        <CardHeader>
          <CardTitle>{STEPS[step].title}</CardTitle>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
        <Button
          variant="outline"
          onClick={() => setStep(getPrevStep(step, processus))}
          disabled={step === 0 || isPending}
          size="lg"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>

        {isLastStep ? (
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
        ) : (
          <Button onClick={handleNext} disabled={isPending} loading={isPending} size="lg">
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}
