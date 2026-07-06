import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { PlanPrevention } from '@/types/planPrevention'

interface ValiderModalProps {
  isOpen: boolean
  planId: string
  planReference: string
  isValidating: boolean
  onClose: () => void
  onValider: (id: string, commentaire?: string) => Promise<PlanPrevention>
}

export default function ValiderModal({
  isOpen,
  planId,
  planReference,
  isValidating,
  onClose,
  onValider,
}: ValiderModalProps) {
  const { t } = useTranslation()
  const [commentaire, setCommentaire] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [missingDocuments, setMissingDocuments] = useState<string[]>([])
  const [signature, setSignature] = useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    setMissingDocuments([])
    try {
      const updatedPlan = await onValider(planId, commentaire.trim() || undefined)
      const latestDecision = updatedPlan.decisionsHse?.at(-1)
      if (latestDecision?.signatureElectronique) {
        setSignature(latestDecision.signatureElectronique)
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'Plan non examiné par Chef de Projet') {
          setError(t('planPrevention.validerModal.errorNotExamined'))
          return
        }
        if (err.message === 'documents_manquants') {
          const missing = (err as Error & { missingDocuments?: string[] }).missingDocuments ?? []
          setMissingDocuments(missing)
          return
        }
      }
      setError(t('planPrevention.validerModal.errorGeneric'))
    }
  }

  const handleClose = () => {
    if (isValidating) return
    setCommentaire('')
    setError(null)
    setMissingDocuments([])
    setSignature(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('planPrevention.validerModal.title', { reference: planReference })}>
      <div className="space-y-4">
        {signature ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{t('planPrevention.validerModal.success')}</span>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                {t('planPrevention.validerModal.signatureLabel')}
              </p>
              <p className="break-all rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-700">
                {signature}
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              {t('planPrevention.validerModal.description')}
            </p>

            <div>
              <label
                htmlFor="valider-commentaire"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t('planPrevention.validerModal.commentaireLabel')}{' '}
                <span className="text-gray-400 font-normal">
                  {t('planPrevention.validerModal.commentaireOptional')}
                </span>
              </label>
              <textarea
                id="valider-commentaire"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={3}
                placeholder={t('planPrevention.validerModal.commentairePlaceholder')}
                disabled={isValidating}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            {missingDocuments.length > 0 && (
              <div className="rounded-lg bg-red-50 px-3 py-2">
                <p className="text-sm font-medium text-red-700 mb-1">
                  {t('planPrevention.validerModal.missingDocuments')}
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {missingDocuments.map((doc) => (
                    <li key={doc} className="text-sm text-red-600">
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
          </>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={handleClose} disabled={isValidating}>
          {signature ? t('planPrevention.validerModal.close') : t('planPrevention.validerModal.cancel')}
        </Button>
        {!signature && (
          <Button onClick={handleConfirm} isLoading={isValidating}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            {t('planPrevention.validerModal.confirm')}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}
