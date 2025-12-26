import { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { MaterialIcons } from '@expo/vector-icons';
import { brandYellow, brandYellowDark } from '@/constants/theme';

type Notification = {
  _id: string;
  user: string;
  from: {
    _id: string;
    name: string;
    profilePhoto?: string;
  };
  type: 'like' | 'comment' | 'follow' | 'unfollow' | 'payment_success' | 'payment_failed' | 'review' | 'message' | 'post_mention' | 'story_reply' | 'story_like' | 'product_like' | 'product_dislike' | 'order_placed';
  read: boolean;
  post?: { _id: string };
  comment?: { _id: string; text?: string };
  review?: { _id: string; rating?: number; comment?: string };
  payment?: { _id: string; amount?: number; status?: string };
  order?: { _id: string; total?: number; status?: string };
  product?: { _id: string; name?: string };
  story?: { _id: string };
  message?: string;
  metadata?: Record<string, any>;
  createdAt: string;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const result = await api.get<{ notifications: Notification[]; unreadCount: number }>(
        '/notifications',
        user.token
      );
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const getNotificationMessage = (notification: Notification): string => {
    const fromName = notification.from?.name || 'Someone';
    
    // Use custom message if available
    if (notification.message) {
      return notification.message;
    }
    
    switch (notification.type) {
      case 'like':
        return `${fromName} liked your post`;
      case 'comment':
        return `${fromName} commented on your post`;
      case 'follow':
        return `${fromName} started following you`;
      case 'unfollow':
        return `${fromName} unfollowed you`;
      case 'payment_success':
        return `Payment successful: $${notification.payment?.amount || 0}`;
      case 'payment_failed':
        return `Payment failed: $${notification.payment?.amount || 0}`;
      case 'review':
        return `${fromName} reviewed your product`;
      case 'message':
        return `${fromName} sent you a message`;
      case 'post_mention':
        return `${fromName} mentioned you in a post`;
      case 'story_reply':
        return `${fromName} replied to your story`;
      case 'story_like':
        return `${fromName} liked your story`;
      case 'product_like':
        return `${fromName} liked your product`;
      case 'product_dislike':
        return `${fromName} disliked your product`;
      case 'order_placed':
        return `${fromName} placed an order for your product`;
      default:
        return 'New notification';
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return 'favorite';
      case 'comment':
        return 'comment';
      case 'follow':
        return 'person-add';
      case 'unfollow':
        return 'person-remove';
      case 'payment_success':
        return 'check-circle';
      case 'payment_failed':
        return 'error';
      case 'review':
        return 'star';
      case 'message':
        return 'message';
      case 'post_mention':
        return 'alternate-email';
      case 'story_reply':
        return 'reply';
      case 'story_like':
        return 'favorite';
      case 'product_like':
        return 'thumb-up';
      case 'product_dislike':
        return 'thumb-down';
      case 'order_placed':
        return 'shopping-cart';
      default:
        return 'notifications';
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (isSelectionMode) {
      toggleSelection(notification._id);
      return;
    }

    // Mark as read if unread
    if (!notification.read && user?.token) {
      api.patch(`/notifications/${notification._id}/read`, {}, user.token).catch(() => {});
      // Update local state
      setNotifications(prev =>
        prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Navigate based on notification type
    if (notification.post?._id) {
      router.push(`/(tabs)/index`);
    } else if (notification.product?._id) {
      router.push(`/product/${notification.product._id}`);
    } else if (notification.order?._id) {
      // Navigate to orders or store page
      router.push(`/(tabs)/index`);
    } else if (notification.story?._id) {
      // Navigate to profile or story viewer
      router.push(`/(tabs)/index`);
    } else if (notification.type === 'follow' || notification.type === 'unfollow') {
      // Navigate to user's profile
      if (notification.from?._id) {
        router.push({
          pathname: '/(tabs)/profile',
          params: { userId: notification.from._id },
        });
      }
    }
  };

  const toggleSelection = (notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n._id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.size === 0) {
      Alert.alert('No Selection', 'Please select notifications to delete');
      return;
    }

    Alert.alert(
      'Delete Notifications',
      `Are you sure you want to delete ${selectedNotifications.size} notification(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.token) return;
            try {
              await api.delete('/notifications', {
                notificationIds: Array.from(selectedNotifications),
              }, user.token);
              
              setNotifications(prev =>
                prev.filter(n => !selectedNotifications.has(n._id))
              );
              setSelectedNotifications(new Set());
              setIsSelectionMode(false);
              await loadNotifications();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete notifications');
            }
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.token) return;
    try {
      await api.patch('/notifications/read-all', {}, user.token);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to mark all as read');
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const isSelected = selectedNotifications.has(item._id);
    
    return (
      <Pressable
        style={[
          styles.notificationItem,
          !item.read && styles.notificationItemUnread,
          isSelected && styles.notificationItemSelected,
        ]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedNotifications(new Set([item._id]));
          }
        }}
      >
        {isSelectionMode && (
          <Pressable
            style={styles.checkbox}
            onPress={() => toggleSelection(item._id)}
          >
            {isSelected && (
              <MaterialIcons name="check-circle" size={24} color={brandYellow} />
            )}
            {!isSelected && (
              <MaterialIcons name="radio-button-unchecked" size={24} color="#999" />
            )}
          </Pressable>
        )}
        {item.from?.profilePhoto ? (
          <Image
            source={{ uri: item.from.profilePhoto }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <ThemedText style={styles.avatarText}>
              {item.from?.name?.charAt(0).toUpperCase() || '?'}
            </ThemedText>
          </View>
        )}
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <ThemedText style={styles.notificationMessage} numberOfLines={2}>
              {getNotificationMessage(item)}
            </ThemedText>
            <MaterialIcons
              name={getNotificationIcon(item.type) as any}
              size={20}
              color={brandYellow}
            />
          </View>
          <ThemedText style={styles.notificationTime}>
            {formatTimeAgo(item.createdAt)}
          </ThemedText>
        </View>
        {!item.read && !isSelectionMode && (
          <View style={styles.unreadDot} />
        )}
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Header
        showBack
        rightAction={
          isSelectionMode
            ? {
                label: selectedNotifications.size > 0 ? `Delete (${selectedNotifications.size})` : 'Cancel',
                onPress: selectedNotifications.size > 0 ? handleDeleteSelected : () => {
                  setIsSelectionMode(false);
                  setSelectedNotifications(new Set());
                },
              }
            : {
                label: 'Select',
                onPress: () => setIsSelectionMode(true),
              }
        }
      />
      
      {!isSelectionMode && notifications.length > 0 && (
        <View style={styles.actionsBar}>
          <Pressable style={styles.actionButton} onPress={handleSelectAll}>
            <ThemedText style={styles.actionButtonText}>Select All</ThemedText>
          </Pressable>
          {unreadCount > 0 && (
            <Pressable style={styles.actionButton} onPress={handleMarkAllAsRead}>
              <ThemedText style={styles.actionButtonText}>Mark All Read</ThemedText>
            </Pressable>
          )}
        </View>
      )}

      {loading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brandYellow} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotification}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="notifications-none" size={64} color="#ccc" />
              <ThemedText style={styles.emptyText}>No notifications yet</ThemedText>
            </View>
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFEF9',
  },
  list: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonText: {
    color: brandYellow,
    fontSize: 14,
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  notificationItemUnread: {
    backgroundColor: '#FFF9E6',
    borderColor: brandYellow,
  },
  notificationItemSelected: {
    backgroundColor: '#FFF4D8',
    borderColor: brandYellow,
    borderWidth: 2,
  },
  checkbox: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: brandYellowDark,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

