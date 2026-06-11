import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { Trash2, AlertTriangle } from 'lucide-react';

// Types pour les risques structurés
export interface RisqueDetailComplet {
  id: string;
  
  // Catégorisation
  categoriePrincipale: 'environnement' | 'social' | 'sante_securite' | 'infrastructure' | '';
  sousCategorie: string;
  
  // Détails du risque
  risqueIdentifie: string;
  natureLocalisation: string;
  
  // Évaluation
  niveauGravite: 'faible' | 'moyen' | 'eleve' | 'critique' | '';
  probabilite: 'faible' | 'moyenne' | 'elevee' | '';
  niveauRisque: 'faible' | 'moyen' | 'eleve' | 'critique' | ''; // Calculé : gravité × probabilité
  
  // Mesures de prévention
  mesuresPreventionPrevues: string;
  equipementsNecessaires: string;
  
  // Responsabilités
  responsableMiseEnOeuvre: 'toa' | 'prestataire' | '';
  personnelConcerne: string;
  
  // Suivi
  delaiMiseEnOeuvre: string;
  verification: boolean;
  dateVerification?: Date;
}

// Données de référence pour les catégories et sous-catégories
const CATEGORIES_RISQUES = {
  environnement: {
    label: 'Risques liés à l\'environnement',
    color: 'green',
    sousCategories: [
      { value: 'pollutions_deversement', label: 'Pollutions (déversement)' },
      { value: 'incendie', label: 'Incendie' },
      { value: 'nuisances_sonores', label: 'Nuisances sonores' },
      { value: 'emissions_atmospheriques', label: 'Émissions atmosphériques' },
      { value: 'gestion_dechets', label: 'Gestion des déchets' },
      { value: 'autre', label: 'Autre (à préciser)' },
    ],
  },
  social: {
    label: 'Risque Social',
    color: 'blue',
    sousCategories: [
      { value: 'contestation_riveraine', label: 'Contestation riveraine' },
      { value: 'surete', label: 'Sûreté' },
      { value: 'relations_communautaires', label: 'Relations avec les communautés' },
      { value: 'acces_site', label: 'Accès au site' },
      { value: 'autre', label: 'Autre (à préciser)' },
    ],
  },
  sante_securite: {
    label: 'Risque lié à la santé et sécurité',
    color: 'red',
    sousCategories: [
      { value: 'securite_routiere', label: 'Accident lié à la sécurité routière' },
      { value: 'risque_chimique', label: 'Risque chimique' },
      { value: 'risque_hauteur', label: 'Risque en hauteur' },
      { value: 'ensevelissement', label: 'Risque d\'ensevelissement et/ou effondrement' },
      { value: 'noyade', label: 'Risque de noyade' },
      { value: 'electrique', label: 'Risques liés aux installations électriques' },
      { value: 'outils_main', label: 'Risque lié à la manipulation des outils à la main' },
      { value: 'outillage_electroportatif', label: 'Risque lié à la manipulation des outillages électroportatifs' },
      { value: 'manutention_mecanique', label: 'Accident lié à manutention mécanique' },
      { value: 'manutention_manuelle', label: 'Accident lié à manutention manuelle' },
      { value: 'travaux_chaud', label: 'Risque lié au travail à chaud' },
      { value: 'travaux_isole', label: 'Risque lié au travail isolé' },
      { value: 'coactivites', label: 'Risque lié aux coactivités' },
      { value: 'ambiance_thermique', label: 'Risque lié à l\'ambiance thermique' },
      { value: 'bruit', label: 'Risque lié au bruit' },
      { value: 'psychosociaux', label: 'Risques psychosociaux' },
      { value: 'maladies_infectieuses', label: 'Risque face aux maladies infectieuses' },
      { value: 'paludisme', label: 'Risque du paludisme' },
      { value: 'autre', label: 'Autre (à préciser)' },
    ],
  },
  infrastructure: {
    label: 'Risque lié aux installation/infrastructure existants',
    color: 'orange',
    sousCategories: [
      { value: 'acces_site', label: 'Risques liés à l\'accès sur site' },
      { value: 'etat_infrastructures', label: 'Risques liés à l\'état des infrastructures existants (Greenfield, Rooftop)' },
      { value: 'stabilite_structures', label: 'Stabilité des structures existantes' },
      { value: 'reseaux_enterres', label: 'Réseaux enterrés' },
      { value: 'autre', label: 'Autre (à préciser)' },
    ],
  },
};

interface RisqueDetailFormProps {
  risques: RisqueDetailComplet[];
  onRisquesChange: (risques: RisqueDetailComplet[]) => void;
}

