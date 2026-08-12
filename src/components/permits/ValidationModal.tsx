import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
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
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { validerParChefProjet, validerParHSE, refuserPermis } = usePermitStore();
  const toast = useToastStore;
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
          toast.showSuccess(t('permits.validationModal.toastSuccessChef'));
        } else {
          validerParHSE(permisId, nom, commentaire);
          toast.showSuccess(t('permits.validationModal.toastSuccessHse'));
        }
      } else {
        refuserPermis(permisId, commentaire);
        toast.showError(t('permits.validationModal.toastErrorRefuse'));
      }

      onClose();
    } catch (err) {
      console.error('Erreur lors de la validation:', err);
      toast.showError(t('permits.validationModal.toastErrorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const title =
    type === 'chef'
      ? t('permits.validationModal.titleChef')
      : t('permits.validationModal.titleHse');

  const description =
    type === 'chef'
      ? t('permits.validationModal.descriptionChef')
      : t('permits.validationModal.descriptionHse');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} size="lg">
      <div className="space-y-6">
        {/* Informations du validateur */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">{t('permits.validationModal.validatedByLabel')}</p>
          <p className="font-medium text-gray-900">
            {user?.prenom} {user?.nom}
          </p>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>

        {/* Commentaire */}
        <Textarea
          label={t('permits.validationModal.commentaireLabel')}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          placeholder={t('permits.validationModal.commentairePlaceholder')}
          rows={4}
          disabled={loading}
        />

        {type === 'hse' && action === 'valider' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900 font-medium">
              {t('permits.validationModal.hseReferenceInfoTitle')}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {t('permits.validationModal.hseReferenceInfoFormat')}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => setAction('valider')}
            disabled={loading}
            className={`flex-1 p-4 border-2 rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
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
                  {t('permits.validationModal.validerActionLabel')}
                </p>
                <p className="text-xs text-gray-600">
                  {type === 'chef'
                    ? t('permits.validationModal.validerActionDescChef')
                    : t('permits.validationModal.validerActionDescHse')}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setAction('refuser')}
            disabled={loading}
            className={`flex-1 p-4 border-2 rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
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
                  {t('permits.validationModal.refuserActionLabel')}
                </p>
                <p className="text-xs text-gray-600">{t('permits.validationModal.refuserActionDesc')}</p>
              </div>
            </div>
          </button>
        </div>

        {action === 'refuser' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900 font-medium">
              {t('permits.validationModal.refusRequiredWarningTitle')}
            </p>
            <p className="text-xs text-red-700 mt-1">
              {t('permits.validationModal.refusRequiredWarningText')}
            </p>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {t('permits.validationModal.cancelButton')}
        </Button>
        <Button
          onClick={handleSubmit}
          loading={loading}
          disabled={!action || (action === 'refuser' && !commentaire.trim())}
          variant={action === 'refuser' ? 'danger' : 'primary'}
        >
          {action === 'valider'
            ? t('permits.validationModal.submitValiderLabel')
            : t('permits.validationModal.submitRefuserLabel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
