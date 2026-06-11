import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Search, Plus, Calendar, User, HardHat, AlertTriangle, Wrench } from 'lucide-react';
import Badge from '@/components/ui/Badge';

type InterventionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

interface Intervention {
  id: string;
  reference: string;
  title: string;
  description: string;
  status: InterventionStatus;
  startDate: string;
  endDate: string;
  assignedTo: string;
  site: string;
  priority: 'low' | 'medium' | 'high';
  type: 'maintenance' | 'repair' | 'inspection' | 'installation';
}

// Mock data - in a real app, this would come from an API
const mockInterventions: Intervention[] = [
  {
    id: 'INT-2023-001',
    reference: 'INT-2023-001',
    title: 'Maintenance préventive mensuelle',
    description: 'Maintenance préventive des équipements de production',
    status: 'planned',
    startDate: '2023-11-15T09:00:00',
    endDate: '2023-11-15T12:00:00',
    assignedTo: 'Jean Dupont',
    site: 'Site Principal - Bâtiment A',
    priority: 'medium',
    type: 'maintenance'
  },
  {
    id: 'INT-2023-002',
    reference: 'INT-2023-002',
    title: 'Réparation panneau électrique',
    description: 'Remplacement du disjoncteur défectueux sur le panneau principal',
    status: 'in_progress',
    startDate: '2023-11-14T14:00:00',
    endDate: '2023-11-14T16:30:00',
    assignedTo: 'Marie Martin',
    site: 'Site Secondaire - Bâtiment B',
    priority: 'high',
    type: 'repair'
  },
  {
    id: 'INT-2023-003',
    reference: 'INT-2023-003',
    title: 'Inspection de sécurité',
    description: 'Inspection trimestrielle des équipements de sécurité',
    status: 'completed',
    startDate: '2023-11-10T10:00:00',
    endDate: '2023-11-10T15:00:00',
    assignedTo: 'Pierre Durand',
    site: 'Site Principal - Bâtiment C',
    priority: 'medium',
    type: 'inspection'
  },
  {
    id: 'INT-2023-004',
    reference: 'INT-2023-004',
    title: 'Installation nouveau compresseur',
    description: 'Installation et mise en service du nouveau compresseur d\'air',
    status: 'planned',
    startDate: '2023-11-20T08:00:00',
    endDate: '2023-11-22T17:00:00',
    assignedTo: 'Sophie Leroy',
    site: 'Site Principal - Bâtiment A',
    priority: 'high',
    type: 'installation'
  },
  {
    id: 'INT-2023-005',
    reference: 'INT-2023-005',
    title: 'Contrôle annuel des extincteurs',
    description: 'Vérification et contrôle des extincteurs sur tout le site',
    status: 'in_progress',
    startDate: '2023-11-13T09:00:00',
    endDate: '2023-11-17T17:00:00',
    assignedTo: 'Thomas Bernard',
    site: 'Tous les bâtiments',
    priority: 'low',
    type: 'inspection'
  }
];

const statusColors = {
  planned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
} as const;

const statusLabels = {
  planned: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée'
} as const;

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-red-100 text-red-800'
} as const;

const typeIcons = {
  maintenance: <Wrench className="h-4 w-4 mr-2" />,
  repair: <AlertTriangle className="h-4 w-4 mr-2" />,
  inspection: <Search className="h-4 w-4 mr-2" />,
  installation: <HardHat className="h-4 w-4 mr-2" />
};

const typeLabels = {
  maintenance: 'Maintenance',
  repair: 'Réparation',
  inspection: 'Inspection',
  installation: 'Installation'
} as const;

const InterventionsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InterventionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredInterventions = mockInterventions.filter(intervention => {
    const matchesSearch = 
      intervention.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intervention.site.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || intervention.status === statusFilter;
    const matchesType = typeFilter === 'all' || intervention.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || intervention.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Gestion des Interventions</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle Intervention
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher une intervention..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                className="text-sm border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InterventionStatus | 'all')}
              >
                <option value="all">Tous les statuts</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              
              <select
                className="text-sm border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">Tous les types</option>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              
              <select
                className="text-sm border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">Toutes priorités</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {filteredInterventions.length > 0 ? (
          filteredInterventions.map((intervention) => (
            <Card key={intervention.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-50">
                      {typeIcons[intervention.type]}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        <span className="font-mono text-sm text-gray-500 mr-2">{intervention.reference}</span>
                        {intervention.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{intervention.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <Badge className={priorityColors[intervention.priority]}>
                      {intervention.priority === 'high' ? 'Haute' : intervention.priority === 'medium' ? 'Moyenne' : 'Basse'} Priorité
                    </Badge>
                    <Badge className={statusColors[intervention.status]}>
                      {statusLabels[intervention.status]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{formatDate(intervention.startDate)}</span>
                    <span className="mx-2">-</span>
                    <span>{formatDate(intervention.endDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{intervention.assignedTo}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{intervention.site}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    Détails
                  </Button>
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                  <Button size="sm">
                    Commencer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <p className="mb-2">Aucune intervention trouvée</p>
              <p className="text-sm">Essayez de modifier vos critères de recherche</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InterventionsPage;
