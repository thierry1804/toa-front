import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useEffect, useState } from 'react';

export interface GPSCoordinate {
  id: string;
  lat: number;
  lng: number;
  nom: string;
}

interface GPSCoordinatesInputProps {
  value?: GPSCoordinate[];
  onChange: (coordinates: GPSCoordinate[]) => void;
}

// Fonction pour extraire les coordonnées d'un fichier KMZ (simulé)
const extractCoordinatesFromKMZ = async (_file: File): Promise<GPSCoordinate[]> => {
  // Dans une vraie implémentation, on utiliserait une bibliothèque comme @tmcw/togeojson
  // pour extraire les coordonnées du fichier KMZ
  // Ceci est une simulation qui retourne des données de test
  return new Promise((resolve) => {
    // Simuler un délai de lecture du fichier
    setTimeout(() => {
      resolve([
        { id: Date.now().toString(), lat: -18.8792, lng: 47.5079, nom: 'Point 1' },
        { id: (Date.now() + 1).toString(), lat: -18.8793, lng: 47.5080, nom: 'Point 2' },
      ]);
    }, 500);
  });
};

export default function GPSCoordinatesInput({ value = [], onChange }: GPSCoordinatesInputProps) {
  const [coordinates, setCoordinates] = useState<GPSCoordinate[]>(value);

  // Mettre à jour le parent lorsque les coordonnées changent
  useEffect(() => {
    onChange(coordinates);
  }, [coordinates, onChange]);

  const handleAddCoordinate = () => {
    const newCoord: GPSCoordinate = {
      id: Date.now().toString(),
      lat: 0,
      lng: 0,
      nom: `Point ${coordinates.length + 1}`
    };
    setCoordinates([...coordinates, newCoord]);
  };

  const handleRemoveCoordinate = (id: string) => {
    setCoordinates(coordinates.filter(coord => coord.id !== id));
  };

  const handleCoordinateChange = (id: string, field: keyof GPSCoordinate, value: string | number) => {
    setCoordinates(coordinates.map(coord => {
      if (coord.id === id) {
        return { ...coord, [field]: field === 'nom' ? value : Number(value) };
      }
      return coord;
    }));
  };

  const handleKMZUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const coords = await extractCoordinatesFromKMZ(file);
        setCoordinates([...coordinates, ...coords]);
      } catch (error) {
        console.error('Erreur lors de la lecture du fichier KMZ', error);
        // Afficher une notification d'erreur
      }
      // Réinitialiser l'input pour permettre la sélection du même fichier
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Coordonnées GPS</h4>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCoordinate}
          >
            Ajouter un point
          </Button>
          <input
            type="file"
            id="kmz-upload"
            accept=".kmz"
            className="hidden"
            onChange={handleKMZUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('kmz-upload')?.click()}
          >
            Importer depuis KMZ
          </Button>
        </div>
      </div>
      
      {coordinates.map((coord) => (
        <div key={coord.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded">
          <Input
            label="Nom du point"
            value={coord.nom}
            onChange={(e) => handleCoordinateChange(coord.id, 'nom', e.target.value)}
          />
          <Input
            label="Latitude"
            type="number"
            step="0.000001"
            value={coord.lat}
            onChange={(e) => handleCoordinateChange(coord.id, 'lat', e.target.value)}
          />
          <Input
            label="Longitude"
            type="number"
            step="0.000001"
            value={coord.lng}
            onChange={(e) => handleCoordinateChange(coord.id, 'lng', e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveCoordinate(coord.id)}
            className="text-red-500 hover:text-red-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Button>
        </div>
      ))}
    </div>
  );
}
