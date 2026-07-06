import { useState } from 'react'
import { AlertTriangle, ShieldX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

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

        <div>
          <label
            htmlFor="refuser-commentaire"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {t('planPrevention.refuserModal.commentaireLabel')}{' '}
            <span className="text-red-500">{t('planPrevention.refuserModal.commentaireRequired')}</span>
          </label>
          <textarea
            id="refuser-commentaire"
            value={commentaire}
            onChange={(e) => {
              setCommentaire(e.target.value)
              if (commentaireError) setCommentaireError(null)
            }}
            rows={4}
            placeholder={t('planPrevention.refuserModal.commentairePlaceholder')}
            disabled={isRefusing}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none disabled:bg-gray-50 disabled:text-gray-400 ${
              commentaireError
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300 focus:ring-red-500'
            }`}
          />
          {commentaireError && (
            <p className="mt-1 text-xs text-red-600">{commentaireError}</p>
          )}
        </div>

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
