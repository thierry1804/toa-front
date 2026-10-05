import { AlertTriangle, ShieldX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal'

interface RefuserModalProps {
  isOpen: boolean
  planId: string
  planReference: string
  isRefusing: boolean
  onClose: () => void
  onRefuser: (id: string, commentaire: string) => Promise<void>
}

export default function RefuserModal({
  isOpen,
  planId,
  planReference,
  isRefusing,
  onClose,
  onRefuser,
}: RefuserModalProps) {
  const { t } = useTranslation()

  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('planPrevention.refuserModal.title', { reference: planReference })}
      banner={
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: t('planPrevention.refuserModal.warning') }}
          />
        </div>
      }
      commentLabel={t('planPrevention.refuserModal.commentaireLabel')}
      commentRequired
      commentRequiredMessage={t('planPrevention.refuserModal.commentaireError')}
      commentPlaceholder={t('planPrevention.refuserModal.commentairePlaceholder')}
      confirmLabel={t('planPrevention.refuserModal.confirm')}
      confirmVariant="danger"
      confirmIcon={<ShieldX className="mr-2 h-4 w-4" />}
      isSubmitting={isRefusing}
      onConfirm={(commentaire) => onRefuser(planId, commentaire)}
      getErrorMessage={(err) => {
        const message = err instanceof Error ? err.message : ''
        if (
          message === 'Plan non examiné' ||
          message.includes('statut_invalide_pour_refus')
        ) {
          return t('planPrevention.refuserModal.errorNotExamined')
        }
        return t('planPrevention.refuserModal.errorGeneric')
      }}
    />
  )
}
