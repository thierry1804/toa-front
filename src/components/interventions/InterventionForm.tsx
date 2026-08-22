import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInterventionStore } from '@/store/interventionStore';
import { interventionApi } from '@/api/interventionApi';
import { permitTravailApi } from '@/api/permitTravailApi';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import type { PermitTravail } from '@/types/permitTravail';

export default function InterventionForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addIntervention } = useInterventionStore();

  const [permits, setPermits] = useState<PermitTravail[]>([]);
  const [selectedPermitId, setSelectedPermitId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    permitTravailApi.list().then((col) => {
      const valide = (col.member ?? []).filter(
        (p: PermitTravail) => p.statut === 'VALIDE_HSE',
      );
      setPermits(valide);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPermitId) return;

    setLoading(true);
    setError(null);
    try {
      const intervention = await interventionApi.create(selectedPermitId);
      addIntervention(intervention);
      navigate(`/interventions/${intervention.id}`);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? t('intervention.components.interventionForm.createError'));
    } finally {
      setLoading(false);
    }
  };

  const permitOptions = permits.map((p) => ({
    value: p.id,
    label: `${p.reference} — ${p.codeSite}`,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-gray-600">
        {t('intervention.components.interventionForm.intro')}
      </p>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t('intervention.components.interventionForm.permitLabel')}
        </label>
        {permits.length === 0 ? (
          <p className="text-sm text-amber-600">
            {t('intervention.components.interventionForm.noPermits')}
          </p>
        ) : (
          <Select
            options={permitOptions}
            value={selectedPermitId}
            onChange={(e) => setSelectedPermitId(e.target.value)}
            placeholder={t('intervention.components.interventionForm.permitPlaceholder')}
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/interventions')}
        >
          {t('intervention.components.interventionForm.cancel')}
        </Button>
        <Button
          type="submit"
          disabled={!selectedPermitId || loading}
          isLoading={loading}
        >
          {loading
            ? t('intervention.components.interventionForm.creating')
            : t('intervention.components.interventionForm.submit')}
        </Button>
      </div>
    </form>
  );
}
