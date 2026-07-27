import { useState } from 'react'
import { AlertTriangle, XCircle } from 'lucide-react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

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
      setError('Erreur lors du refus du PV de réception.')
    }
  }

  const handleClose = () => {
    if (isRefuserPv) return
    setCommentaire('')
    setCommentaireError(null)
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Refuser le PV — ${permitReference}`}>
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">
            Le prestataire sera notifié par email et devra re-clôturer le permis.
          </p>
        </div>

        <div>
          <label htmlFor="pv-refuser-commentaire" className="block text-sm font-medium text-gray-700 mb-1.5">
            Motif du refus{' '}
            <span className="text-red-500">*</span>
          </label>
          <textarea
            id="pv-refuser-commentaire"
            value={commentaire}
            onChange={(e) => {
              setCommentaire(e.target.value)
              if (commentaireError) setCommentaireError(null)
            }}
            rows={4}
            placeholder="Expliquez les raisons du refus du PV..."
            disabled={isRefuserPv}
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
        <Button variant="secondary" onClick={handleClose} disabled={isRefuserPv}>
          Annuler
        </Button>
        <Button variant="danger" onClick={() => void handleConfirm()} isLoading={isRefuserPv}>
          <XCircle className="mr-2 h-4 w-4" />
          Refuser le PV
        </Button>
      </ModalFooter>
    </Modal>
  )
}
