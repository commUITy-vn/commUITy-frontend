import { storage } from '@/lib/storage';
import { env } from '@/config/env';

const STORAGE_KEY_ACCESS_TOKEN = 'auth_access_token';
const STORAGE_KEY_REFRESH_TOKEN = 'auth_refresh_token';

type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
};

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

export async function getAccessToken(): Promise<string | null> {
  try {
    return await storage.getItemAsync(STORAGE_KEY_ACCESS_TOKEN);
  } catch {
    return null;
  }
}

export async function setTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  try {
    await storage.setItemAsync(STORAGE_KEY_ACCESS_TOKEN, accessToken);
    await storage.setItemAsync(STORAGE_KEY_REFRESH_TOKEN, refreshToken);
  } catch (error) {
    console.error('Failed to store tokens:', error);
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await storage.deleteItemAsync(STORAGE_KEY_ACCESS_TOKEN);
    await storage.deleteItemAsync(STORAGE_KEY_REFRESH_TOKEN);
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
}

async function fetchApi<T>(
  url: string,
  options: RequestOptions & { method: string; body?: any },
): Promise<T> {
  const { method, body, headers, params } = options;
  const fullUrl = buildUrlWithParams(url, params);

  // Add auth header if token exists
  const token = await getAccessToken();
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const res = await fetch(`${env.API_URL}${fullUrl}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = json?.message || res.statusText || "Request failed";
    throw new Error(message);
  }

  if (json && typeof json === "object" && "success" in json && "data" in json) {
    return json.data;
  }
  return json;
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
