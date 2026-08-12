import { AlertTriangle, ShieldX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal'

interface RefuserPermitModalProps {
  isOpen: boolean
  permitId: string
  permitReference: string
  isRefusing: boolean
  onClose: () => void
  onRefuser: (id: string, commentaire: string) => Promise<void>
}

export default function RefuserPermitModal({
  isOpen,
  permitId,
  permitReference,
  isRefusing,
  onClose,
  onRefuser,
}: RefuserPermitModalProps) {
  const { t } = useTranslation()

  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('permitTravail.components.refuserModal.title', { reference: permitReference })}
      banner={
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">{t('permitTravail.components.refuserModal.banner')}</p>
        </div>
      }
      commentLabel={t('permitTravail.components.refuserModal.commentLabel')}
      commentRequired
      commentRequiredMessage={t('permitTravail.components.refuserModal.commentRequiredMessage')}
      commentPlaceholder={t('permitTravail.components.refuserModal.commentPlaceholder')}
      confirmLabel={t('permitTravail.components.refuserModal.confirmLabel')}
      confirmVariant="danger"
      confirmIcon={<ShieldX className="mr-2 h-4 w-4" />}
      isSubmitting={isRefusing}
      onConfirm={(commentaire) => onRefuser(permitId, commentaire)}
      errorMessage={t('permitTravail.components.refuserModal.errorMessage')}
    />
  )
}
