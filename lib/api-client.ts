import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/config/env';

function buildUrlWithParams(
  url: string,
  params?: RequestOptions['params'],
): string {
  if (!params) return url;
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  );
  if (Object.keys(filteredParams).length === 0) return url;
  const queryString = new URLSearchParams(
    filteredParams as Record<string, string>,
  ).toString();
  return `${url}?${queryString}`;
}

export const api = {
  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'GET' });
  },
  post<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'POST', body });
  },
  put<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'PUT', body });
  },
  patch<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'PATCH', body });
  },
  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'DELETE' });
  },
};