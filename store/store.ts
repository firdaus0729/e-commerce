import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './slices/cartSlice';
import authReducer from './slices/authSlice';
import postsReducer from './slices/postsSlice';
import productsReducer from './slices/productsSlice';
import messagesReducer from './slices/messagesSlice';
import storiesReducer from './slices/storiesSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    auth: authReducer,
    posts: postsReducer,
    products: productsReducer,
    messages: messagesReducer,
    stories: storiesReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

