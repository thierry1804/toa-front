import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePermitStore } from '@/store/permitStore';
import { useAuthStore } from '@/store/authStore';
import { usePermission } from '@/features/auth/usePermission';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/features/menus/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ValidationModal from '@/components/permits/ValidationModal';
import { FileText, Plus, Filter, Eye, Edit, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { PermitStatus } from '@/types';

export default function PermitsListPage() {
  const { permisGeneraux } = usePermitStore();
  const { user } = useAuthStore();
  const canViewAllPermits = usePermission('permits.view_all');
  const canValidatePermitsChef = usePermission('validate_permits_chef');
  const canValidatePermitsHse = usePermission('validate_permits_hse');
  const { t } = useTranslation();
  const perms = usePermissions('/permits');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [validationModal, setValidationModal] = useState<{
    isOpen: boolean;
    permisId: string;
    status: string;
    type: 'chef' | 'hse';
  }>({
    isOpen: false,
    permisId: '',
    status: '',
    type: 'chef',
  });

  // Filtrer les permis selon le rôle
  const filteredPermis = permisGeneraux.filter((permis) => {
    // Filtre par recherche
    const matchSearch =
      searchQuery === '' ||
      permis.numero.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permis.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permis.codeSite.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permis.contractant.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtre par statut
    const matchStatus = statusFilter === 'all' || permis.status === statusFilter;

    const matchRole =
      canViewAllPermits ||
      permis.creerPar === user?.email ||
      permis.contractant === user?.entreprise;

    return matchSearch && matchStatus && matchRole;
  });

  const getStatusBadge = (status: PermitStatus) => {
    const statusConfig = {
      brouillon: { label: t(`permits.statuses.${status}`), color: 'bg-gray-100 text-gray-800' },
      en_attente_validation_chef: {
        label: t(`permits.statuses.${status}`),
        color: 'bg-yellow-100 text-yellow-800',
      },
      en_attente_validation_hse: {
        label: t(`permits.statuses.${status}`),
        color: 'bg-orange-100 text-orange-800',
      },
      valide: { label: t(`permits.statuses.${status}`), color: 'bg-green-100 text-green-800' },
      refuse: { label: t(`permits.statuses.${status}`), color: 'bg-red-100 text-red-800' },
      en_cours: { label: t(`permits.statuses.${status}`), color: 'bg-blue-100 text-blue-800' },
      cloture: { label: t(`permits.statuses.${status}`), color: 'bg-gray-100 text-gray-800' },
      expire: { label: t(`permits.statuses.${status}`), color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || {
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

  const statusOptions = [
    { value: 'all', label: t('common.all') },
    { value: 'brouillon', label: t('permits.statuses.brouillon') },
    { value: 'en_attente_validation_chef', label: t('permits.statuses.en_attente_validation_chef') },
    { value: 'en_attente_validation_hse', label: t('permits.statuses.en_attente_validation_hse') },
    { value: 'valide', label: t('permits.statuses.valide') },
    { value: 'refuse', label: t('permits.statuses.refuse') },
    { value: 'en_cours', label: t('permits.statuses.en_cours') },
    { value: 'cloture', label: t('permits.statuses.cloture') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{t('permits.title')}</h2>
          <p className="mt-1 text-gray-600">
            Gestion des permis de travail et demandes d'autorisation
          </p>
        </div>
        {perms?.canCreate && (
          <Link to="/permits/new">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              {t('permits.create')}
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
                placeholder="Rechercher par numéro, référence, site..."
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

      {/* Liste des permis */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des permis ({filteredPermis.length})</CardTitle>
          <CardDescription>
            {canViewAllPermits
              ? 'Tous les permis de travail'
              : 'Vos demandes de permis'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPermis.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('common.noData')}</p>
              {perms?.canCreate && (
                <Link to="/permits/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-5 w-5 mr-2" />
                    {t('permits.create')}
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Numéro
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Référence
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Travaux
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Site
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Prestataire
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPermis.map((permis) => (
                    <tr key={permis.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                        {permis.numero}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {permis.reference || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {permis.intituleTravaux}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{permis.codeSite}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{permis.contractant}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {formatDate(permis.dateDebut)}
                      </td>
                      <td className="px-4 py-4">{getStatusBadge(permis.status)}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/permits/${permis.id}`}>
                            <button
                              className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                              title="Voir"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                          {perms?.canEdit && permis.status === 'brouillon' && (
                            <Link to={`/permits/${permis.id}/edit`}>
                              <button
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </Link>
                          )}
                          {canValidatePermitsChef &&
                            permis.status === 'en_attente_validation_chef' && (
                              <button
                                onClick={() =>
                                  setValidationModal({
                                    isOpen: true,
                                    permisId: permis.id,
                                    status: permis.status,
                                    type: 'chef',
                                  })
                                }
                                className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Valider"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                          {canValidatePermitsHse &&
                            permis.status === 'en_attente_validation_hse' && (
                              <button
                                onClick={() =>
                                  setValidationModal({
                                    isOpen: true,
                                    permisId: permis.id,
                                    status: permis.status,
                                    type: 'hse',
                                  })
                                }
                                className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Valider"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{filteredPermis.length}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {
                    filteredPermis.filter(
                      (p) =>
                        p.status === 'en_attente_validation_chef' ||
                        p.status === 'en_attente_validation_hse'
                    ).length
                  }
                </p>
              </div>
              <Filter className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Validés</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredPermis.filter((p) => p.status === 'valide').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Refusés</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredPermis.filter((p) => p.status === 'refuse').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modale de validation */}
      <ValidationModal
        isOpen={validationModal.isOpen}
        onClose={() =>
          setValidationModal({ isOpen: false, permisId: '', status: '', type: 'chef' })
        }
        permisId={validationModal.permisId}
        currentStatus={validationModal.status}
        type={validationModal.type}
      />
    </div>
  );
}
