/**
 * $api composable — thin wrapper around $fetch that:
 *   - prefixes every request with the configured API base URL
 *   - injects the Authorization header from the auth store
 *   - handles 401 (redirect to /login) and surfaces error objects
 */
import type { FetchOptions } from 'ofetch';

export interface ApiError {
  statusCode: number;
  message: string;
  code?: string;
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const authStore = useAuthStore();
  const router = useRouter();

  async function api<T = unknown>(path: string, options: FetchOptions<'json'> = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    };

    if (authStore.accessToken) {
      headers['Authorization'] = `Bearer ${authStore.accessToken}`;
    }

    try {
      return await $fetch<T>(`${config.public.apiBaseUrl}${path}`, {
        ...options,
        headers,
      });
    } catch (err: unknown) {
      const fetchError = err as { status?: number; data?: { message?: string; code?: string } };

      if (fetchError.status === 401) {
        // Try token refresh first
        try {
          await authStore.refresh();
          // Retry with new token
          return await api<T>(path, options);
        } catch {
          authStore.logout();
          await router.push('/login');
          throw err;
        }
      }

      if (fetchError.status === 403) {
        throw { statusCode: 403, message: 'Access forbidden', code: 'FORBIDDEN' } satisfies ApiError;
      }

      throw {
        statusCode: fetchError.status ?? 500,
        message: fetchError.data?.message ?? 'An unexpected error occurred',
        code: fetchError.data?.code,
      } satisfies ApiError;
    }
  }

  return {
    provide: { api },
  };
});
