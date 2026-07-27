import { useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface PvValiderModalProps {
  isOpen: boolean
  permitId: string
  permitReference: string
  isValiderPv: boolean
  onClose: () => void
  onValider: (id: string, commentaire?: string) => Promise<{ signatureElectronique?: string }>
}

export default function PvValiderModal({
  isOpen,
  permitId,
  permitReference,
  isValiderPv,
  onClose,
  onValider,
}: PvValiderModalProps) {
  const [commentaire, setCommentaire] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    try {
      const result = await onValider(permitId, commentaire.trim() || undefined)
      setSignature(result.signatureElectronique ?? null)
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      if (detail.includes('not_cloture') || detail.includes('Permis non clôturé')) {
        setError('Le permis n\'est pas clôturé.')
      } else if (detail.includes('pv_not_genere') || detail.includes('PV non généré')) {
        setError('Le PV de réception n\'est pas encore généré. Attendez la fin de la génération.')
      } else if (detail.includes('suivi_journalier_manquant')) {
        setError('Aucun suivi journalier trouvé pour ce permis.')
      } else if (detail.includes('evaluation_risque_manquante')) {
        setError('Aucune évaluation des risques trouvée pour ce permis.')
      } else {
        setError('Erreur lors de la validation du PV de réception.')
      }
    }
  }

  const handleClose = () => {
    if (isValiderPv) return
    setCommentaire('')
    setError(null)
    setSignature(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Valider le PV — ${permitReference}`}>
      <div className="space-y-4">
        {signature !== null ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700">
              <ClipboardCheck className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">PV de réception validé avec succès.</span>
            </div>
            {signature && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                  Signature électronique
                </p>
                <p className="break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
                  {signature}
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Confirmer la validation du PV de réception pour le permis{' '}
              <span className="font-semibold text-blue-700">{permitReference}</span>.
            </p>
            <div>
              <label htmlFor="pv-valider-commentaire" className="block text-sm font-medium text-gray-700 mb-1.5">
                Commentaire{' '}
                <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                id="pv-valider-commentaire"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={3}
                placeholder="Observations de réception..."
                disabled={isValiderPv}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
          </>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={isValiderPv}>
          {signature !== null ? 'Fermer' : 'Annuler'}
        </Button>
        {signature === null && (
          <Button
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={() => void handleConfirm()}
            isLoading={isValiderPv}
          >
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Valider le PV
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}
