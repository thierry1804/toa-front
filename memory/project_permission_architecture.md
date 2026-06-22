---
name: project-permission-architecture
description: Backend-driven permission system: usePermission hook reads JWT permissions array; usePermissions hook reads backend menu access flags
metadata:
  type: project
---

Permissions are wired from backend to frontend via two hooks:

1. **`usePermission(key: string): boolean`** — `src/features/auth/usePermission.ts`  
   Checks `authStore.permissions` (string[] from JWT `permissions` field).  
   Used for action-level guards: `manage_menus`, `edit_users`, `validate_permits_chef`, `start_interventions`, etc.  
   Also used for data-scope permissions: `permits.view_all`, `interventions.view_all`, `prevention.view_all`, `prevention.submit`.

2. **`usePermissions(route: string): MenuPermissions | null`** — `src/features/menus/hooks/usePermissions.ts`  
   Reads from `menuStore.items` which is fetched from `/api/my-menu`.  
   Returns `{ canView, canCreate, canEdit, canDelete }` for a given route.  
   Used for CRUD button visibility in list/form pages.

**Auth store** (`src/store/auth.store.ts`): stores `user` + `permissions: string[]`. Permissions are extracted from JWT on login (`setPermissions`) and on page load (`permissionsFromToken()`).

**On login** (`src/features/auth/useAuth.ts`): JWT payload `permissions` array is stored via `setPermissions`.

**403 handling** (`src/lib/axios.ts`): reads `error.response.data.error_key`, translates via i18n `errors.{key}`, falls back to `errors.access_denied`.

**Why:** Old system used hardcoded `ROLE_FEATURES` map in `roles.ts` and `canAccessFeature()` on the store — completely frontend-only, not driven by backend.

**How to apply:** Never add new role string comparisons for access control. Always use `usePermission('permission.name')`. Permission strings must match what the backend includes in the JWT `permissions` array.
