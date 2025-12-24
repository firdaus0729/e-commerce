import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from './store';
import { initializeAuth } from './slices/authSlice';
import type { AppDispatch } from './store';

const ReduxInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Initialize auth on app start
    dispatch(initializeAuth());
  }, [dispatch]);

  return <>{children}</>;
};

export const ReduxProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <ReduxInitializer>{children}</ReduxInitializer>
    </Provider>
  );
};

