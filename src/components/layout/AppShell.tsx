import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { useRefreshPermissions } from '@/features/auth/useAuth'
import { useLoadMenu } from '@/features/menus/hooks/useLoadMenu'
import { useSyncOnReconnect } from '@/hooks/useSyncOnReconnect'
import { PwaReloadBanner } from '@/components/layout/PwaReloadBanner'

export function AppShell() {
  useLoadMenu()
  useRefreshPermissions()
  useSyncOnReconnect()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <PwaReloadBanner />
        <TopBar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 lg:p-5">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}

export default AppShell
