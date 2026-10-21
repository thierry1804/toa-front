import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, ClipboardCheck, ClipboardList, Eye, FileText, ShieldCheck, ShieldX, Lock, AlertTriangle, CheckCircle, XCircle, Pencil, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { InfoItem, InfoList } from '@/components/ui/InfoList'
import { permitTravailApi } from '@/api/permitTravailApi'
import { useUiStore } from '@/store/ui.store'
import Button from '@/components/ui/Button'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import StatutPermitBadge from '@/components/permitTravail/StatutPermitBadge'
import ExpirationBadge from '@/components/permitTravail/ExpirationBadge'
import PermitDocumentUploadZone from '@/components/permitTravail/PermitDocumentUploadZone'
import ValiderPermitModal from '@/components/permitTravail/ValiderPermitModal'
import RefuserPermitModal from '@/components/permitTravail/RefuserPermitModal'
import PermitTravailPdfButton from '@/components/permitTravail/PermitTravailPdfButton'
import CloturerModal from '@/components/permitTravail/CloturerModal'
import PvReceptionButton from '@/components/permitTravail/PvReceptionButton'
import PvValiderModal from '@/components/permitTravail/PvValiderModal'
import PvRefuserModal from '@/components/permitTravail/PvRefuserModal'
import { usePermitTravailDetail, usePermitTravail, usePermitTravailCloture, usePvDecision, usePermitDocumentsRequis } from '@/features/permitTravail/hooks/usePermitTravail'
import { useIntervention } from '@/features/intervention/hooks/useIntervention'
import { usePermission } from '@/features/auth/usePermission'
import { canEditDraft, wasRefused } from '@/features/permitTravail/utils/permitDraft'
import {
  TYPE_PERMIT_LABELS,
  PROCESSUS_LABELS,
  resolveDocumentRequirements,
  type TypeDocumentPermitTravail,
} from '@/types/permitTravail'

