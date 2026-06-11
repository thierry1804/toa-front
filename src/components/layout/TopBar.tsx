import { useUiStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { useLogout } from '@/features/auth/useAuth'
import { useOnline } from '@/hooks/useOnline'
import { useTranslation } from 'react-i18next'

export function TopBar() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const user = useAuthStore((s) => s.user)
  const { mutate: logout } = useLogout()
  const isOnline = useOnline()
  const { t, i18n } = useTranslation()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        {!isOnline && (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
            {t('offline.banner')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <select
          value={i18n.language}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="rounded-lg border border-gray-900 px-2 py-1 text-sm text-gray-900 font-medium"
        >
          <option value="fr">FR</option>
          <option value="mg">MG</option>
        </select>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">{user?.nom}</span>
          <button
            onClick={() => logout()}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            {t('auth.logout')}
          </button>
        </div>
      </div>
    </header>
  )
}

export default TopBar
