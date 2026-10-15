import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, FileText, AlertCircle, Eye, Users, ShieldCheck, ShieldX, Pencil, FileDown, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { TableIconButton } from '@/components/ui/TableIconButton'
import { Card, CardContent } from '@/components/ui/Card'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import { ListTableFilters, ListTable, ListTableActions, ListTableBody, ListTableCell, ListTableHead, ListTableHeadCell, ListTableRow } from '@/components/ui/ListTable'
import StatutPermitBadge from '@/components/permitTravail/StatutPermitBadge'
import ExpirationBadge from '@/components/permitTravail/ExpirationBadge'
import { ClickableCard } from '@/components/ui/ClickableCard'
import { sortNewestFirst } from '@/lib/listOrder'
import { useSearchParamState } from '@/hooks/useSearchParamState'
import {
  PERMIT_STATUT_GROUPS,
  statutApiParam,
  statutMatchesFilter,
} from '@/features/dashboard/buildProfileKpis'
import ValiderPermitModal from '@/components/permitTravail/ValiderPermitModal'
import RefuserPermitModal from '@/components/permitTravail/RefuserPermitModal'
import { usePermitsTravail, usePermitTravail, usePvReceptionPdf } from '@/features/permitTravail/hooks/usePermitTravail'
import { usePermitTravailLabels } from '@/features/permitTravail/usePermitTravailLabels'
import { usePermission } from '@/features/auth/usePermission'
import { useAuthStore } from '@/store/auth.store'
import { canDeletePermit } from '@/features/permitTravail/utils/permitDeletion'
import type { PermitTravail } from '@/types/permitTravail'

function PvDownloadCell({ permitId }: { permitId: string }) {
  const { t } = useTranslation()
  const { pvStatut, downloadPv } = usePvReceptionPdf(permitId, { enabled: true })
  if (pvStatut !== 'GENERE') return null
  return (
    <TableIconButton
      title={t('permitTravail.list.downloadPv')}
      variant="success"
      onClick={(e) => { e.stopPropagation(); void downloadPv() }}
    >
      <FileDown className="h-4 w-4" />
    </TableIconButton>
  )
}

interface PermitRowProps {
  permit: PermitTravail
  showHseColumns: boolean
  canValider: boolean
  canRefuser: boolean
  canResoumettre: boolean
  canDelete: boolean
  onValider: (permit: PermitTravail) => void
  onRefuser: (permit: PermitTravail) => void
  onDelete: (permit: PermitTravail) => void
}

