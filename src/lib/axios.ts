import axios from "axios";
import i18n from "@/lib/i18n";
import { useUiStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { decodeJwtPayload } from "@/utils/jwt";
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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

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
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
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
        const payload = decodeJwtPayload(newAccessToken)
        if (payload) {
          const roles = Array.isArray(payload.roles) ? (payload.roles as string[]) : []
          const rawPerms = payload.permissions
          const perms =
            Array.isArray(rawPerms) && (rawPerms as unknown[]).length > 0
              ? (rawPerms as string[])
              : []
          useAuthStore.getState().setRoles(roles)
          useAuthStore.getState().setPermissions(perms)
        }

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearOfflineState();
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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
