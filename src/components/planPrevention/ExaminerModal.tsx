import { useState } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'

interface ExaminerModalProps {
  isOpen: boolean
  planId: string
  planReference: string
  isExamining: boolean
  onClose: () => void
  onExaminer: (id: string, commentaire?: string) => Promise<void>
}

export default function ExaminerModal({
  isOpen,
  planId,
  planReference,
  isExamining,
  onClose,
  onExaminer,
}: ExaminerModalProps) {
  const [commentaire, setCommentaire] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    try {
      await onExaminer(planId, commentaire.trim() || undefined)
      setCommentaire('')
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('Statut invalide')) {
        setError('Statut invalide pour examen')
      } else {
        setError("Une erreur est survenue lors de l'examen du plan.")
      }
    }
  }

  const handleClose = () => {
    if (isExamining) return
    setCommentaire('')
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Examiner le plan ${planReference}`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Vous êtes sur le point de marquer ce plan comme{' '}
          <strong>examiné</strong>. Les utilisateurs HSE concernés seront notifiés pour validation.
        </p>

        <Textarea
          label="Commentaire"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          rows={4}
          placeholder="Ajoutez un commentaire sur votre examen..."
          disabled={isExamining}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={isExamining}>
          Annuler
        </Button>
        <Button onClick={handleConfirm} isLoading={isExamining}>
          Confirmer l'examen
        </Button>
      </ModalFooter>
    </Modal>
  )
}
