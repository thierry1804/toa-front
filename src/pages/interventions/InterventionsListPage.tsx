import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInterventionStore } from '@/store/interventionStore';
import { usePermissions } from '@/features/menus/hooks/usePermissions';
import { interventionApi } from '@/api/interventionApi';
import type { PermitTravailSummary } from '@/types/intervention';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { StatStrip } from '@/components/ui/StatStrip';
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
import type { InterventionStatus } from '@/types';

const STATUT_MAP: Record<string, string> = {
  EN_PREPARATION: 'planifiee',
  EVALUATION_COMPLETE: 'planifiee',
  EN_COURS: 'en_cours',
  TERMINEE: 'terminee',
}

function getPermit(intervention: any): PermitTravailSummary | null {
  if (intervention.permitTravail && typeof intervention.permitTravail === 'object') {
    return intervention.permitTravail as PermitTravailSummary
  }
  return null
}

function mapIntervention(raw: any) {
  const permit = getPermit(raw)
  const createdBy = permit?.createdBy
  const prestataire = createdBy?.entrepriseName
    ? `${createdBy.entrepriseName} (${createdBy.firstname ?? ''} ${createdBy.name})`
    : `${createdBy?.firstname ?? ''} ${createdBy?.name ?? ''}`.trim()

  return {
    ...raw,
    reference: permit?.reference ?? raw.id,
    codeSite: permit?.codeSite ?? '—',
    nomSite: permit?.codeSite ?? '—',
    description: permit?.descriptionTravaux ?? '',
    dateDebut: permit?.dateDebutPrevue ?? raw.createdAt,
    dateFin: permit?.dateFinPrevue ?? raw.createdAt,
    prestataire,
    status: STATUT_MAP[raw.statut] ?? raw.statut,
    creerPar: raw.createdBy?.email ?? '',
    zoneEnclavee: false,
    nombreIntervenants: 0,
    validationsJournalieres: raw.validationsJournalieres ?? [],
    incidents: raw.incidents ?? [],
  }
}

export default function InterventionsListPage() {
  const { interventions, setInterventions } = useInterventionStore();
  const perms = usePermissions('/interventions');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    interventionApi.getAll()
      .then((col) => {
        const mapped = (col.member ?? []).map(mapIntervention)
        setInterventions(mapped)
      })
      .catch((err) => console.error('[InterventionsList] fetch error:', err))
      .finally(() => setIsLoading(false))
  }, []);

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

  // Extraire les sites uniques pour le filtre
  const uniqueSites = Array.from(new Set(interventions.map((i: any) => i.codeSite as string)));

  const getStatusBadge = (status: InterventionStatus) => {
    const statusConfig = {
      planifiee: {
        label: 'Planifiée',
        variant: 'secondary' as const,
        icon: Calendar,
      },
      en_cours: {
        label: 'En cours',
        variant: 'primary' as const,
        icon: Clock,
      },
      suspendue: {
        label: 'Suspendue',
        variant: 'warning' as const,
        icon: AlertTriangle,
      },
      terminee: {
        label: 'Terminée',
        variant: 'success' as const,
        icon: CheckCircle2,
      },
      annulee: {
        label: 'Annulée',
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

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'planifiee', label: 'Planifiée' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'suspendue', label: 'Suspendue' },
    { value: 'terminee', label: 'Terminée' },
    { value: 'annulee', label: 'Annulée' },
  ];

  const siteOptions = [
    { value: 'all', label: 'Tous les sites' },
    ...uniqueSites.map((site) => ({ value: site, label: site })),
  ];

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
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Interventions</h2>
          <p className="mt-1 text-gray-600">
            Suivi journalier des interventions et validations de chantier
          </p>
        </div>
        {perms?.canCreate && (
          <Link to="/interventions/new">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              Nouvelle intervention
            </Button>
          </Link>
        )}
      </div>

      {/* Statistiques */}
      <StatStrip
        items={[
          { label: 'Total', value: stats.total },
          { label: 'En cours', value: stats.enCours },
          { label: 'Planifiées', value: stats.planifiees },
          { label: 'Terminées', value: stats.terminees },
          { label: 'Zones enclavées', value: stats.zonesEnclavees },
        ]}
      />

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Rechercher par référence, site, prestataire..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Filtrer par statut"
            />
            <Select
              options={siteOptions}
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              placeholder="Filtrer par site"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des interventions */}
      <Card>
        <CardHeader>
          <CardTitle>Interventions actives ({filteredInterventions.length})</CardTitle>
          <CardDescription>Toutes vos interventions</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInterventions.length === 0 ? (
            <div className="text-center py-12">
              <Clipboard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune intervention trouvée</p>
              {perms?.canCreate && (
                <Link to="/interventions/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-5 w-5 mr-2" />
                    Créer une intervention
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInterventions.map((intervention) => {
                const avancement = calculateAvancement(intervention);
                const hasIncidents =
                  intervention.incidents && intervention.incidents.length > 0;
                const lastValidation =
                  intervention.validationsJournalieres[
                    intervention.validationsJournalieres.length - 1
                  ];

                return (
                  <Card key={intervention.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {intervention.reference}
                            </h3>
                            {getStatusBadge(intervention.status)}
                            {intervention.zoneEnclavee && (
                              <Badge variant="warning">
                                <WifiOff className="h-3 w-3 mr-1" />
                                Zone enclavée
                              </Badge>
                            )}
                            {hasIncidents && (
                              <Badge variant="error">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Incidents
                              </Badge>
                            )}
                          </div>

                          <p className="text-gray-600 mb-3">{intervention.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <div>
                                <p className="font-medium">{intervention.codeSite}</p>
                                <p className="text-xs text-gray-500">{intervention.nomSite}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="h-4 w-4" />
                              <div>
                                <p className="font-medium">{intervention.prestataire}</p>
                                <p className="text-xs text-gray-500">
                                  {intervention.nombreIntervenants} intervenant
                                  {intervention.nombreIntervenants > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <div>
                                <p className="font-medium">{formatDate(intervention.dateDebut)}</p>
                                <p className="text-xs text-gray-500">
                                  au {formatDate(intervention.dateFin)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <div>
                                <p className="font-medium">{avancement}% complété</p>
                                <p className="text-xs text-gray-500">
                                  {intervention.validationsJournalieres.length} validation
                                  {intervention.validationsJournalieres.length > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Barre de progression */}
                          {intervention.status === 'en_cours' && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Avancement</span>
                                <span>{avancement}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full transition-all"
                                  style={{ width: `${avancement}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Dernière validation */}
                          {lastValidation && (
                            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                              <span className="font-medium">Dernière validation:</span>{' '}
                              {formatDate(lastValidation.date)} - {lastValidation.observationsJour}
                            </div>
                          )}
                        </div>

                        <div className="ml-4">
                          <Link to={`/interventions/${intervention.id}`}>
                            <button
                              className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                              title="Voir détails"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
