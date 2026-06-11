import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Checkbox from '@/components/ui/Checkbox';
import Select from '@/components/ui/Select';
import { AlertTriangle, CheckCircle2, Eye, Search, Shield, Play } from 'lucide-react';
import type { Take5Record, RisqueEvalue, MesureControle } from '@/types';

interface Take5FormProps {
  interventionId: string;
  onSubmit: (take5: Omit<Take5Record, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
  initialData?: Partial<Take5Record>;
}

export default function Take5Form({
  interventionId,
  onSubmit,
  onCancel,
  initialData,
}: Take5FormProps) {
  const [formData, setFormData] = useState({
    responsableNom: initialData?.responsableNom || '',
    equipe: initialData?.equipe || [],
    localisation: initialData?.localisation || '',
    tacheDescription: initialData?.tacheDescription || '',

    // Étape 1: Arrêter
    etape1_arreter: {
      complete: initialData?.etape1_arreter?.complete || false,
      observations: initialData?.etape1_arreter?.observations || '',
    },

    // Étape 2: Observer
    etape2_observer: {
      complete: initialData?.etape2_observer?.complete || false,
      dangersIdentifies: initialData?.etape2_observer?.dangersIdentifies || [],
      autresDangers: initialData?.etape2_observer?.autresDangers || '',
    },

    // Étape 3: Analyser
    etape3_analyser: {
      complete: initialData?.etape3_analyser?.complete || false,
      risquesEvalues: initialData?.etape3_analyser?.risquesEvalues || [],
    },

    // Étape 4: Contrôler
    etape4_controler: {
      complete: initialData?.etape4_controler?.complete || false,
      mesuresControle: initialData?.etape4_controler?.mesuresControle || [],
    },

    // Étape 5: Procéder
    etape5_proceder: {
      complete: initialData?.etape5_proceder?.complete || false,
      securiteConfirmee: initialData?.etape5_proceder?.securiteConfirmee || false,
      autorisationProceder: initialData?.etape5_proceder?.autorisationProceder || false,
    },
  });

  const [nouveauMembre, setNouveauMembre] = useState('');
  const [nouveauRisque, setNouveauRisque] = useState<RisqueEvalue>({
    danger: '',
    niveauRisque: 'faible',
    probabilite: 'faible',
    gravite: 'mineure',
  });
  const [nouvelleMesure, setNouvelleMesure] = useState<MesureControle>({
    type: 'epi',
    description: '',
    miseEnPlace: false,
    responsable: '',
  });

  const dangersCommuns = [
    'Travail en hauteur',
    'Risque électrique',
    'Chute d\'objets',
    'Risque chimique',
    'Manutention manuelle',
    'Conditions météo',
    'Circulation véhicules',
    'Espaces confinés',
    'Machines en mouvement',
    'Surfaces glissantes',
  ];

  const addMembre = () => {
    if (nouveauMembre.trim()) {
      setFormData({
        ...formData,
        equipe: [...formData.equipe, nouveauMembre.trim()],
      });
      setNouveauMembre('');
    }
  };

  const removeMembre = (index: number) => {
    setFormData({
      ...formData,
      equipe: formData.equipe.filter((_, i) => i !== index),
    });
  };

  const toggleDanger = (danger: string) => {
    const currentDangers = formData.etape2_observer.dangersIdentifies;
    const newDangers = currentDangers.includes(danger)
      ? currentDangers.filter((d) => d !== danger)
      : [...currentDangers, danger];

    setFormData({
      ...formData,
      etape2_observer: {
        ...formData.etape2_observer,
        dangersIdentifies: newDangers,
      },
    });
  };

  const addRisque = () => {
    if (nouveauRisque.danger.trim()) {
      setFormData({
        ...formData,
        etape3_analyser: {
          ...formData.etape3_analyser,
          risquesEvalues: [...formData.etape3_analyser.risquesEvalues, nouveauRisque],
        },
      });
      setNouveauRisque({
        danger: '',
        niveauRisque: 'faible',
        probabilite: 'faible',
        gravite: 'mineure',
      });
    }
  };

  const removeRisque = (index: number) => {
    setFormData({
      ...formData,
      etape3_analyser: {
        ...formData.etape3_analyser,
        risquesEvalues: formData.etape3_analyser.risquesEvalues.filter((_, i) => i !== index),
      },
    });
  };

  const addMesure = () => {
    if (nouvelleMesure.description.trim()) {
      setFormData({
        ...formData,
        etape4_controler: {
          ...formData.etape4_controler,
          mesuresControle: [...formData.etape4_controler.mesuresControle, nouvelleMesure],
        },
      });
      setNouvelleMesure({
        type: 'epi',
        description: '',
        miseEnPlace: false,
        responsable: '',
      });
    }
  };

  const removeMesure = (index: number) => {
    setFormData({
      ...formData,
      etape4_controler: {
        ...formData.etape4_controler,
        mesuresControle: formData.etape4_controler.mesuresControle.filter((_, i) => i !== index),
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const take5Data: Omit<Take5Record, 'id' | 'createdAt' | 'updatedAt'> = {
      interventionId,
      date: now,
      heure: now.toTimeString().slice(0, 5),
      responsableNom: formData.responsableNom,
      equipe: formData.equipe,
      localisation: formData.localisation,
      tacheDescription: formData.tacheDescription,
      etape1_arreter: formData.etape1_arreter,
      etape2_observer: formData.etape2_observer,
      etape3_analyser: formData.etape3_analyser,
      etape4_controler: formData.etape4_controler,
      etape5_proceder: formData.etape5_proceder,
      transmisHSE: false,
    };

    onSubmit(take5Data);
  };

  const isFormValid = () => {
    return (
      formData.responsableNom.trim() !== '' &&
      formData.equipe.length > 0 &&
      formData.localisation.trim() !== '' &&
      formData.tacheDescription.trim() !== '' &&
      formData.etape1_arreter.complete &&
      formData.etape2_observer.complete &&
      formData.etape3_analyser.complete &&
      formData.etape4_controler.complete &&
      formData.etape5_proceder.complete &&
      formData.etape5_proceder.securiteConfirmee &&
      formData.etape5_proceder.autorisationProceder
    );
  };

  const getNiveauRisqueColor = (niveau: string) => {
    switch (niveau) {
      case 'faible':
        return 'bg-green-100 text-green-800';
      case 'moyen':
        return 'bg-yellow-100 text-yellow-800';
      case 'eleve':
        return 'bg-orange-100 text-orange-800';
      case 'critique':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header avec logo Take 5 */}
      <Card className="bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Take 5 - Évaluation de Sécurité</CardTitle>
              <CardDescription>
                Pause de 5 minutes pour identifier et contrôler les risques avant de commencer
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Informations de base */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Responsable *"
              value={formData.responsableNom}
              onChange={(e) => setFormData({ ...formData, responsableNom: e.target.value })}
              placeholder="Nom du responsable"
              required
            />
            <Input
              label="Localisation *"
              value={formData.localisation}
              onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
              placeholder="Zone précise d'intervention"
              required
            />
          </div>

          <Textarea
            label="Description de la tâche *"
            value={formData.tacheDescription}
            onChange={(e) => setFormData({ ...formData, tacheDescription: e.target.value })}
            placeholder="Décrire la tâche à réaliser..."
            rows={3}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Équipe présente * (au moins 1 membre)
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={nouveauMembre}
                onChange={(e) => setNouveauMembre(e.target.value)}
                placeholder="Nom du membre de l'équipe"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMembre())}
              />
              <Button type="button" onClick={addMembre} variant="outline">
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.equipe.map((membre, index) => (
                <div
                  key={index}
                  className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {membre}
                  <button
                    type="button"
                    onClick={() => removeMembre(index)}
                    className="text-primary-900 hover:text-primary-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Étape 1: ARRÊTER */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-700 font-bold text-lg">1</span>
            </div>
            <div>
              <CardTitle>ARRÊTER</CardTitle>
              <CardDescription>Prenez le temps de faire une pause avant de commencer</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Checkbox
            label="J'ai pris le temps de m'arrêter et de réfléchir avant de commencer"
            checked={formData.etape1_arreter.complete}
            onChange={(e) =>
              setFormData({
                ...formData,
                etape1_arreter: {
                  ...formData.etape1_arreter,
                  complete: e.target.checked,
                },
              })
            }
          />
          <Textarea
            label="Observations"
            value={formData.etape1_arreter.observations}
            onChange={(e) =>
              setFormData({
                ...formData,
                etape1_arreter: {
                  ...formData.etape1_arreter,
                  observations: e.target.value,
                },
              })
            }
            placeholder="Notes sur la préparation..."
            rows={2}
          />
        </CardContent>
      </Card>

      {/* Étape 2: OBSERVER */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Eye className="h-5 w-5 text-orange-700" />
            </div>
            <div>
              <CardTitle>OBSERVER</CardTitle>
              <CardDescription>Identifiez tous les dangers potentiels</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dangers identifiés (sélectionnez tous ceux qui s'appliquent)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {dangersCommuns.map((danger) => (
                <div
                  key={danger}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.etape2_observer.dangersIdentifies.includes(danger)
                      ? 'bg-orange-50 border-orange-500 text-orange-900'
                      : 'bg-white border-gray-300 hover:border-orange-300'
                  }`}
                  onClick={() => toggleDanger(danger)}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.etape2_observer.dangersIdentifies.includes(danger)}
                      onChange={() => toggleDanger(danger)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{danger}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Textarea
            label="Autres dangers identifiés"
            value={formData.etape2_observer.autresDangers}
            onChange={(e) =>
              setFormData({
                ...formData,
                etape2_observer: {
                  ...formData.etape2_observer,
                  autresDangers: e.target.value,
                },
              })
            }
            placeholder="Décrivez d'autres dangers spécifiques..."
            rows={2}
          />

          <Checkbox
            label="J'ai observé et identifié tous les dangers potentiels"
            checked={formData.etape2_observer.complete}
            onChange={(e) =>
              setFormData({
                ...formData,
                etape2_observer: {
                  ...formData.etape2_observer,
                  complete: e.target.checked,
                },
              })
            }
          />
        </CardContent>
      </Card>

      {/* Étape 3: ANALYSER */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Search className="h-5 w-5 text-yellow-700" />
            </div>
            <div>
              <CardTitle>ANALYSER</CardTitle>
              <CardDescription>Évaluez les risques associés à chaque danger</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium text-gray-900">Ajouter une évaluation de risque</h4>
            <Input
              label="Danger"
              value={nouveauRisque.danger}
              onChange={(e) => setNouveauRisque({ ...nouveauRisque, danger: e.target.value })}
              placeholder="Ex: Chute de hauteur depuis le pylône"
            />
            <div className="grid grid-cols-3 gap-3">
              <Select
                label="Probabilité"
                options={[
                  { value: 'faible', label: 'Faible' },
                  { value: 'moyenne', label: 'Moyenne' },
                  { value: 'elevee', label: 'Élevée' },
                ]}
                value={nouveauRisque.probabilite}
                onChange={(e) =>
                  setNouveauRisque({ ...nouveauRisque, probabilite: e.target.value as 'faible' | 'moyenne' | 'elevee' })
                }
              />
              <Select
                label="Gravité"
                options={[
                  { value: 'mineure', label: 'Mineure' },
                  { value: 'moderee', label: 'Modérée' },
                  { value: 'grave', label: 'Grave' },
                  { value: 'critique', label: 'Critique' },
                ]}
                value={nouveauRisque.gravite}
                onChange={(e) =>
                  setNouveauRisque({ ...nouveauRisque, gravite: e.target.value as 'mineure' | 'moderee' | 'grave' | 'critique' })
                }
              />
              <Select
                label="Niveau de risque"
                options={[
                  { value: 'faible', label: 'Faible' },
                  { value: 'moyen', label: 'Moyen' },
                  { value: 'eleve', label: 'Élevé' },
                  { value: 'critique', label: 'Critique' },
                ]}
                value={nouveauRisque.niveauRisque}
                onChange={(e) =>
                  setNouveauRisque({ ...nouveauRisque, niveauRisque: e.target.value as 'faible' | 'moyen' | 'eleve' | 'critique' })
                }
              />
            </div>
            <Button type="button" onClick={addRisque} variant="outline" className="w-full">
              Ajouter le risque
            </Button>
          </div>

          <div className="space-y-2">
            {formData.etape3_analyser.risquesEvalues.map((risque, index) => (
              <div key={index} className="bg-white border border-gray-200 p-3 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{risque.danger}</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        Probabilité: {risque.probabilite}
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        Gravité: {risque.gravite}
                      </span>
                      <span className={`px-2 py-1 rounded font-medium ${getNiveauRisqueColor(risque.niveauRisque)}`}>
                        Niveau: {risque.niveauRisque}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRisque(index)}
                    className="text-red-600 hover:text-red-700 ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Checkbox
            label="J'ai analysé et évalué tous les risques identifiés"
            checked={formData.etape3_analyser.complete}
            onChange={(e) =>
              setFormData({
                ...formData,
                etape3_analyser: {
                  ...formData.etape3_analyser,
                  complete: e.target.checked,
                },
              })
            }
          />
        </CardContent>
      </Card>

      {/* Étape 4: CONTRÔLER */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <CardTitle>CONTRÔLER</CardTitle>
              <CardDescription>Mettez en place les mesures de contrôle nécessaires</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium text-gray-900">Ajouter une mesure de contrôle</h4>
            <Select
              label="Type de mesure"
              options={[
                { value: 'elimination', label: 'Élimination' },
                { value: 'substitution', label: 'Substitution' },
                { value: 'controle_ingenierie', label: 'Contrôle d\'ingénierie' },
                { value: 'controle_administratif', label: 'Contrôle administratif' },
                { value: 'epi', label: 'Équipement de Protection Individuelle (EPI)' },
              ]}
              value={nouvelleMesure.type}
              onChange={(e) => setNouvelleMesure({ ...nouvelleMesure, type: e.target.value as 'elimination' | 'substitution' | 'controle_ingenierie' | 'controle_administratif' | 'epi' })}
            />
            <Textarea
              label="Description de la mesure"
              value={nouvelleMesure.description}
              onChange={(e) =>
                setNouvelleMesure({ ...nouvelleMesure, description: e.target.value })
              }
              placeholder="Ex: Port du harnais complet avec double longe"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Responsable"
                value={nouvelleMesure.responsable}
                onChange={(e) =>
                  setNouvelleMesure({ ...nouvelleMesure, responsable: e.target.value })
                }
                placeholder="Nom du responsable"
              />
              <div className="flex items-end">
                <Checkbox
                  label="Mesure mise en place"
                  checked={nouvelleMesure.miseEnPlace}
                  onChange={(e) =>
                    setNouvelleMesure({ ...nouvelleMesure, miseEnPlace: e.target.checked })
                  }
                />
              </div>
            </div>
            <Button type="button" onClick={addMesure} variant="outline" className="w-full">
              Ajouter la mesure
            </Button>
          </div>

          <div className="space-y-2">
            {formData.etape4_controler.mesuresControle.map((mesure, index) => (
              <div key={index} className="bg-white border border-gray-200 p-3 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {mesure.type.replace(/_/g, ' ')}
                      </span>
                      {mesure.miseEnPlace && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-gray-900">{mesure.description}</p>
                    <p className="text-sm text-gray-600 mt-1">Responsable: {mesure.responsable}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMesure(index)}
                    className="text-red-600 hover:text-red-700 ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Checkbox
            label="Toutes les mesures de contrôle nécessaires ont été identifiées et mises en place"
            checked={formData.etape4_controler.complete}
            onChange={(e) =>
              setFormData({
                ...formData,
                etape4_controler: {
                  ...formData.etape4_controler,
                  complete: e.target.checked,
                },
              })
            }
          />
        </CardContent>
      </Card>

      {/* Étape 5: PROCÉDER */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Play className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <CardTitle>PROCÉDER</CardTitle>
              <CardDescription>Vérification finale avant de commencer le travail</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg space-y-3">
            <Checkbox
              label={
                <span className="font-medium">
                  Je confirme que toutes les mesures de sécurité sont en place et que je peux
                  procéder en toute sécurité
                </span>
              }
              checked={formData.etape5_proceder.securiteConfirmee}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  etape5_proceder: {
                    ...formData.etape5_proceder,
                    securiteConfirmee: e.target.checked,
                  },
                })
              }
            />
            <Checkbox
              label={
                <span className="font-medium">
                  J'autorise l'équipe à procéder avec les travaux
                </span>
              }
              checked={formData.etape5_proceder.autorisationProceder}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  etape5_proceder: {
                    ...formData.etape5_proceder,
                    autorisationProceder: e.target.checked,
                  },
                })
              }
            />
          </div>

          <Checkbox
            label="Étape de vérification finale complétée"
            checked={formData.etape5_proceder.complete}
            onChange={(e) =>
              setFormData({
                ...formData,
                etape5_proceder: {
                  ...formData.etape5_proceder,
                  complete: e.target.checked,
                },
              })
            }
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <div className="flex-1" />
        <div className="text-sm text-gray-600">
          {isFormValid() ? (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Prêt à soumettre
            </span>
          ) : (
            <span className="text-orange-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Veuillez compléter toutes les étapes
            </span>
          )}
        </div>
        <Button type="submit" disabled={!isFormValid()}>
          Valider le Take 5
        </Button>
      </div>
    </form>
  );
}
