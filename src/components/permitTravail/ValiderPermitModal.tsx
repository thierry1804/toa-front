import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Textarea from '@/components/ui/Textarea'
import type { PermitTravail } from '@/types/permitTravail'

interface ValiderPermitModalProps {
  isOpen: boolean
  permitId: string
  permitReference: string
  isValidating: boolean
  onClose: () => void
  onValider: (id: string, commentaire?: string) => Promise<PermitTravail>
}

export default function ValiderPermitModal({
  isOpen,
  permitId,
  permitReference,
  isValidating,
  onClose,
  onValider,
}: ValiderPermitModalProps) {
  const [commentaire, setCommentaire] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [dateExpiration, setDateExpiration] = useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    try {
      const updatedPermit = await onValider(permitId, commentaire.trim() || undefined)
      const latestDecision = updatedPermit.decisionsHse?.at(-1)
      if (latestDecision?.signatureElectronique) {
        setSignature(latestDecision.signatureElectronique)
        const exp = new Date(new Date(latestDecision.decidedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
        setDateExpiration(exp.toLocaleDateString('fr-FR'))
      }
    } catch {
      setError('Erreur lors de la validation du permis.')
    }
  }

  const handleClose = () => {
    if (isValidating) return
    setCommentaire('')
    setError(null)
    setSignature(null)
    setDateExpiration(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Valider le permis ${permitReference}`}>
      <div className="space-y-4">
        {signature ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Permis validé avec succès.</span>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                Signature électronique
              </p>
              <p className="break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
                {signature}
              </p>
            </div>
            {dateExpiration && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Date d'expiration
                </p>
                <p className="text-sm font-medium text-gray-800">{dateExpiration}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Confirmez la validation du permis de travail{' '}
              <span className="font-semibold text-blue-700">{permitReference}</span>.
            </p>
            <Textarea
              label="Commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              placeholder="Observations ou remarques..."
              disabled={isValidating}
            />
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
          </>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={isValidating}>
          {signature ? 'Fermer' : 'Annuler'}
        </Button>
        {!signature && (
          <Button onClick={handleConfirm} isLoading={isValidating}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Valider
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}