export default function RisqueDetailForm({ risques, onRisquesChange }: RisqueDetailFormProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentRisque, setCurrentRisque] = useState<RisqueDetailComplet>({
    id: '',
    categoriePrincipale: '',
    sousCategorie: '',
    risqueIdentifie: '',
    natureLocalisation: '',
    niveauGravite: '',
    probabilite: '',
    niveauRisque: '',
    mesuresPreventionPrevues: '',
    equipementsNecessaires: '',
    responsableMiseEnOeuvre: '',
    personnelConcerne: '',
    delaiMiseEnOeuvre: '',
    verification: false,
  });

  const [sousCategoriesDisponibles, setSousCategoriesDisponibles] = useState<
    Array<{ value: string; label: string }>
  >([]);

  // Calculer automatiquement le niveau de risque (Gravité × Probabilité)
  useEffect(() => {
    if (currentRisque.niveauGravite && currentRisque.probabilite) {
      const niveauCalcule = calculerNiveauRisque(
        currentRisque.niveauGravite,
        currentRisque.probabilite
      );
      if (niveauCalcule !== currentRisque.niveauRisque) {
        setCurrentRisque((prev) => ({ ...prev, niveauRisque: niveauCalcule }));
      }
    }
  }, [currentRisque.niveauGravite, currentRisque.probabilite, currentRisque.niveauRisque]);

  // Mettre à jour les sous-catégories quand la catégorie principale change
  useEffect(() => {
    if (currentRisque.categoriePrincipale) {
      const categorie = CATEGORIES_RISQUES[currentRisque.categoriePrincipale];
      setSousCategoriesDisponibles(categorie?.sousCategories || []);
      // Réinitialiser la sous-catégorie si elle n'est plus valide
      if (
        currentRisque.sousCategorie &&
        !categorie?.sousCategories.find((sc) => sc.value === currentRisque.sousCategorie)
      ) {
        setCurrentRisque((prev) => ({ ...prev, sousCategorie: '' }));
      }
    } else {
      setSousCategoriesDisponibles([]);
    }
  }, [currentRisque.categoriePrincipale, currentRisque.sousCategorie]);

  const calculerNiveauRisque = (
    gravite: string,
    probabilite: string
  ): 'faible' | 'moyen' | 'eleve' | 'critique' => {
    // Matrice de risque simplifiée
    const matrice: Record<string, Record<string, 'faible' | 'moyen' | 'eleve' | 'critique'>> = {
      faible: { faible: 'faible', moyenne: 'faible', elevee: 'moyen' },
      moyen: { faible: 'faible', moyenne: 'moyen', elevee: 'eleve' },
      eleve: { faible: 'moyen', moyenne: 'eleve', elevee: 'critique' },
      critique: { faible: 'eleve', moyenne: 'critique', elevee: 'critique' },
    };

    return matrice[gravite]?.[probabilite] || 'moyen';
  };

  const ajouterRisque = () => {
    setCurrentRisque({
      id: `risque-${Date.now()}`,
      categoriePrincipale: '',
      sousCategorie: '',
      risqueIdentifie: '',
      natureLocalisation: '',
      niveauGravite: '',
      probabilite: '',
      niveauRisque: '',
      mesuresPreventionPrevues: '',
      equipementsNecessaires: '',
      responsableMiseEnOeuvre: '',
      personnelConcerne: '',
      delaiMiseEnOeuvre: '',
      verification: false,
    });
    setEditingIndex(null);
  };

  const modifierRisque = (index: number) => {
    setCurrentRisque(risques[index]);
    setEditingIndex(index);
  };

  const sauvegarderRisque = () => {
    if (!validerRisque()) {
      return;
    }

    const nouveauRisque = { ...currentRisque };
    if (editingIndex !== null) {
      // Modifier un risque existant
      const updatedRisques = [...risques];
      updatedRisques[editingIndex] = nouveauRisque;
      onRisquesChange(updatedRisques);
    } else {
      // Ajouter un nouveau risque
      onRisquesChange([...risques, nouveauRisque]);
    }

    // Réinitialiser le formulaire
    ajouterRisque();
  };

  const annulerEdition = () => {
    ajouterRisque();
  };

  const supprimerRisque = (index: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce risque ?')) {
      onRisquesChange(risques.filter((_, i) => i !== index));
    }
  };

  const validerRisque = (): boolean => {
    if (!currentRisque.categoriePrincipale) {
      alert('Veuillez sélectionner une catégorie principale');
      return false;
    }
    if (!currentRisque.sousCategorie) {
      alert('Veuillez sélectionner une sous-catégorie');
      return false;
    }
    if (!currentRisque.risqueIdentifie.trim()) {
      alert('Veuillez décrire le risque identifié');
      return false;
    }
    if (!currentRisque.niveauGravite) {
      alert('Veuillez sélectionner le niveau de gravité');
      return false;
    }
    if (!currentRisque.probabilite) {
      alert('Veuillez sélectionner la probabilité');
      return false;
    }
    if (!currentRisque.mesuresPreventionPrevues.trim()) {
      alert('Veuillez décrire les mesures de prévention');
      return false;
    }
    if (!currentRisque.responsableMiseEnOeuvre) {
      alert('Veuillez indiquer le responsable de la mise en œuvre');
      return false;
    }
    return true;
  };

  const getNiveauRisqueColor = (niveau: string) => {
    switch (niveau) {
      case 'faible':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'moyen':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'eleve':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'critique':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategorieColor = (categorie: string) => {
    const colors: Record<string, string> = {
      environnement: 'bg-green-100 text-green-800',
      social: 'bg-blue-100 text-blue-800',
      sante_securite: 'bg-red-100 text-red-800',
      infrastructure: 'bg-orange-100 text-orange-800',
    };
    return colors[categorie] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Formulaire d'ajout/édition */}
      <Card className="border-2 border-primary-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary-600" />
            {editingIndex !== null ? 'Modifier le risque' : 'Ajouter un risque'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section 1: Catégorisation */}
          <div className="border-l-4 border-primary-500 pl-4">
            <h3 className="font-semibold text-lg mb-4 text-primary-900">
              1. Catégorisation du risque
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Catégorie principale *"
                options={[
                  { value: '', label: 'Sélectionnez une catégorie' },
                  { value: 'environnement', label: 'Risques liés à l\'environnement' },
                  { value: 'social', label: 'Risque Social' },
                  { value: 'sante_securite', label: 'Risque lié à la santé et sécurité' },
                  { value: 'infrastructure', label: 'Risque lié aux installations/infrastructures' },
                ]}
                value={currentRisque.categoriePrincipale}
                onChange={(e) =>
                  setCurrentRisque({ ...currentRisque, categoriePrincipale: e.target.value as 'environnement' | 'social' | 'sante_securite' | 'infrastructure' | '' })
                }
                required
              />

              <Select
                label="Sous-catégorie *"
                options={[
                  { value: '', label: 'Sélectionnez une sous-catégorie' },
                  ...sousCategoriesDisponibles,
                ]}
                value={currentRisque.sousCategorie}
                onChange={(e) =>
                  setCurrentRisque({ ...currentRisque, sousCategorie: e.target.value })
                }
                disabled={!currentRisque.categoriePrincipale}
                required
              />
            </div>
          </div>

          {/* Section 2: Description du risque */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-lg mb-4 text-blue-900">
              2. Description du risque
            </h3>
            <div className="space-y-4">
              <Textarea
                label="Risque identifié *"
                value={currentRisque.risqueIdentifie}
                onChange={(e) =>
                  setCurrentRisque({ ...currentRisque, risqueIdentifie: e.target.value })
                }
                placeholder="Décrivez précisément le risque identifié..."
                rows={3}
                required
              />

              <Textarea
                label="Nature et localisation *"
                value={currentRisque.natureLocalisation}
                onChange={(e) =>
                  setCurrentRisque({ ...currentRisque, natureLocalisation: e.target.value })
                }
                placeholder="Où et comment ce risque se manifeste-t-il ?"
                rows={3}
                required
              />
            </div>
          </div>

          {/* Section 3: Évaluation du risque */}
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-semibold text-lg mb-4 text-yellow-900">3. Évaluation du risque</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Niveau de gravité *"
                options={[
                  { value: '', label: 'Sélectionnez' },
                  { value: 'faible', label: 'Faible' },
                  { value: 'moyen', label: 'Moyen' },
                  { value: 'eleve', label: 'Élevé' },
                  { value: 'critique', label: 'Critique' },
                ]}
                value={currentRisque.niveauGravite}
                onChange={(e) =>
                  setCurrentRisque({ ...currentRisque, niveauGravite: e.target.value as 'faible' | 'moyen' | 'eleve' | 'critique' | '' })
                }
                required
              />

              <Select
                label="Probabilité d'occurrence *"
                options={[
                  { value: '', label: 'Sélectionnez' },
                  { value: 'faible', label: 'Faible' },
                  { value: 'moyenne', label: 'Moyenne' },
                  { value: 'elevee', label: 'Élevée' },
                ]}
                value={currentRisque.probabilite}
                onChange={(e) =>
                  setCurrentRisque({ ...currentRisque, probabilite: e.target.value as 'faible' | 'moyenne' | 'elevee' | '' })
                }
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau de risque (calculé)
                </label>
                <div
                  className={`px-4 py-2 rounded-lg border-2 text-center font-semibold ${getNiveauRisqueColor(
                    currentRisque.niveauRisque
                  )}`}
                >
                  {currentRisque.niveauRisque
                    ? currentRisque.niveauRisque.toUpperCase()
                    : 'Non calculé'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Mesures de prévention */}
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-semibold text-lg mb-4 text-green-900">
              4. Mesures de prévention
            </h3>
            <div className="space-y-4">
              <Textarea
                label="Mesures de prévention prévues *"
                value={currentRisque.mesuresPreventionPrevues}
                onChange={(e) =>
                  setCurrentRisque({ ...currentRisque, mesuresPreventionPrevues: e.target.value })
                }
                placeholder="Listez toutes les mesures de prévention à mettre en place..."
                rows={4}
                required
              />

              <Input
                label="Équipements nécessaires"
                value={currentRisque.equipementsNecessaires}
                onChange={(e) =>
                  setCurrentRisque({ ...currentRisque, equipementsNecessaires: e.target.value })
                }
                placeholder="EPI, matériel de sécurité, etc."
              />
            </div>
          </div>

          {/* Section 5: Responsabilités et suivi */}
          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="font-semibold text-lg mb-4 text-purple-900">
              5. Responsabilités et suivi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Responsable de la mise en œuvre *"
                options={[
                  { value: '', label: 'Sélectionnez' },
                  { value: 'toa', label: 'TOA (Donneur d\'Ordre)' },
                  { value: 'prestataire', label: 'Prestataire' },
                ]}
                value={currentRisque.responsableMiseEnOeuvre}
                onChange={(e) =>
                  setCurrentRisque({
                    ...currentRisque,
                    responsableMiseEnOeuvre: e.target.value as 'toa' | 'prestataire' | '',
                  })
                }
                required
              />

              <Input
                label="Personnel concerné"
                value={currentRisque.personnelConcerne}
                onChange={(e) =>
                  setCurrentRisque({ ...currentRisque, personnelConcerne: e.target.value })
                }
                placeholder="Qui est affecté par ce risque ?"
              />

              <Input
                label="Délai de mise en œuvre"
                value={currentRisque.delaiMiseEnOeuvre}
                onChange={(e) =>
                  setCurrentRisque({ ...currentRisque, delaiMiseEnOeuvre: e.target.value })
                }
                placeholder="Ex: Avant démarrage, J+7, etc."
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {editingIndex !== null && (
              <Button type="button" variant="outline" onClick={annulerEdition}>
                Annuler
              </Button>
            )}
            <Button type="button" onClick={sauvegarderRisque}>
              {editingIndex !== null ? 'Mettre à jour' : 'Ajouter le risque'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des risques ajoutés */}
      <Card>
        <CardHeader>
          <CardTitle>Risques identifiés ({risques.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {risques.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                Aucun risque identifié. Utilisez le formulaire ci-dessus pour ajouter des risques.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {risques.map((risque, index) => (
                <div
                  key={risque.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategorieColor(
                            risque.categoriePrincipale
                          )}`}
                        >
                          {risque.categoriePrincipale && CATEGORIES_RISQUES[risque.categoriePrincipale]?.label || risque.categoriePrincipale}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${getNiveauRisqueColor(
                            risque.niveauRisque
                          )}`}
                        >
                          Risque {risque.niveauRisque?.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{risque.risqueIdentifie}</h4>
                      <p className="text-sm text-gray-600 mb-2">{risque.natureLocalisation}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        type="button"
                        onClick={() => modifierRisque(index)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => supprimerRisque(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Sous-catégorie:</span>
                      <p className="text-gray-600">
                        {sousCategoriesDisponibles.find((sc) => sc.value === risque.sousCategorie)
                          ?.label || risque.sousCategorie}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Responsable:</span>
                      <p className="text-gray-600">
                        {risque.responsableMiseEnOeuvre === 'toa' ? 'TOA' : 'Prestataire'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Mesures de prévention:</span>
                      <p className="text-gray-600">{risque.mesuresPreventionPrevues}</p>
                    </div>
                    {risque.equipementsNecessaires && (
                      <div>
                        <span className="font-medium text-gray-700">Équipements:</span>
                        <p className="text-gray-600">{risque.equipementsNecessaires}</p>
                      </div>
                    )}
                    {risque.delaiMiseEnOeuvre && (
                      <div>
                        <span className="font-medium text-gray-700">Délai:</span>
                        <p className="text-gray-600">{risque.delaiMiseEnOeuvre}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
