import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal'
import type { PlanPrevention } from '@/types/planPrevention'

interface ValiderModalProps {
  isOpen: boolean
  planId: string
  planReference: string
  isValidating: boolean
  onClose: () => void
  onValider: (id: string, commentaire?: string) => Promise<PlanPrevention>
}

export default function ValiderModal({
  isOpen,
  planId,
  planReference,
  isValidating,
  onClose,
  onValider,
}: ValiderModalProps) {
  const { t } = useTranslation()

  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('planPrevention.validerModal.title', { reference: planReference })}
      description={t('planPrevention.validerModal.description')}
      showComment={false}
      confirmLabel={t('planPrevention.validerModal.confirm')}
      confirmIcon={<ShieldCheck className="mr-2 h-4 w-4" />}
      isSubmitting={isValidating}
      onConfirm={async (commentaire) => {
        const updatedPlan = await onValider(planId, commentaire || undefined)
        const latestDecision = updatedPlan.decisionsHse?.at(-1)
        if (!latestDecision?.signatureElectronique) return undefined

        const signature = latestDecision.signatureElectronique
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{t('planPrevention.validerModal.success')}</span>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                {t('planPrevention.validerModal.signatureLabel')}
              </p>
              <p className="break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
                {signature}
              </p>
            </div>
          </div>
        )
      }}
      getErrorMessage={(err) => {
        if (err instanceof Error) {
          if (err.message === 'Plan non examiné par Chef de Projet') {
            return t('planPrevention.validerModal.errorNotExamined')
          }
          if (err.message === 'documents_manquants') {
            const missing = (err as Error & { missingDocuments?: string[] }).missingDocuments ?? []
            return (
              <>
                <p className="font-medium mb-1">{t('planPrevention.validerModal.missingDocuments')}</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {missing.map((doc) => (
                    <li key={doc}>{doc}</li>
                  ))}
                </ul>
              </>
            )
          }
        }
        return t('planPrevention.validerModal.errorGeneric')
      }}
    />
  )
}
