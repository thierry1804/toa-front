import { useState } from 'react'
import { AlertTriangle, ShieldX } from 'lucide-react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

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
  const [commentaire, setCommentaire] = useState('')
  const [commentaireError, setCommentaireError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setCommentaireError(null)
    setError(null)

    if (!commentaire.trim()) {
      setCommentaireError('Le motif de refus est obligatoire.')
      return
    }

    try {
      await onRefuser(permitId, commentaire.trim())
      handleClose()
    } catch {
      setError('Erreur lors du refus du permis.')
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
    <Modal isOpen={isOpen} onClose={handleClose} title={`Refuser le permis ${permitReference}`}>
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">
            Le prestataire sera notifié par email et devra corriger son dossier puis soumettre à nouveau.
          </p>
        </div>

        <div>
          <label htmlFor="refuser-permit-commentaire" className="block text-sm font-medium text-gray-700 mb-1.5">
            Motif du refus{' '}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            id="refuser-permit-commentaire"
            value={commentaire}
            onChange={(e) => {
              setCommentaire(e.target.value)
              if (commentaireError) setCommentaireError(null)
            }}
            rows={4}
            placeholder="Expliquez les raisons du refus..."
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
          Annuler
        </Button>
        <Button variant="danger" onClick={handleConfirm} isLoading={isRefusing}>
          <ShieldX className="mr-2 h-4 w-4" />
          Refuser
        </Button>
      </ModalFooter>
    </Modal>
  )
}
