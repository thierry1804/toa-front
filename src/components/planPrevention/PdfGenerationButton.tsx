import { FileDown, FileCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { usePermission } from '@/features/auth/usePermission'
import { usePlanPreventionPdf } from '@/features/planPrevention/hooks/usePlanPrevention'
import Button from '@/components/ui/Button'

interface PdfGenerationButtonProps {
  planId: string
  planStatut: string
}

export default function PdfGenerationButton({ planId, planStatut }: PdfGenerationButtonProps) {
  const canGenerate = usePermission('plan_prevention.generate_pdf')
  const canDownload = usePermission('plan_prevention.download_pdf')
  const { pdfStatut, isPolling, pdfMeta, pollError, generatePdf, downloadPdf } =
    usePlanPreventionPdf(planId, { enabled: planStatut === 'VALIDE_HSE' })

  if (planStatut !== 'VALIDE_HSE' || !canGenerate) return null

  if (pdfStatut === 'EN_COURS' || isPolling) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Génération en cours...
      </Button>
    )
  }

  if (pdfStatut === 'GENERE') {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button
          className="bg-green-600 text-white hover:bg-green-700"
          disabled={!canDownload}
          onClick={() => void downloadPdf()}
        >
          <FileCheck className="mr-2 h-4 w-4" />
          Télécharger le PDF
        </Button>
        {pdfMeta?.genereAt && (
          <span className="text-xs text-gray-500">
            Généré le {new Date(pdfMeta.genereAt).toLocaleString('fr-FR')}
            {pdfMeta.tailleFichier
              ? ` (${Math.round(pdfMeta.tailleFichier / 1024)} Ko)`
              : ''}
          </span>
        )}
      </div>
    )
  }

  if (pdfStatut === 'ERREUR') {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button variant="danger" onClick={() => void generatePdf()}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Réessayer
        </Button>
        {pollError && <span className="text-xs text-red-500">{pollError}</span>}
      </div>
    )
  }

  // Idle — no PDF yet
  return (
    <Button onClick={() => void generatePdf()}>
      <FileDown className="mr-2 h-4 w-4" />
      Générer le PDF
    </Button>
  )
}
