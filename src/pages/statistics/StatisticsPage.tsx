import { useMemo } from 'react';
import { usePermitTravailSuivi, usePermitsTravail } from '@/features/permitTravail/hooks/usePermitTravail';
import { usePlanPreventions } from '@/features/planPrevention/hooks/usePlanPrevention';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { StatStrip } from '@/components/ui/StatStrip';
import { TYPE_PERMIT_LABELS, type StatutPermitTravail } from '@/types/permitTravail';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MapPin,
} from 'lucide-react';

const VALIDES_STATUTS: StatutPermitTravail[] = ['VALIDE', 'VALIDE_HSE'];
const REFUSES_STATUTS: StatutPermitTravail[] = ['REJETE', 'REFUSE_HSE', 'PV_REFUSE'];
const ATTENTE_STATUTS: StatutPermitTravail[] = ['BROUILLON', 'SOUMIS'];
const CLOTURE_STATUTS: StatutPermitTravail[] = ['CLOTURE', 'PV_VALIDE'];

export default function StatisticsPage() {
  const { data: suivi, isLoading: isLoadingSuivi } = usePermitTravailSuivi();
  const { data: permitsData, isLoading: isLoadingPermits } = usePermitsTravail({
    itemsPerPage: '500',
  });
  const { data: plans = [], isLoading: isLoadingPlans } = usePlanPreventions({
    itemsPerPage: '500',
  });

  const permits = useMemo(() => permitsData?.member ?? [], [permitsData]);
  const parStatut = suivi?.parStatut ?? {};
  const parType = suivi?.parType ?? {};
  const parSite = suivi?.parSite ?? {};

  const sumStatuts = (keys: StatutPermitTravail[]) =>
    keys.reduce((sum, k) => sum + (parStatut[k] ?? 0), 0);

  // Statistiques des permis (source: /api/permits-travail/suivi, agrégé côté serveur)
  const permitsStats = useMemo(
    () => ({
      total: suivi?.totalPermis ?? 0,
      valides: sumStatuts(VALIDES_STATUTS),
      refuses: sumStatuts(REFUSES_STATUTS),
      enAttente: sumStatuts(ATTENTE_STATUTS),
      enCours: parStatut.EN_COURS ?? 0,
      clotures: sumStatuts(CLOTURE_STATUTS),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [suivi],
  );

  // Statistiques des plans de prévention
  const plansStats = useMemo(() => {
    const total = plans.length;
    const enAttente = plans.filter(
      (p) => p.statut === 'BROUILLON' || p.statut === 'SOUMIS' || p.statut === 'EN_ATTENTE',
    ).length;
    const valides = plans.filter(
      (p) => p.statut === 'VALIDE' || p.statut === 'VALIDE_HSE',
    ).length;
    const refuses = plans.filter(
      (p) => p.statut === 'REJETE' || p.statut === 'REFUSE_HSE',
    ).length;

    return { total, enAttente, valides, refuses };
  }, [plans]);

  // Statistiques par site
  const siteStats = useMemo(() => {
    return Object.entries(parSite)
      .map(([site, count]) => ({ site, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suivi]);

  // Statistiques par prestataire
  const contractantStats = useMemo(() => {
    const contractants = new Map<string, number>();
    permits.forEach((p) => {
      const nom = p.nomPrestataire?.trim();
      if (!nom) return;
      contractants.set(nom, (contractants.get(nom) || 0) + 1);
    });
    return Array.from(contractants.entries())
      .map(([contractant, count]) => ({ contractant, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [permits]);

  // Répartition par type de permis
  const typeStats = useMemo(
    () => ({
      general: parType.GENERAL ?? 0,
      electrique: parType.ELECTRIQUE ?? 0,
      hauteur: parType.HAUTEUR ?? 0,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [suivi],
  );

  // Taux de validation
  const validationRate = useMemo(() => {
    if (permitsStats.total === 0) return 0;
    return Math.round((permitsStats.valides / permitsStats.total) * 100);
  }, [permitsStats]);

  // Taux de refus
  const refusalRate = useMemo(() => {
    if (permitsStats.total === 0) return 0;
    return Math.round((permitsStats.refuses / permitsStats.total) * 100);
  }, [permitsStats]);

  if (isLoadingSuivi || isLoadingPermits || isLoadingPlans) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Statistiques</h2>
        <p className="mt-1 text-gray-600">Vue d'ensemble des permis et plans de prévention</p>
      </div>

      {/* KPIs Principaux */}
      <StatStrip
        items={[
          { label: 'Total Permis', value: permitsStats.total },
          { label: 'Taux de Validation', value: `${validationRate}%` },
          { label: 'En Attente', value: permitsStats.enAttente },
          { label: 'Taux de Refus', value: `${refusalRate}%` },
        ]}
      />

      {/* Répartition par statut */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Statut des Permis</CardTitle>
            <CardDescription>Répartition des permis par statut</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-700">Validés</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="success" size="lg">
                  {permitsStats.valides}
                </Badge>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {permitsStats.total > 0
                    ? Math.round((permitsStats.valides / permitsStats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="text-sm text-gray-700">En attente</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="warning" size="lg">
                  {permitsStats.enAttente}
                </Badge>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {permitsStats.total > 0
                    ? Math.round((permitsStats.enAttente / permitsStats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-700">En cours</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="info" size="lg">
                  {permitsStats.enCours}
                </Badge>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {permitsStats.total > 0
                    ? Math.round((permitsStats.enCours / permitsStats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-700">Clôturés</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="gray" size="lg">
                  {permitsStats.clotures}
                </Badge>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {permitsStats.total > 0
                    ? Math.round((permitsStats.clotures / permitsStats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-gray-700">Refusés</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="danger" size="lg">
                  {permitsStats.refuses}
                </Badge>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {permitsStats.total > 0
                    ? Math.round((permitsStats.refuses / permitsStats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plans de Prévention</CardTitle>
            <CardDescription>Statistiques des plans de prévention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary-600" />
                <span className="text-sm text-gray-700">Total</span>
              </div>
              <Badge variant="primary" size="lg">
                {plansStats.total}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-700">Validés</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="success" size="lg">
                  {plansStats.valides}
                </Badge>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {plansStats.total > 0
                    ? Math.round((plansStats.valides / plansStats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="text-sm text-gray-700">En attente</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="warning" size="lg">
                  {plansStats.enAttente}
                </Badge>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {plansStats.total > 0
                    ? Math.round((plansStats.enAttente / plansStats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-gray-700">Refusés</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="danger" size="lg">
                  {plansStats.refuses}
                </Badge>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {plansStats.total > 0
                    ? Math.round((plansStats.refuses / plansStats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Sites et Prestataires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top 5 Sites
            </CardTitle>
            <CardDescription>Sites avec le plus de permis</CardDescription>
          </CardHeader>
          <CardContent>
            {siteStats.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucune donnée disponible</p>
            ) : (
              <div className="space-y-3">
                {siteStats.map((stat, index) => (
                  <div key={stat.site} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary-600">{index + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{stat.site}</span>
                    </div>
                    <Badge variant="primary" size="lg">
                      {stat.count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top 5 Prestataires
            </CardTitle>
            <CardDescription>Prestataires avec le plus de permis</CardDescription>
          </CardHeader>
          <CardContent>
            {contractantStats.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucune donnée disponible</p>
            ) : (
              <div className="space-y-3">
                {contractantStats.map((stat, index) => (
                  <div key={stat.contractant} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-green-600">{index + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{stat.contractant}</span>
                    </div>
                    <Badge variant="success" size="lg">
                      {stat.count}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Répartition par type de permis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Répartition par Type de Permis
          </CardTitle>
          <CardDescription>Nombre de permis par type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {TYPE_PERMIT_LABELS.GENERAL}
                </span>
                <Badge variant="info" size="lg">
                  {typeStats.general}
                </Badge>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {TYPE_PERMIT_LABELS.ELECTRIQUE}
                </span>
                <Badge variant="warning" size="lg">
                  {typeStats.electrique}
                </Badge>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {TYPE_PERMIT_LABELS.HAUTEUR}
                </span>
                <Badge variant="warning" size="lg">
                  {typeStats.hauteur}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
