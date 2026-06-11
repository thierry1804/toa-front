import { useEffect, useState, useCallback } from "react";
import { NavLink } from "react-router-dom";
import { useUiStore } from "@/store/ui.store";
import { useMenuStore } from "@/store/menu.store";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import type { MenuNode } from "@/types";
import { iconMap } from "@/data/constant/sidebar";

function getIcon(name: string | undefined): LucideIcon | null {
  if (!name) return null;
  return iconMap[name] ?? null;
}

function MenuItemLink({
  node,
  collapsed,
}: {
  node: MenuNode;
  collapsed: boolean;
}) {
  const Icon = getIcon(node.icon);

  return (
    <NavLink
      to={node.route ?? "#"}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-700 hover:bg-gray-100"
        } ${collapsed ? "justify-center" : ""}`
      }
      title={collapsed ? node.name : undefined}
    >
      {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
      {!collapsed && <span className="truncate"> {node.name} </span>}
    </NavLink>
  );
}

function buildMenuList(items: MenuNode[]): MenuNode[] {
  const result: MenuNode[] = [];
  function walk(nodes: MenuNode[]) {
    for (const n of nodes) {
      if (n.route) {
        result.push(n);
      }
      walk(n.children);
    }
  }
  walk(items);
  return result;
}

export function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const menuStore = useMenuStore();
  const [collapsed, setCollapsed] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const load = useCallback(async () => {
    try {
      await menuStore.load();
    } catch {
      console.error("Failed to load menu");
    } finally {
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flatItems = buildMenuList(menuStore.items);

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
        } ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="relative flex h-16 items-center justify-center border-b border-gray-200 px-4">
          <div className={`border border-gray-200 rounded-lg p-1 ${collapsed ? "p-0.5" : "p-1"}`}>
            <img
              src="/images/TOA.png"
              alt="TOA"
              className={`${collapsed ? "h-6 w-auto" : "h-8 w-auto"}`}
            />
          </div>
          <div className="absolute right-2 flex items-center gap-1">
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
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
              className="hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 lg:block"
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
          {menuStore.loading && !initialized ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : menuStore.error && flatItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="mb-2 h-5 w-5 text-gray-400" />
              <p className="text-xs text-gray-400"> Menu indisponible</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {flatItems.map((node) => (
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