function PermitRow({
  permit,
  showHseColumns,
  canValider,
  canRefuser,
  canResoumettre,
  canDelete,
  onValider,
  onRefuser,
  onDelete,
}: PermitRowProps) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { typeLabel, processusLabel } = usePermitTravailLabels()
  const locale = i18n.language === 'mg' ? 'mg-MG' : 'fr-FR'

  return (
    <ListTableRow
      className="cursor-pointer"
      onClick={() => navigate(`/permits-travail/${permit.id}`)}
    >
      <ListTableCell className="break-all">
        <span className="font-mono text-sm font-medium text-blue-700">{permit.reference}</span>
      </ListTableCell>
      <ListTableCell compact className="text-gray-800">
        {typeLabel(permit.typePermis)}
      </ListTableCell>
      <ListTableCell className="text-gray-600">
        {processusLabel(permit.processus)}
      </ListTableCell>
      <ListTableCell compact className="text-gray-600">{permit.codeSite}</ListTableCell>
      <ListTableCell compact>
        <div className="flex flex-wrap items-center gap-2">
          <StatutPermitBadge statut={permit.statut} />
          {['CLOTURE', 'PV_VALIDE', 'PV_REFUSE'].includes(permit.statut) && (
            <PvDownloadCell permitId={permit.id} />
          )}
          {permit.groupeId && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 cursor-pointer hover:bg-purple-200"
              title={t('permitTravail.list.groupTitle')}
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/permits-travail?groupeId=${permit.groupeId}`)
              }}
            >
              <Users className="h-3 w-3" />
              {t('permitTravail.list.groupBadge')}
            </span>
          )}
        </div>
      </ListTableCell>
      <ListTableCell compact className="text-gray-500">
        {permit.soumisAt
          ? new Date(permit.soumisAt).toLocaleString(locale)
          : <span className="text-gray-400">—</span>}
      </ListTableCell>
      {showHseColumns && (
        <ListTableCell compact>
          {['VALIDE_HSE', 'EN_COURS', 'VALIDE'].includes(permit.statut) && permit.dateFinPrevue ? (
            <ExpirationBadge expiresAt={permit.dateFinPrevue} />
          ) : (
            <span className="text-gray-400 text-sm">—</span>
          )}
        </ListTableCell>
      )}
      <ListTableCell actions onClick={(e) => e.stopPropagation()}>
        <ListTableActions>
          <TableIconButton
            title={t('permitTravail.list.actions.voir')}
            onClick={() => navigate(`/permits-travail/${permit.id}`)}
          >
            <Eye className="h-4 w-4" />
          </TableIconButton>
          {permit.statut === 'SOUMIS' && canValider && (
            <TableIconButton
              title={t('permitTravail.list.actions.valider')}
              variant="success"
              onClick={() => onValider(permit)}
            >
              <ShieldCheck className="h-4 w-4" />
            </TableIconButton>
          )}
          {permit.statut === 'SOUMIS' && canRefuser && (
            <TableIconButton
              title={t('permitTravail.list.actions.refuser')}
              variant="danger"
              onClick={() => onRefuser(permit)}
            >
              <ShieldX className="h-4 w-4" />
            </TableIconButton>
          )}
          {permit.statut === 'BROUILLON' &&
            canResoumettre &&
            permit.decisionsHse?.some((d) => d.decision === 'REFUSE') && (
              <TableIconButton
                title={t('permitTravail.list.actions.corriger')}
                variant="warning"
                onClick={() => navigate(`/permits-travail/${permit.id}/edit`)}
              >
                <Pencil className="h-4 w-4" />
              </TableIconButton>
            )}
          {canDelete && (
            <TableIconButton
              title={t('permitTravail.list.actions.supprimer')}
              variant="danger"
              onClick={() => onDelete(permit)}
            >
              <Trash2 className="h-4 w-4" />
            </TableIconButton>
          )}
        </ListTableActions>
      </ListTableCell>
    </ListTableRow>
  )
}

const HSE_STATUTS: string[] = ['SOUMIS', 'EN_COURS', 'VALIDE', 'VALIDE_HSE', 'REFUSE_HSE']
const ITEMS_PER_PAGE = 10

/** Carte mobile d'un permis : tout le bloc ouvre la fiche (les actions de validation sont sur la fiche). */
function PermitCard({ permit }: { permit: PermitTravail }) {
  const { t } = useTranslation()
  const { typeLabel } = usePermitTravailLabels()
  const active = ['VALIDE_HSE', 'EN_COURS', 'VALIDE'].includes(permit.statut) && !!permit.dateFinPrevue
  return (
    <ClickableCard to={`/permits-travail/${permit.id}`} label={`${t('permitTravail.list.actions.voir')} ${permit.reference}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="truncate font-mono text-sm font-semibold text-gray-900">{permit.reference}</p>
        <StatutPermitBadge statut={permit.statut} />
      </div>
      <p className="mt-1 text-sm text-gray-800">{typeLabel(permit.typePermis)} · {permit.codeSite}</p>
      {permit.descriptionTravaux && <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{permit.descriptionTravaux}</p>}
      {active && <div className="mt-2"><ExpirationBadge expiresAt={permit.dateFinPrevue} /></div>}
    </ClickableCard>
  )
}

function PermitTravailListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [urlParams] = useSearchParams()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const groupeIdFilter = urlParams.get('groupeId')
  const canCreate = usePermission('permit_travail.create')
  const canValider = usePermission('permit_travail.valider_hse')
  const canRefuser = usePermission('permit_travail.refuser_hse')
  const canResoumettre = usePermission('permit_travail.resoumettre')
  // R-25 : le compte à rebours de validité est visible pour tous les profils.
  const showHseColumns = true

  const [hseView, setHseView] = useState(false)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilterParam] = useSearchParamState('statut')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    setPage(1)
  }, [statusFilter, groupeIdFilter])
  const [selectedForValider, setSelectedForValider] = useState<PermitTravail | null>(null)
  const [selectedForRefuser, setSelectedForRefuser] = useState<PermitTravail | null>(null)
  const [selectedForDelete, setSelectedForDelete] = useState<PermitTravail | null>(null)

  const statutParam = statutApiParam(statusFilter, PERMIT_STATUT_GROUPS)
  const queryParams: Record<string, string | string[]> = {
    page: String(page),
    itemsPerPage: String(ITEMS_PER_PAGE),
    ...(statutParam
      ? { statut: statutParam }
      : hseView
        ? { statut: HSE_STATUTS }
        : {}),
    ...(groupeIdFilter ? { groupeId: groupeIdFilter } : {}),
  }

  const { data, isLoading, isError } = usePermitsTravail(queryParams)
  const {
    validerPermit,
    refuserPermit,
    deletePermit,
    isValidating,
    isRefusing,
    isDeleting,
  } = usePermitTravail()
  const { typeLabel, processusLabel } = usePermitTravailLabels()

  const displayedPermits = useMemo(
    () => sortNewestFirst(data?.member ?? []),
    [data?.member],
  )
  const totalItems = data?.totalItems ?? 0
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: t('permitTravail.list.filters.allStatuts') },
      { value: 'todo', label: t('dashboard.kpis.permitsToHandle') },
      { value: 'valides', label: t('dashboard.kpis.permisValides') },
      { value: 'clotures', label: t('dashboard.kpis.permisClotures') },
      { value: 'BROUILLON', label: t('permitTravail.statut.BROUILLON') },
      { value: 'SOUMIS', label: t('permitTravail.statut.SOUMIS') },
      { value: 'VALIDE_HSE', label: t('permitTravail.statut.VALIDE_HSE') },
      { value: 'REFUSE_HSE', label: t('permitTravail.statut.REFUSE_HSE') },
      { value: 'CLOTURE', label: t('permitTravail.statut.CLOTURE') },
    ],
    [t],
  )

  const typeOptions = useMemo(
    () => [
      { value: 'all', label: t('permitTravail.list.filters.allTypes') },
      { value: 'GENERAL', label: t('permitTravail.types.GENERAL') },
      { value: 'ELECTRIQUE', label: t('permitTravail.types.ELECTRIQUE') },
      { value: 'HAUTEUR', label: t('permitTravail.types.HAUTEUR') },
    ],
    [t],
  )

  const filteredPermits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return displayedPermits.filter((permit) => {
      if (!statutMatchesFilter(permit.statut, statusFilter, PERMIT_STATUT_GROUPS)) return false
      if (typeFilter !== 'all' && permit.typePermis !== typeFilter) return false
      if (!query) return true
      const haystack = [
        permit.reference,
        permit.codeSite,
        typeLabel(permit.typePermis),
        processusLabel(permit.processus),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [displayedPermits, searchQuery, statusFilter, typeFilter, typeLabel, processusLabel])

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || typeFilter !== 'all'

  const handleHseViewToggle = () => {
    setHseView((v) => !v)
    setPage(1)
  }

  const headers = [
    t('permitTravail.list.headers.reference'),
    t('permitTravail.list.headers.type'),
    t('permitTravail.list.headers.processus'),
    t('permitTravail.list.headers.site'),
    t('permitTravail.list.headers.statut'),
    t('permitTravail.list.headers.submittedAt'),
    ...(showHseColumns ? [t('permitTravail.list.headers.expiration')] : []),
    t('permitTravail.list.headers.actions'),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('permitTravail.list.title')}
        description={t('permitTravail.list.description')}
        actions={
          <div className="flex items-center gap-2">
            {showHseColumns && (
              <Button
                variant={hseView ? 'primary' : 'outline'}
                onClick={handleHseViewToggle}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                {t('permitTravail.list.hseView')}
              </Button>
            )}
            {canCreate && (
              <Button onClick={() => navigate('/permits-travail/new')}>
                <Plus className="mr-2 h-4 w-4" />
                {t('permitTravail.list.newPermit')}
              </Button>
            )}
          </div>
        }
      />

      {groupeIdFilter && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5">
          <span className="flex items-center gap-2 text-sm text-purple-800">
            <Users className="h-4 w-4" />
            {t('permitTravail.list.groupFilterActive')}
          </span>
          <button
            type="button"
            onClick={() => navigate('/permits-travail')}
            className="flex items-center gap-1 text-sm font-medium text-purple-700 hover:text-purple-900"
          >
            <X className="h-3.5 w-3.5" />
            {t('permitTravail.list.groupFilterClear')}
          </button>
        </div>
      )}

      {isLoading && <ListPageSkeleton withStatStrip={false} />}

      {!isLoading && (
      <Card className="overflow-hidden">
        <ListTableFilters>
          <Input
            placeholder={t('permitTravail.list.filters.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilterParam(e.target.value)
              setPage(1)
            }}
            placeholder={t('permitTravail.list.filters.statut')}
          />
          <Select
            options={typeOptions}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            placeholder={t('permitTravail.list.filters.type')}
          />
        </ListTableFilters>
        <CardContent className="p-0">
          {isError && (
            <div className="flex items-center justify-center gap-2 py-12 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{t('permitTravail.list.loadingError')}</span>
            </div>
          )}

          {!isLoading && !isError && displayedPermits.length === 0 && !hasActiveFilters && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-4 h-12 w-12 text-gray-300" />
              <p className="font-medium text-gray-500">{t('permitTravail.list.empty')}</p>
              <p className="mt-1 text-sm text-gray-400">
                {canCreate
                  ? t('permitTravail.list.emptyCreate')
                  : t('permitTravail.list.emptyNoCreate')}
              </p>
            </div>
          )}

          {!isLoading && !isError && (displayedPermits.length > 0 || hasActiveFilters) && filteredPermits.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-4 h-12 w-12 text-gray-300" />
              <p className="font-medium text-gray-500">{t('permitTravail.list.filters.noResults')}</p>
            </div>
          )}

          {!isLoading && !isError && filteredPermits.length > 0 && (
            <>
              <div className="space-y-3 p-3 lg:hidden">
                {filteredPermits.map((permit) => (
                  <PermitCard key={permit.id} permit={permit} />
                ))}
              </div>
              <div className="hidden lg:block">
              <ListTable>
                <ListTableHead>
                  <tr>
                    {headers.map((h, i) => (
                      <ListTableHeadCell
                        key={h}
                        actions={i === headers.length - 1}
                        compact={
                          i !== headers.length - 1 &&
                          (h === t('permitTravail.list.headers.type') ||
                            h === t('permitTravail.list.headers.site') ||
                            h === t('permitTravail.list.headers.submittedAt') ||
                            h === t('permitTravail.list.headers.expiration'))
                        }
                      >
                        {h}
                      </ListTableHeadCell>
                    ))}
                  </tr>
                </ListTableHead>
                <ListTableBody>
                  {filteredPermits.map((permit) => (
                    <PermitRow
                      key={permit.id}
                      permit={permit}
                      showHseColumns={showHseColumns}
                      canValider={canValider}
                      canRefuser={canRefuser}
                      canResoumettre={canResoumettre}
                      canDelete={canDeletePermit(permit, currentUserId)}
                      onValider={setSelectedForValider}
                      onRefuser={setSelectedForRefuser}
                      onDelete={setSelectedForDelete}
                    />
                  ))}
                </ListTableBody>
              </ListTable>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                  <p className="text-sm text-gray-600">
                    Page {page} / {totalPages} ({totalItems}{' '}
                    {t('permitTravail.list.paginationPermits')})
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t('common.previous')}
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t('common.next')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      )}

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
      {selectedForDelete && (
        <Modal
          isOpen={true}
          onClose={() => {
            if (!isDeleting) setSelectedForDelete(null)
          }}
          title={t('permitTravail.list.deleteModal.title', { reference: selectedForDelete.reference })}
        >
          <p className="text-sm text-gray-600">
            {selectedForDelete.groupeId
              ? t('permitTravail.list.deleteModal.groupMessage')
              : t('permitTravail.list.deleteModal.message')}
          </p>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setSelectedForDelete(null)} disabled={isDeleting}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                await deletePermit(selectedForDelete.id)
                setSelectedForDelete(null)
              }}
              isLoading={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('permitTravail.list.deleteModal.confirm')}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}

export default PermitTravailListPage
