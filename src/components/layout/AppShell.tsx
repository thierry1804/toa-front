import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { useRefreshPermissions } from '@/features/auth/useAuth'
import { useLoadMenu } from '@/features/menus/hooks/useLoadMenu'
import { useSyncOnReconnect } from '@/hooks/useSyncOnReconnect'
import { useAutoSnapshot } from '@/hooks/useAutoSnapshot'
import { PwaReloadBanner } from '@/components/layout/PwaReloadBanner'
import { FieldAgentTabBar } from '@/components/layout/FieldAgentTabBar'
import { useIsFieldAgent } from '@/features/terrain/useIsFieldAgent'

export function AppShell() {
  useLoadMenu()
  useRefreshPermissions()
  useSyncOnReconnect()
  useAutoSnapshot()
  const isFieldAgent = useIsFieldAgent()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <PwaReloadBanner />
        <TopBar />
        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-5 ${
            isFieldAgent ? 'pb-24 lg:pb-5' : 'pb-[max(0.75rem,env(safe-area-inset-bottom))]'
          }`}
        >
          <Outlet />
        </main>
      </div>
      {isFieldAgent && <FieldAgentTabBar />}
      <ToastContainer />
    </div>
  )
}

export default AppShell
