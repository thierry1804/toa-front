import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal'
import type { PermitTravail } from '@/types/permitTravail'

interface ValiderPermitModalProps {
  isOpen: boolean
  permitId: string
  permitReference: string
  isValidating: boolean
  onClose: () => void
  onValider: (id: string, commentaire?: string) => Promise<PermitTravail>
}

export default function ValiderPermitModal({
  isOpen,
  permitId,
  permitReference,
  isValidating,
  onClose,
  onValider,
}: ValiderPermitModalProps) {
  const { t } = useTranslation()

  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('permitTravail.components.validerModal.title', { reference: permitReference })}
      description={
        <>
          {t('permitTravail.components.validerModal.descriptionPrefix')}{' '}
          <span className="font-semibold text-blue-700">{permitReference}</span>.
        </>
      }
      showComment={false}
      confirmLabel={t('permitTravail.components.validerModal.confirmLabel')}
      confirmIcon={<ShieldCheck className="mr-2 h-4 w-4" />}
      isSubmitting={isValidating}
      errorMessage={t('permitTravail.components.validerModal.errorMessage')}
      onConfirm={async (commentaire) => {
        const updatedPermit = await onValider(permitId, commentaire || undefined)
        const latestDecision = updatedPermit.decisionsHse?.at(-1)
        if (!latestDecision?.signatureElectronique) return undefined

        const signature = latestDecision.signatureElectronique
        const exp = new Date(
          new Date(latestDecision.decidedAt).getTime() + 30 * 24 * 60 * 60 * 1000,
        )
        const dateExpiration = exp.toLocaleDateString('fr-FR')

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">
                {t('permitTravail.components.validerModal.successMessage')}
              </span>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                {t('permitTravail.components.validerModal.signatureLabel')}
              </p>
              <p className="break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
                {signature}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                {t('permitTravail.components.validerModal.expirationLabel')}
              </p>
              <p className="text-sm font-medium text-gray-800">{dateExpiration}</p>
            </div>
          </div>
        )
      }}
    />
  )
}
