import { FileDown, FileCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { usePermission } from '@/features/auth/usePermission'
import { usePermitTravailPdf } from '@/features/permitTravail/hooks/usePermitTravail'
import Button from '@/components/ui/Button'

interface PermitTravailPdfButtonProps {
  permitId: string
  permitStatut: string
}

export default function PermitTravailPdfButton({ permitId, permitStatut }: PermitTravailPdfButtonProps) {
  const { t } = useTranslation()
  const canGenerate = usePermission('permit_travail.generate_pdf')
  const canView = usePermission('permit_travail.view')
  const { pdfStatut, isPolling, pdfMeta, pollError, generatePdf, downloadPdf } =
    usePermitTravailPdf(permitId, { enabled: permitStatut === 'VALIDE_HSE' })

  if (permitStatut !== 'VALIDE_HSE' || (!canGenerate && !canView)) return null

  if (pdfStatut === 'EN_COURS' || isPolling) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t('permitTravail.components.pdfButton.generating')}
      </Button>
    )
  }

  if (pdfStatut === 'GENERE') {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button
          className="bg-green-600 text-white hover:bg-green-700"
          onClick={() => void downloadPdf()}
        >
          <FileCheck className="mr-2 h-4 w-4" />
          {t('permitTravail.components.pdfButton.downloadOfficial')}
        </Button>
        {pdfMeta?.genereAt && (
          <span className="text-xs text-gray-500">
            {pdfMeta.tailleFichier
              ? t('permitTravail.components.pdfButton.generatedOnWithSize', {
                  date: new Date(pdfMeta.genereAt).toLocaleString('fr-FR'),
                  size: Math.round(pdfMeta.tailleFichier / 1024),
                })
              : t('permitTravail.components.pdfButton.generatedOn', {
                  date: new Date(pdfMeta.genereAt).toLocaleString('fr-FR'),
                })}
          </span>
        )}
        {canGenerate && (
          <button
            className="text-xs text-gray-400 underline hover:text-gray-600"
            onClick={() => void generatePdf()}
          >
            {t('permitTravail.components.pdfButton.regenerate')}
          </button>
        )}
      </div>
    )
  }

  if (pdfStatut === 'ERREUR') {
    if (!canGenerate) return null
    return (
      <div className="flex flex-col items-start gap-1">
        <Button variant="danger" onClick={() => void generatePdf()}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          {t('permitTravail.components.pdfButton.retryGeneration')}
        </Button>
        {pollError && <span className="text-xs text-red-500">{pollError}</span>}
      </div>
    )
  }

  if (!canGenerate) return null

  return (
    <Button onClick={() => void generatePdf()}>
      <FileDown className="mr-2 h-4 w-4" />
      {t('permitTravail.components.pdfButton.generateOfficial')}
    </Button>
  )
}
