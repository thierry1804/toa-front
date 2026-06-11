import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/lib/i18n';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Shield, Globe } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { t, language, setLanguage } = useI18n();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError(t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'mg' : 'fr');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 p-4">
      <div className="w-full max-w-md">
        {/* Language toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-white hover:text-primary-100 transition-colors"
          >
            <Globe className="h-5 w-5" />
            <span className="font-medium">{language === 'fr' ? 'MG' : 'FR'}</span>
          </button>
        </div>

        <Card>
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <CardTitle>TowerCo of Africa</CardTitle>
              <CardDescription className="mt-2">
                Plateforme de gestion HSE
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('auth.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@toa.mg"
                required
                autoComplete="email"
              />

              <Input
                label={t('auth.password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />

              {error && (
                <div className="p-3 text-sm text-danger-600 bg-danger-50 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                {t('auth.loginButton')}
              </Button>
            </form>

            {/* Comptes de démonstration */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-3">Comptes de démonstration :</p>
              <div className="space-y-1 text-xs text-gray-600">
                <div>
                  <strong>Super Admin:</strong> admin@toa.mg / admin123
                </div>
                <div>
                  <strong>Chef Projet:</strong> chef@toa.mg / chef123
                </div>
                <div>
                  <strong>HSE:</strong> hse@toa.mg / hse123
                </div>
                <div>
                  <strong>Prestataire:</strong> prestataire@etech.mg / prest123
                </div>
                <div>
                  <strong>DG:</strong> dg@toa.mg / dg123
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
