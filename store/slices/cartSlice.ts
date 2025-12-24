import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { Cart, CartItem } from '@/types';

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: CartState = {
  cart: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (token: string, { rejectWithValue }) => {
    try {
      const data = await api.get<Cart>('/cart', token);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity, token }: { productId: string; quantity: number; token: string }, { rejectWithValue }) => {
    try {
      const data = await api.post<Cart>('/cart/items', { productId, quantity }, token);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add to cart');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async ({ productId, token }: { productId: string; token: string }, { rejectWithValue }) => {
    try {
      await api.delete(`/cart/items/${productId}`, token);
      return productId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove from cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ productId, quantity, token }: { productId: string; quantity: number; token: string }, { rejectWithValue }) => {
    try {
      const data = await api.patch<Cart>(`/cart/items/${productId}`, { quantity }, token);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update cart item');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.cart = null;
      state.lastUpdated = null;
    },
    setCart: (state, action: PayloadAction<Cart | null>) => {
      state.cart = action.payload;
      state.lastUpdated = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        if (state.cart) {
          state.cart.items = state.cart.items.filter(item => item.product._id !== action.payload);
          state.lastUpdated = Date.now();
        }
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update cart item
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload;
        state.lastUpdated = Date.now();
      });
  },
});

export const { clearCart, setCart } = cartSlice.actions;

// Selectors
export const selectCart = (state: { cart: CartState }) => state.cart.cart;
export const selectCartLoading = (state: { cart: CartState }) => state.cart.loading;
export const selectCartItemCount = (state: { cart: CartState }) => 
  state.cart.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.cart?.items?.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0) || 0;

export default cartSlice.reducer;

