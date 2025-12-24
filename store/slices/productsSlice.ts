import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { Product, Store } from '@/types';

interface ProductsState {
  products: Record<string, Product[]>; // key: storeId
  stores: Store[];
  loading: boolean;
  error: string | null;
  lastUpdated: Record<string, number>; // key: storeId
}

const initialState: ProductsState = {
  products: {},
  stores: [],
  loading: false,
  error: null,
  lastUpdated: {},
};

// Async thunks
export const fetchStores = createAsyncThunk(
  'products/fetchStores',
  async (_, { rejectWithValue }) => {
    try {
      const data = await api.get<Store[]>('/stores');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch stores');
    }
  }
);

export const fetchStoreProducts = createAsyncThunk(
  'products/fetchStoreProducts',
  async ({ storeId, token }: { storeId: string; token?: string }, { rejectWithValue }) => {
    try {
      const data = token
        ? await api.get<Product[]>(`/products?store=${storeId}`, token)
        : await api.get<Product[]>(`/products?store=${storeId}`);
      return { storeId, products: data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);

export const fetchProduct = createAsyncThunk(
  'products/fetchProduct',
  async ({ productId, token }: { productId: string; token?: string }, { rejectWithValue }) => {
    try {
      const data = token
        ? await api.get<Product>(`/products/${productId}`, token)
        : await api.get<Product>(`/products/${productId}`);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch product');
    }
  }
);

export const updateProductStock = createAsyncThunk(
  'products/updateProductStock',
  async ({ productId, stock, token }: { productId: string; stock: number; token: string }, { rejectWithValue }) => {
    try {
      const data = await api.patch<Product>(`/products/${productId}`, { stock }, token);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update product stock');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    updateProductInStore: (state, action: PayloadAction<{ storeId: string; product: Product }>) => {
      const { storeId, product } = action.payload;
      if (state.products[storeId]) {
        const index = state.products[storeId].findIndex(p => p._id === product._id);
        if (index !== -1) {
          state.products[storeId][index] = product;
        } else {
          state.products[storeId].push(product);
        }
      }
    },
    updateProductStockOptimistic: (state, action: PayloadAction<{ productId: string; storeId: string; quantity: number }>) => {
      const { productId, storeId, quantity } = action.payload;
      if (state.products[storeId]) {
        const product = state.products[storeId].find(p => p._id === productId);
        if (product && product.stock !== undefined) {
          product.stock = Math.max(0, product.stock - quantity);
        }
      }
    },
    clearStoreProducts: (state, action: PayloadAction<string>) => {
      delete state.products[action.payload];
      delete state.lastUpdated[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch stores
      .addCase(fetchStores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.loading = false;
        state.stores = action.payload;
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch store products
      .addCase(fetchStoreProducts.fulfilled, (state, action) => {
        state.loading = false;
        const { storeId, products } = action.payload;
        state.products[storeId] = products;
        state.lastUpdated[storeId] = Date.now();
      })
      .addCase(fetchStoreProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch product
      .addCase(fetchProduct.fulfilled, (state, action) => {
        const product = action.payload;
        if (product.store) {
          const storeId = typeof product.store === 'string' ? product.store : product.store._id;
          if (!state.products[storeId]) {
            state.products[storeId] = [];
          }
          const index = state.products[storeId].findIndex(p => p._id === product._id);
          if (index !== -1) {
            state.products[storeId][index] = product;
          } else {
            state.products[storeId].push(product);
          }
        }
      })
      // Update product stock
      .addCase(updateProductStock.fulfilled, (state, action) => {
        const product = action.payload;
        if (product.store) {
          const storeId = typeof product.store === 'string' ? product.store : product.store._id;
          if (state.products[storeId]) {
            const index = state.products[storeId].findIndex(p => p._id === product._id);
            if (index !== -1) {
              state.products[storeId][index] = product;
            }
          }
        }
      });
  },
});

export const { updateProductInStore, updateProductStockOptimistic, clearStoreProducts } = productsSlice.actions;

// Selectors
export const selectStores = (state: { products: ProductsState }) => state.products.stores;
export const selectStoreProducts = (state: { products: ProductsState }, storeId: string) =>
  state.products.products[storeId] || [];
export const selectProductById = (state: { products: ProductsState }, productId: string) => {
  for (const products of Object.values(state.products.products)) {
    const product = products.find(p => p._id === productId);
    if (product) return product;
  }
  return undefined;
};
export const selectProductsLoading = (state: { products: ProductsState }) => state.products.loading;

export default productsSlice.reducer;

