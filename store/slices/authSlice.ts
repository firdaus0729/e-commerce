import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Alert, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/api';
import { User } from '@/types';

const TOKEN_KEY = 'auth_token';

// Helper functions for token storage
const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

const setToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
};

const removeToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  initialized: false,
};

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getToken();
      if (!token) {
        return null;
      }
      const me = await api.get<User>('/auth/me', token);
      return { ...me, token };
    } catch (error: any) {
      await removeToken();
      return rejectWithValue(error.message || 'Failed to initialize auth');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
      await setToken(res.token);
      const savedToken = await getToken();
      if (!savedToken) {
        return rejectWithValue('Failed to save authentication token');
      }
      return { ...res.user, token: res.token };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/register', {
        name,
        email,
        password,
      });
      await setToken(res.token);
      return { ...res.user, token: res.token };
    } catch (error: any) {
      Alert.alert('Register failed', error.message ?? 'Request failed');
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await removeToken();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async (token: string, { rejectWithValue }) => {
    try {
      const me = await api.get<User>('/auth/me', token);
      return { ...me, token };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update user');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.initialized = true;
        state.error = action.payload as string;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.error = null;
      })
      // Update user
      .addCase(updateUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectIsAuthenticated = (state: { auth: AuthState }) => !!state.auth.user;
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.initialized;

export default authSlice.reducer;