function InfoRow({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return <InfoItem label={label} value={value} wide={wide} />
}

export default function PermitTravailDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: permit, isLoading, isError } = usePermitTravailDetail(id ?? '')
  const { validerPermit, refuserPermit, cloturerPermit, validerPv, refuserPv, uploadDocument, deleteDocument, setDocumentNonApplicable, isValidating, isRefusing, isCloturer, isValiderPv, isRefuserPv } = usePermitTravail()
  const { data: requis, isLoading: requisLoading } = usePermitDocumentsRequis(id ?? '')
  const { createIntervention, isCreating: isCreatingIntervention } = useIntervention()
  const { data: clotureData } = usePermitTravailCloture(
    ['CLOTURE', 'PV_VALIDE', 'PV_REFUSE'].includes(permit?.statut ?? '') ? (id ?? '') : '',
  )
  const { data: pvDecisionsData } = usePvDecision(id ?? '', {
    enabled: !!id && ['CLOTURE', 'PV_VALIDE', 'PV_REFUSE'].includes(permit?.statut ?? ''),
  })
  const latestPvDecision = pvDecisionsData?.at(-1)
  const canValider = usePermission('permit_travail.valider_hse')
  const canRefuser = usePermission('permit_travail.refuser_hse')
  const canResoumettre = usePermission('permit_travail.resoumettre')
  const canEdit = usePermission('permit_travail.edit')
  const canCloturer = usePermission('permit_travail.cloturer')
  const canCreatePermit = usePermission('permit_travail.create')
  const addToast = useUiStore((s) => s.addToast)
  const [isRenewing, setIsRenewing] = useState(false)
  const canValiderPv = usePermission('permit_travail.pv_valider')
  const canRefuserPv = usePermission('permit_travail.pv_refuser')
  const canStartIntervention = usePermission('intervention.create')
  const canViewIntervention = usePermission('intervention.view')
  const [validerOpen, setValiderOpen] = useState(false)
  const [refuserOpen, setRefuserOpen] = useState(false)
  const [cloturerOpen, setCloturerOpen] = useState(false)
  const [pvValiderOpen, setPvValiderOpen] = useState(false)
  const [pvRefuserOpen, setPvRefuserOpen] = useState(false)

  const handleStartIntervention = async () => {
    if (!permit) return
    const intervention = await createIntervention(permit.id)
    navigate(`/interventions/${intervention.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Chargement…
      </div>
    )
  }

  if (isError || !permit) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
        <FileText className="h-12 w-12 text-gray-300" />
        <p>Permis introuvable.</p>
        <Button variant="outline" onClick={() => navigate('/permits-travail')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  const { soumission: docTypes, cloture: clotureDocTypes } = resolveDocumentRequirements(permit, requis)
  const companionPermit = permit.permitsGroupe?.[0]
  const latestDecision = permit.decisionsHse?.at(-1)
  const canCorrigerEtResoumettre =
    permit.statut === 'BROUILLON' &&
    canResoumettre &&
    permit.decisionsHse?.some((d) => d.decision === 'REFUSE')
  // R-24 : un brouillon jamais refusé (renouvellement, création interrompue) se complète puis se soumet.
  const canCompleterBrouillon = !wasRefused(permit) && canEditDraft(permit, { canEdit, canResoumettre })

  const handleClotureDocUpload = async (type: TypeDocumentPermitTravail, file: File, capturedAt?: string) => {
    await uploadDocument(permit.id, type, file, capturedAt)
  }

  const handleClotureDocDelete = async (documentId: string) => {
    await deleteDocument(permit.id, documentId)
  }

  const handleClotureDocNotApplicable = async (type: TypeDocumentPermitTravail, next: boolean) => {
    await setDocumentNonApplicable(permit.id, type, next)
  }

  // R-24 : renouvellement d'un permis Hauteur/Électrique encore valide (nouveau permis lié à l'origine).
  const canRenouveler =
    canCreatePermit &&
    ['HAUTEUR', 'ELECTRIQUE'].includes(permit.typePermis) &&
    ['VALIDE_HSE', 'EN_COURS', 'VALIDE'].includes(permit.statut)

  const handleRenouveler = async () => {
    setIsRenewing(true)
    try {
      const created = await permitTravailApi.renouveler(permit.id)
      addToast({ message: `Renouvellement ${created.reference} créé : complétez les documents puis soumettez-le.`, type: 'success' })
      navigate(`/permits-travail/${created.id}/edit`)
    } catch (error) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      addToast({
        message: detail.includes('renouvellement_en_cours')
          ? 'Un renouvellement est déjà en cours pour ce permis.'
          : 'Impossible de créer le renouvellement.',
        type: 'error',
      })
    } finally {
      setIsRenewing(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[
          { label: 'Permis de travail', href: '/permits-travail' },
          { label: permit.reference },
        ]}
        title={
          <span className="flex items-center gap-3">
            <span className="font-mono text-blue-700">{permit.reference}</span>
            <StatutPermitBadge statut={permit.statut} />
          </span>
        }
        description={`${TYPE_PERMIT_LABELS[permit.typePermis]} — ${PROCESSUS_LABELS[permit.processus]}`}
        actions={
          <div className="flex items-center gap-2">
            {canRenouveler && (
              <Button variant="primary" onClick={handleRenouveler} loading={isRenewing}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Renouveler le permis
              </Button>
            )}
            {canCompleterBrouillon && (
              <Button
                variant="primary"
                onClick={() => navigate(`/permits-travail/${permit.id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Compléter et soumettre
              </Button>
            )}
            {canCorrigerEtResoumettre && (
              <Button
                variant="primary"
                onClick={() => navigate(`/permits-travail/${permit.id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Corriger et resoumettre
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/permits-travail')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </div>
        }
      />

      {/* Informations générales */}
      <CollapsibleSection title="Informations travaux" defaultOpen>
<div>
          <InfoList>
            <InfoRow label="Référence" value={<span className="font-mono font-semibold text-blue-700">{permit.reference}</span>} />
            {permit.permisOrigineId && (
              <InfoRow
                label="Renouvellement de"
                value={
                  <Link to={`/permits-travail/${permit.permisOrigineId}`} className="text-blue-700 hover:underline">
                    Permis d'origine (renouvellement R{permit.numeroRenouvellement ?? ''})
                  </Link>
                }
              />
            )}
            <InfoRow label="Type de permis" value={TYPE_PERMIT_LABELS[permit.typePermis]} />
            <InfoRow label="Processus" value={PROCESSUS_LABELS[permit.processus]} />
            <InfoRow label="Code site" value={permit.codeSite} />
            <InfoRow label="Description travaux" value={permit.descriptionTravaux} wide />
            {/* R-19 : dates réelles, non saisissables — début = validation, fin = clôture effective */}
            <InfoRow
              label="Date de début réelle"
              value={
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {permit.validatedAt ? new Date(permit.validatedAt).toLocaleDateString('fr-FR') : '—'}
                </span>
              }
            />
            <InfoRow
              label="Date de fin réelle"
              value={
                clotureData?.dateClotureEffective
                  ? new Date(clotureData.dateClotureEffective).toLocaleDateString('fr-FR')
                  : '—'
              }
            />
            {permit.dateFinPrevue && ['VALIDE_HSE', 'EN_COURS', 'VALIDE'].includes(permit.statut) && (
              <InfoRow
                label="Validité restante"
                value={<ExpirationBadge expiresAt={permit.dateFinPrevue} />}
              />
            )}
            <InfoRow label="Statut" value={<StatutPermitBadge statut={permit.statut} />} />
            {permit.soumisAt && (
              <InfoRow
                label="Soumis le"
                value={new Date(permit.soumisAt).toLocaleString('fr-FR')}
              />
            )}
            {permit.validatedAt && (
              <InfoRow
                label="Validé le"
                value={new Date(permit.validatedAt).toLocaleString('fr-FR')}
              />
            )}
            {permit.nomPrestataire && (
              <InfoRow label="Prestataire" value={permit.nomPrestataire} />
            )}
            {permit.planPreventionId && (
              <InfoRow
                label="Plan de prévention"
                value={
                  <Link
                    to={`/prevention/${permit.planPreventionId}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Voir le plan
                  </Link>
                }
              />
            )}
          </InfoList>
        </div>
      </CollapsibleSection>

      {/* Évaluation des risques */}
      <CollapsibleSection title="Évaluation des risques">
<div>
          <div className="space-y-3">
            {(!permit.dangers || permit.dangers.length === 0) && (
              <p className="text-sm italic text-gray-400">Aucun danger évalué.</p>
            )}
            {permit.dangers?.map((danger, index) => (
              <div key={index} className="rounded-lg border border-red-300 bg-white p-4 space-y-3 text-sm">
                {permit.dangers && permit.dangers.length > 1 && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Danger {index + 1}
                  </p>
                )}
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Quels sont les dangers ?
                  </p>
                  <p className="text-gray-800 whitespace-pre-wrap">{danger.dangers || <span className="italic text-gray-400">—</span>}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 flex-1">
                    Évaluation préliminaire des risques
                  </span>
                  {danger.evaluationPreliminaire ? (
                    <>
                      <span className={`inline-block h-5 w-5 rounded-full border-2 ${
                        danger.evaluationPreliminaire === 'rouge' ? 'bg-red-400 border-red-400' :
                        danger.evaluationPreliminaire === 'jaune' ? 'bg-yellow-400 border-yellow-400' :
                        'bg-green-500 border-green-500'
                      }`} />
                      <span className="text-gray-700 capitalize">{danger.evaluationPreliminaire}</span>
                    </>
                  ) : (
                    <span className="italic text-gray-400">—</span>
                  )}
                </div>
                <div className="border-t border-gray-200 pt-3 border-b border-gray-200 pb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Quels sont les moyens de maîtriser les dangers en sécurité ?
                  </p>
                  <p className="text-gray-800 whitespace-pre-wrap">{danger.moyensMaitrise || <span className="italic text-gray-400">—</span>}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 flex-1">
                    Évaluation finale des risques
                  </span>
                  {danger.evaluationFinale ? (
                    <>
                      <span className={`inline-block h-5 w-5 rounded-full border-2 ${
                        danger.evaluationFinale === 'rouge' ? 'bg-red-400 border-red-400' :
                        danger.evaluationFinale === 'jaune' ? 'bg-yellow-400 border-yellow-400' :
                        'bg-green-500 border-green-500'
                      }`} />
                      <span className="text-gray-700 capitalize">{danger.evaluationFinale}</span>
                    </>
                  ) : (
                    <span className="italic text-gray-400">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Groupe (NOUVEAU_SITE) */}
      {companionPermit && (
        <CollapsibleSection title="Permis associé (Nouveau site)">
<div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm font-semibold text-blue-700">{companionPermit.reference}</span>
              <span className="text-sm text-gray-600">{TYPE_PERMIT_LABELS[companionPermit.typePermis]}</span>
              <StatutPermitBadge statut={companionPermit.statut} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/permits-travail/${companionPermit.id}`)}
              >
                Voir
              </Button>
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Documents */}
      <CollapsibleSection title="Documents" summary={`${permit.documents.filter((d) => !d.nonApplicable).length} document(s) joint(s)`}>
<div>
          <PermitDocumentUploadZone
            permitId={permit.id}
            documentTypes={[...docTypes, ...clotureDocTypes]}
            uploadedDocuments={permit.documents}
            onUpload={async () => {}}
            disabled={true}
            allowDownload={true}
          />
        </div>
      </CollapsibleSection>

      {/* Actions HSE */}
      {permit.statut === 'SOUMIS' && (canValider || canRefuser) && (
        <CollapsibleSection title="Actions HSE" defaultOpen>
<div>
            <div className="flex items-center gap-3">
              {canValider && (
                <Button onClick={() => setValiderOpen(true)}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Valider le permis
                </Button>
              )}
              {canRefuser && (
                <Button variant="danger" onClick={() => setRefuserOpen(true)}>
                  <ShieldX className="mr-2 h-4 w-4" />
                  Refuser le permis
                </Button>
              )}
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Décision HSE */}
      {latestDecision && (
        <CollapsibleSection title="Décision HSE" defaultOpen>
<div>
            <InfoList>
              <InfoRow
                label="Décision"
                value={
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    latestDecision.decision === 'VALIDE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {latestDecision.decision === 'VALIDE' ? (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldX className="h-3.5 w-3.5" />
                    )}
                    {latestDecision.decision === 'VALIDE' ? 'Validé' : 'Refusé'}
                  </span>
                }
              />
              <InfoRow
                label="Décidé par"
                value={`${latestDecision.decidePar.firstname ?? ''} ${latestDecision.decidePar.name}`.trim()}
              />
              <InfoRow
                label="Date de décision"
                value={new Date(latestDecision.decidedAt).toLocaleString('fr-FR')}
              />
              <InfoRow
                label="Signature électronique"
                value={
                  <span className="font-mono text-xs text-gray-600 break-all">
                    {latestDecision.signatureElectronique}
                  </span>
                }
              />
              {latestDecision.commentaire && (
                <InfoRow
                  label={latestDecision.decision === 'REFUSE' ? 'Motif du refus' : 'Commentaire'}
                  value={
                    <p className={`text-sm rounded px-3 py-2 ${
                      latestDecision.decision === 'REFUSE'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-gray-50 text-gray-700'
                    }`}>
                      {latestDecision.commentaire}
                    </p>
                  }
                />
              )}
            </InfoList>
          </div>
        </CollapsibleSection>
      )}

      {/* Évaluation des risques */}
      {permit.statut === 'VALIDE_HSE' && (canStartIntervention || canViewIntervention) && (
        <CollapsibleSection title="Évaluation des risques avant intervention">
<div>
            {permit.interventionId ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/interventions/${permit.interventionId}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Voir l'évaluation
                </Button>
                <span className="text-sm text-gray-500">
                  Une évaluation des risques a déjà été créée pour ce permis.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {canStartIntervention && (
                  <Button
                    onClick={() => void handleStartIntervention()}
                    disabled={isCreatingIntervention}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    {isCreatingIntervention ? 'Création…' : "Démarrer l'évaluation"}
                  </Button>
                )}
                <span className="text-sm text-gray-500">
                  Aucune évaluation des risques pour ce permis.
                </span>
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* PDF officiel */}
      {permit.statut === 'VALIDE_HSE' && (
        <CollapsibleSection title="Document officiel PDF">
<div>
            <PermitTravailPdfButton permitId={permit.id} permitStatut={permit.statut} />
          </div>
        </CollapsibleSection>
      )}

      {/* Clôturer */}
      {(permit.statut === 'VALIDE_HSE' || permit.statut === 'EN_COURS') && canCloturer && (
        <CollapsibleSection title="Clôture du permis" defaultOpen>
<div>
            <p className="mb-3 text-sm text-gray-500">
              La demande de clôture est soumise à la validation du chef de projet TOA.
            </p>
            <Button
              className="bg-gray-800 text-white hover:bg-gray-900"
              onClick={() => setCloturerOpen(true)}
            >
              <Lock className="mr-2 h-4 w-4" />
              Soumettre la clôture
            </Button>
          </div>
        </CollapsibleSection>
      )}

      {/* Section CLOTURE / PV */}
      {['CLOTURE', 'PV_VALIDE', 'PV_REFUSE'].includes(permit.statut) && (
        <CollapsibleSection title="Permis clôturé" defaultOpen>
<div className="space-y-4">
            {clotureData?.typeCloture === 'AUTOMATIQUE' && (
              <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                <p className="text-xs text-orange-800">
                  <strong>Clôture automatique</strong> — la date de fin prévue a été dépassée.
                </p>
              </div>
            )}
            {clotureData && (
              <InfoList>
                <InfoRow
                  label="Type de clôture"
                  value={
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      clotureData.typeCloture === 'AUTOMATIQUE'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {clotureData.typeCloture}
                    </span>
                  }
                />
                <InfoRow
                  label="Date effective"
                  value={new Date(clotureData.dateClotureEffective).toLocaleString('fr-FR')}
                />
                <InfoRow
                  label="Accord client"
                  value={
                    clotureData.accordClient ? (
                      <span className="inline-flex items-center gap-1 text-green-700 text-sm">
                        <CheckCircle className="h-3.5 w-3.5" /> Obtenu
                        {clotureData.accordClientAt && ` le ${new Date(clotureData.accordClientAt).toLocaleDateString('fr-FR')}`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-500 text-sm">
                        <XCircle className="h-3.5 w-3.5" /> Non requis
                      </span>
                    )
                  }
                />
                {clotureData.clotureBy && (
                  <InfoRow
                    label="Clôturé par"
                    value={`${clotureData.clotureBy.firstname ?? ''} ${clotureData.clotureBy.name}`.trim()}
                  />
                )}
                {clotureData.commentaire && (
                  <InfoRow
                    label="Commentaire"
                    value={
                      <p className="text-sm rounded bg-gray-50 px-3 py-2 text-gray-700">
                        {clotureData.commentaire}
                      </p>
                    }
                  />
                )}
              </InfoList>
            )}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-500">PV de réception</p>
              <PvReceptionButton permitId={permit.id} />
            </div>
          </div>
        </CollapsibleSection>
      )}

      {/* Validation PV — Chef de Projet */}
      {['CLOTURE', 'PV_VALIDE', 'PV_REFUSE'].includes(permit.statut) && (canValiderPv || canRefuserPv || !!latestPvDecision) && (
        <CollapsibleSection title="Validation PV — Chef de Projet" defaultOpen>
<div className="space-y-4">
            {permit.statut === 'CLOTURE' && (canValiderPv || canRefuserPv) && (
              <div className="flex items-center gap-3">
                {canValiderPv && (
                  <Button
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={() => setPvValiderOpen(true)}
                  >
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Valider le PV
                  </Button>
                )}
                {canRefuserPv && (
                  <Button variant="danger" onClick={() => setPvRefuserOpen(true)}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Refuser le PV
                  </Button>
                )}
              </div>
            )}
            {latestPvDecision ? (
              <InfoList>
                <InfoRow
                  label="Décision"
                  value={
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      latestPvDecision.decision === 'VALIDE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {latestPvDecision.decision === 'VALIDE' ? (
                        <ClipboardCheck className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {latestPvDecision.decision === 'VALIDE' ? 'PV Validé' : 'PV Refusé'}
                    </span>
                  }
                />
                <InfoRow
                  label="Décidé par"
                  value={
                    latestPvDecision.decidePar
                      ? `${latestPvDecision.decidePar.firstname ?? ''} ${latestPvDecision.decidePar.name}`.trim()
                      : '—'
                  }
                />
                <InfoRow
                  label="Date"
                  value={new Date(latestPvDecision.decidedAt).toLocaleString('fr-FR')}
                />
                <InfoRow
                  label="Signature électronique"
                  value={
                    <span className="font-mono text-xs text-gray-600 break-all">
                      {latestPvDecision.signatureElectronique}
                    </span>
                  }
                />
                {latestPvDecision.commentaire && (
                  <InfoRow
                    label={latestPvDecision.decision === 'REFUSE' ? 'Motif du refus' : 'Commentaire'}
                    value={
                      <p className={`text-sm rounded px-3 py-2 ${
                        latestPvDecision.decision === 'REFUSE'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-gray-50 text-gray-700'
                      }`}>
                        {latestPvDecision.commentaire}
                      </p>
                    }
                  />
                )}
              </InfoList>
            ) : (
              permit.statut === 'CLOTURE' && !canValiderPv && !canRefuserPv && (
                <p className="text-sm text-gray-500">En attente de validation par le Chef de Projet.</p>
              )
            )}
          </div>
        </CollapsibleSection>
      )}

      <ValiderPermitModal
        isOpen={validerOpen}
        permitId={permit.id}
        permitReference={permit.reference}
        isValidating={isValidating}
        onClose={() => setValiderOpen(false)}
        onValider={validerPermit}
      />
      <RefuserPermitModal
        isOpen={refuserOpen}
        permitId={permit.id}
        permitReference={permit.reference}
        isRefusing={isRefusing}
        onClose={() => setRefuserOpen(false)}
        onRefuser={refuserPermit}
      />
      <CloturerModal
        isOpen={cloturerOpen}
        permitId={permit.id}
        permitReference={permit.reference}
        isCloturer={isCloturer}
        onClose={() => setCloturerOpen(false)}
        onCloturer={cloturerPermit}
        requiredDocumentTypes={clotureDocTypes}
        requiredDocumentsLoading={requisLoading}
        uploadedDocuments={permit.documents}
        onUploadDocument={handleClotureDocUpload}
        onDeleteDocument={handleClotureDocDelete}
        onToggleNotApplicable={handleClotureDocNotApplicable}
      />
      <PvValiderModal
        isOpen={pvValiderOpen}
        permitId={permit.id}
        permitReference={permit.reference}
        isValiderPv={isValiderPv}
        onClose={() => setPvValiderOpen(false)}
        onValider={validerPv}
      />
      <PvRefuserModal
        isOpen={pvRefuserOpen}
        permitId={permit.id}
        permitReference={permit.reference}
        isRefuserPv={isRefuserPv}
        onClose={() => setPvRefuserOpen(false)}
        onRefuser={refuserPv}
      />
    </div>
  )
}
