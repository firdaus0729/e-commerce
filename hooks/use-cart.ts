// Compatibility hook that uses Redux instead of Context
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { 
  selectCart, 
  selectCartLoading, 
  selectCartItemCount,
  fetchCart,
  addToCart as addToCartAction,
  removeFromCart as removeFromCartAction,
  updateCartItem as updateCartItemAction,
} from '@/store/slices/cartSlice';
import { selectUser } from '@/store/slices/authSlice';

export const useCart = () => {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectCart);
  const loading = useAppSelector(selectCartLoading);
  const cartItemCount = useAppSelector(selectCartItemCount);
  const user = useAppSelector(selectUser);

  const refreshCart = async () => {
    if (user?.token) {
      await dispatch(fetchCart(user.token));
    }
  };

  return {
    cart,
    cartItemCount,
    loading,
    refreshCart,
    addToCart: async (productId: string, quantity: number, token: string) => {
      await dispatch(addToCartAction({ productId, quantity, token }));
    },
    removeFromCart: async (productId: string, token: string) => {
      await dispatch(removeFromCartAction({ productId, token }));
    },
    updateCartItem: async (productId: string, quantity: number, token: string) => {
      await dispatch(updateCartItemAction({ productId, quantity, token }));
    },
  };
};

