import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Checkbox from '@/components/ui/Checkbox';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

interface RisquesActivites {
  environnement: {
    actif: boolean;
    pollutions: boolean;
    incendie: boolean;
  };
  social: {
    actif: boolean;
    contestationRiveraine: boolean;
    surete: boolean;
    autres: string;
  };
  santeSécurite: {
    actif: boolean;
    accidentSecuriteRoutiere: boolean;
    risqueChimique: boolean;
    risqueHauteur: boolean;
    risqueEnsevelissement: boolean;
    risqueNoyade: boolean;
    risqueElectrique: boolean;
    risqueOutilsMain: boolean;
    risqueOutillageElectroportatif: boolean;
    accidentManutentionMecanique: boolean;
    accidentManutentionManuelle: boolean;
    risqueTravauxChaud: boolean;
    risqueTravauxIsole: boolean;
    risqueCoactivites: boolean;
    risqueAmbianceThermique: boolean;
    risqueBruit: boolean;
    risquesPsychosociaux: boolean;
    risqueMaladiesInfectieuses: boolean;
    risquePaludisme: boolean;
    autres: string;
  };
  infrastructures: {
    actif: boolean;
    risqueAccesSite: boolean;
    risqueEtatInfrastructures: boolean;
    autresRooftop: string;
  };
}

interface DetailRisque {
  id: string;
  detailRisque: string;
  natureLocalisation: string;
  mesuresProtection: string;
  misesEnOeuvrePar: 'toa' | 'prestataire';
}

interface SecuriteRoutiere {
  gestionTempsPause: boolean;
  formationConductionDefensive: boolean;
  chauffeurApteMedicalement: boolean;
  planTrajet: boolean;
  geolocalisationFlottes: boolean;
  checklistAvantDepart: boolean;
  respectReglementsVehicule: boolean;
  maintenancePeriodique: boolean;
}

interface RisquesIdentifiesSectionProps {
  risquesActivites: RisquesActivites;
  onRisquesActivitesChange: (risques: RisquesActivites) => void;
  detailsRisques: DetailRisque[];
  onDetailsRisquesChange: (details: DetailRisque[]) => void;
  securiteRoutiere: SecuriteRoutiere;
  onSecuriteRoutiereChange: (securite: SecuriteRoutiere) => void;
}

