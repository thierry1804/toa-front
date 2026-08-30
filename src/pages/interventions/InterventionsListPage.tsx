import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSearchParamState } from '@/hooks/useSearchParamState';
import { useTranslation } from 'react-i18next';
import { useInterventionStore, type StoredIntervention } from '@/store/interventionStore';
import { usePermissions } from '@/features/menus/hooks/usePermissions';
import { interventionApi } from '@/api/interventionApi';
import type { Intervention, PermitTravailSummary } from '@/types/intervention';
import type { ValidationInterventionJournaliere } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { TableIconButton } from '@/components/ui/TableIconButton';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { StatStrip } from '@/components/ui/StatStrip';
import ListPageSkeleton from '@/components/ui/ListPageSkeleton';
import { listFiltersContainerClass } from '@/components/ui/ListTable';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Clipboard,
  Plus,
  Eye,
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  WifiOff,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { sortNewestFirst } from '@/lib/listOrder';
import type { InterventionStatus } from '@/types';

const STATUT_MAP: Record<string, string> = {
  EN_PREPARATION: 'planifiee',
  EVALUATION_COMPLETE: 'planifiee',
  EN_COURS: 'en_cours',
  TERMINEE: 'terminee',
}

type RawIntervention = Intervention & {
  validationsJournalieres?: unknown[]
  incidents?: unknown[]
}

function getPermit(intervention: Intervention): PermitTravailSummary | null {
  if (intervention.permitTravail && typeof intervention.permitTravail === 'object') {
    return intervention.permitTravail
  }
  return null
}

function mapIntervention(raw: RawIntervention): StoredIntervention {
  const permit = getPermit(raw)
  const createdBy = permit?.createdBy
  const prestataire = createdBy?.entrepriseName
    ? `${createdBy.entrepriseName} (${createdBy.firstname ?? ''} ${createdBy.name})`
    : `${createdBy?.firstname ?? ''} ${createdBy?.name ?? ''}`.trim()

  return {
    id: raw.id,
    createdAt: raw.createdAt,
    reference: permit?.reference ?? raw.id,
    codeSite: permit?.codeSite ?? '—',
    nomSite: permit?.codeSite ?? '—',
    description: permit?.descriptionTravaux ?? '',
    dateDebut: permit?.dateDebutPrevue ?? raw.createdAt,
    dateFin: permit?.dateFinPrevue ?? raw.createdAt,
    prestataire,
    status: (STATUT_MAP[raw.statut] ?? raw.statut) as InterventionStatus,
    creerPar: raw.createdBy?.email ?? '',
    zoneEnclavee: false,
    nombreIntervenants: 0,
    validationsJournalieres: (raw.validationsJournalieres ?? []) as ValidationInterventionJournaliere[],
    take5Records: [],
    incidents: raw.incidents ?? [],
    documentsProgres: [],
  }
}

