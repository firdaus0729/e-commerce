import { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/header';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Image } from 'expo-image';
import { brandYellow, brandYellowDark } from '@/constants/theme';
import { Post, UserStats } from '@/types';
import { IconSymbol } from '@/components/ui/icon-symbol';

type User = {
  _id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  bio?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
};

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState<boolean>(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');

  useEffect(() => {
    if (userId && currentUser?.token) {
      loadUserProfile();
      checkFollowStatus();
    }
  }, [userId, currentUser?.token]);

  const loadUserProfile = async () => {
    if (!userId || !currentUser?.token) return;
    setLoading(true);
    try {
      const [userData, postsData] = await Promise.all([
        api.get<User>(`/users/${userId}`, currentUser.token),
        api.get<Post[]>(`/posts/user/${userId}`, currentUser.token),
      ]);
      setUser(userData);
      setPosts(postsData);
    } catch (err: any) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!userId || !currentUser?.token || userId === currentUser.id) return;
    try {
      const response = await api.get<{ following: boolean }>(`/users/${userId}/follow-status`, currentUser.token);
      setFollowing(response.following);
    } catch (err) {
      // User might not exist
    }
  };

  const handleFollow = async () => {
    if (!userId || !currentUser?.token || userId === currentUser.id) return;
    setUpdating(true);
    try {
      const response = await api.post<{ following: boolean }>(`/users/${userId}/follow`, {}, currentUser.token);
      setFollowing(response.following);
      if (user) {
        setUser({
          ...user,
          followersCount: response.following ? user.followersCount + 1 : user.followersCount - 1,
        });
      }
    } catch (err: any) {
      console.error('Failed to follow/unfollow:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleMessage = () => {
    if (!userId) return;
    // Navigate to chat with this user
    router.push({
      pathname: '/(tabs)/index',
      params: { chatUserId: userId },
    });
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return String(count);
  };

  const renderPost = ({ item }: { item: Post }) => {
    return (
      <Pressable style={styles.postCard}>
        {item.images && item.images[0] ? (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.postImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.postImage, styles.postImagePlaceholder]}>
            <IconSymbol name="photo" size={40} color="#ccc" />
          </View>
        )}
        {item.caption && (
          <ThemedText style={styles.postCaption} numberOfLines={2}>
            {item.caption}
          </ThemedText>
        )}
      </Pressable>
    );
  };

  if (loading || !user) {
    return (
      <ThemedView style={styles.container}>
        <Header showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandYellow} />
        </View>
      </ThemedView>
    );
  }

  const isOwnProfile = userId === currentUser?.id;

  return (
    <ThemedView style={styles.container}>
      <Header showBack />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.profilePictureContainer}>
            {user.profilePhoto ? (
              <Image
                source={{ uri: user.profilePhoto }}
                style={styles.profilePicture}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.profilePicture, styles.avatarPlaceholder]}>
                <ThemedText style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>{user.name}</ThemedText>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{formatCount(user.postsCount)}</ThemedText>
                <ThemedText style={styles.statLabel}>Posts</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{formatCount(user.followersCount)}</ThemedText>
                <ThemedText style={styles.statLabel}>Followers</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{formatCount(user.followingCount)}</ThemedText>
                <ThemedText style={styles.statLabel}>Following</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.profileHandle}>@{user.email.split('@')[0]}</ThemedText>
            {user.bio && (
              <ThemedText style={styles.profileBio}>{user.bio}</ThemedText>
            )}
          </View>
        </View>

        {!isOwnProfile && (
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, following && styles.followingButton]}
              onPress={handleFollow}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color={following ? "#1A1A1A" : "#FFFFFF"} />
              ) : (
                <ThemedText style={[styles.actionButtonText, following && styles.followingButtonText]}>
                  {following ? 'Following' : 'Follow'}
                </ThemedText>
              )}
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.messageButton]}
              onPress={handleMessage}
            >
              <ThemedText style={styles.messageButtonText}>Message</ThemedText>
            </Pressable>
          </View>
        )}

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Posts
            </ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item._id}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.postsGrid}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  profilePictureContainer: {
    position: 'relative',
    width: 108,
    height: 108,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: brandYellow,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#666',
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
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 14,
    color: '#1A1A1A',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: brandYellow,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#1A1A1A',
  },
  messageButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageButtonText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: brandYellow,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: brandYellow,
    fontWeight: '600',
  },
  postsGrid: {
    padding: 2,
  },
  postCard: {
    flex: 1,
    aspectRatio: 1,
    margin: 1,
    backgroundColor: '#F5F5F5',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCaption: {
    fontSize: 12,
    color: '#666',
    padding: 4,
  },
});

