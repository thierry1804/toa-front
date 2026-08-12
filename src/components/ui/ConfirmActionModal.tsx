import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, ModalFooter } from './Modal'
import Button, { type ButtonProps } from './Button'
import Textarea from './Textarea'

export interface ConfirmActionModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  /** Intro text shown above the comment field, e.g. "Confirmez la validation du permis X." */
  description?: ReactNode
  /** Warning/info banner shown above the comment field (e.g. "Le prestataire sera notifié…"). */
  banner?: ReactNode
  commentLabel?: string
  commentPlaceholder?: string
  commentRequired?: boolean
  commentRequiredMessage?: string
  /** Extra form content rendered between the comment field and the error banner (e.g. a checkbox). */
  extraContent?: ReactNode
  confirmLabel: string
  confirmVariant?: ButtonProps['variant']
  confirmIcon?: ReactNode
  isSubmitting: boolean
  /**
   * Called with the trimmed comment. Throw to show a generic error banner.
   * Return a ReactNode (e.g. a signature/expiration panel) to show it in
   * place of the form and switch the footer to a single "Fermer" button;
   * return void/undefined to just close the modal on success.
   */
  onConfirm: (comment: string) => Promise<ReactNode | void>
  errorMessage?: ReactNode
  /** Map a thrown error to a display message (plain text or richer content). Falls back to errorMessage. */
  getErrorMessage?: (err: unknown) => ReactNode
}

export default function ConfirmActionModal({
  isOpen,
  onClose,
  title,
  description,
  banner,
  commentLabel,
  commentPlaceholder,
  commentRequired = false,
  commentRequiredMessage,
  extraContent,
  confirmLabel,
  confirmVariant = 'primary',
  confirmIcon,
  isSubmitting,
  onConfirm,
  errorMessage,
  getErrorMessage,
}: ConfirmActionModalProps) {
  const { t } = useTranslation()
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [error, setError] = useState<ReactNode | null>(null)
  const [successContent, setSuccessContent] = useState<ReactNode | null>(null)

  const effectiveCommentLabel = commentLabel ?? t('ui.confirmActionModal.commentLabel')
  const effectiveCommentRequiredMessage = commentRequiredMessage ?? t('ui.confirmActionModal.fieldRequired')
  const effectiveErrorMessage = errorMessage ?? t('common.error')

  const handleClose = () => {
    if (isSubmitting) return
    setComment('')
    setCommentError(null)
    setError(null)
    setSuccessContent(null)
    onClose()
  }

  const handleConfirm = async () => {
    setCommentError(null)
    setError(null)
    if (commentRequired && !comment.trim()) {
      setCommentError(effectiveCommentRequiredMessage)
      return
    }
    try {
      const result = await onConfirm(comment.trim())
      if (result) {
        setSuccessContent(result)
      } else {
        handleClose()
      }
    } catch (err) {
      setError(getErrorMessage ? getErrorMessage(err) : effectiveErrorMessage)
    }
  }

  const showSuccess = successContent !== null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="space-y-4">
        {showSuccess ? (
          successContent
        ) : (
          <>
            {banner}
            {description && <p className="text-sm text-gray-600">{description}</p>}
            <Textarea
              label={effectiveCommentLabel}
              required={commentRequired}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                if (commentError) setCommentError(null)
              }}
              placeholder={commentPlaceholder}
              rows={commentRequired ? 4 : 3}
              disabled={isSubmitting}
              error={commentError || undefined}
            />
            {extraContent}
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            )}
          </>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
          {showSuccess ? t('common.close') : t('common.cancel')}
        </Button>
        {!showSuccess && (
          <Button
            variant={confirmVariant}
            onClick={() => void handleConfirm()}
            isLoading={isSubmitting}
          >
            {confirmIcon}
            {confirmLabel}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}
