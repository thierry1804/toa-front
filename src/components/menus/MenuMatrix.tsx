import type { Menu, Role } from '@/types'
import type { AccessEntry, AccessKey } from '@/features/roles/hooks/useRoleManagement'
import { makeKey } from '@/features/roles/hooks/useRoleManagement'
import { PERMS, PERM_ICONS, PERM_TITLES } from '@/data/constant/permissions'

const COL_MIN_W = 140
const SKELETON_COLS = 4
const SKELETON_ROWS = 6

interface MenuMatrixProps {
  menuItems: Menu[]
  roles: Role[]
  entries: Map<AccessKey, AccessEntry>
  toggling: AccessKey | null
  onToggle: (key: AccessKey, perm: string) => void
  isLoading?: boolean
}

function SkeletonCell() {
  return (
    <div className="flex justify-center gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-7 w-7 rounded bg-gray-200 animate-pulse" />
      ))}
    </div>
  )
}

export default function MenuMatrix({
  menuItems,
  roles,
  entries,
  toggling,
  onToggle,
  isLoading,
}: MenuMatrixProps) {
  const visibleRoles = isLoading ? Array.from({ length: SKELETON_COLS }) : roles
  const colCount = 1 + visibleRoles.length
  const colPct = `${(100 / colCount).toFixed(4)}%`

  return (
    /* wrapper: overflow inside, no scroll leaks to parent */
    <div
      className="w-full overflow-x-auto overflow-y-auto"
      style={{ maxHeight: 'calc(100vh - 260px)' }}
    >
      <table
        className="border-separate border-spacing-0 text-sm w-full"
        style={{ tableLayout: 'fixed', minWidth: colCount * COL_MIN_W }}
      >
        <colgroup>
          <col style={{ width: colPct, minWidth: COL_MIN_W }} />
          {visibleRoles.map((_, i) => (
            <col key={i} style={{ width: colPct, minWidth: COL_MIN_W }} />
          ))}
        </colgroup>

        <thead>
          <tr className="border-b-2 border-gray-200">
            {/* Corner cell: sticky left + sticky top — highest z-index */}
            <th
              className="px-3 py-3 text-left font-semibold text-gray-900 bg-gray-50
                         sticky left-0 top-0 z-40
                         border-r-2 border-gray-300 shadow-[2px_0_6px_rgba(0,0,0,0.08)]"
            >
              Menu
            </th>
            {/* Role headers: sticky top only */}
            {isLoading
              ? Array.from({ length: SKELETON_COLS }).map((_, i) => (
                  <th
                    key={i}
                    className="px-3 py-3 bg-gray-50 sticky top-0 z-10 border-r border-gray-100 last:border-r-0"
                  >
                    <div className="h-4 w-20 mx-auto rounded bg-gray-200 animate-pulse" />
                  </th>
                ))
              : roles.map((roleObj) => (
                  <th
                    key={roleObj.name}
                    className="px-3 py-3 text-center font-semibold text-gray-900 bg-gray-50
                               sticky top-0 z-10 whitespace-nowrap
                               border-r border-gray-100 last:border-r-0"
                  >
                    {roleObj.label}
                  </th>
                ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {isLoading
            ? Array.from({ length: SKELETON_ROWS }).map((_, ri) => (
                <tr key={ri}>
                  {/* Sticky menu cell skeleton */}
                  <td
                    className="px-3 py-3 sticky left-0 bg-white z-20
                               border-r-2 border-gray-300 shadow-[2px_0_6px_rgba(0,0,0,0.08)]"
                  >
                    <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
                  </td>
                  {Array.from({ length: SKELETON_COLS }).map((_, ci) => (
                    <td key={ci} className="px-3 py-3 border-r border-gray-100 last:border-r-0">
                      <SkeletonCell />
                    </td>
                  ))}
                </tr>
              ))
            : menuItems.map((menu) => (
                <tr key={menu.id} className="group hover:bg-blue-50/40">
                  {/* Menu name — sticky left */}
                  <td
                    className="px-3 py-3 font-medium text-gray-900
                               sticky left-0 bg-white group-hover:bg-blue-50 z-20
                               border-r-2 border-gray-300 shadow-[2px_0_6px_rgba(0,0,0,0.08)]
                               overflow-hidden text-ellipsis whitespace-nowrap"
                    title={menu.name}
                  >
                    {menu.name}
                  </td>
                  {/* Permission cells — scrollable, generated from API roles */}
                  {roles.map((roleObj) => {
                    const key = makeKey(menu['@id'], roleObj.name)
                    const isToggling = toggling === key
                    return (
                      <td
                        key={key}
                        className="px-3 py-3 border-r border-gray-100 last:border-r-0"
                      >
                        <div className="flex items-center justify-center gap-2">
                          {PERMS.map((p) => {
                            const Icon = PERM_ICONS[p]
                            const active = entries.get(key)?.[p as keyof AccessEntry] as boolean
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => onToggle(key, p)}
                                disabled={isToggling}
                                title={PERM_TITLES[p]}
                                className={`p-1.5 rounded-md transition-colors ${
                                  active
                                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                                    : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                                } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <Icon className="h-4 w-4" />
                              </button>
                            )
                          })}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
