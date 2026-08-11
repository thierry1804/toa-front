import { useState } from 'react'
import { AlertTriangle, ShieldX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'

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
  const [commentaire, setCommentaire] = useState('')
  const [commentaireError, setCommentaireError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setCommentaireError(null)
    setError(null)

    if (!commentaire.trim()) {
      setCommentaireError(t('planPrevention.refuserModal.commentaireError'))
      return
    }

    try {
      await onRefuser(planId, commentaire.trim())
      handleClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'Commentaire obligatoire en cas de refus') {
          setCommentaireError(t('planPrevention.refuserModal.commentaireError'))
          return
        }
        if (err.message === 'Plan non examiné') {
          setError(t('planPrevention.refuserModal.errorNotExamined'))
          return
        }
      }
      setError(t('planPrevention.refuserModal.errorGeneric'))
    }
  }

  const handleClose = () => {
    if (isRefusing) return
    setCommentaire('')
    setCommentaireError(null)
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('planPrevention.refuserModal.title', { reference: planReference })}>
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: t('planPrevention.refuserModal.warning') }}
          />
        </div>

        <Textarea
          label={t('planPrevention.refuserModal.commentaireLabel')}
          required
          value={commentaire}
          onChange={(e) => {
            setCommentaire(e.target.value)
            if (commentaireError) setCommentaireError(null)
          }}
          rows={4}
          placeholder={t('planPrevention.refuserModal.commentairePlaceholder')}
          disabled={isRefusing}
          error={commentaireError || undefined}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={isRefusing}>
          {t('planPrevention.refuserModal.cancel')}
        </Button>
        <Button variant="danger" onClick={handleConfirm} isLoading={isRefusing}>
          <ShieldX className="mr-2 h-4 w-4" />
          {t('planPrevention.refuserModal.confirm')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
