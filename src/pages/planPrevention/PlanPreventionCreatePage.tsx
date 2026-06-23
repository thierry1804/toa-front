import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import RisqueMatrice from '@/components/planPrevention/RisqueMatrice'
import DocumentUploadZone from '@/components/planPrevention/DocumentUploadZone'
import KmzImportButton from '@/components/planPrevention/KmzImportButton'
import PlanReference from '@/components/planPrevention/PlanReference'
import { usePlanPrevention } from '@/features/planPrevention/hooks/usePlanPrevention'
import { usePermissions } from '@/features/menus/hooks/usePermissions'
import type { PlanPrevention, RisqueRow, TypeDocumentPrevention } from '@/types/planPrevention'
import { TYPES_DOCUMENT_LABELS } from '@/types/planPrevention'

// ─── Zod schema for step 0 ────────────────────────────────────────────────────
const step0Schema = z
  .object({
    codeSite: z.string().min(1, 'Code site requis'),
    localite: z.string().min(1, 'Localité requise'),
    activitePlanifiee: z.string().min(3, 'Activité planifiée requise (min 3 caractères)'),
    dateDebut: z.string().min(1, 'Date de début requise'),
    dateFin: z.string().min(1, 'Date de fin requise'),
  })
  .refine((d) => !d.dateDebut || !d.dateFin || d.dateFin > d.dateDebut, {
    message: 'La date de fin doit être postérieure à la date de début',
    path: ['dateFin'],
  })

type Step0FormData = z.infer<typeof step0Schema>

