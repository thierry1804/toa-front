import { useEffect, useState, useCallback, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUiStore } from "@/store/ui.store";
import { useMenuStore } from "@/store/menu.store";
import { useAuthStore } from "@/store/auth.store";
import { injectPrestataireEntrepriseMenu } from "@/features/users/utils/prestataireMenu";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import type { MenuNode } from "@/types";
import { iconMap } from "@/data/constant/sidebar";

function getIcon(name: string | undefined): LucideIcon | null {
  if (!name) return null;
  return iconMap[name] ?? null;
}

function hasActiveChild(node: MenuNode, pathname: string): boolean {
  return node.children.some(
    (c) => c.route === pathname || hasActiveChild(c, pathname),
  );
}

function ChildLink({ node, collapsed }: { node: MenuNode; collapsed: boolean }) {
  const Icon = getIcon(node.icon);
  return (
    <NavLink
      to={node.route ?? "#"}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg py-2 pr-3 text-sm font-medium transition-colors ${
          collapsed ? "justify-center px-3" : "pl-9"
        } ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
      }
      title={collapsed ? node.name : undefined}
    >
      {Icon
        ? <Icon className="h-4 w-4 flex-shrink-0" />
        : !collapsed && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />}
      {!collapsed && <span className="truncate">{node.name}</span>}
    </NavLink>
  );
}

function ParentMenuItem({
  node,
  collapsed,
}: {
  node: MenuNode;
  collapsed: boolean;
}) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const isChildActive = hasActiveChild(node, pathname);
  const [open, setOpen] = useState(isChildActive);
  const Icon = getIcon(node.icon);

  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  return (
    <div>
      <div
        className={`flex w-full items-center rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 ${
          isChildActive ? "text-blue-700" : "text-gray-700"
        }`}
      >
        <NavLink
          to={node.route ?? "#"}
          end
          className={({ isActive }) =>
            `flex flex-1 items-center gap-3 px-3 py-2.5 ${
              collapsed ? "justify-center" : ""
            }${isActive && !isChildActive ? " text-blue-700" : ""}`
          }
          title={collapsed ? node.name : undefined}
          onClick={() => setOpen(true)}
        >
          {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
          {!collapsed && <span className="flex-1 truncate text-left">{node.name}</span>}
        </NavLink>
        {!collapsed && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={t(open ? "nav.collapseSection" : "nav.expandSection")}
            aria-expanded={open}
            className="touch-target flex items-center justify-center px-2"
          >
            <ChevronDown
              className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      {open && !collapsed && (
        <div className="mt-0.5 flex flex-col gap-0.5">
          {node.children.map((child) => (
            <ChildLink key={child.id} node={child} collapsed={collapsed} />
          ))}
        </div>
      )}

      {open && collapsed && (
        <div className="flex flex-col gap-0.5 pt-0.5">
          {node.children.map((child) => (
            <ChildLink key={child.id} node={child} collapsed={collapsed} />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuItemLink({ node, collapsed }: { node: MenuNode; collapsed: boolean }) {
  const Icon = getIcon(node.icon);

  if (node.children.length > 0) {
    return <ParentMenuItem node={node} collapsed={collapsed} />;
  }

  return (
    <NavLink
      to={node.route ?? "#"}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
        } ${collapsed ? "justify-center" : ""}`
      }
      title={collapsed ? node.name : undefined}
    >
      {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
      {!collapsed && <span className="truncate">{node.name}</span>}
    </NavLink>
  );
}

export function Sidebar() {
  const { t } = useTranslation();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const menuStore = useMenuStore();
  const roles = useAuthStore((s) => s.roles);
  const [collapsed, setCollapsed] = useState(false);

  const retryLoad = useCallback(() => {
    void menuStore.load();
  }, [menuStore]);

  useEffect(() => {
    void menuStore.load();
  }, [menuStore]);

  const rootItems = useMemo(
    () => injectPrestataireEntrepriseMenu(menuStore.items, t("nav.myEntreprise"), roles),
    [menuStore.items, roles, t],
  );
  const showMenuSkeleton = menuStore.loading && !menuStore.loaded;

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white transition-all duration-200 ease-in-out lg:static ${
          collapsed ? "w-20" : "w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="relative flex h-14 items-center border-b border-gray-200 px-4">
          <img
            src="/images/TOA.png"
            alt="TOA"
            className={`${collapsed ? "mx-auto h-6 w-auto" : "h-7 w-auto"}`}
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label={t("nav.closeMenu")}
              className="touch-target flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 lg:hidden"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-label={t(collapsed ? "nav.expandSidebar" : "nav.collapseSidebar")}
              aria-expanded={!collapsed}
              className="touch-target hidden items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 lg:flex"
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {showMenuSkeleton ? (
            <div className="flex flex-col gap-1" aria-hidden="true">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : menuStore.error && rootItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="mb-2 h-5 w-5 text-gray-500" />
              <p className="text-xs text-gray-600">{t('layout.sidebar.menuUnavailable')}</p>
              <button
                onClick={retryLoad}
                className="touch-target-inline mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                {t('layout.sidebar.retry')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {rootItems.map((node) => (
                <MenuItemLink key={node.id} node={node} collapsed={collapsed} />
              ))}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
