import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { Story, StoryFeedItem } from '@/types';

interface StoriesState {
  feed: StoryFeedItem[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: StoriesState = {
  feed: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchStoriesFeed = createAsyncThunk(
  'stories/fetchFeed',
  async (token: string, { rejectWithValue }) => {
    try {
      const data = await api.get<StoryFeedItem[]>('/stories/feed', token);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch stories feed');
    }
  }
);

export const fetchUserStories = createAsyncThunk(
  'stories/fetchUserStories',
  async ({ userId, token }: { userId: string; token: string }, { rejectWithValue }) => {
    try {
      const data = await api.get<Story[]>(`/stories/user/${userId}`, token);
      return { userId, stories: data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user stories');
    }
  }
);

export const createStory = createAsyncThunk(
  'stories/createStory',
  async ({ mediaUrl, mediaType, caption, token }: { mediaUrl: string; mediaType: 'image' | 'video'; caption?: string; token: string }, { rejectWithValue }) => {
    try {
      const data = await api.post<Story>('/stories', { mediaUrl, mediaType, caption }, token);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create story');
    }
  }
);

export const viewStory = createAsyncThunk(
  'stories/viewStory',
  async ({ storyId, token }: { storyId: string; token: string }, { rejectWithValue }) => {
    try {
      await api.post(`/stories/${storyId}/view`, {}, token);
      return storyId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to view story');
    }
  }
);

export const likeStory = createAsyncThunk(
  'stories/likeStory',
  async ({ storyId, token }: { storyId: string; token: string }, { rejectWithValue }) => {
    try {
      const data = await api.post<Story>(`/stories/${storyId}/like`, {}, token);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to like story');
    }
  }
);

const storiesSlice = createSlice({
  name: 'stories',
  initialState,
  reducers: {
    setStoriesFeed: (state, action: PayloadAction<StoryFeedItem[]>) => {
      state.feed = action.payload;
      state.lastUpdated = Date.now();
    },
    addStoryToFeed: (state, action: PayloadAction<Story>) => {
      const story = action.payload;
      const userId = typeof story.user === 'string' ? story.user : story.user._id;
      const existingItem = state.feed.find(item => item.user._id === userId);
      if (existingItem) {
        existingItem.stories.unshift(story);
      } else {
        state.feed.unshift({
          user: typeof story.user === 'string' ? { _id: userId } : story.user,
          stories: [story],
          allViewed: false,
        });
      }
      state.lastUpdated = Date.now();
    },
    updateStoryInFeed: (state, action: PayloadAction<Story>) => {
      const story = action.payload;
      const userId = typeof story.user === 'string' ? story.user : story.user._id;
      const item = state.feed.find(item => item.user._id === userId);
      if (item) {
        const index = item.stories.findIndex(s => s._id === story._id);
        if (index !== -1) {
          item.stories[index] = story;
        }
      }
    },
    clearStories: (state) => {
      state.feed = [];
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch stories feed
      .addCase(fetchStoriesFeed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStoriesFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.feed = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchStoriesFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create story
      .addCase(createStory.fulfilled, (state, action) => {
        const story = action.payload;
        const userId = typeof story.user === 'string' ? story.user : story.user._id;
        const existingItem = state.feed.find(item => item.user._id === userId);
        if (existingItem) {
          existingItem.stories.unshift(story);
        } else {
          state.feed.unshift({
            user: typeof story.user === 'string' ? { _id: userId } : story.user,
            stories: [story],
            allViewed: false,
          });
        }
        state.lastUpdated = Date.now();
      })
      // View story
      .addCase(viewStory.fulfilled, (state, action) => {
        const storyId = action.payload;
        for (const item of state.feed) {
          const story = item.stories.find(s => s._id === storyId);
          if (story) {
            story.isViewed = true;
            break;
          }
        }
      })
      // Like story
      .addCase(likeStory.fulfilled, (state, action) => {
        const updatedStory = action.payload;
        for (const item of state.feed) {
          const index = item.stories.findIndex(s => s._id === updatedStory._id);
          if (index !== -1) {
            item.stories[index] = updatedStory;
            break;
          }
        }
      });
  },
});

export const { setStoriesFeed, addStoryToFeed, updateStoryInFeed, clearStories } = storiesSlice.actions;

// Selectors
export const selectStoriesFeed = (state: { stories: StoriesState }) => state.stories.feed;
export const selectStoriesLoading = (state: { stories: StoriesState }) => state.stories.loading;

export default storiesSlice.reducer;

