import ConfirmActionModal from '@/components/ui/ConfirmActionModal'

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
  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Examiner le plan ${planReference}`}
      description={
        <>
          Vous êtes sur le point de marquer ce plan comme <strong>examiné</strong>. Les
          utilisateurs HSE concernés seront notifiés pour validation.
        </>
      }
      commentPlaceholder="Ajoutez un commentaire sur votre examen..."
      confirmLabel="Confirmer l'examen"
      isSubmitting={isExamining}
      onConfirm={(commentaire) => onExaminer(planId, commentaire || undefined)}
      getErrorMessage={(err) => {
        const message = err instanceof Error ? err.message : ''
        return message.includes('Statut invalide')
          ? 'Statut invalide pour examen'
          : "Une erreur est survenue lors de l'examen du plan."
      }}
    />
  )
}