export default function InterventionsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { interventions, setInterventions } = useInterventionStore();
  const perms = usePermissions('/interventions');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilterParam] = useSearchParamState('statut');
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);
  const itemsPerPage = 10;

  useEffect(() => {
    setIsLoading(true);
    interventionApi.getAll()
      .then((col) => {
        const mapped = (col.member ?? []).map(mapIntervention)
        setInterventions(mapped)
      })
      .catch((err) => console.error('[InterventionsList] fetch error:', err))
      .finally(() => setIsLoading(false))
  }, [setInterventions]);

  // Filtrer les interventions (ownership filtré par le backend)
  const filteredInterventions = interventions.filter((intervention) => {
    const matchSearch =
      searchQuery === '' ||
      intervention.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intervention.nomSite.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intervention.codeSite.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intervention.prestataire.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'all' || intervention.status === statusFilter;

    const matchSite = siteFilter === 'all' || intervention.codeSite === siteFilter;

    return matchSearch && matchStatus && matchSite;
  });
  const sortedInterventions = sortNewestFirst(filteredInterventions);

  const totalItems = sortedInterventions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const pagedInterventions = sortedInterventions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  // Extraire les sites uniques pour le filtre
  const uniqueSites = Array.from(new Set(interventions.map((i) => i.codeSite as string)));

  const getStatusBadge = (status: InterventionStatus) => {
    const statusConfig = {
      planifiee: {
        label: t('interventions.list.status.planifiee'),
        variant: 'secondary' as const,
        icon: Calendar,
      },
      en_cours: {
        label: t('interventions.list.status.en_cours'),
        variant: 'primary' as const,
        icon: Clock,
      },
      suspendue: {
        label: t('interventions.list.status.suspendue'),
        variant: 'warning' as const,
        icon: AlertTriangle,
      },
      terminee: {
        label: t('interventions.list.status.terminee'),
        variant: 'success' as const,
        icon: CheckCircle2,
      },
      annulee: {
        label: t('interventions.list.status.annulee'),
        variant: 'error' as const,
        icon: AlertTriangle,
      },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: 'secondary' as const,
      icon: Clock,
    };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: t('interventions.list.allStatuts') },
      { value: 'planifiee', label: t('interventions.list.status.planifiee') },
      { value: 'en_cours', label: t('interventions.list.status.en_cours') },
      { value: 'suspendue', label: t('interventions.list.status.suspendue') },
      { value: 'terminee', label: t('interventions.list.status.terminee') },
      { value: 'annulee', label: t('interventions.list.status.annulee') },
    ],
    [t],
  );

  const siteOptions = useMemo(
    () => [
      { value: 'all', label: t('interventions.list.allSites') },
      ...uniqueSites.map((site) => ({ value: site, label: site })),
    ],
    [t, uniqueSites],
  );

  // Calculer les statistiques
  const stats = {
    total: filteredInterventions.length,
    enCours: filteredInterventions.filter((i) => i.status === 'en_cours').length,
    planifiees: filteredInterventions.filter((i) => i.status === 'planifiee').length,
    terminees: filteredInterventions.filter((i) => i.status === 'terminee').length,
    zonesEnclavees: filteredInterventions.filter((i) => i.zoneEnclavee).length,
  };

  const calculateAvancement = (intervention: { validationsJournalieres: Array<{ avancementPourcentage?: number }> }) => {
    if (intervention.validationsJournalieres.length === 0) return 0;
    const latestValidation =
      intervention.validationsJournalieres[intervention.validationsJournalieres.length - 1];
    return latestValidation.avancementPourcentage || 0;
  };

  if (isLoading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('interventions.list.title')}
        description={t('interventions.list.description')}
        actions={
          perms?.canCreate ? (
            <Link to="/interventions/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('interventions.list.newIntervention')}
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Statistiques */}
      <StatStrip
        items={[
          { label: t('interventions.list.stats.total'), value: stats.total, href: '/interventions' },
          { label: t('interventions.list.stats.enCours'), value: stats.enCours, href: '/interventions?statut=en_cours' },
          { label: t('interventions.list.stats.planifiees'), value: stats.planifiees, href: '/interventions?statut=planifiee' },
          { label: t('interventions.list.stats.terminees'), value: stats.terminees, href: '/interventions?statut=terminee' },
          { label: t('interventions.list.stats.zonesEnclavees'), value: stats.zonesEnclavees },
        ]}
      />

      {/* Filtres */}
      <Card>
        <CardContent className={listFiltersContainerClass}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <Input
                placeholder={t('interventions.list.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilterParam(e.target.value);
                setPage(1);
              }}
              placeholder={t('interventions.list.filterStatus')}
            />
            <Select
              options={siteOptions}
              value={siteFilter}
              onChange={(e) => {
                setSiteFilter(e.target.value);
                setPage(1);
              }}
              placeholder={t('interventions.list.filterSite')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des interventions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('interventions.list.activeTitle', { count: filteredInterventions.length })}</CardTitle>
          <CardDescription>{t('interventions.list.tableDescription')}</CardDescription>
        </CardHeader>
        <CardContent className={filteredInterventions.length === 0 ? undefined : 'p-0'}>
          {filteredInterventions.length === 0 ? (
            <div className="text-center py-12">
              <Clipboard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('interventions.list.empty')}</p>
              {perms?.canCreate && (
                <Link to="/interventions/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-5 w-5 mr-2" />
                    {t('interventions.list.createAction')}
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">{t('interventions.list.headers.reference')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">{t('interventions.list.headers.site')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">{t('interventions.list.headers.prestataire')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">{t('interventions.list.headers.dates')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">{t('interventions.list.headers.statut')}</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{t('interventions.list.headers.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pagedInterventions.map((intervention) => {
                      const avancement = calculateAvancement(intervention);
                      const hasIncidents =
                        intervention.incidents && intervention.incidents.length > 0;

                      return (
                        <tr key={intervention.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium text-gray-900">{intervention.reference}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {intervention.zoneEnclavee && (
                                <Badge variant="warning">
                                  <WifiOff className="h-3 w-3 mr-1" />
                                  {t('interventions.list.zoneEnclavee')}
                                </Badge>
                              )}
                              {hasIncidents && (
                                <Badge variant="error">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Incidents
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1 text-sm text-gray-900">
                              <MapPin className="h-3.5 w-3.5 text-gray-400" />
                              {intervention.codeSite}
                            </div>
                            <p className="text-xs text-gray-500">{intervention.nomSite}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1 text-sm text-gray-900">
                              <Users className="h-3.5 w-3.5 text-gray-400" />
                              {intervention.prestataire}
                            </div>
                            <p className="text-xs text-gray-500">
                              {intervention.nombreIntervenants} intervenant
                              {intervention.nombreIntervenants > 1 ? 's' : ''}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-gray-900">{formatDate(intervention.dateDebut)}</p>
                            <p className="text-xs text-gray-500">→ {formatDate(intervention.dateFin)}</p>
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(intervention.status)}
                            {intervention.status === 'en_cours' && (
                              <p className="mt-1 text-xs text-gray-500">{avancement}% complété</p>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <TableIconButton
                              title={t('interventions.list.actions.voir')}
                              onClick={() => navigate(`/interventions/${intervention.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </TableIconButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden space-y-3 p-4">
                {pagedInterventions.map((intervention) => {
                  const avancement = calculateAvancement(intervention);
                  const hasIncidents =
                    intervention.incidents && intervention.incidents.length > 0;

                  return (
                    <div key={intervention.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {intervention.reference}
                          </p>
                        </div>
                        <Link to={`/interventions/${intervention.id}`} className="shrink-0 ml-2">
                          <TableIconButton title={t('interventions.list.actions.voir')}>
                            <Eye className="h-4 w-4" />
                          </TableIconButton>
                        </Link>
                      </div>
                      <div className="mb-2 flex flex-wrap items-center gap-1">
                        {getStatusBadge(intervention.status)}
                        {intervention.zoneEnclavee && (
                          <Badge variant="warning">
                            <WifiOff className="h-3 w-3 mr-1" />
                            {t('interventions.list.zoneEnclavee')}
                          </Badge>
                        )}
                        {hasIncidents && (
                          <Badge variant="error">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Incidents
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{intervention.nomSite}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{intervention.prestataire}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="text-gray-900">{formatDate(intervention.dateDebut)}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-gray-900">{formatDate(intervention.dateFin)}</span>
                        </div>
                        {intervention.status === 'en_cours' && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <CheckCircle2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            {avancement}% complété
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-600">
                Page {page} / {totalPages} ({totalItems} intervention{totalItems !== 1 ? 's' : ''})
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
        </CardContent>
      </Card>
    </div>
  );
}
