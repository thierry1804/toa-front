import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMenus } from "@/features/menus/hooks/useMenus";
import { useMenuAccesses } from "@/features/menus/hooks/useMenuAccesses";
import { menuAccessesApi } from "@/api/menuAccessesApi";
import { useUiStore } from "@/store/ui.store";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Shield, Loader2 } from "lucide-react";
import { useRoles } from "@/features/roles/hooks/useRoles";
import { PERMS, PERM_ICONS, PERM_TITLES } from "@/data/constant/permissions";

type AccessKey = string;

interface AccessEntry {
  key: AccessKey;
  menu: string;
  role: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  id?: number;
}

function makeKey(menu: string, role: string): AccessKey {
  return `${menu}|${role}`;
}

export default function MenuManagerPage() {
  const addToast = useUiStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const { data: menus, isLoading: menusLoading } = useMenus();
  const { data: accesses, isLoading: accessesLoading } = useMenuAccesses();
  const { data: rolesData, isLoading: rolesLoading } = useRoles(1, 200);
  const [entries, setEntries] = useState<Map<AccessKey, AccessEntry>>(
    new Map(),
  );

  const { t } = useTranslation();
  const menuItems = (menus ?? []).filter((m) => m.name !== "Dashboard");
  const allRoles = rolesData?.member ?? [];
  const [loaded, setLoaded] = useState(false);
  const [toggling, setToggling] = useState<AccessKey | null>(null);

  useEffect(() => {
    if (!menus || !accesses || !allRoles.length || loaded) return;
    const map = new Map<AccessKey, AccessEntry>();
    for (const menu of menuItems) {
      for (const roleObj of allRoles) {
        const key = makeKey(menu["@id"], roleObj.name);
        const existing = accesses.find(
          (a) => a.menu === menu["@id"] && a.role === roleObj.name,
        );
        const isSuperAdmin = roleObj.name === "ROLE_SUPER_ADMIN";
        map.set(key, {
          key,
          menu: menu["@id"],
          role: roleObj.name,
          canView: existing?.canView ?? isSuperAdmin,
          canCreate: existing?.canCreate ?? isSuperAdmin,
          canEdit: existing?.canEdit ?? isSuperAdmin,
          canDelete: existing?.canDelete ?? isSuperAdmin,
          id: existing?.id,
        });
      }
    }
    setEntries(map);
    setLoaded(true);
  }, [menus, accesses, rolesData, loaded]);

  const toggle = useCallback(
    async (key: AccessKey, perm: string) => {
      setToggling(key);

      const entry = entries.get(key);
      if (!entry) return;

      const updated = { ...entry, [perm]: !entry[perm as keyof AccessEntry] };

      setEntries((prev) => {
        const next = new Map(prev);
        next.set(key, updated);
        return next;
      });

      try {
        const hasAny =
          updated.canView ||
          updated.canCreate ||
          updated.canEdit ||
          updated.canDelete;

        if (entry.id) {
          if (hasAny) {
            await menuAccessesApi.update(entry.id, {
              menu: entry.menu,
              role: entry.role,
              canView: updated.canView,
              canCreate: updated.canCreate,
              canEdit: updated.canEdit,
              canDelete: updated.canDelete,
            });
          } else {
            await menuAccessesApi.delete(entry.id);
            setEntries((prev) => {
              const next = new Map(prev);
              const e = next.get(key);
              if (e) next.set(key, { ...e, id: undefined });
              return next;
            });
          }
          queryClient.invalidateQueries({ queryKey: ["menu-accesses"] });
        } else if (hasAny) {
          const result = await menuAccessesApi.create({
            menu: entry.menu,
            role: entry.role,
            canView: updated.canView,
            canCreate: updated.canCreate,
            canEdit: updated.canEdit,
            canDelete: updated.canDelete,
          });
          setEntries((prev) => {
            const next = new Map(prev);
            const e = next.get(key);
            if (e) next.set(key, { ...e, id: result.id });
            return next;
          });
          queryClient.invalidateQueries({ queryKey: ["menu-accesses"] });
        }
      } catch {
        addToast({ message: t("menus.manager.error"), type: "error" });
        setEntries((prev) => {
          const next = new Map(prev);
          next.set(key, entry);
          return next;
        });
      } finally {
        setToggling(null);
      }
    },
    [entries, addToast],
  );

  if (menusLoading || accessesLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
        <p className="text-gray-500">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          {t("menus.manager.title")}
        </h2>
        <p className="mt-1 text-gray-600">{t("menus.manager.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Shield className="h-5 w-5 text-blue-600" />
            {t("menus.manager.permissions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-3 py-3 text-left font-semibold text-gray-900 sticky left-0 bg-gray-50 whitespace-nowrap z-20 border-r-2 border-gray-300 shadow-[2px_0_6px_rgba(0,0,0,0.08)]">
                    {t("menus.manager.menu")}
                  </th>
                  {allRoles.map((roleObj) => (
                    <th
                      key={roleObj.name}
                      className="px-3 py-3 text-center font-semibold text-gray-900 whitespace-nowrap border-r border-gray-100 last:border-r-0"
                    >
                      {roleObj.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {menuItems.map((menu) => (
                  <tr key={menu.id} className="group">
                    <td className="px-3 py-3 font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-blue-50 z-10 whitespace-nowrap border-r-2 border-gray-300">
                      {menu.name}
                    </td>
                    {allRoles.map((roleObj) => {
                      const key = makeKey(menu["@id"], roleObj.name);
                      return (
                        <td
                          key={key}
                          className="px-3 py-3 border-r border-gray-100 last:border-r-0"
                        >
                          <div className="flex items-center justify-center gap-3">
                            {PERMS.map((p) => {
                              const Icon = PERM_ICONS[p];
                              const active = entries.get(key)?.[
                                p as keyof AccessEntry
                              ] as boolean;
                              const isToggling = toggling === key;
                              return (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => toggle(key, p)}
                                  disabled={isToggling}
                                  className={`p-1.5 rounded-md transition-colors ${
                                    active
                                      ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                      : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                                  } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
                                  title={PERM_TITLES[p]}
                                >
                                  <Icon className="h-4 w-4" />
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="lg:hidden space-y-4">
            {menuItems.map((menu) => (
              <div
                key={menu.id}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <h4 className="font-semibold text-gray-900 text-sm">
                  {menu.name}
                </h4>
                {allRoles.map((roleObj) => {
                  const key = makeKey(menu["@id"], roleObj.name);
                  return (
                    <div
                      key={roleObj.name}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-gray-600 min-w-[100px]">
                        {roleObj.label}
                      </span>
                      <div className="flex items-center gap-2">
                        {PERMS.map((p) => {
                          const Icon = PERM_ICONS[p];
                          const active = entries.get(key)?.[
                            p as keyof AccessEntry
                          ] as boolean;
                          const isToggling = toggling === key;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => toggle(key, p)}
                              disabled={isToggling}
                              className={`p-1.5 rounded-md transition-colors ${
                                active
                                  ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                  : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                              } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
                              title={PERM_TITLES[p]}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
