import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, AlertCircle, Eye, Users, ShieldCheck, ShieldX, Pencil, FileDown } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import StatutPermitBadge from '@/components/permitTravail/StatutPermitBadge'
import ExpirationBadge from '@/components/permitTravail/ExpirationBadge'
import ValiderPermitModal from '@/components/permitTravail/ValiderPermitModal'
import RefuserPermitModal from '@/components/permitTravail/RefuserPermitModal'
import { usePermitsTravail, usePermitTravail, usePvReceptionPdf } from '@/features/permitTravail/hooks/usePermitTravail'
import { usePermission } from '@/features/auth/usePermission'
import type { PermitTravail } from '@/types/permitTravail'
import { TYPE_PERMIT_LABELS, PROCESSUS_LABELS } from '@/types/permitTravail'

function PvDownloadCell({ permitId }: { permitId: string }) {
  const { pvStatut, downloadPv } = usePvReceptionPdf(permitId, { enabled: true })
  if (pvStatut !== 'GENERE') return null
  return (
    <button
      title="Télécharger le PV de réception"
      className="ml-1 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
      onClick={(e) => { e.stopPropagation(); void downloadPv() }}
    >
      <FileDown className="h-3.5 w-3.5" />
      PV
    </button>
  )
}

interface PermitRowProps {
  permit: PermitTravail
  showHseColumns: boolean
  canValider: boolean
  canRefuser: boolean
  canResoumettre: boolean
  onValider: (permit: PermitTravail) => void
  onRefuser: (permit: PermitTravail) => void
}

function PermitRow({ permit, showHseColumns, canValider, canRefuser, canResoumettre, onValider, onRefuser }: PermitRowProps) {
  const navigate = useNavigate()
  const latestDecision = permit.decisionsHse?.at(-1)

  return (
    <tr
      className="hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => navigate(`/permits-travail/${permit.id}`)}
    >
      <td className="px-4 py-3">
        <span className="font-mono text-sm font-medium text-blue-700">{permit.reference}</span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-800">
        {TYPE_PERMIT_LABELS[permit.typePermis]}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {PROCESSUS_LABELS[permit.processus]}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{permit.codeSite}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatutPermitBadge statut={permit.statut} />
          {['CLOTURE', 'PV_VALIDE', 'PV_REFUSE'].includes(permit.statut) && (
            <PvDownloadCell permitId={permit.id} />
          )}
          {permit.groupeId && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 cursor-pointer hover:bg-purple-200"
              title="Fait partie d'un groupe de permis"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/permits-travail?groupeId=${permit.groupeId}`)
              }}
            >
              <Users className="h-3 w-3" />
              Groupe
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {permit.soumisAt
          ? new Date(permit.soumisAt).toLocaleDateString('fr-FR')
          : <span className="text-gray-400">—</span>}
      </td>
      {showHseColumns && (
        <td className="px-4 py-3">
          {permit.statut === 'VALIDE_HSE' && latestDecision ? (
            <ExpirationBadge decidedAt={latestDecision.decidedAt} typePermis={permit.typePermis} />
          ) : (
            <span className="text-gray-400 text-sm">—</span>
          )}
        </td>
      )}
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => navigate(`/permits-travail/${permit.id}`)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Voir
          </Button>
          {permit.statut === 'SOUMIS' && canValider && (
            <Button size="sm" onClick={() => onValider(permit)}>
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              Valider
            </Button>
          )}
          {permit.statut === 'SOUMIS' && canRefuser && (
            <Button size="sm" variant="danger" onClick={() => onRefuser(permit)}>
              <ShieldX className="mr-1.5 h-3.5 w-3.5" />
              Refuser
            </Button>
          )}
          {permit.statut === 'BROUILLON' &&
            canResoumettre &&
            permit.decisionsHse?.some((d) => d.decision === 'REFUSE') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/permits-travail/${permit.id}/edit`)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Corriger
              </Button>
            )}
        </div>
      </td>
    </tr>
  )
}

const HSE_STATUTS: string[] = ['SOUMIS', 'EN_COURS', 'VALIDE', 'VALIDE_HSE', 'REFUSE_HSE']
const ITEMS_PER_PAGE = 10

export default function PermitTravailListPage() {
  const navigate = useNavigate()
  const canCreate = usePermission('permit_travail.create')
  const canValider = usePermission('permit_travail.valider_hse')
  const canRefuser = usePermission('permit_travail.refuser_hse')
  const canResoumettre = usePermission('permit_travail.resoumettre')
  const showHseColumns = canValider || canRefuser

  const [hseView, setHseView] = useState(false)
  const [page, setPage] = useState(1)
  const [selectedForValider, setSelectedForValider] = useState<PermitTravail | null>(null)
  const [selectedForRefuser, setSelectedForRefuser] = useState<PermitTravail | null>(null)

  const queryParams: Record<string, string | string[]> = {
    page: String(page),
    itemsPerPage: String(ITEMS_PER_PAGE),
    ...(hseView ? { statut: HSE_STATUTS } : {}),
  }

  const { data, isLoading, isError } = usePermitsTravail(queryParams)
  const { validerPermit, refuserPermit, isValidating, isRefusing } = usePermitTravail()

  const displayedPermits = data?.member ?? []
  const totalItems = data?.totalItems ?? 0
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  const handleHseViewToggle = () => {
    setHseView((v) => !v)
    setPage(1)
  }

  const headers = [
    'Référence', 'Type', 'Processus', 'Site', 'Statut', 'Date soumission',
    ...(showHseColumns ? ['Expiration'] : []),
    'Actions',
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permis de travail"
        description="Gérez vos demandes de permis de travail"
        actions={
          <div className="flex items-center gap-2">
            {showHseColumns && (
              <Button
                variant={hseView ? 'primary' : 'outline'}
                onClick={handleHseViewToggle}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Vue HSE
              </Button>
            )}
            {canCreate && (
              <Button onClick={() => navigate('/permits-travail/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau permis
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Chargement des permis...
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center gap-2 py-12 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">Erreur lors du chargement des permis.</span>
            </div>
          )}

          {!isLoading && !isError && displayedPermits.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-4 h-12 w-12 text-gray-300" />
              <p className="font-medium text-gray-500">Aucun permis de travail</p>
              <p className="mt-1 text-sm text-gray-400">
                {canCreate
                  ? 'Créez votre premier permis de travail.'
                  : 'Aucun permis disponible pour votre compte.'}
              </p>
            </div>
          )}

          {!isLoading && !isError && displayedPermits.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {headers.map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {displayedPermits.map((permit) => (
                      <PermitRow
                        key={permit.id}
                        permit={permit}
                        showHseColumns={showHseColumns}
                        canValider={canValider}
                        canRefuser={canRefuser}
                        canResoumettre={canResoumettre}
                        onValider={setSelectedForValider}
                        onRefuser={setSelectedForRefuser}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                  <p className="text-sm text-gray-600">
                    Page {page} / {totalPages} ({totalItems} permis)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedForValider && (
        <ValiderPermitModal
          isOpen={true}
          permitId={selectedForValider.id}
          permitReference={selectedForValider.reference}
          isValidating={isValidating}
          onClose={() => setSelectedForValider(null)}
          onValider={validerPermit}
        />
      )}
      {selectedForRefuser && (
        <RefuserPermitModal
          isOpen={true}
          permitId={selectedForRefuser.id}
          permitReference={selectedForRefuser.reference}
          isRefusing={isRefusing}
          onClose={() => setSelectedForRefuser(null)}
          onRefuser={refuserPermit}
        />
      )}
    </div>
  )
}
