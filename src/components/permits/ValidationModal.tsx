import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePermitStore } from '@/store/permitStore';
import { useToastStore } from '@/store/toastStore';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { CheckCircle, XCircle } from 'lucide-react';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  permisId: string;
  currentStatus: string;
  type: 'chef' | 'hse';
}

export default function ValidationModal({
  isOpen,
  onClose,
  permisId,
  type,
}: ValidationModalProps) {
  const { user } = useAuthStore();
  const { validerParChefProjet, validerParHSE, refuserPermis } = usePermitStore();
  const { success, error } = useToastStore();
  const [commentaire, setCommentaire] = useState('');
  const [action, setAction] = useState<'valider' | 'refuser' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!action || !user) return;

    setLoading(true);

    try {
      const nom = `${user.prenom} ${user.nom}`;

      if (action === 'valider') {
        if (type === 'chef') {
          validerParChefProjet(permisId, nom, commentaire);
          success('Permis validé par le Chef de Projet avec succès');
        } else {
          validerParHSE(permisId, nom, commentaire);
          success('Permis validé par HSE et référence attribuée avec succès');
        }
      } else {
        refuserPermis(permisId, commentaire);
        error('Permis refusé');
      }

      onClose();
      window.location.reload(); // Refresh pour voir les changements
    } catch (err) {
      console.error('Erreur lors de la validation:', err);
      error('Une erreur est survenue lors de la validation');
    } finally {
      setLoading(false);
    }
  };

  const title =
    type === 'chef'
      ? 'Validation Chef de Projet'
      : 'Validation HSE et Attribution de Référence';

  const description =
    type === 'chef'
      ? 'Examinez la demande et validez ou refusez le permis'
      : 'Validation finale et attribution d\'une référence unique au permis';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} size="lg">
      <div className="space-y-6">
        {/* Informations du validateur */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Validé par</p>
          <p className="font-medium text-gray-900">
            {user?.prenom} {user?.nom}
          </p>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>

        {/* Commentaire */}
        <Textarea
          label="Commentaire"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          placeholder="Ajoutez un commentaire (optionnel)"
          rows={4}
        />

        {type === 'hse' && action === 'valider' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 font-medium">
              Une référence unique sera automatiquement générée lors de la validation.
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Format: ANNÉE/PTW/XXX (ex: 2025/PTW/001)
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => setAction('valider')}
            className={`flex-1 p-4 border-2 rounded-lg transition-all ${
              action === 'valider'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-green-400'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <CheckCircle
                className={`h-6 w-6 ${action === 'valider' ? 'text-green-600' : 'text-gray-400'}`}
              />
              <div className="text-left">
                <p
                  className={`font-semibold ${action === 'valider' ? 'text-green-900' : 'text-gray-700'}`}
                >
                  Valider
                </p>
                <p className="text-xs text-gray-600">
                  {type === 'chef' ? 'Transférer à HSE' : 'Approuver le permis'}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setAction('refuser')}
            className={`flex-1 p-4 border-2 rounded-lg transition-all ${
              action === 'refuser'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-red-400'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <XCircle
                className={`h-6 w-6 ${action === 'refuser' ? 'text-red-600' : 'text-gray-400'}`}
              />
              <div className="text-left">
                <p
                  className={`font-semibold ${action === 'refuser' ? 'text-red-900' : 'text-gray-700'}`}
                >
                  Refuser
                </p>
                <p className="text-xs text-gray-600">Rejeter la demande</p>
              </div>
            </div>
          </button>
        </div>

        {action === 'refuser' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900 font-medium">
              ⚠️ Le commentaire est obligatoire pour un refus
            </p>
            <p className="text-xs text-red-700 mt-1">
              Expliquez la raison du refus pour que le prestataire puisse corriger.
            </p>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          loading={loading}
          disabled={!action || (action === 'refuser' && !commentaire.trim())}
          variant={action === 'refuser' ? 'danger' : 'primary'}
        >
          {action === 'valider' ? 'Valider le permis' : 'Refuser le permis'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