export default function RisquesIdentifiesSection({
  risquesActivites,
  onRisquesActivitesChange,
  detailsRisques,
  onDetailsRisquesChange,
  securiteRoutiere,
  onSecuriteRoutiereChange,
}: RisquesIdentifiesSectionProps) {
  const addRisque = () => {
    const newRisque: DetailRisque = {
      id: `risque-${Date.now()}`,
      detailRisque: '',
      natureLocalisation: '',
      mesuresProtection: '',
      misesEnOeuvrePar: 'prestataire',
    };
    onDetailsRisquesChange([...detailsRisques, newRisque]);
  };

  const removeRisque = (id: string) => {
    onDetailsRisquesChange(detailsRisques.filter((r) => r.id !== id));
  };

  const updateRisque = (id: string, field: keyof DetailRisque, value: string | 'toa' | 'prestataire') => {
    onDetailsRisquesChange(
      detailsRisques.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  return (
    <div className="space-y-6">
      {/* Titre principal */}
      <Card className="border-2 border-primary-200 bg-primary-50">
        <CardHeader>
          <CardTitle className="text-xl text-primary-900 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            RISQUES DUS AUX ACTIVITÉS ET INSTALLATIONS ET DE L'ENTREPRISE PRESTATAIRE
          </CardTitle>
          <p className="text-sm text-primary-700 mt-2">
            Identification les risques générés par les activités.
          </p>
        </CardHeader>
      </Card>

      {/* Tableau principal des catégories de risques */}
      <Card>
        <CardHeader>
          <CardTitle>Catégorie de risques</CardTitle>
          <p className="text-sm text-gray-600">
            Cochez toutes les catégories et sous-types de risques applicables à votre intervention
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Risques liés à l'environnement */}
          <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
            <div className="space-y-3">
              <Checkbox
                label={
                  <span className="text-lg font-semibold text-green-900">
                    Risques liés à l'environnement
                  </span>
                }
                checked={risquesActivites.environnement.actif}
                onChange={(e) =>
                  onRisquesActivitesChange({
                    ...risquesActivites,
                    environnement: {
                      ...risquesActivites.environnement,
                      actif: e.target.checked,
                    },
                  })
                }
              />

              {risquesActivites.environnement.actif && (
                <div className="ml-8 space-y-2 border-l-2 border-green-300 pl-4">
                  <Checkbox
                    label="Pollutions (déversement)"
                    checked={risquesActivites.environnement.pollutions}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        environnement: {
                          ...risquesActivites.environnement,
                          pollutions: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Incendie"
                    checked={risquesActivites.environnement.incendie}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        environnement: {
                          ...risquesActivites.environnement,
                          incendie: e.target.checked,
                        },
                      })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Risque Social */}
          <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
            <div className="space-y-3">
              <Checkbox
                label={
                  <span className="text-lg font-semibold text-blue-900">Risque Social</span>
                }
                checked={risquesActivites.social.actif}
                onChange={(e) =>
                  onRisquesActivitesChange({
                    ...risquesActivites,
                    social: {
                      ...risquesActivites.social,
                      actif: e.target.checked,
                    },
                  })
                }
              />

              {risquesActivites.social.actif && (
                <div className="ml-8 space-y-2 border-l-2 border-blue-300 pl-4">
                  <Checkbox
                    label="Contestation riveraine"
                    checked={risquesActivites.social.contestationRiveraine}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        social: {
                          ...risquesActivites.social,
                          contestationRiveraine: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Sureté"
                    checked={risquesActivites.social.surete}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        social: {
                          ...risquesActivites.social,
                          surete: e.target.checked,
                        },
                      })
                    }
                  />
                  <Input
                    label="Autre(s) à préciser :"
                    value={risquesActivites.social.autres}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        social: {
                          ...risquesActivites.social,
                          autres: e.target.value,
                        },
                      })
                    }
                    placeholder="Précisez les autres risques sociaux..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Risque lié à la santé et sécurité */}
          <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
            <div className="space-y-3">
              <Checkbox
                label={
                  <span className="text-lg font-semibold text-red-900">
                    Risque lié à la santé et sécurité
                  </span>
                }
                checked={risquesActivites.santeSécurite.actif}
                onChange={(e) =>
                  onRisquesActivitesChange({
                    ...risquesActivites,
                    santeSécurite: {
                      ...risquesActivites.santeSécurite,
                      actif: e.target.checked,
                    },
                  })
                }
              />

              {risquesActivites.santeSécurite.actif && (
                <div className="ml-8 space-y-2 border-l-2 border-red-300 pl-4">
                  <Checkbox
                    label="Accident lié à la sécurité routière"
                    checked={risquesActivites.santeSécurite.accidentSecuriteRoutiere}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          accidentSecuriteRoutiere: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risque chimique"
                    checked={risquesActivites.santeSécurite.risqueChimique}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risqueChimique: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risque en hauteur"
                    checked={risquesActivites.santeSécurite.risqueHauteur}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risqueHauteur: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risque d'ensevelissement et/ou effondrement"
                    checked={risquesActivites.santeSécurite.risqueEnsevelissement}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risqueEnsevelissement: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risque de noyade"
                    checked={risquesActivites.santeSécurite.risqueNoyade}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risqueNoyade: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risques liés aux installations électrique"
                    checked={risquesActivites.santeSécurite.risqueElectrique}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risqueElectrique: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risque lié à la manipulation des outils à la main"
                    checked={risquesActivites.santeSécurite.risqueOutilsMain}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risqueOutilsMain: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risque lié à la manipulation des outillages électroportatifs"
                    checked={risquesActivites.santeSécurite.risqueOutillageElectroportatif}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risqueOutillageElectroportatif: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Accident lié à manutention mécanique"
                    checked={risquesActivites.santeSécurite.accidentManutentionMecanique}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          accidentManutentionMecanique: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Accident lié à manutention manuelle"
                    checked={risquesActivites.santeSécurite.accidentManutentionManuelle}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          accidentManutentionManuelle: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risque lié au travail à chaud"
                    checked={risquesActivites.santeSécurite.risqueTravauxChaud}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risqueTravauxChaud: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risque lié au travail isolé"
                    checked={risquesActivites.santeSécurite.risqueTravauxIsole}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risqueTravauxIsole: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risque lié aux coactivités"
                    checked={risquesActivites.santeSécurite.risqueCoactivites}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risqueCoactivites: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risque lié à l'ambiance thermique"
                    checked={risquesActivites.santeSécurite.risqueAmbianceThermique}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risqueAmbianceThermique: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risque lié au bruit"
                    checked={risquesActivites.santeSécurite.risqueBruit}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risqueBruit: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risques psychosociaux"
                    checked={risquesActivites.santeSécurite.risquesPsychosociaux}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risquesPsychosociaux: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risque face aux maladies infectieuses"
                    checked={risquesActivites.santeSécurite.risqueMaladiesInfectieuses}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risqueMaladiesInfectieuses: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risque du paludisme"
                    checked={risquesActivites.santeSécurite.risquePaludisme}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          risquePaludisme: e.target.checked,
                        },
                      })
                    }
                  />
                  <Input
                    label="Autre(s) à préciser :"
                    value={risquesActivites.santeSécurite.autres}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        santeSécurite: {
                          ...risquesActivites.santeSécurite,
                          autres: e.target.value,
                        },
                      })
                    }
                    placeholder="Précisez les autres risques de santé et sécurité..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Risque lié aux installation/infrastructure existants */}
          <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
            <div className="space-y-3">
              <Checkbox
                label={
                  <span className="text-lg font-semibold text-orange-900">
                    Risque lié aux installation/infrastructure existants
                  </span>
                }
                checked={risquesActivites.infrastructures.actif}
                onChange={(e) =>
                  onRisquesActivitesChange({
                    ...risquesActivites,
                    infrastructures: {
                      ...risquesActivites.infrastructures,
                      actif: e.target.checked,
                    },
                  })
                }
              />

              {risquesActivites.infrastructures.actif && (
                <div className="ml-8 space-y-2 border-l-2 border-orange-300 pl-4">
                  <Checkbox
                    label="Risques liés à l'accès sur site"
                    checked={risquesActivites.infrastructures.risqueAccesSite}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        infrastructures: {
                          ...risquesActivites.infrastructures,
                          risqueAccesSite: e.target.checked,
                        },
                      })
                    }
                  />
                  <Checkbox
                    label="Risques liés à l'état des infrastructures existants (Greenfield, Rooftop)"
                    checked={risquesActivites.infrastructures.risqueEtatInfrastructures}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        infrastructures: {
                          ...risquesActivites.infrastructures,
                          risqueEtatInfrastructures: e.target.checked,
                        },
                      })
                    }
                  />
                  <Input
                    label="Autre(s) à préciser pour le site Rooftop :"
                    value={risquesActivites.infrastructures.autresRooftop}
                    onChange={(e) =>
                      onRisquesActivitesChange({
                        ...risquesActivites,
                        infrastructures: {
                          ...risquesActivites.infrastructures,
                          autresRooftop: e.target.value,
                        },
                      })
                    }
                    placeholder="Précisez les autres risques pour le site Rooftop..."
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900 font-medium">
            Détailler, pour chaque risque identifié, sa nature et sa localisation ainsi que les
            mesures de prévention prises. Et Indiquer le responsable de la mise en œuvre (TOA /
            Prestataire)
          </p>
        </CardContent>
      </Card>

      {/* Tableau n°1 : Détails des risques */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tableau n°1 : Détail du risque identifié</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Détaillez chaque risque coché ci-dessus
              </p>
            </div>
            <Button type="button" variant="outline" onClick={addRisque}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un risque
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {detailsRisques.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                Aucun risque détaillé. Cliquez sur "Ajouter un risque" pour commencer.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* En-tête du tableau */}
              <div className="grid grid-cols-12 gap-4 p-3 bg-gray-100 rounded-lg font-semibold text-sm">
                <div className="col-span-3">Détail du risque identifié</div>
                <div className="col-span-3">Nature et localisation</div>
                <div className="col-span-3">Mesures de protection à prendre</div>
                <div className="col-span-2">Mises en œuvre par</div>
                <div className="col-span-1 text-center">Actions</div>
              </div>

              {/* Lignes du tableau */}
              {detailsRisques.map((risque) => (
                <div
                  key={risque.id}
                  className="grid grid-cols-12 gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="col-span-3">
                    <Textarea
                      value={risque.detailRisque}
                      onChange={(e) => updateRisque(risque.id, 'detailRisque', e.target.value)}
                      placeholder="Décrivez le risque..."
                      rows={3}
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-3">
                    <Textarea
                      value={risque.natureLocalisation}
                      onChange={(e) =>
                        updateRisque(risque.id, 'natureLocalisation', e.target.value)
                      }
                      placeholder="Nature et localisation..."
                      rows={3}
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-3">
                    <Textarea
                      value={risque.mesuresProtection}
                      onChange={(e) => updateRisque(risque.id, 'mesuresProtection', e.target.value)}
                      placeholder="Mesures de protection..."
                      rows={3}
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="space-y-2">
                      <Checkbox
                        label="TOA"
                        checked={risque.misesEnOeuvrePar === 'toa'}
                        onChange={() => updateRisque(risque.id, 'misesEnOeuvrePar', 'toa')}
                      />
                      <Checkbox
                        label="Prestataire"
                        checked={risque.misesEnOeuvrePar === 'prestataire'}
                        onChange={() =>
                          updateRisque(risque.id, 'misesEnOeuvrePar', 'prestataire')
                        }
                      />
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeRisque(risque.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tableau n°2 : Sécurité routière */}
      <Card>
        <CardHeader>
          <CardTitle>Tableau n°2 : Sécurité routière</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Mesures de protection liées aux déplacements vers le site
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-yellow-900">
              <div className="col-span-3">Détail du risque identifié</div>
              <div className="col-span-3">Nature et localisation</div>
              <div className="col-span-5">Mesures de protection à prendre</div>
              <div className="col-span-1">Mises en œuvre</div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 p-4 border border-gray-200 rounded-lg">
            <div className="col-span-3">
              <div className="font-semibold text-gray-900">Sécurité routière</div>
            </div>
            <div className="col-span-3">
              <div className="text-gray-700">Risques liés au déplacement vers site</div>
            </div>
            <div className="col-span-5 space-y-3">
              <Checkbox
                label="Gestion de temps de pause"
                checked={securiteRoutiere.gestionTempsPause}
                onChange={(e) =>
                  onSecuriteRoutiereChange({
                    ...securiteRoutiere,
                    gestionTempsPause: e.target.checked,
                  })
                }
              />
              <Checkbox
                label="Formation du chauffeur en conduite défensive"
                checked={securiteRoutiere.formationConductionDefensive}
                onChange={(e) =>
                  onSecuriteRoutiereChange({
                    ...securiteRoutiere,
                    formationConductionDefensive: e.target.checked,
                  })
                }
              />
              <Checkbox
                label="Chauffeur apte médicalement"
                checked={securiteRoutiere.chauffeurApteMedicalement}
                onChange={(e) =>
                  onSecuriteRoutiereChange({
                    ...securiteRoutiere,
                    chauffeurApteMedicalement: e.target.checked,
                  })
                }
              />
              <Checkbox
                label="Plan du trajet"
                checked={securiteRoutiere.planTrajet}
                onChange={(e) =>
                  onSecuriteRoutiereChange({
                    ...securiteRoutiere,
                    planTrajet: e.target.checked,
                  })
                }
              />
              <Checkbox
                label="Géolocalisation des flottes"
                checked={securiteRoutiere.geolocalisationFlottes}
                onChange={(e) =>
                  onSecuriteRoutiereChange({
                    ...securiteRoutiere,
                    geolocalisationFlottes: e.target.checked,
                  })
                }
              />
              <Checkbox
                label="Check-list avant départ des véhicules"
                checked={securiteRoutiere.checklistAvantDepart}
                onChange={(e) =>
                  onSecuriteRoutiereChange({
                    ...securiteRoutiere,
                    checklistAvantDepart: e.target.checked,
                  })
                }
              />
              <Checkbox
                label="Respect des règlements et exigences de TOA, liées à l'utilisation de véhicule de service (Chargement matériels, transport personne autorisé, validation conduite de nuit, ....)"
                checked={securiteRoutiere.respectReglementsVehicule}
                onChange={(e) =>
                  onSecuriteRoutiereChange({
                    ...securiteRoutiere,
                    respectReglementsVehicule: e.target.checked,
                  })
                }
              />
              <Checkbox
                label="Maintenance périodique des véhicules"
                checked={securiteRoutiere.maintenancePeriodique}
                onChange={(e) =>
                  onSecuriteRoutiereChange({
                    ...securiteRoutiere,
                    maintenancePeriodique: e.target.checked,
                  })
                }
              />
            </div>
            <div className="col-span-1">
              <div className="text-sm text-gray-700 font-medium">par le prestataire</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note :</strong> Veuillez fournir des évidences pour chaque mesure cochée
              (certificats, photos, documents) en annexe du plan de prévention.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
