import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { Message } from '@/types';

interface MessagesState {
  conversations: Record<string, Message[]>; // key: conversationId (postId:userId or userId for direct)
  unreadCounts: Record<string, number>; // key: userId
  loading: boolean;
  error: string | null;
  lastUpdated: Record<string, number>; // key: conversationId
}

const initialState: MessagesState = {
  conversations: {},
  unreadCounts: {},
  loading: false,
  error: null,
  lastUpdated: {},
};

// Async thunks
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ postId, userId, token, isDirect = false }: { postId?: string; userId: string; token: string; isDirect?: boolean }, { rejectWithValue }) => {
    try {
      let data: Message[];
      if (isDirect) {
        data = await api.get<Message[]>(`/messages/direct/${userId}`, token);
      } else if (postId) {
        data = await api.get<Message[]>(`/messages/conversation/${postId}/${userId}`, token);
      } else {
        return rejectWithValue('Either postId or isDirect must be provided');
      }
      const conversationId = isDirect ? userId : `${postId}:${userId}`;
      return { conversationId, messages: data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ 
    receiverId, 
    postId, 
    type, 
    text, 
    mediaUrl, 
    fileName, 
    fileSize, 
    duration, 
    token 
  }: { 
    receiverId: string; 
    postId?: string; 
    type: string; 
    text?: string; 
    mediaUrl?: string; 
    fileName?: string; 
    fileSize?: number; 
    duration?: number; 
    token: string;
  }, { rejectWithValue }) => {
    try {
      const data = await api.post<Message>('/messages', {
        receiverId,
        postId,
        type,
        text,
        mediaUrl,
        fileName,
        fileSize,
        duration,
      }, token);
      const conversationId = postId ? `${postId}:${receiverId}` : receiverId;
      return { conversationId, message: data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const fetchUnreadMessageCounts = createAsyncThunk(
  'messages/fetchUnreadMessageCounts',
  async ({ userIds, token }: { userIds: string[]; token: string }, { rejectWithValue }) => {
    try {
      const counts: Record<string, number> = {};
      await Promise.all(
        userIds.map(async (userId) => {
          try {
            const result = await api.get<{ unreadCount: number }>(
              `/messages/direct/unread/${userId}`,
              token
            );
            counts[userId] = result.unreadCount;
          } catch (err) {
            counts[userId] = 0;
          }
        })
      );
      return counts;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch unread counts');
    }
  }
);

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const { conversationId, message } = action.payload;
      if (!state.conversations[conversationId]) {
        state.conversations[conversationId] = [];
      }
      state.conversations[conversationId].push(message);
      state.lastUpdated[conversationId] = Date.now();
    },
    setMessages: (state, action: PayloadAction<{ conversationId: string; messages: Message[] }>) => {
      const { conversationId, messages } = action.payload;
      state.conversations[conversationId] = messages;
      state.lastUpdated[conversationId] = Date.now();
    },
    clearConversation: (state, action: PayloadAction<string>) => {
      delete state.conversations[action.payload];
      delete state.lastUpdated[action.payload];
    },
    setUnreadCounts: (state, action: PayloadAction<Record<string, number>>) => {
      state.unreadCounts = { ...state.unreadCounts, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { conversationId, messages } = action.payload;
        state.conversations[conversationId] = messages;
        state.lastUpdated[conversationId] = Date.now();
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Send message
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { conversationId, message } = action.payload;
        if (!state.conversations[conversationId]) {
          state.conversations[conversationId] = [];
        }
        state.conversations[conversationId].push(message);
        state.lastUpdated[conversationId] = Date.now();
      })
      // Fetch unread counts
      .addCase(fetchUnreadMessageCounts.fulfilled, (state, action) => {
        state.unreadCounts = { ...state.unreadCounts, ...action.payload };
      });
  },
});

export const { addMessage, setMessages, clearConversation, setUnreadCounts } = messagesSlice.actions;

// Selectors
export const selectMessages = (state: { messages: MessagesState }, conversationId: string) =>
  state.messages.conversations[conversationId] || [];
export const selectUnreadMessageCounts = (state: { messages: MessagesState }) => state.messages.unreadCounts;
export const selectMessagesLoading = (state: { messages: MessagesState }) => state.messages.loading;

export default messagesSlice.reducer;

