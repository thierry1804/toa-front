import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePermitStore } from '@/store/permitStore';
import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/lib/i18n';
import { usePermissions } from '@/features/menus/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Shield, Plus, Eye, Edit, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function PreventionListPage() {
  const { plansPrevention } = usePermitStore();
  const { user, canAccessFeature } = useAuthStore();
  const { t } = useI18n();
  const perms = usePermissions('/prevention');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtrer les plans selon le rôle
  const filteredPlans = plansPrevention.filter((plan) => {
    const matchSearch =
      searchQuery === '' ||
      plan.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.entreprisePrestataire.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.codeSite || plan.nomSite).toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'all' || plan.status === statusFilter;

    const matchRole =
      user?.role !== 'prestataire' ||
      plan.creerPar === user?.email ||
      plan.entreprisePrestataire === user?.entreprise;

    return matchSearch && matchStatus && matchRole;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
      valide: { label: 'Validé', color: 'bg-green-100 text-green-800' },
      en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
      termine: { label: 'Terminé', color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getRisqueLevel = (plan: typeof plansPrevention[0]) => {
    const critiques = plan.risques.filter((r) => r.niveauGravite === 'critique').length;
    const eleves = plan.risques.filter((r) => r.niveauGravite === 'eleve').length;

    if (critiques > 0) {
      return { label: `${critiques} critique(s)`, color: 'text-red-600' };
    }
    if (eleves > 0) {
      return { label: `${eleves} élevé(s)`, color: 'text-orange-600' };
    }
    return { label: 'Standard', color: 'text-gray-600' };
  };

  const statusOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'valide', label: 'Validé' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'termine', label: 'Terminé' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{t('prevention.title')}</h2>
          <p className="mt-1 text-gray-600">
            Plans de prévention des risques HSSES
          </p>
        </div>
        {perms?.canCreate && (
          <Link to="/prevention/new">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              {t('prevention.create')}
            </Button>
          </Link>
        )}
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Rechercher par référence, entreprise, site..."
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
          </div>
        </CardContent>
      </Card>

      {/* Liste des plans */}
      <Card>
        <CardHeader>
          <CardTitle>Plans de prévention ({filteredPlans.length})</CardTitle>
          <CardDescription>
            {user?.role === 'prestataire'
              ? 'Vos plans de prévention'
              : 'Tous les plans de prévention HSSES'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('common.noData')}</p>
              {perms?.canCreate && (
                <Link to="/prevention/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-5 w-5 mr-2" />
                    {t('prevention.create')}
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((plan) => {
                const risque = getRisqueLevel(plan);
                return (
                  <Card key={plan.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Shield className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{plan.reference}</p>
                            <p className="text-Solution text-gray-500">{plan.codeSite || plan.nomSite}</p>
                          </div>
                        </div>
                        {getStatusBadge(plan.status)}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {plan.entreprisePrestataire}
                          </p>
                          <p className="text-sm text-gray-600">{plan.natureIntervention}</p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(plan.dateDebut)}</span>
                          <span>→</span>
                          <span>{formatDate(plan.dateFin)}</span>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <AlertTriangle className={`h-4 w-4 ${risque.color}`} />
                          <span className={`text-xs font-medium ${risque.color}`}>
                            {plan.risques.length} risque(s) - {risque.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                        <Link to={`/prevention/${plan.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-1.5" />
                            {t('common.view')}
                          </Button>
                        </Link>
                        {perms?.canEdit &&
                          plan.status === 'brouillon' && (
                            <Link to={`/prevention/${plan.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{filteredPlans.length}</p>
              </div>
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Validés</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredPlans.filter((p) => p.status === 'valide').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredPlans.filter((p) => p.status === 'en_cours').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risques critiques</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredPlans.reduce(
                    (acc, p) =>
                      acc + p.risques.filter((r) => r.niveauGravite === 'critique').length,
                    0
                  )}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
