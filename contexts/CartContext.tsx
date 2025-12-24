import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api } from '@/lib/api';
import { Cart } from '@/types';
import { useAuth } from '@/hooks/use-auth';

interface CartContextType {
  cart: Cart | null;
  cartItemCount: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user?.token) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<Cart>('/cart', user.token);
      setCart(data);
    } catch (err) {
      console.error('Failed to load cart:', err);
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    if (user?.token) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [user?.token, refreshCart]);

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, cartItemCount, loading, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

