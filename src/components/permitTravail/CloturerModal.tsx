import { useState } from 'react'
import { AlertTriangle, Lock } from 'lucide-react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
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
  const [commentaire, setCommentaire] = useState('')
  const [accordClient, setAccordClient] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    try {
      await onCloturer(permitId, commentaire || undefined, accordClient)
      onClose()
    } catch {
      setError('Erreur lors de la clôture — vérifiez les droits ou le statut du permis.')
    }
  }

  const handleClose = () => {
    if (isCloturer) return
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Clôturer le permis"
      description={permitReference}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
          <p className="text-xs text-orange-800 leading-relaxed">
            <strong>Action irréversible.</strong> Le permis passera en statut CLÔTURÉ et un PV de
            réception sera généré automatiquement.
          </p>
        </div>

        <Textarea
          label="Commentaire"
          rows={3}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          placeholder="Motif de clôture, remarques de réception…"
          disabled={isCloturer}
        />

        <Checkbox
          label="Accord client obtenu"
          checked={accordClient}
          onChange={(e) => setAccordClient(e.target.checked)}
          disabled={isCloturer}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={isCloturer}>
          Annuler
        </Button>
        <Button variant="danger" onClick={() => void handleConfirm()} isLoading={isCloturer}>
          <Lock className="mr-2 h-4 w-4" />
          Confirmer la clôture
        </Button>
      </ModalFooter>
    </Modal>
  )
}
