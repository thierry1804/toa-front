import axios from "axios";
import i18n from "@/lib/i18n";
import { useUiStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { decodeJwtPayload, isTokenExpiring } from "@/utils/jwt";
import { OfflineQueuedError } from "@/offline/offlineError";
import { enqueueOfflineMutation } from "@/offline/enqueueOfflineMutation";
import { clearOfflineState } from "@/offline/clearOfflineState";

declare module "axios" {
  interface AxiosRequestConfig {
    _skipAuthInterceptor?: boolean;
    _skipOfflineQueue?: boolean;
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * Un seul renouvellement du jeton à la fois, partagé par la requête qui a reçu un 401 et par le renouvellement
 * anticipé : le refresh token ne doit pas être consommé deux fois en parallèle.
 */
let refreshPromise: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem("refresh_token");
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/token/refresh`,
        { refresh_token: refreshToken },
      );
      const newAccessToken: string = data.token ?? data.access_token;
      localStorage.setItem("access_token", newAccessToken);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }

      // Sync auth store with the new token's claims
      const payload = decodeJwtPayload(newAccessToken);
      if (payload) {
        const roles = Array.isArray(payload.roles) ? (payload.roles as string[]) : [];
        const rawPerms = payload.permissions;
        const perms =
          Array.isArray(rawPerms) && (rawPerms as unknown[]).length > 0
            ? (rawPerms as string[])
            : [];
        useAuthStore.getState().setRoles(roles);
        useAuthStore.getState().setPermissions(perms);
      }
      return newAccessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

api.interceptors.request.use(async (config) => {
  let token = localStorage.getItem("access_token");
  // Renouvellement anticipé : un jeton sur le point d'expirer est remplacé avant l'appel, au lieu de provoquer
  // un 401 (visible en rouge dans la console) puis un second appel.
  if (
    token &&
    !config._skipAuthInterceptor &&
    navigator.onLine &&
    localStorage.getItem("refresh_token") &&
    isTokenExpiring(token)
  ) {
    try {
      token = await refreshAccessToken();
    } catch {
      /* le chemin 401 ci-dessous prend le relais */
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest?._skipAuthInterceptor) {
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      const errorKey = error.response?.data?.error_key as string | undefined
      const message = errorKey
        ? (i18n.t(`errors.${errorKey}`, '') || i18n.t('errors.access_denied'))
        : i18n.t('errors.access_denied')
      useUiStore.getState().addToast({ message, type: 'error' })
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await clearOfflineState();
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Network error on mutating request → queue for offline sync
    if (!error.response && !originalRequest?._skipAuthInterceptor) {
      const result = await enqueueOfflineMutation(originalRequest)
      if (result === 'queued' || result === 'quota') {
        return Promise.reject(new OfflineQueuedError())
      }
    }

    return Promise.reject(error);
  },
);

export default api;
