import { useState } from 'react'
import { AlertTriangle, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal'
import Checkbox from '@/components/ui/Checkbox'

interface CloturerModalProps {
  isOpen: boolean
  permitId: string
  permitReference: string
  isCloturer: boolean
  onClose: () => void
  onCloturer: (id: string, commentaire?: string, accordClient?: boolean) => Promise<unknown>
}

export default function CloturerModal({
  isOpen,
  permitId,
  permitReference,
  isCloturer,
  onClose,
  onCloturer,
}: CloturerModalProps) {
  const { t } = useTranslation()
  const [accordClient, setAccordClient] = useState(false)

  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('permitTravail.components.cloturerModal.title')}
      description={permitReference}
      banner={
        <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
          <p
            className="text-xs text-orange-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: t('permitTravail.components.cloturerModal.banner') }}
          />
        </div>
      }
      commentPlaceholder={t('permitTravail.components.cloturerModal.commentPlaceholder')}
      extraContent={
        <Checkbox
          label={t('permitTravail.components.cloturerModal.accordClientLabel')}
          checked={accordClient}
          onChange={(e) => setAccordClient(e.target.checked)}
          disabled={isCloturer}
        />
      }
      confirmLabel={t('permitTravail.components.cloturerModal.confirmLabel')}
      confirmVariant="danger"
      confirmIcon={<Lock className="mr-2 h-4 w-4" />}
      isSubmitting={isCloturer}
      onConfirm={async (commentaire) => {
        await onCloturer(permitId, commentaire || undefined, accordClient)
      }}
      errorMessage={t('permitTravail.components.cloturerModal.errorMessage')}
    />
  )
}
