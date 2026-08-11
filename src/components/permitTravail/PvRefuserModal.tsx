import { AlertTriangle, XCircle } from 'lucide-react'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal'

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
  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Refuser le PV — ${permitReference}`}
      banner={
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm">
            Le prestataire sera notifié par email et devra re-clôturer le permis.
          </p>
        </div>
      }
      commentLabel="Motif du refus"
      commentRequired
      commentRequiredMessage="Le motif de refus est obligatoire."
      commentPlaceholder="Expliquez les raisons du refus du PV..."
      confirmLabel="Refuser le PV"
      confirmVariant="danger"
      confirmIcon={<XCircle className="mr-2 h-4 w-4" />}
      isSubmitting={isRefuserPv}
      onConfirm={(commentaire) => onRefuser(permitId, commentaire)}
      errorMessage="Erreur lors du refus du PV de réception."
    />
  )
}
