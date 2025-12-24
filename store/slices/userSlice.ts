import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { Post, Stream, UserStats } from '@/types';

interface UserState {
  profile: {
    stats: UserStats | null;
    posts: Post[];
    savedPosts: Post[];
    savedStreams: Stream[];
    loading: boolean;
    error: string | null;
  };
  followers: Array<{ _id: string; name: string; profilePhoto?: string }>;
  interactionUsers: Array<{ _id: string; name: string; profilePhoto?: string }>;
  lastUpdated: number | null;
}

const initialState: UserState = {
  profile: {
    stats: null,
    posts: [],
    savedPosts: [],
    savedStreams: [],
    loading: false,
    error: null,
  },
  followers: [],
  interactionUsers: [],
  lastUpdated: null,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (token: string, { rejectWithValue }) => {
    try {
      const [stats, posts, savedPosts, savedStreams] = await Promise.all([
        api.get<UserStats>('/users/me/stats', token),
        api.get<Post[]>('/posts/me', token),
        api.get<Post[]>('/posts/saved', token),
        api.get<Stream[]>('/streams/saved', token),
      ]);
      return { stats, posts, savedPosts, savedStreams };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user profile');
    }
  }
);

export const fetchFollowers = createAsyncThunk(
  'user/fetchFollowers',
  async (token: string, { rejectWithValue }) => {
    try {
      const data = await api.get<Array<{ _id: string; name: string; profilePhoto?: string }>>('/users/me/followers', token);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch followers');
    }
  }
);

export const fetchInteractionUsers = createAsyncThunk(
  'user/fetchInteractionUsers',
  async (token: string, { rejectWithValue }) => {
    try {
      const data = await api.get<Array<{ _id: string; name: string; profilePhoto?: string }>>('/users/me/interactions?limit=20', token);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch interaction users');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    addUserPost: (state, action: PayloadAction<Post>) => {
      state.profile.posts.unshift(action.payload);
      if (state.profile.stats) {
        state.profile.stats.postsCount = (state.profile.stats.postsCount || 0) + 1;
      }
    },
    removeUserPost: (state, action: PayloadAction<string>) => {
      state.profile.posts = state.profile.posts.filter(p => p._id !== action.payload);
      if (state.profile.stats) {
        state.profile.stats.postsCount = Math.max(0, (state.profile.stats.postsCount || 0) - 1);
      }
    },
    updateUserStats: (state, action: PayloadAction<UserStats>) => {
      state.profile.stats = action.payload;
    },
    clearUserProfile: (state) => {
      state.profile = {
        stats: null,
        posts: [],
        savedPosts: [],
        savedStreams: [],
        loading: false,
        error: null,
      };
      state.followers = [];
      state.interactionUsers = [];
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.profile.loading = true;
        state.profile.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profile.loading = false;
        state.profile.stats = action.payload.stats;
        state.profile.posts = action.payload.posts;
        state.profile.savedPosts = action.payload.savedPosts;
        state.profile.savedStreams = action.payload.savedStreams;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.profile.loading = false;
        state.profile.error = action.payload as string;
      })
      // Fetch followers
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.followers = action.payload;
      })
      // Fetch interaction users
      .addCase(fetchInteractionUsers.fulfilled, (state, action) => {
        state.interactionUsers = action.payload;
      });
  },
});

export const { addUserPost, removeUserPost, updateUserStats, clearUserProfile } = userSlice.actions;

// Selectors
export const selectUserProfile = (state: { user: UserState }) => state.user.profile;
export const selectUserStats = (state: { user: UserState }) => state.user.profile.stats;
export const selectUserPosts = (state: { user: UserState }) => state.user.profile.posts;
export const selectSavedPosts = (state: { user: UserState }) => state.user.profile.savedPosts;
export const selectSavedStreams = (state: { user: UserState }) => state.user.profile.savedStreams;
export const selectFollowers = (state: { user: UserState }) => state.user.followers;
export const selectInteractionUsers = (state: { user: UserState }) => state.user.interactionUsers;

export default userSlice.reducer;

