import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/lib/i18n';
import { Bell, Globe } from 'lucide-react';

export default function Header() {
  const { user } = useAuthStore();
  const { language, setLanguage } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'mg' : 'fr');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.entreprise ? `${user.entreprise} - TOA` : 'TowerCo of Africa'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Globe className="h-5 w-5" />
          <span className="font-medium text-sm">{language.toUpperCase()}</span>
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
