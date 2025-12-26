import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/header';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Image } from 'expo-image';
import { brandYellow, brandYellowDark } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

type User = {
  _id: string;
  name: string;
  profilePhoto?: string;
};

type TabType = 'followers' | 'following';

export default function FollowersFollowingScreen() {
  const router = useRouter();
  const { userId: targetUserId, initialTab } = useLocalSearchParams<{ userId?: string; initialTab?: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>((initialTab as TabType) || 'followers');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [filteredFollowers, setFilteredFollowers] = useState<User[]>([]);
  const [filteredFollowing, setFilteredFollowing] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const currentUserId = targetUserId || user?.id;

  useEffect(() => {
    if (user?.token) {
      if (activeTab === 'followers') {
        loadFollowers();
      } else {
        loadFollowing();
      }
    }
  }, [user?.token, targetUserId, activeTab]);

  useEffect(() => {
    if (searchQuery.trim()) {
      if (activeTab === 'followers') {
        const filtered = followers.filter(follower =>
          follower.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredFollowers(filtered);
      } else {
        const filtered = following.filter(user =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredFollowing(filtered);
      }
    } else {
      setFilteredFollowers(followers);
      setFilteredFollowing(following);
    }
  }, [searchQuery, followers, following, activeTab]);

  const loadFollowers = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const endpoint = currentUserId === user.id 
        ? '/users/me/followers' 
        : `/users/${currentUserId}/followers-list`;
      const data = await api.get<User[]>(endpoint, user.token);
      setFollowers(data);
      setFilteredFollowers(data);
      
      // Batch load follow status for all followers
      if (data.length > 0) {
        try {
          const userIds = data.map(f => f._id).filter(id => id !== user.id);
          if (userIds.length > 0) {
            const statusMap = await api.post<Record<string, boolean>>(
              '/users/batch/follow-status',
              { userIds },
              user.token
            );
            setFollowingStatus(statusMap);
          }
        } catch (err) {
          if (__DEV__) console.log('Failed to load follow status:', err);
        }
      }
    } catch (err: any) {
      if (__DEV__) console.log('Failed to load followers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowing = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const endpoint = currentUserId === user.id 
        ? '/users/me/following' 
        : `/users/${currentUserId}/following-list`;
      const data = await api.get<User[]>(endpoint, user.token);
      setFollowing(data);
      setFilteredFollowing(data);
      // In following tab, all users are already being followed, so set status
      data.forEach(userItem => {
        if (userItem._id !== user.id) {
          setFollowingStatus(prev => ({ ...prev, [userItem._id]: true }));
        }
      });
    } catch (err: any) {
      if (__DEV__) console.log('Failed to load following:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async (targetUserId: string) => {
    if (!user?.token || targetUserId === user.id) return;
    try {
      const response = await api.get<{ following: boolean }>(`/users/${targetUserId}/follow-status`, user.token);
      setFollowingStatus(prev => ({ ...prev, [targetUserId]: response.following }));
    } catch (err) {
      // User might not exist or other error
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!user?.token || targetUserId === user.id) return;
    setUpdating(prev => ({ ...prev, [targetUserId]: true }));
    try {
      const response = await api.post<{ following: boolean }>(`/users/${targetUserId}/follow`, {}, user.token);
      setFollowingStatus(prev => ({ ...prev, [targetUserId]: response.following }));
    } catch (err: any) {
      if (__DEV__) console.log('Failed to follow/unfollow:', err);
    } finally {
      setUpdating(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!user?.token || targetUserId === user.id) return;
    setUpdating(prev => ({ ...prev, [targetUserId]: true }));
    try {
      await api.post<{ following: boolean }>(`/users/${targetUserId}/follow`, {}, user.token);
      // Remove from list after unfollowing
      setFollowing(prev => prev.filter(u => u._id !== targetUserId));
      setFilteredFollowing(prev => prev.filter(u => u._id !== targetUserId));
      setFollowingStatus(prev => ({ ...prev, [targetUserId]: false }));
    } catch (err: any) {
      if (__DEV__) console.log('Failed to unfollow:', err);
    } finally {
      setUpdating(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const handleUserPress = (targetUserId: string) => {
    router.push({
      pathname: '/(tabs)/profile',
      params: { userId: targetUserId },
    });
  };

  const renderUser = useCallback(({ item }: { item: User }) => {
    const isFollowing = followingStatus[item._id] || false;
    const isUpdating = updating[item._id] || false;
    const isFollowingTab = activeTab === 'following';

    return (
      <Pressable
        style={styles.userRow}
        onPress={() => handleUserPress(item._id)}
      >
        <View style={styles.userInfo}>
          {item.profilePhoto ? (
            <Image
              source={{ uri: item.profilePhoto }}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <ThemedText style={styles.avatarText}>
                {item.name.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          )}
          <View style={styles.userDetails}>
            <ThemedText style={styles.username}>{item.name}</ThemedText>
          </View>
        </View>
        {item._id !== user?.id && (
          <Pressable
            style={[
              styles.followButton,
              (isFollowingTab || isFollowing) && styles.followingButton
            ]}
            onPress={(e) => {
              e.stopPropagation();
              // In following tab, clicking does nothing (already following)
              // In followers tab, clicking follows/unfollows
              if (isFollowingTab) {
                // Do nothing - already following
                return;
              } else {
                handleFollow(item._id);
              }
            }}
            disabled={isUpdating || isFollowingTab}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={isFollowing ? "#1A1A1A" : "#FFFFFF"} />
            ) : (
              <ThemedText style={[
                styles.followButtonText,
                (isFollowingTab || isFollowing) && styles.followingButtonText
              ]}>
                {isFollowingTab ? 'Following' : (isFollowing ? 'Following' : 'Follow')}
              </ThemedText>
            )}
          </Pressable>
        )}
      </Pressable>
    );
  }, [activeTab, followingStatus, updating, user?.id, handleFollow, handleUserPress]);

  const currentData = activeTab === 'followers' ? filteredFollowers : filteredFollowing;
  const emptyText = activeTab === 'followers' 
    ? 'No followers yet' 
    : 'Not following anyone yet';

  return (
    <ThemedView style={styles.container}>
      <Header showBack />
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>
          {targetUserId && targetUserId !== user?.id ? 'Users' : 'Followers & Following'}
        </ThemedText>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'followers' && styles.tabActive]}
          onPress={() => setActiveTab('followers')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'followers' && styles.tabTextActive]}>
            Followers
          </ThemedText>
          {activeTab === 'followers' && <View style={styles.tabUnderline} />}
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'following' && styles.tabActive]}
          onPress={() => setActiveTab('following')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
            Following
          </ThemedText>
          {activeTab === 'following' && <View style={styles.tabUnderline} />}
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={16} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandYellow} />
        </View>
      ) : (
        <FlatList
          data={currentData}
          renderItem={renderUser}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>{emptyText}</ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {
    // Active tab styling
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
  list: {
    paddingHorizontal: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  followButton: {
    backgroundColor: brandYellow,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
