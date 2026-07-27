import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, ClipboardCheck, ClipboardList, Eye, FileDown, FileText, MapPin, Users, ShieldCheck, ShieldX, Lock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
import { usePermitTravailDetail, usePermitTravail, usePermitTravailCloture, usePvDecision } from '@/features/permitTravail/hooks/usePermitTravail'
import { useIntervention } from '@/features/intervention/hooks/useIntervention'
import { usePermission } from '@/features/auth/usePermission'
import {
  TYPE_PERMIT_LABELS,
  PROCESSUS_LABELS,
  DOCUMENT_TYPES_BY_PERMIT,
} from '@/types/permitTravail'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )
}

export default function PermitTravailDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: permit, isLoading, isError } = usePermitTravailDetail(id ?? '')
  const { validerPermit, refuserPermit, cloturerPermit, validerPv, refuserPv, isValidating, isRefusing, isCloturer, isValiderPv, isRefuserPv } = usePermitTravail()
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
  const canCloturer = usePermission('permit_travail.cloturer')
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

  const docTypes = DOCUMENT_TYPES_BY_PERMIT[permit.typePermis]
  const companionPermit = permit.permitsGroupe?.[0]
  const latestDecision = permit.decisionsHse?.at(-1)

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="font-mono text-blue-700">{permit.reference}</span>
            <StatutPermitBadge statut={permit.statut} />
          </span>
        }
        description={`${TYPE_PERMIT_LABELS[permit.typePermis]} — ${PROCESSUS_LABELS[permit.processus]}`}
        actions={
          <Button variant="outline" onClick={() => navigate('/permits-travail')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        }
      />

      {/* Informations générales */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">
            <MapPin className="inline mr-2 h-4 w-4 text-gray-400" />
            Informations travaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <InfoRow label="Référence" value={<span className="font-mono font-semibold text-blue-700">{permit.reference}</span>} />
            <InfoRow label="Type de permis" value={TYPE_PERMIT_LABELS[permit.typePermis]} />
            <InfoRow label="Processus" value={PROCESSUS_LABELS[permit.processus]} />
            <InfoRow label="Code site" value={permit.codeSite} />
            <InfoRow label="Description travaux" value={permit.descriptionTravaux} />
            <InfoRow
              label="Période"
              value={
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {new Date(permit.dateDebutPrevue).toLocaleDateString('fr-FR')}
                  {' → '}
                  {new Date(permit.dateFinPrevue).toLocaleDateString('fr-FR')}
                </span>
              }
            />
            <InfoRow label="Statut" value={<StatutPermitBadge statut={permit.statut} />} />
            {permit.soumisAt && (
              <InfoRow
                label="Soumis le"
                value={new Date(permit.soumisAt).toLocaleDateString('fr-FR')}
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
          </dl>
        </CardContent>
      </Card>

      {/* Groupe (NOUVEAU_SITE) */}
      {companionPermit && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              <Users className="inline mr-2 h-4 w-4 text-gray-400" />
              Permis associé (Nouveau site)
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">
            <FileText className="inline mr-2 h-4 w-4 text-gray-400" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PermitDocumentUploadZone
            permitId={permit.id}
            documentTypes={docTypes}
            uploadedDocuments={permit.documents}
            onUpload={async () => {}}
            disabled={true}
            allowDownload={true}
          />
        </CardContent>
      </Card>

      {/* Actions HSE */}
      {permit.statut === 'SOUMIS' && (canValider || canRefuser) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              <ShieldCheck className="inline mr-2 h-4 w-4 text-gray-400" />
              Actions HSE
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Décision HSE */}
      {latestDecision && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              {latestDecision.decision === 'VALIDE' ? (
                <ShieldCheck className="inline mr-2 h-4 w-4 text-green-500" />
              ) : (
                <ShieldX className="inline mr-2 h-4 w-4 text-red-500" />
              )}
              Décision HSE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
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
                value={new Date(latestDecision.decidedAt).toLocaleDateString('fr-FR')}
              />
              <InfoRow
                label="Signature électronique"
                value={
                  <span className="font-mono text-xs text-gray-600 break-all">
                    {latestDecision.signatureElectronique}
                  </span>
                }
              />
              {latestDecision.decision === 'VALIDE' && (
                <InfoRow
                  label="Expiration"
                  value={<ExpirationBadge decidedAt={latestDecision.decidedAt} typePermis={permit.typePermis} />}
                />
              )}
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
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Évaluation des risques */}
      {permit.statut === 'VALIDE_HSE' && (canStartIntervention || canViewIntervention) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              <ClipboardList className="inline mr-2 h-4 w-4 text-gray-400" />
              Évaluation des risques avant intervention
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* PDF officiel */}
      {permit.statut === 'VALIDE_HSE' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              <FileDown className="inline mr-2 h-4 w-4 text-gray-400" />
              Document officiel PDF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PermitTravailPdfButton permitId={permit.id} permitStatut={permit.statut} />
          </CardContent>
        </Card>
      )}

      {/* Clôturer */}
      {(permit.statut === 'VALIDE_HSE' || permit.statut === 'EN_COURS') && canCloturer && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              <Lock className="inline mr-2 h-4 w-4 text-gray-400" />
              Clôture du permis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-gray-500">
              Clôturer ce permis génère automatiquement un PV de réception et archive le dossier.
            </p>
            <Button
              className="bg-gray-800 text-white hover:bg-gray-900"
              onClick={() => setCloturerOpen(true)}
            >
              <Lock className="mr-2 h-4 w-4" />
              Clôturer le permis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Section CLOTURE / PV */}
      {['CLOTURE', 'PV_VALIDE', 'PV_REFUSE'].includes(permit.statut) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              <Lock className="inline mr-2 h-4 w-4 text-gray-800" />
              Permis clôturé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {clotureData?.typeCloture === 'AUTOMATIQUE' && (
              <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                <p className="text-xs text-orange-800">
                  <strong>Clôture automatique</strong> — la date de fin prévue a été dépassée.
                </p>
              </div>
            )}
            {clotureData && (
              <dl className="space-y-3">
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
              </dl>
            )}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-500">PV de réception</p>
              <PvReceptionButton permitId={permit.id} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation PV — Chef de Projet */}
      {['CLOTURE', 'PV_VALIDE', 'PV_REFUSE'].includes(permit.statut) && (canValiderPv || canRefuserPv || !!latestPvDecision) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              <ClipboardCheck className="inline mr-2 h-4 w-4 text-gray-400" />
              Validation PV — Chef de Projet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <dl className="space-y-3">
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
                  value={new Date(latestPvDecision.decidedAt).toLocaleDateString('fr-FR')}
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
              </dl>
            ) : (
              permit.statut === 'CLOTURE' && !canValiderPv && !canRefuserPv && (
                <p className="text-sm text-gray-500">En attente de validation par le Chef de Projet.</p>
              )
            )}
          </CardContent>
        </Card>
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
