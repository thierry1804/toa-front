import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronLeft, ChevronRight, Check, AlertCircle, FileText } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import PermitDocumentUploadZone from '@/components/permitTravail/PermitDocumentUploadZone'
import EngagementSection, { type EvaluationData } from '@/components/permitTravail/EngagementSection'
import BandeauRefus from '@/components/planPrevention/BandeauRefus'
import HistoriqueVersions from '@/components/planPrevention/HistoriqueVersions'
import {
  usePermitTravailDetail,
  usePermitTravailVersions,
  usePermitTravail,
} from '@/features/permitTravail/hooks/usePermitTravail'
import { usePermission } from '@/features/auth/usePermission'
import { useAuthStore } from '@/store/auth.store'
import type { DecisionHsePermitTravail, TypeDocumentPermitTravail, DocumentPermitTravail } from '@/types/permitTravail'
import {
  TYPE_PERMIT_LABELS,
  PROCESSUS_LABELS,
  getRequiredDocumentTypes,
} from '@/types/permitTravail'
import type { DecisionHsePlanPrevention, VersionPlanPrevention } from '@/types/planPrevention'

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

const STEPS = [
  { title: 'Type et processus' },
  { title: 'Plan de prévention' },
  { title: 'Informations travaux' },
  { title: 'Documents obligatoires' },
  { title: 'Correction et resoumission' },
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

export default function PermitTravailEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const canEdit = usePermission('permit_travail.edit')
  const canResoumettre = usePermission('permit_travail.resoumettre')

  const { data: permit, isLoading, isError } = usePermitTravailDetail(id ?? '')
  const { data: versions = [] } = usePermitTravailVersions(id ?? '')
  const { updatePermit, uploadDocument, resoumettrePermit, isResoumitting } = usePermitTravail()

  const [step, setStep] = useState(0)
  const [engagementChecked, setEngagementChecked] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationData>({
    dangers: '',
    evaluationPreliminaire: '',
    moyensMaitrise: '',
    evaluationFinale: '',
  })
  const [motif, setMotif] = useState('')
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [missingDocTypes, setMissingDocTypes] = useState<TypeDocumentPermitTravail[]>([])
  const [localDocs, setLocalDocs] = useState<DocumentPermitTravail[]>([])
  const engagementRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Step2FormData>({ resolver: zodResolver(step2Schema) })

  useEffect(() => {
    if (!permit) return
    reset({
      codeSite: permit.codeSite,
      descriptionTravaux: permit.descriptionTravaux,
      dateDebutPrevue: permit.dateDebutPrevue
        ? permit.dateDebutPrevue.split('T')[0]
        : '',
      dateFinPrevue: permit.dateFinPrevue
        ? permit.dateFinPrevue.split('T')[0]
        : '',
    })
    setEngagementChecked(permit.engagementAccepte ?? false)
    setLocalDocs(permit.documents ?? [])
    setEvaluation({
      dangers: permit.dangers ?? '',
      evaluationPreliminaire: (permit.evaluationPreliminaire as EvaluationData['evaluationPreliminaire']) ?? '',
      moyensMaitrise: permit.moyensMaitrise ?? '',
      evaluationFinale: (permit.evaluationFinale as EvaluationData['evaluationFinale']) ?? '',
    })
  }, [permit, reset])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Chargement…
      </div>
    )
  }

  if (isError || !permit) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
        <FileText className="h-12 w-12 text-gray-300" />
        <p>Permis introuvable.</p>
        <Button variant="outline" onClick={() => navigate('/permits-travail')}>
          Retour à la liste
        </Button>
      </div>
    )
  }

  const lastRefus = [...(permit.decisionsHse ?? [])]
    .reverse()
    .find((d) => d.decision === 'REFUSE')

  if (!lastRefus) {
    navigate(`/permits-travail/${permit.id}`)
    return null
  }

  const docTypes = getRequiredDocumentTypes(permit.planProcess, permit.typePermis, permit.processus)

  const handleDocUpload = async (type: TypeDocumentPermitTravail, file: File) => {
    if (!permit) return
    await uploadDocument(permit.id, type, file)
    setLocalDocs((prev) => [
      ...prev.filter((d) => d.type !== type),
      {
        id: crypto.randomUUID(),
        type,
        filePath: '',
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
      },
    ])
    setMissingDocTypes((prev) => prev.filter((t) => t !== type))
  }

  const handleStep2Next = handleSubmit(async (data) => {
    if (!canEdit) { setStep(3); return }
    await updatePermit(permit.id, {
      codeSite: data.codeSite,
      descriptionTravaux: data.descriptionTravaux,
      dateDebutPrevue: data.dateDebutPrevue,
      dateFinPrevue: data.dateFinPrevue,
    })
    setStep(3)
  })

  const handleResoumettre = async () => {
    if (!permit) return
    setInlineError(null)
    try {
      await resoumettrePermit(permit.id, motif || undefined)
      navigate('/permits-travail')
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      if (detail.includes('documents_manquants')) {
        const raw = detail.replace('documents_manquants:', '').trim()
        const missing = raw.split(',').map((s: string) => s.trim()) as TypeDocumentPermitTravail[]
        setMissingDocTypes(missing)
        setStep(3)
      } else if (detail.includes('engagement_obligatoire')) {
        setStep(4)
        setTimeout(() => engagementRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        setInlineError('Vous devez cocher l\'engagement avant de resoumettre.')
      } else if (detail.includes('aucun_refus_enregistre')) {
        setInlineError('Aucun refus enregistré pour ce permis.')
      } else {
        setInlineError('Ce permis n\'est pas modifiable.')
      }
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Type de permis</p>
                <p className="font-medium text-gray-900 mt-0.5">{TYPE_PERMIT_LABELS[permit.typePermis]}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Processus</p>
                <p className="font-medium text-gray-900 mt-0.5">{PROCESSUS_LABELS[permit.processus]}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Le type et le processus ne peuvent pas être modifiés après création.</p>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4 text-sm">
            {permit.planPreventionId ? (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Plan de prévention associé</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  ID : <span className="font-mono text-blue-700">{permit.planPreventionId}</span>
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucun plan de prévention associé.</p>
            )}
            <p className="text-xs text-gray-400">Le plan de prévention associé ne peut pas être modifié après création.</p>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <Input
              label="Code site *"
              {...register('codeSite')}
              error={errors.codeSite?.message}
              disabled={!canEdit}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description des travaux *
              </label>
              <textarea
                {...register('descriptionTravaux')}
                rows={4}
                disabled={!canEdit}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-500"
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
                disabled={!canEdit}
              />
              <Input
                label="Date de fin prévue *"
                type="date"
                {...register('dateFinPrevue')}
                error={errors.dateFinPrevue?.message}
                disabled={!canEdit}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            {missingDocTypes.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Documents manquants :</p>
                  <ul className="mt-1 list-disc list-inside space-y-0.5">
                    {missingDocTypes.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
              </div>
            )}
            <PermitDocumentUploadZone
              permitId={permit.id}
              documentTypes={docTypes}
              uploadedDocuments={localDocs}
              onUpload={handleDocUpload}
              allowDownload={true}
            />
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
              <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Référence</span>
              <span className="font-mono text-sm font-semibold text-blue-800">{permit.reference}</span>
            </div>

            <div ref={engagementRef}>
              <EngagementSection
                checked={engagementChecked}
                onChange={setEngagementChecked}
                statut="BROUILLON"
                evaluation={evaluation}
                onEvaluationChange={setEvaluation}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motif de correction <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={3}
                placeholder="Décrivez les corrections apportées suite au refus HSE…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {inlineError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-800">{inlineError}</p>
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
    if (step === 2) {
      await handleStep2Next()
    } else if (!isLastStep) {
      setStep((s) => s + 1)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PageHeader
        title="Corriger le permis"
        description="Apportez les corrections demandées et resoumettez."
        breadcrumb={[
          { label: 'Permis de travail', href: '/permits-travail' },
          { label: 'Corriger' },
        ]}
      />

      {lastRefus && (
        <BandeauRefus
          decision={lastRefus as unknown as DecisionHsePlanPrevention}
          label="Permis"
        />
      )}

      {versions.length > 0 && (
        <HistoriqueVersions versions={versions as unknown as VersionPlanPrevention[]} />
      )}

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
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || isResoumitting}
          size="lg"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Précédent
        </Button>

        {isLastStep ? (
          canResoumettre && (
            <Button
              onClick={() => void handleResoumettre()}
              disabled={isResoumitting || !engagementChecked}
              loading={isResoumitting}
              size="lg"
            >
              Resoumettre le permis
            </Button>
          )
        ) : (
          <Button onClick={() => void handleNext()} size="lg">
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}
