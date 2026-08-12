import { AlertTriangle, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal'

interface PvRefuserModalProps {
  isOpen: boolean
  permitId: string
  permitReference: string
  isRefuserPv: boolean
  onClose: () => void
  onRefuser: (id: string, commentaire: string) => Promise<void>
}

export default function PvRefuserModal({
  isOpen,
  permitId,
  permitReference,
  isRefuserPv,
  onClose,
  onRefuser,
}: PvRefuserModalProps) {
  const { t } = useTranslation()

  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('permitTravail.components.pvRefuserModal.title', { reference: permitReference })}
      banner={
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">{t('permitTravail.components.pvRefuserModal.banner')}</p>
        </div>
      }
      commentLabel={t('permitTravail.components.pvRefuserModal.commentLabel')}
      commentRequired
      commentRequiredMessage={t('permitTravail.components.pvRefuserModal.commentRequiredMessage')}
      commentPlaceholder={t('permitTravail.components.pvRefuserModal.commentPlaceholder')}
      confirmLabel={t('permitTravail.components.pvRefuserModal.confirmLabel')}
      confirmVariant="danger"
      confirmIcon={<XCircle className="mr-2 h-4 w-4" />}
      isSubmitting={isRefuserPv}
      onConfirm={(commentaire) => onRefuser(permitId, commentaire)}
      errorMessage={t('permitTravail.components.pvRefuserModal.errorMessage')}
    />
  )
}
