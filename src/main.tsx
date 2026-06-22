import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import '@/lib/i18n'
import { AppShell } from '@/components/layout/AppShell'
import { RouteGuard } from '@/components/layout/RouteGuard'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import PermitsListPage from '@/pages/PermitsListPage'
import PermitDetailPage from '@/pages/PermitDetailPage'
import PermitNewPage from '@/pages/PermitNewPage'
import PreventionPage from '@/pages/PreventionPage'
import UsersListPage from '@/pages/users/UsersListPage'
import UserFormPage from '@/pages/users/UserFormPage'
import PlanningListPage from '@/pages/planning/PlanningListPage'
import PlanningFormPage from '@/pages/planning/PlanningFormPage'
import MenusListPage from '@/pages/menus/MenusListPage'
import MenuFormPage from '@/pages/menus/MenuFormPage'
import MenuAccessesListPage from '@/pages/menus/MenuAccessesListPage'
import MenuAccessFormPage from '@/pages/menus/MenuAccessFormPage'
import MenuManagerPage from '@/pages/menus/MenuManagerPage'
import StatisticsPage from '@/pages/StatisticsPage'
import '../app/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route element={<RouteGuard menuRoute="/permits" />}>
              <Route path="/permits" element={<PermitsListPage />} />
              <Route path="/permits/new" element={<PermitNewPage />} />
              <Route path="/permits/:id" element={<PermitDetailPage />} />
            </Route>

            <Route element={<RouteGuard menuRoute="/prevention" />}>
              <Route path="/prevention" element={<PreventionPage />} />
            </Route>

            <Route element={<RouteGuard menuRoute="/users" />}>
              <Route path="/users" element={<UsersListPage />} />
              <Route path="/users/new" element={<UserFormPage />} />
              <Route path="/users/:id/edit" element={<UserFormPage />} />
            </Route>

            <Route element={<RouteGuard menuRoute="/planning" />}>
              <Route path="/planning" element={<PlanningListPage />} />
              <Route path="/planning/new" element={<PlanningFormPage />} />
              <Route path="/planning/:id/edit" element={<PlanningFormPage />} />
            </Route>

            <Route element={<RouteGuard menuRoute="/menus" />}>
              <Route path="/menus" element={<MenusListPage />} />
              <Route path="/menus/new" element={<MenuFormPage />} />
              <Route path="/menus/:id/edit" element={<MenuFormPage />} />
            </Route>

            <Route element={<RouteGuard menuRoute="/menu-accesses" />}>
              <Route path="/menu-accesses" element={<MenuAccessesListPage />} />
              <Route path="/menu-accesses/new" element={<MenuAccessFormPage />} />
              <Route path="/menu-accesses/:id/edit" element={<MenuAccessFormPage />} />
            </Route>

            <Route element={<RouteGuard menuRoute="/menu-manager" />}>
              <Route path="/menu-manager" element={<MenuManagerPage />} />
            </Route>

            <Route element={<RouteGuard menuRoute="/statistics" />}>
              <Route path="/statistics" element={<StatisticsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
