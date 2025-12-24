import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { Post } from '@/types';

interface PostsState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  unreadCounts: Record<string, number>;
  savedPosts: Record<string, boolean>;
}

const initialState: PostsState = {
  posts: [],
  loading: false,
  error: null,
  lastUpdated: null,
  unreadCounts: {},
  savedPosts: {},
};

// Async thunks
export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (token: string, { rejectWithValue }) => {
    try {
      const data = await api.get<Post[]>('/posts/feed', token);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch posts');
    }
  }
);

export const fetchSavedPosts = createAsyncThunk(
  'posts/fetchSavedPosts',
  async (token: string, { rejectWithValue }) => {
    try {
      const data = await api.get<Post[]>('/posts/saved', token);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch saved posts');
    }
  }
);

export const likePost = createAsyncThunk(
  'posts/likePost',
  async ({ postId, token }: { postId: string; token: string }, { rejectWithValue }) => {
    try {
      const data = await api.post<Post>(`/posts/${postId}/like`, {}, token);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to like post');
    }
  }
);

export const savePost = createAsyncThunk(
  'posts/savePost',
  async ({ postId, token }: { postId: string; token: string }, { rejectWithValue }) => {
    try {
      await api.post(`/posts/${postId}/save`, {}, token);
      return postId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save post');
    }
  }
);

export const unsavePost = createAsyncThunk(
  'posts/unsavePost',
  async ({ postId, token }: { postId: string; token: string }, { rejectWithValue }) => {
    try {
      await api.delete(`/posts/${postId}/save`, token);
      return postId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to unsave post');
    }
  }
);

export const fetchUnreadCounts = createAsyncThunk(
  'posts/fetchUnreadCounts',
  async ({ posts, userId, token }: { posts: Post[]; userId: string; token: string }, { rejectWithValue }) => {
    try {
      const counts: Record<string, number> = {};
      await Promise.all(
        posts.map(async (post) => {
          if (!post.user) return;
          const postUser = post.user as any;
          const postOwnerId = postUser?._id?.toString() || postUser?.toString();
          if (!postOwnerId) return;
          try {
            if (postOwnerId === userId) {
              const result = await api.get<{ totalUnread: number }>(
                `/messages/post/${post._id}/users`,
                token
              );
              counts[post._id] = result.totalUnread;
            } else {
              const result = await api.get<{ unreadCount: number }>(
                `/messages/unread/${post._id}/${postOwnerId}`,
                token
              );
              counts[post._id] = result.unreadCount;
            }
          } catch (err) {
            // Silently fail for individual posts
          }
        })
      );
      return counts;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch unread counts');
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setPosts: (state, action: PayloadAction<Post[]>) => {
      state.posts = action.payload;
      state.lastUpdated = Date.now();
    },
    addPost: (state, action: PayloadAction<Post>) => {
      state.posts.unshift(action.payload);
    },
    updatePost: (state, action: PayloadAction<Post>) => {
      const index = state.posts.findIndex(p => p._id === action.payload._id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
    },
    removePost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter(p => p._id !== action.payload);
    },
    setUnreadCounts: (state, action: PayloadAction<Record<string, number>>) => {
      state.unreadCounts = { ...state.unreadCounts, ...action.payload };
    },
    clearPosts: (state) => {
      state.posts = [];
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch posts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch saved posts
      .addCase(fetchSavedPosts.fulfilled, (state, action) => {
        const savedMap: Record<string, boolean> = {};
        action.payload.forEach((post) => {
          savedMap[post._id] = true;
        });
        state.savedPosts = savedMap;
      })
      // Like post
      .addCase(likePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
      })
      // Save post
      .addCase(savePost.fulfilled, (state, action) => {
        state.savedPosts[action.payload] = true;
      })
      // Unsave post
      .addCase(unsavePost.fulfilled, (state, action) => {
        delete state.savedPosts[action.payload];
      })
      // Fetch unread counts
      .addCase(fetchUnreadCounts.fulfilled, (state, action) => {
        state.unreadCounts = { ...state.unreadCounts, ...action.payload };
      });
  },
});

export const { setPosts, addPost, updatePost, removePost, setUnreadCounts, clearPosts } = postsSlice.actions;

// Selectors
export const selectPosts = (state: { posts: PostsState }) => state.posts.posts;
export const selectPostsLoading = (state: { posts: PostsState }) => state.posts.loading;
export const selectSavedPosts = (state: { posts: PostsState }) => state.posts.savedPosts;
export const selectUnreadCounts = (state: { posts: PostsState }) => state.posts.unreadCounts;
export const selectPostById = (state: { posts: PostsState }, postId: string) =>
  state.posts.posts.find(p => p._id === postId);

export default postsSlice.reducer;

