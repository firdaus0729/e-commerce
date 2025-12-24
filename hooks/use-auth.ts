// Compatibility hook that uses Redux instead of Context
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectUser, selectAuthLoading, selectAuthError, selectIsAuthenticated, login, register, logout, updateUser } from '@/store/slices/authSlice';
import { User } from '@/types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login: async (email: string, password: string): Promise<User> => {
      const result = await dispatch(login({ email, password }));
      if (login.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string || 'Login failed');
    },
    register: async (name: string, email: string, password: string): Promise<User> => {
      const result = await dispatch(register({ name, email, password }));
      if (register.fulfilled.match(result)) {
        return result.payload;
      }
      throw new Error(result.payload as string || 'Registration failed');
    },
    logout: async (): Promise<void> => {
      await dispatch(logout());
    },
    updateUser: async (token: string): Promise<void> => {
      await dispatch(updateUser(token));
    },
  };
};
