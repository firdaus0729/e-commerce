import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';

/**
 * Hook that provides API methods with automatic token injection from auth context
 */
export const useApi = () => {
  const { user } = useAuth();

  return {
    get: <T>(path: string, token?: string) => {
      const authToken = token || user?.token;
      return api.get<T>(path, authToken);
    },
    post: <T>(path: string, body: unknown, token?: string) => {
      const authToken = token || user?.token;
      return api.post<T>(path, body, authToken);
    },
    patch: <T>(path: string, body: unknown, token?: string) => {
      const authToken = token || user?.token;
      return api.patch<T>(path, body, authToken);
    },
    put: <T>(path: string, body: unknown, token?: string) => {
      const authToken = token || user?.token;
      return api.put<T>(path, body, authToken);
    },
    delete: <T>(path: string, token?: string) => {
      const authToken = token || user?.token;
      return api.delete<T>(path, authToken);
    },
    upload: <T>(path: string, formData: FormData, token?: string) => {
      const authToken = token || user?.token;
      return api.upload<T>(path, formData, authToken);
    },
  };
};