// ─── Step indicator ────────────────────────────────────────────────────────────
const STEPS = [
  { title: 'Informations générales' },
  { title: 'Matrice des risques' },
  { title: 'Sites concernés' },
  { title: 'Documents obligatoires' },
  { title: 'Récapitulatif' },
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

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function PlanPreventionCreatePage() {
  const navigate = useNavigate()
  const perms = usePermissions('/prevention')
  const canEdit = perms?.canEdit ?? true
  const canSubmit = perms?.canCreate ?? true

  const {
    createPlan,
    addRisque,
    uploadDocument,
    importKmz,
    soumettrePlan,
    missingDocuments,
    isCreating,
    isSubmitting,
  } = usePlanPrevention()

  const [step, setStep] = useState(0)
  const [plan, setPlan] = useState<PlanPrevention | null>(null)
  const [localRisques, setLocalRisques] = useState<RisqueRow[]>([])
  const [isSavingRisques, setIsSavingRisques] = useState(false)

  // ── Step 0 form ──────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step0FormData>({
    resolver: zodResolver(step0Schema),
  })

  const handleStep0Next = handleSubmit(async (data) => {
    const created = await createPlan(data)
    setPlan(created)
    setStep(1)
  })

  // ── Step 1: save risques then proceed ────────────────────────────────────────
  const handleStep1Next = async () => {
    if (!plan) return
    setIsSavingRisques(true)
    try {
      for (const row of localRisques) {
        if (!row.description.trim() || !row.mesuresPreventives.trim()) continue
        await addRisque(plan.id, {
          description: row.description,
          gravite: row.gravite,
          probabilite: row.probabilite,
          mesuresPreventives: row.mesuresPreventives,
        })
      }
      setStep(2)
    } finally {
      setIsSavingRisques(false)
    }
  }

  // ── Step 4: submit ────────────────────────────────────────────────────────────
  const handleSoumettre = async () => {
    if (!plan) return
    try {
      await soumettrePlan(plan.id)
      navigate('/prevention')
    } catch {
      // errors handled by hook (toast + missingDocuments)
    }
  }

  const handleKmzImport = async (file: File) => {
    if (!plan) return
    const updated = await importKmz(plan.id, file)
    if (updated) setPlan(updated)
  }

  const handleDocumentUpload = async (type: TypeDocumentPrevention, file: File) => {
    if (!plan) return
    await uploadDocument(plan.id, type, file)
    // Refetch plan to update documents list
    setPlan((prev) =>
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

  const currentSites = plan?.sites ?? []
  const currentDocuments = plan?.documents ?? []

  // ── Render steps ─────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Code site *"
                {...register('codeSite')}
                error={errors.codeSite?.message}
                placeholder="Ex. : ANT-001"
                disabled={!canEdit}
              />
              <Input
                label="Localité *"
                {...register('localite')}
                error={errors.localite?.message}
                placeholder="Ex. : Antananarivo"
                disabled={!canEdit}
              />
            </div>
            <Input
              label="Activité planifiée *"
              {...register('activitePlanifiee')}
              error={errors.activitePlanifiee?.message}
              placeholder="Ex. : Maintenance préventive équipements télécoms"
              disabled={!canEdit}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date de début *"
                type="date"
                {...register('dateDebut')}
                error={errors.dateDebut?.message}
                disabled={!canEdit}
              />
              <Input
                label="Date de fin *"
                type="date"
                {...register('dateFin')}
                error={errors.dateFin?.message}
                disabled={!canEdit}
              />
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            {plan && <PlanReference reference={plan.reference} />}
            <RisqueMatrice
              rows={localRisques}
              onChange={setLocalRisques}
              disabled={!canEdit}
            />
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            {plan && <PlanReference reference={plan.reference} />}
            <KmzImportButton
              planId={plan?.id ?? ''}
              sites={currentSites}
              onImport={handleKmzImport}
              disabled={!canEdit}
            />
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            {plan && <PlanReference reference={plan.reference} />}
            {missingDocuments.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Documents manquants :</p>
                  <ul className="mt-1 list-disc list-inside text-sm text-red-700">
                    {missingDocuments.map((t) => (
                      <li key={t}>{TYPES_DOCUMENT_LABELS[t as TypeDocumentPrevention] ?? t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <DocumentUploadZone
              planId={plan?.id ?? ''}
              uploadedDocuments={currentDocuments}
              onUpload={handleDocumentUpload}
              missingTypes={missingDocuments}
              disabled={!canEdit}
            />
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            {plan && <PlanReference reference={plan.reference} className="mb-2" />}

            {/* General info recap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Code site', value: plan?.codeSite },
                { label: 'Localité', value: plan?.localite },
                { label: 'Activité planifiée', value: plan?.activitePlanifiee },
                { label: 'Date de début', value: plan?.dateDebut ? new Date(plan.dateDebut).toLocaleDateString('fr-FR') : '' },
                { label: 'Date de fin', value: plan?.dateFin ? new Date(plan.dateFin).toLocaleDateString('fr-FR') : '' },
                { label: 'Statut', value: plan?.statut },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{value ?? '—'}</p>
                </div>
              ))}
            </div>

            {/* Risques recap */}
            {plan?.risques && plan.risques.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Risques identifiés ({plan.risques.length})
                </h3>
                <RisqueMatrice
                  rows={plan.risques.map((r) => ({
                    localId: r.id,
                    description: r.description,
                    gravite: r.gravite,
                    probabilite: r.probabilite,
                    mesuresPreventives: r.mesuresPreventives,
                  }))}
                  onChange={() => {}}
                  disabled
                />
              </div>
            )}

            {/* Sites recap */}
            {currentSites.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Sites ({currentSites.length})
                </h3>
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {currentSites.map((site) => (
                    <li key={site.id} className="px-4 py-2 text-sm flex justify-between">
                      <span className="font-medium">{site.nom}</span>
                      <span className="text-gray-500 font-mono text-xs">
                        {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Documents recap */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Documents obligatoires</h3>
              <DocumentUploadZone
                planId={plan?.id ?? ''}
                uploadedDocuments={currentDocuments}
                onUpload={handleDocumentUpload}
                missingTypes={missingDocuments}
                disabled
              />
            </div>

            {missingDocuments.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  Des documents sont manquants. Retournez à l'étape précédente pour les téléverser.
                </p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const isLastStep = step === STEPS.length - 1

  const handleNext = async () => {
    if (step === 0) {
      await handleStep0Next()
    } else if (step === 1) {
      await handleStep1Next()
    } else if (!isLastStep) {
      setStep((s) => s + 1)
    }
  }

  const isPending = isCreating || isSavingRisques || isSubmitting

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau plan de prévention</h1>
        <p className="text-sm text-gray-500 mt-1">
          Renseignez les informations en suivant les étapes
        </p>
      </div>

      <StepIndicator current={step} />

      {/* Step card */}
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
          onClick={() => setStep((s) => s - 1)}
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
              disabled={isPending}
              loading={isSubmitting}
              size="lg"
            >
              Soumettre le plan
            </Button>
          )
        ) : (
          <Button
            onClick={handleNext}
            disabled={isPending}
            loading={isPending}
            size="lg"
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}
