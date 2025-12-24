import { useEffect, useState, useRef, useCallback } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/header';
import { useAuth } from '@/hooks/use-auth';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { brandYellow } from '@/constants/theme';
import { api } from '@/lib/api';
import { Post, Stream, UserStats, Message, MessageType } from '@/types';
import { API_URL } from '@/constants/config';
import { Video } from 'expo-av';
import { ChatMenu } from '@/components/chat-menu';
import { EmojiPicker } from '@/components/emoji-picker';
import { GifPicker } from '@/components/gif-picker';
import { MaterialIcons } from '@expo/vector-icons';

type TabType = 'posts' | 'saved';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [stats, setStats] = useState<UserStats>({ postsCount: 0, followersCount: 0, followingCount: 0 });
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedStreams, setSavedStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postImageUri, setPostImageUri] = useState<string | null>(null);
  const [postCaption, setPostCaption] = useState('');
  const [uploadingPost, setUploadingPost] = useState(false);
  const [localProfilePhoto, setLocalProfilePhoto] = useState<string | undefined>(user?.profilePhoto);
  const [suggestedUsers, setSuggestedUsers] = useState<{ _id: string; name: string; profilePhoto?: string }[]>([]);
  const [unreadMessageCounts, setUnreadMessageCounts] = useState<Record<string, number>>({});
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState(user?.paypalEmail || '');
  const [updatingPayPal, setUpdatingPayPal] = useState(false);
  const [showUserActionModal, setShowUserActionModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ _id: string; name: string; profilePhoto?: string } | null>(null);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [checkingFollowStatus, setCheckingFollowStatus] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    if (!authLoading && user?.token) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, authLoading]);

  // Refresh unread message counts when page is focused
  useFocusEffect(
    useCallback(() => {
      if (user?.token && suggestedUsers.length > 0) {
        loadUnreadMessageCounts(suggestedUsers);
      }
    }, [user?.token, suggestedUsers.length])
  );

  useEffect(() => {
    setLocalProfilePhoto(user?.profilePhoto);
  }, [user?.profilePhoto]);

  useEffect(() => {
    setPaypalEmail(user?.paypalEmail || '');
  }, [user?.paypalEmail]);

  const handleUpdatePayPalEmail = async () => {
    if (!user?.token) return;
    
    if (!paypalEmail || !paypalEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid PayPal email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paypalEmail)) {
      Alert.alert('Invalid Format', 'Please enter a valid email address format.');
      return;
    }

    setUpdatingPayPal(true);
    try {
      await api.patch('/users/me/paypal-email', { paypalEmail }, user.token);
      if (user?.token) {
        await updateUser(user.token); // Refresh user data
      }
      setShowPayPalModal(false);
      Alert.alert('Success', 'PayPal email updated successfully!');
    } catch (err: any) {
      const errorCode = err.response?.data?.code;
      const errorMessage = err.response?.data?.message || err.message;
      
      if (errorCode === 'INVALID_FORMAT' || errorCode === 'INVALID_EMAIL') {
        Alert.alert('Invalid Email', 'Please enter a valid PayPal email address.');
      } else {
        Alert.alert('Error', errorMessage || 'Failed to update PayPal email. Please try again.');
      }
    } finally {
      setUpdatingPayPal(false);
    }
  };

  const loadData = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const [statsData, postsData, savedPostsData, savedStreamsData] = await Promise.all([
        api.get<UserStats>('/users/me/stats', user.token),
        api.get<Post[]>('/posts/me', user.token),
        api.get<Post[]>('/posts/saved', user.token),
        api.get<Stream[]>('/streams/saved', user.token),
      ]);
      setStats(statsData);
      setPosts(postsData);
      setSavedPosts(savedPostsData);
      setSavedStreams(savedStreamsData);
      loadSuggestedUsers();
    } catch (err: any) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestedUsers = async () => {
    if (!user?.token) return;
    setLoadingUsers(true);
    try {
      // Get users who messaged current user or liked their stories
      const users = await api.get<{ _id: string; name: string; profilePhoto?: string }[]>('/users/me/interactions?limit=20', user.token);
      setSuggestedUsers(users);
      // Load unread message counts for each user
      await loadUnreadMessageCounts(users);
    } catch (err: any) {
      console.error('Failed to load interaction users:', err);
      // Fallback to empty array if endpoint fails
      setSuggestedUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUnreadMessageCounts = async (users: { _id: string; name: string; profilePhoto?: string }[]) => {
    if (!user?.token) return;
    const counts: Record<string, number> = {};
    await Promise.all(
      users.map(async (userItem) => {
        try {
          const result = await api.get<{ unreadCount: number }>(
            `/messages/direct/unread/${userItem._id}`,
            user.token
          );
          counts[userItem._id] = result.unreadCount;
        } catch (err) {
          console.error(`Failed to load unread count for user ${userItem._id}:`, err);
          counts[userItem._id] = 0;
        }
      })
    );
    setUnreadMessageCounts(counts);
  };

  const handleFollow = async (userId: string) => {
    if (!user?.token) return;
    try {
      const response = await api.post<{ following: boolean }>(`/users/${userId}/follow`, {}, user.token);
      setFollowingStatus(prev => ({ ...prev, [userId]: response.following }));
      await loadData(); // Refresh stats
      // Keep modal open to show the status change, user can close manually
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to follow user');
    }
  };

  const checkFollowStatus = async (userId: string) => {
    if (!user?.token || followingStatus[userId] !== undefined) return;
    setCheckingFollowStatus(true);
    try {
      const response = await api.get<{ following: boolean }>(`/users/${userId}/following`, user.token);
      setFollowingStatus(prev => ({ ...prev, [userId]: response.following }));
    } catch (err: any) {
      console.error('Failed to check follow status:', err);
    } finally {
      setCheckingFollowStatus(false);
    }
  };

  const handleUserPress = async (suggestedUser: { _id: string; name: string; profilePhoto?: string }) => {
    setSelectedUser(suggestedUser);
    await checkFollowStatus(suggestedUser._id);
    setShowUserActionModal(true);
  };

  const handleMessage = async () => {
    if (!selectedUser || !user?.token) return;
    setShowUserActionModal(false);
    setShowChatModal(true);
    await loadDirectMessages(selectedUser._id);
  };

  const loadDirectMessages = async (userId: string) => {
    if (!user?.token) return;
    setLoadingMessages(true);
    try {
      const data = await api.get<Message[]>(`/messages/direct/${userId}`, user.token);
      setMessages(data);
      // Refresh unread counts after loading messages (they will be marked as read)
      await loadUnreadMessageCounts(suggestedUsers);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      // Start with empty messages if endpoint fails
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async (
    type: MessageType = 'text',
    mediaUrl?: string,
    fileName?: string,
    fileSize?: number,
    duration?: number,
    text?: string
  ) => {
    if (!user?.token || !selectedUser) return;
    const messageContent = text || messageText.trim();
    if (type === 'text' && !messageContent) return;

    setSendingMessage(true);
    try {
      const newMessage = await api.post<Message>(
        '/messages',
        {
          receiverId: selectedUser._id,
          // No postId for direct messages
          type,
          text: type === 'text' ? messageContent : messageContent || '',
          mediaUrl,
          fileName,
          fileSize,
          duration,
        },
        user.token
      );
      setMessages([...messages, newMessage]);
      setMessageText('');
      // Refresh unread message counts after sending
      if (suggestedUsers.length > 0) {
        await loadUnreadMessageCounts(suggestedUsers);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const pickImage = async () => {
    setShowChatMenu(false);
    if (!user?.token || !selectedUser) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }
    const anyPicker = ImagePicker as any;
    const mediaType = anyPicker.MediaType?.Images ?? ImagePicker.MediaType?.Images ?? anyPicker.MediaType?.All ?? ImagePicker.MediaType?.All;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType as any,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        setSendingMessage(true);
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('image', { uri, name: filename, type } as any);
        const uploadResult = await api.upload<{ url: string; filename: string; size: number }>(
          '/upload/image',
          formData,
          user.token
        );
        await sendMessage('image', uploadResult.url, filename, uploadResult.size);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to upload image');
      } finally {
        setSendingMessage(false);
      }
    }
  };

  const pickVideo = async () => {
    setShowChatMenu(false);
    if (!user?.token || !selectedUser) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }
    const anyPicker = ImagePicker as any;
    const mediaType = anyPicker.MediaType?.Videos ?? ImagePicker.MediaType?.Videos ?? anyPicker.MediaType?.All ?? ImagePicker.MediaType?.All;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType as any,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        setSendingMessage(true);
        const formData = new FormData();
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'video.mp4';
        const duration = result.assets[0].duration || 0;
        formData.append('video', { uri, name: filename, type: 'video/mp4' } as any);
        const uploadResult = await api.upload<{ url: string; filename: string; size: number }>(
          '/upload/video',
          formData,
          user.token
        );
        await sendMessage('video', uploadResult.url, filename, uploadResult.size, Math.round(duration / 1000));
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to upload video');
      } finally {
        setSendingMessage(false);
      }
    }
  };

  const pickFile = async () => {
    setShowChatMenu(false);
    if (!user?.token || !selectedUser) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        setSendingMessage(true);
        try {
          const formData = new FormData();
          const uri = result.assets[0].uri;
          const filename = result.assets[0].name;
          const fileSize = result.assets[0].size || 0;
          formData.append('file', {
            uri,
            name: filename,
            type: result.assets[0].mimeType || 'application/octet-stream',
          } as any);
          const uploadResult = await api.upload<{ url: string; filename: string; size: number }>(
            '/upload/file',
            formData,
            user.token
          );
          await sendMessage('file', uploadResult.url, filename, uploadResult.size);
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Failed to upload file');
        } finally {
          setSendingMessage(false);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to pick file');
    }
  };

  const pickProfilePhoto = async () => {
    if (!user?.token) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const anyPicker = ImagePicker as any;
    const mediaType = anyPicker.MediaType?.Images ?? ImagePicker.MediaType?.Images ?? anyPicker.MediaType?.All ?? ImagePicker.MediaType?.All;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadProfilePhoto(result.assets[0].uri);
    }
  };

  const uploadProfilePhoto = async (uri: string) => {
    if (!user?.token) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri,
        name: filename,
        type,
      } as any);

      const data = await api.upload<{ url: string; filename: string; size: number }>(
        '/upload/image',
        formData,
        user.token
      );
      await api.patch('/users/me', { profilePhoto: data.url }, user.token);
      
      // Update immediately in local state for instant UI update
      setLocalProfilePhoto(data.url);
      
      // Update user in auth context to keep it in sync
      if (user.token) {
        await updateUser(user.token);
      }
      
      Alert.alert('Success', 'Profile photo updated');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCreatePost = () => {
    setShowPostModal(true);
    setPostImageUri(null);
    setPostCaption('');
  };

  const pickPostImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const anyPicker2 = ImagePicker as any;
    const mediaType2 = anyPicker2.MediaType?.Images ?? ImagePicker.MediaType?.Images ?? anyPicker2.MediaType?.All ?? ImagePicker.MediaType?.All;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType2 as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPostImageUri(result.assets[0].uri);
    }
  };

  const uploadPost = async () => {
    if (!user?.token || !postImageUri) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    setUploadingPost(true);
    try {
      // Upload image
      const formData = new FormData();
      const filename = postImageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: postImageUri,
        name: filename,
        type,
      } as any);

      const uploadData = await api.upload<{ url: string; filename: string; size: number }>(
        '/upload/image',
        formData,
        user.token
      );

      // Create post
      await api.post(
        '/posts',
        {
          images: [uploadData.url],
          caption: postCaption || undefined,
        },
        user.token
      );

      Alert.alert('Success', 'Post created');
      setShowPostModal(false);
      setPostImageUri(null);
      setPostCaption('');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create post');
    } finally {
      setUploadingPost(false);
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <Header showSearch />
        <View style={styles.emptyState}>
          <ThemedText type="title" style={styles.welcomeTitle}>
            Welcome
          </ThemedText>
          <ThemedText style={styles.welcomeText}>
            Sign in to manage your profile, cart, orders, and live store.
          </ThemedText>
          <Pressable style={styles.authButton} onPress={() => router.push('/auth/login')}>
            <ThemedText style={styles.authButtonText}>Log in</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.authButton, styles.authButtonSecondary]}
            onPress={() => router.push('/auth/register')}
          >
            <ThemedText style={[styles.authButtonText, styles.authButtonTextSecondary]}>
              Create account
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Header
        showSearch={false}
        showBack
        showMenu={true}
        rightAction={{
          onPress: handleCreatePost,
          icon: 'plus',
          circular: true,
        }}
        onMenuPress={() => {
          router.push('/settings');
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profilePictureContainer}>
            {localProfilePhoto ? (
              <Image source={{ uri: localProfilePhoto }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profilePicture}>
                <View style={styles.avatarPlaceholder} />
              </View>
            )}
            <Pressable
              style={styles.cameraButton}
              onPress={pickProfilePhoto}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#1A1A1A" />
              ) : (
                <IconSymbol name="camera.fill" size={16} color="#1A1A1A" />
              )}
            </Pressable>
          </View>

          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>{user.name}</ThemedText>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{formatCount(stats.postsCount)}</ThemedText>
                <ThemedText style={styles.statLabel}>Posts</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{formatCount(stats.followersCount)}</ThemedText>
                <ThemedText style={styles.statLabel}>Followers</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{formatCount(stats.followingCount)}</ThemedText>
                <ThemedText style={styles.statLabel}>Following</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.profileHandle}>@{user.email.split('@')[0]}</ThemedText>
            <ThemedText style={styles.profileBio}>
              {user.bio || `Hello, I'm ${user.name}. Welcome to my profile!`}
            </ThemedText>
          </View>
        </View>
        {/* Interaction Flow Band - Users who messaged or liked stories */}
        {suggestedUsers.length > 0 && (
          <View style={styles.followFlowContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.followFlowScroll}>
              {suggestedUsers.map((suggestedUser) => {
                const unreadCount = unreadMessageCounts[suggestedUser._id] || 0;
                return (
                  <Pressable
                    key={suggestedUser._id}
                    style={styles.followFlowItem}
                    onPress={() => handleUserPress(suggestedUser)}
                  >
                    <View style={styles.followFlowAvatar}>
                      {suggestedUser.profilePhoto ? (
                        <Image source={{ uri: suggestedUser.profilePhoto }} style={styles.followFlowAvatarImage} />
                      ) : (
                        <View style={styles.followFlowAvatarPlaceholder}>
                          <ThemedText style={styles.followFlowAvatarText}>
                            {suggestedUser.name.charAt(0).toUpperCase()}
                          </ThemedText>
                        </View>
                      )}
                      {unreadCount > 0 && (
                        <View style={styles.unreadMessageBadge}>
                          <ThemedText style={styles.unreadMessageBadgeText}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText style={styles.followFlowName} numberOfLines={1}>
                      {suggestedUser.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
            onPress={() => setActiveTab('posts')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
              Posts
            </ThemedText>
            {activeTab === 'posts' && <View style={styles.tabUnderline} />}
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
            onPress={() => setActiveTab('saved')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
              Saved
            </ThemedText>
            {activeTab === 'saved' && <View style={styles.tabUnderline} />}
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={brandYellow} />
          </View>
        ) : (
          <View style={styles.grid}>
            {activeTab === 'posts' &&
              posts.map((post) => (
                <Pressable
                  key={post._id}
                  style={styles.gridItem}
                  onPress={() => {
                    if (post.images && post.images[0]) {
                      setSelectedImage(post.images[0]);
                      setShowImageModal(true);
                    }
                  }}
                >
                  {post.images && post.images[0] ? (
                    <Image source={{ uri: post.images[0] }} style={styles.gridImage} />
                  ) : (
                    <View style={styles.gridImagePlaceholder}>
                      <IconSymbol name="photo" size={30} color="#ccc" />
                    </View>
                  )}
                </Pressable>
              ))}
            {activeTab === 'posts' && posts.length === 0 && (
              <View style={styles.emptyGrid}>
                <ThemedText style={styles.emptyText}>No posts yet</ThemedText>
                <Pressable style={styles.createPostButton} onPress={handleCreatePost}>
                  <ThemedText style={styles.createPostButtonText}>Create your first post</ThemedText>
                </Pressable>
              </View>
            )}
            {activeTab === 'saved' && (
              <>
                {savedPosts.length === 0 && savedStreams.length === 0 ? (
                  <View style={styles.emptyGrid}>
                    <ThemedText style={styles.emptyText}>No saved items</ThemedText>
                  </View>
                ) : (
                  <>
                    {savedPosts.map((post) => (
                      <Pressable
                        key={`saved-post-${post._id}`}
                        style={styles.gridItem}
                        onPress={() => {
                          if (post.images && post.images[0]) {
                            setSelectedImage(post.images[0]);
                            setShowImageModal(true);
                          }
                        }}
                      >
                        {post.images && post.images[0] ? (
                          <Image source={{ uri: post.images[0] }} style={styles.gridImage} />
                        ) : (
                          <View style={styles.gridImagePlaceholder}>
                            <IconSymbol name="photo" size={30} color="#ccc" />
                          </View>
                        )}
                      </Pressable>
                    ))}
                    {savedStreams.map((stream) => (
                      <Pressable
                        key={`saved-stream-${stream._id}`}
                        style={styles.gridItem}
                        onPress={() => {
                          if (stream.playbackUrl) {
                            setSelectedStream(stream);
                            setShowVideoModal(true);
                          }
                        }}
                      >
                        <View style={styles.videoThumb}>
                          {stream.store?.logo ? (
                            <Image source={{ uri: stream.store.logo }} style={styles.videoThumbImage} />
                          ) : (
                            <View style={styles.gridImagePlaceholder}>
                              <IconSymbol name="play.fill" size={30} color="#ccc" />
                            </View>
                          )}
                          <View style={styles.videoPlayOverlay}>
                            <IconSymbol name="play.fill" size={28} color="#FFFFFF" />
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Post Creation Modal */}
      <Modal
        visible={showPostModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPostModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setShowPostModal(false)}>
                <ThemedText style={styles.modalCancel}>Cancel</ThemedText>
              </Pressable>
              <ThemedText style={styles.modalTitle}>Create Post</ThemedText>
              <Pressable onPress={uploadPost} disabled={!postImageUri || uploadingPost}>
                <ThemedText
                  style={[
                    styles.modalPost,
                    (!postImageUri || uploadingPost) && styles.modalPostDisabled,
                  ]}
                >
                  {uploadingPost ? 'Posting...' : 'Post'}
                </ThemedText>
              </Pressable>
            </View>

            {!postImageUri ? (
              <Pressable style={styles.pickImageButton} onPress={pickPostImage}>
                <IconSymbol name="photo" size={40} color="#666" />
                <ThemedText style={styles.pickImageText}>Pick an image</ThemedText>
              </Pressable>
            ) : (
              <View style={styles.postImageContainer}>
                <Image source={{ uri: postImageUri }} style={styles.postImagePreview} />
                <TextInput
                  style={styles.captionInput}
                  placeholder="Write a caption..."
                  placeholderTextColor="#999"
                  value={postCaption}
                  onChangeText={setPostCaption}
                  multiline
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalOverlay}>
          <Pressable style={styles.imageModalClose} onPress={() => setShowImageModal(false)}>
            <ThemedText style={styles.imageModalCloseText}>Close</ThemedText>
          </Pressable>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.imageModalImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* PayPal Email Modal */}
      <Modal
        visible={showPayPalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPayPalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>PayPal Email</ThemedText>
              <Pressable onPress={() => setShowPayPalModal(false)}>
                <IconSymbol name="chevron.down" size={24} color="#666" />
              </Pressable>
            </View>
            
            <ThemedText style={styles.modalSubtitle}>
              Link your PayPal account to make purchases. Your email will be used for payment processing.
            </ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>PayPal Email Address</ThemedText>
              <TextInput
                style={styles.modalInput}
                placeholder="your.email@example.com"
                placeholderTextColor="#999"
                value={paypalEmail}
                onChangeText={setPaypalEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowPayPalModal(false)}
              >
                <ThemedText style={styles.modalButtonTextCancel}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleUpdatePayPalEmail}
                disabled={updatingPayPal}
              >
                {updatingPayPal ? (
                  <ActivityIndicator color="#1A1A1A" />
                ) : (
                  <ThemedText style={styles.modalButtonTextSave}>Save</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Saved Video Player Modal */}
      <Modal
        visible={showVideoModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowVideoModal(false)}
      >
        <ThemedView style={styles.videoModalContainer}>
          <View style={styles.videoModalHeader}>
            <Pressable onPress={() => setShowVideoModal(false)}>
              <ThemedText style={styles.imageModalCloseText}>Close</ThemedText>
            </Pressable>
            <ThemedText style={styles.videoModalTitle} numberOfLines={1}>
              {selectedStream?.title || 'Saved stream'}
            </ThemedText>
          </View>
          {selectedStream?.playbackUrl ? (
            <Video
              source={{ uri: selectedStream.playbackUrl }}
              style={styles.videoPlayer}
              useNativeControls
              resizeMode="contain"
              shouldPlay
            />
          ) : (
            <View style={styles.emptyGrid}>
              <ThemedText style={styles.emptyText}>No playback URL for this stream</ThemedText>
            </View>
          )}
        </ThemedView>
      </Modal>

      {/* User Action Modal */}
      <Modal
        visible={showUserActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUserActionModal(false)}
      >
        <Pressable 
          style={styles.userActionModalOverlay}
          onPress={() => setShowUserActionModal(false)}
        >
          <View 
            style={styles.userActionModalContent}
          >
            {selectedUser && (
              <>
                <View style={styles.userActionHeader}>
                  <View style={styles.userActionAvatarContainer}>
                    {selectedUser.profilePhoto ? (
                      <Image 
                        source={{ uri: selectedUser.profilePhoto }} 
                        style={styles.userActionAvatar} 
                      />
                    ) : (
                      <View style={[styles.userActionAvatar, styles.userActionAvatarPlaceholder]}>
                        <ThemedText style={styles.userActionAvatarText}>
                          {selectedUser.name.charAt(0).toUpperCase()}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={styles.userActionName}>{selectedUser.name}</ThemedText>
                </View>

                <View style={styles.userActionButtons}>
                  <Pressable
                    style={[
                      styles.userActionButton,
                      followingStatus[selectedUser._id] 
                        ? styles.userActionButtonUnfollow 
                        : styles.userActionButtonFollow
                    ]}
                    onPress={() => handleFollow(selectedUser._id)}
                  >
                    <ThemedText style={[
                      styles.userActionButtonText,
                      followingStatus[selectedUser._id] 
                        ? styles.userActionButtonTextUnfollow 
                        : styles.userActionButtonTextFollow
                    ]}>
                      {followingStatus[selectedUser._id] ? 'Unfollow' : 'Follow'}
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    style={[styles.userActionButton, styles.userActionButtonMessage]}
                    onPress={handleMessage}
                  >
                    <IconSymbol name="message.fill" size={18} color="#fff" />
                    <ThemedText style={styles.userActionButtonTextMessage}>
                      Message
                    </ThemedText>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.userActionCancel}
                  onPress={() => setShowUserActionModal(false)}
                >
                  <ThemedText style={styles.userActionCancelText}>Cancel</ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Chat Modal */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        transparent={false}
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setShowChatModal(false);
          setMessages([]);
          setMessageText('');
        }}
      >
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <View style={styles.chatHeader}>
            <Pressable
              onPress={() => {
                setShowChatModal(false);
                setMessages([]);
                setMessageText('');
              }}
            >
              <IconSymbol name="chevron.left" size={24} color="#1A1A1A" />
            </Pressable>
            {selectedUser && (
              <View style={styles.chatHeaderUser}>
                {selectedUser.profilePhoto ? (
                  <Image
                    source={{ uri: selectedUser.profilePhoto }}
                    style={styles.chatHeaderAvatar}
                  />
                ) : (
                  <View style={styles.chatHeaderAvatar} />
                )}
                <View style={styles.chatHeaderUserInfo}>
                  <ThemedText style={styles.chatHeaderName}>
                    {selectedUser.name}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>

          <ScrollView
            style={styles.chatMessages}
            contentContainerStyle={styles.chatMessagesContent}
          >
            {loadingMessages ? (
              <View style={styles.chatLoading}>
                <ActivityIndicator size="large" color={brandYellow} />
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.chatEmpty}>
                <ThemedText style={styles.chatEmptyText}>
                  No messages yet. Start the conversation!
                </ThemedText>
              </View>
            ) : (
              messages.map((msg) => {
                const isSent = msg.sender._id === user?.id;
                const senderAvatar = isSent ? user?.profilePhoto : msg.sender.profilePhoto;
                return (
                  <View
                    key={msg._id}
                    style={[
                      styles.chatMessageWrapper,
                      isSent ? styles.chatMessageWrapperSent : styles.chatMessageWrapperReceived,
                    ]}
                  >
                    {!isSent && (
                      senderAvatar ? (
                        <Image source={{ uri: senderAvatar }} style={styles.chatMessageAvatar} />
                      ) : (
                        <View style={styles.chatMessageAvatar} />
                      )
                    )}
                    <Pressable
                      style={[
                        styles.chatMessage,
                        isSent ? styles.chatMessageSent : styles.chatMessageReceived,
                      ]}
                    >
                      {msg.type === 'image' && msg.mediaUrl ? (
                        <Image source={{ uri: msg.mediaUrl }} style={styles.chatMediaImage} />
                      ) : msg.type === 'video' && msg.mediaUrl ? (
                        <View style={styles.chatMediaVideo}>
                          <Image source={{ uri: msg.mediaUrl }} style={styles.chatMediaVideoThumb} />
                          <MaterialIcons name="play-circle-filled" size={48} color="#fff" style={styles.playIcon} />
                        </View>
                      ) : msg.type === 'audio' && msg.mediaUrl ? (
                        <View style={styles.chatAudioContainer}>
                          <MaterialIcons name="audiotrack" size={24} color={isSent ? '#1A1A1A' : '#666'} />
                          <View style={styles.chatAudioInfo}>
                            <ThemedText style={[styles.chatAudioText, isSent && styles.chatMessageTextSent]}>
                              Audio Message
                            </ThemedText>
                            <ThemedText style={[styles.chatAudioDuration, isSent && styles.chatMessageTimeSent]}>
                              {msg.duration ? `${Math.floor(msg.duration / 60)}:${String(msg.duration % 60).padStart(2, '0')}` : '0:00'}
                            </ThemedText>
                          </View>
                        </View>
                      ) : msg.type === 'file' && msg.mediaUrl ? (
                        <View style={styles.chatFileContainer}>
                          <MaterialIcons name="insert-drive-file" size={32} color={isSent ? '#1A1A1A' : '#666'} />
                          <View style={styles.chatFileInfo}>
                            <ThemedText style={[styles.chatFileText, isSent && styles.chatMessageTextSent]} numberOfLines={1}>
                              {msg.fileName || 'File'}
                            </ThemedText>
                            {msg.fileSize && (
                              <ThemedText style={[styles.chatFileSize, isSent && styles.chatMessageTimeSent]}>
                                {(msg.fileSize / 1024).toFixed(1)} KB
                              </ThemedText>
                            )}
                          </View>
                        </View>
                      ) : msg.type === 'gif' && msg.mediaUrl ? (
                        <Image source={{ uri: msg.mediaUrl }} style={styles.chatGifImage} />
                      ) : null}
                      {msg.text && (
                        <ThemedText style={[styles.chatMessageText, isSent && styles.chatMessageTextSent]}>
                          {msg.text}
                        </ThemedText>
                      )}
                      <View style={styles.chatMessageFooter}>
                        <ThemedText style={[styles.chatMessageTime, isSent && styles.chatMessageTimeSent]}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </ThemedText>
                        {isSent && (
                          <View style={styles.messageTicks}>
                            {msg.read ? (
                              <MaterialIcons name="done-all" size={14} color="#4CAF50" />
                            ) : msg.delivered ? (
                              <MaterialIcons name="done-all" size={14} color="#999" />
                            ) : (
                              <MaterialIcons name="done" size={14} color="#999" />
                            )}
                          </View>
                        )}
                      </View>
                    </Pressable>
                    {isSent && (
                      senderAvatar ? (
                        <Image source={{ uri: senderAvatar }} style={styles.chatMessageAvatar} />
                      ) : (
                        <View style={styles.chatMessageAvatar} />
                      )
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <Pressable
              style={styles.chatMenuButton}
              onPress={() => setShowChatMenu(!showChatMenu)}
            >
              <MaterialIcons name="add-circle" size={28} color={brandYellow} />
            </Pressable>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />
            <Pressable
              style={styles.chatEmojiButton}
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <MaterialIcons name="mood" size={24} color="#666" />
            </Pressable>
            {messageText.trim() && (
              <Pressable
                style={[styles.chatSendButton, sendingMessage && styles.chatSendButtonDisabled]}
                onPress={() => sendMessage('text')}
                disabled={sendingMessage}
              >
                {sendingMessage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconSymbol name="paperplane.fill" size={20} color="#fff" />
                )}
              </Pressable>
            )}
          </View>
          <ChatMenu
            visible={showChatMenu}
            onClose={() => setShowChatMenu(false)}
            onPickImage={pickImage}
            onPickVideo={pickVideo}
            onPickFile={pickFile}
            onShowGifs={() => {
              setShowChatMenu(false);
              setShowGifPicker(true);
            }}
          />
          <GifPicker
            visible={showGifPicker}
            onClose={() => setShowGifPicker(false)}
            onSelect={(gifUrl) => {
              sendMessage('gif', gifUrl);
              setShowGifPicker(false);
            }}
          />
          <EmojiPicker
            visible={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onSelect={(emoji) => {
              setMessageText(prev => prev + emoji);
              setShowEmojiPicker(false);
            }}
          />
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  welcomeTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  authButton: {
    width: '100%',
    backgroundColor: brandYellow,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  authButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: brandYellow,
  },
  authButtonText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 16,
  },
  authButtonTextSecondary: {
    color: brandYellow,
  },
  profileSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
    overflow: 'visible',
  },
  profilePictureContainer: {
    position: 'relative',
    width: 108,
    height: 108,
    marginRight: 0,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatarPlaceholder: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#E0E0E0',
  },
  followFlowContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  followFlowScroll: {
    flexDirection: 'row',
  },
  followFlowItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  followFlowAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'visible',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: brandYellow,
    position: 'relative',
  },
  followFlowAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50
  },
  followFlowAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  followFlowAvatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
  },
  followFlowName: {
    fontSize: 12,
    color: '#1A1A1A',
    textAlign: 'center',
    maxWidth: 70,
  },
  unreadMessageBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
  unreadMessageBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 100,
    transform: [{ translateX: 0 }, { translateY: 0 }],
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    marginRight: 8
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  profileHandle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: brandYellow,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
  },
  gridItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoThumbImage: {
    width: '100%',
    height: '100%',
  },
  videoPlayOverlay: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGrid: {
    width: '100%',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  createPostButton: {
    backgroundColor: brandYellow,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createPostButtonText: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalPost: {
    fontSize: 16,
    fontWeight: '600',
    color: brandYellow,
  },
  modalPostDisabled: {
    opacity: 0.5,
  },
  pickImageButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
  },
  pickImageText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  postImageContainer: {
    flex: 1,
  },
  postImagePreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
  },
  imageModalCloseText: {
    color: '#fff',
    fontSize: 14,
  },
  imageModalImage: {
    width: '100%',
    height: '100%',
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  videoModalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  videoPlayer: {
    flex: 1,
    backgroundColor: '#000',
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  paypalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paypalInfo: {
    flex: 1,
  },
  paypalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  paypalValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  paypalHint: {
    fontSize: 12,
    color: '#999',
  },
  paypalButton: {
    backgroundColor: brandYellow,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paypalButtonText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 14,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonSave: {
    backgroundColor: brandYellow,
  },
  modalButtonTextCancel: {
    color: '#666',
    fontWeight: '600',
  },
  modalButtonTextSave: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  userActionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userActionModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userActionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  userActionAvatarContainer: {
    marginBottom: 12,
  },
  userActionAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: brandYellow,
  },
  userActionAvatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userActionAvatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#666',
  },
  userActionName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  userActionButtons: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  userActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  userActionButtonFollow: {
    backgroundColor: brandYellow,
  },
  userActionButtonUnfollow: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  userActionButtonMessage: {
    backgroundColor: '#007AFF',
  },
  userActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userActionButtonTextFollow: {
    color: '#1A1A1A',
  },
  userActionButtonTextUnfollow: {
    color: '#1A1A1A',
  },
  userActionButtonTextMessage: {
    color: '#fff',
  },
  userActionCancel: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  userActionCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
  },
  chatHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginLeft: 12,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  chatHeaderUserInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  chatMessages: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chatMessagesContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 20,
  },
  chatLoading: {
    padding: 20,
    alignItems: 'center',
  },
  chatEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  chatEmptyText: {
    color: '#999',
    fontSize: 14,
  },
  chatMessageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    gap: 8,
    width: '100%',
  },
  chatMessageWrapperSent: {
    justifyContent: 'flex-end',
  },
  chatMessageWrapperReceived: {
    justifyContent: 'flex-start',
  },
  chatMessage: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  chatMessageSent: {
    backgroundColor: brandYellow,
    borderBottomRightRadius: 4,
  },
  chatMessageReceived: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  chatMessageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  chatMessageText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  chatMessageTextSent: {
    color: '#1A1A1A',
  },
  chatMessageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  chatMessageTime: {
    fontSize: 10,
    color: '#999',
  },
  chatMessageTimeSent: {
    color: '#666',
  },
  messageTicks: {
    marginLeft: 2,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    minHeight: 40,
    backgroundColor: '#f9f9f9',
    color: '#1A1A1A',
  },
  chatSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  chatMenuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatEmojiButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatMediaImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  chatMediaVideo: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  chatMediaVideoThumb: {
    width: '100%',
    height: '100%',
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -24,
  },
  chatAudioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  chatAudioInfo: {
    flex: 1,
  },
  chatAudioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  chatAudioDuration: {
    fontSize: 12,
    color: '#999',
  },
  chatFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  chatFileInfo: {
    flex: 1,
  },
  chatFileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  chatFileSize: {
    fontSize: 12,
    color: '#999',
  },
  chatGifImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
});
