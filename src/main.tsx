import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import "@/lib/i18n";
import { AppShell } from "@/components/layout/AppShell";
import { RouteGuard } from "@/components/layout/RouteGuard";
import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import PlanPreventionListPage from "@/pages/prevention/PlanPreventionListPage";
import UsersListPage from "@/pages/users/UsersListPage";
import UserFormPage from "@/pages/users/UserFormPage";
import PlanningListPage from "@/pages/planning/PlanningListPage";
import PlanningFormPage from "@/pages/planning/PlanningFormPage";
import MenusListPage from "@/pages/menus/MenusListPage";
import MenuFormPage from "@/pages/menus/MenuFormPage";
import MenuAccessesListPage from "@/pages/menus/MenuAccessesListPage";
import MenuAccessFormPage from "@/pages/menus/MenuAccessFormPage";
import MenuManagerPage from "@/pages/menus/MenuManagerPage";
import RolesListPage from "@/pages/roles/RolesListPage";
import RoleFormPage from "@/pages/roles/RoleFormPage";
import RolesManagementPage from "@/pages/roles/RolesManagementPage";
import PlanPreventionCreatePage from "@/pages/planPrevention/PlanPreventionCreatePage";
import PlanPreventionDetailPage from "@/pages/planPrevention/PlanPreventionDetailPage";
import PlanPreventionEditPage from "@/pages/planPrevention/PlanPreventionEditPage";
import PermitTravailListPage from "@/pages/permitTravail/PermitTravailListPage";
import PermitTravailCreatePage from "@/pages/permitTravail/PermitTravailCreatePage";
import PermitTravailDetailPage from "@/pages/permitTravail/PermitTravailDetailPage";
import PermitTravailEditPage from "@/pages/permitTravail/PermitTravailEditPage";
import PermitTravailSuiviPage from "@/pages/permitTravail/PermitTravailSuiviPage";
import StatisticsPage from "@/pages/statistics/StatisticsPage";
import "maplibre-gl/dist/maplibre-gl.css";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route element={<RouteGuard menuRoute="/prevention" />}>
              <Route path="/prevention" element={<PlanPreventionListPage />} />
              <Route
                path="/prevention/new"
                element={<PlanPreventionCreatePage />}
              />
              <Route
                path="/prevention/:id/edit"
                element={<PlanPreventionEditPage />}
              />
              <Route
                path="/prevention/:id"
                element={<PlanPreventionDetailPage />}
              />
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
              <Route
                path="/menu-accesses/new"
                element={<MenuAccessFormPage />}
              />
              <Route
                path="/menu-accesses/:id/edit"
                element={<MenuAccessFormPage />}
              />
            </Route>

            <Route element={<RouteGuard menuRoute="/menu-manager" />}>
              <Route path="/menu-manager" element={<MenuManagerPage />} />
            </Route>

            <Route element={<RouteGuard menuRoute="/roles" />}>
              <Route path="/roles" element={<RolesListPage />} />
              <Route path="/roles/new" element={<RoleFormPage />} />
              <Route path="/roles/:id/edit" element={<RoleFormPage />} />
            </Route>

            <Route element={<RouteGuard menuRoute="/roles-management" />}>
              <Route path="/roles-management" element={<RolesManagementPage />} />
            </Route>

            <Route element={<RouteGuard menuRoute="/permits-travail" />}>
              <Route path="/permits-travail" element={<PermitTravailListPage />} />
              <Route path="/permits-travail/suivi" element={<PermitTravailSuiviPage />} />
              <Route path="/permits-travail/new" element={<PermitTravailCreatePage />} />
              <Route path="/permits-travail/:id/edit" element={<PermitTravailEditPage />} />
              <Route path="/permits-travail/:id" element={<PermitTravailDetailPage />} />
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
);
