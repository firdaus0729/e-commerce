import { API_URL } from '@/constants/config';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

// Helper to get token from storage
const getTokenFromStorage = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem(TOKEN_KEY);
        return token;
      }
      return null;
    }
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return token;
  } catch (err) {
    console.error('Failed to get token from storage:', err);
    return null;
  }
};

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

const buildUrlWithToken = (baseUrl: string, token?: string) => {
  if (!token) return baseUrl;
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
};

const request = async <T>(path: string, method: Method = 'GET', body?: unknown, token?: string) => {
  const baseUrl = `${API_URL}${path}`;

  // Always try to get token from storage first (most reliable)
  // Only use provided token if storage doesn't have one (for login/register)
  let authToken = token;
  const storedToken = await getTokenFromStorage();
  if (storedToken) {
    authToken = storedToken;
  }

  const url = buildUrlWithToken(baseUrl, authToken);

  // Lightweight client-side logging to verify requests fire
  console.log(`[api] ${method} ${url}`, body ? { body } : {});

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken
        ? {
            Authorization: `Bearer ${authToken}`,
            'x-access-token': authToken,
          }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    console.warn('[api] error', method, url, error);
    throw new Error(error.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
};

export const api = {
  get:   <T>(path: string, token?: string) => request<T>(path, 'GET',    undefined, token),
  post:  <T>(path: string, body: unknown, token?: string) => request<T>(path, 'POST',  body,      token),
  patch: <T>(path: string, body: unknown, token?: string) => request<T>(path, 'PATCH', body,      token),
  put:   <T>(path: string, body: unknown, token?: string) => request<T>(path, 'PUT',   body,      token),
  delete:<T>(path: string, token?: string)               => request<T>(path, 'DELETE', undefined, token),
  upload: async <T>(path: string, formData: FormData, token?: string): Promise<T> => {
    const baseUrl = `${API_URL}${path}`;

    // Always try to get token from storage first (most reliable)
    // Only use provided token if storage doesn't have one
    let authToken = token;
    const storedToken = await getTokenFromStorage();
    if (storedToken) {
      authToken = storedToken;
    }

    const url = buildUrlWithToken(baseUrl, authToken);

    console.log(`[api] POST ${url} (file upload)`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(authToken
          ? {
              Authorization: `Bearer ${authToken}`,
              'x-access-token': authToken,
            }
          : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      console.warn('[api] error', 'POST', url, error);
      throw new Error(error.message ?? 'Upload failed');
    }
    return res.json() as Promise<T>;
  },
};
