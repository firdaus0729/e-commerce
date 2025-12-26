import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Share as RNShare,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { IconSymbol } from './ui/icon-symbol';
import { MaterialIcons } from '@expo/vector-icons';
import { brandYellow, brandYellowDark } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import * as Clipboard from 'expo-clipboard';

type User = {
  _id: string;
  name: string;
  profilePhoto?: string;
  verified?: boolean;
};

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  postId?: string;
  postImageUrl?: string;
  postCaption?: string;
  onAddToStory?: () => void;
}

export function ShareModal({
  visible,
  onClose,
  postId,
  postImageUrl,
  postCaption,
  onAddToStory,
}: ShareModalProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (visible && user?.token) {
      loadFollowers();
    }
  }, [visible, user?.token]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = followers.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(followers);
    }
  }, [searchQuery, followers]);

  const loadFollowers = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const data = await api.get<User[]>(
        '/users/me/followers',
        user.token
      );
      setFollowers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      if (__DEV__) console.log('Failed to load followers:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleShareToUsers = async () => {
    if (selectedUsers.size === 0 || !postId || !user?.token) {
      Alert.alert('Error', 'Please select at least one user to share with');
      return;
    }

    setSharing(true);
    try {
      // Share post to selected users via direct messages
      const sharePromises = Array.from(selectedUsers).map((userId) =>
        api.post(
          '/messages',
          {
            receiverId: userId,
            postId: postId,
            text: `Check out this post! ${postCaption ? `"${postCaption}"` : ''}`,
            type: 'text',
          },
          user.token
        )
      );

      await Promise.all(sharePromises);
      Alert.alert('Success', `Shared with ${selectedUsers.size} user(s)`);
      setSelectedUsers(new Set());
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to share post');
    } finally {
      setSharing(false);
    }
  };

  const handleWhatsAppShare = async () => {
    try {
      const postUrl = postId
        ? `https://demisan.app/post/${postId}`
        : 'https://demisan.app';
      const message = postCaption
        ? `${postCaption}\n\n${postUrl}`
        : `Check out this post!\n\n${postUrl}`;

      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);

      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp
        const webUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
      }
      onClose();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  const handleCopyLink = async () => {
    try {
      const postUrl = postId
        ? `https://demisan.app/post/${postId}`
        : 'https://demisan.app';
      await Clipboard.setStringAsync(postUrl);
      Alert.alert('Success', 'Link copied to clipboard');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleAddToStory = () => {
    if (onAddToStory) {
      onAddToStory();
      onClose();
    }
  };

  const handleNativeShare = async () => {
    try {
      const postUrl = postId
        ? `https://demisan.app/post/${postId}`
        : 'https://demisan.app';
      const message = postCaption
        ? `${postCaption}\n\n${postUrl}`
        : `Check out this post!\n\n${postUrl}`;

      await RNShare.share({
        message: message,
        url: postImageUrl || postUrl,
        title: 'Share Post',
      });
      onClose();
    } catch (err: any) {
      if (__DEV__) console.log('Share error:', err);
    }
  };

  // Group users into rows of 3
  const groupedUsers: User[][] = [];
  for (let i = 0; i < filteredUsers.length; i += 3) {
    groupedUsers.push(filteredUsers.slice(i, i + 3));
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <ThemedView style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#1A1A1A" />
            </Pressable>
            <ThemedText style={styles.headerTitle}>Share</ThemedText>
            {selectedUsers.size > 0 && (
              <Pressable
                onPress={handleShareToUsers}
                disabled={sharing}
                style={styles.sendButton}
              >
                {sharing ? (
                  <ActivityIndicator size="small" color={brandYellow} />
                ) : (
                  <ThemedText style={styles.sendButtonText}>
                    Send ({selectedUsers.size})
                  </ThemedText>
                )}
              </Pressable>
            )}
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={18} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Pressable style={styles.addFriendsButton}>
              <MaterialIcons name="person-add" size={22} color={brandYellow} />
            </Pressable>
          </View>

          {/* Users List */}
          <ScrollView
            style={styles.usersList}
            contentContainerStyle={styles.usersListContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={brandYellow} />
              </View>
            ) : groupedUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>No users found</ThemedText>
              </View>
            ) : (
              groupedUsers.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.userRow}>
                  {row.map((userItem) => {
                    const isSelected = selectedUsers.has(userItem._id);
                    return (
                      <Pressable
                        key={userItem._id}
                        style={styles.userItem}
                        onPress={() => toggleUserSelection(userItem._id)}
                      >
                        <View
                          style={[
                            styles.userAvatarContainer,
                            isSelected && styles.userAvatarSelected,
                          ]}
                        >
                          {userItem.profilePhoto ? (
                            <Image
                              source={{ uri: userItem.profilePhoto }}
                              style={styles.userAvatar}
                            />
                          ) : (
                            <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
                              <ThemedText style={styles.userAvatarText}>
                                {userItem.name.charAt(0).toUpperCase()}
                              </ThemedText>
                            </View>
                          )}
                          {isSelected && (
                            <View style={styles.selectedIndicator}>
                              <MaterialIcons name="check" size={18} color="#FFFFFF" />
                            </View>
                          )}
                        </View>
                        <View style={styles.userNameContainer}>
                          <ThemedText style={styles.userName} numberOfLines={1}>
                            {userItem.name}
                          </ThemedText>
                          {userItem.verified && (
                            <View style={styles.verifiedBadge}>
                              <MaterialIcons name="check-circle" size={12} color="#FFFFFF" />
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                  {/* Fill empty slots in last row */}
                  {row.length < 3 &&
                    Array.from({ length: 3 - row.length }).map((_, idx) => (
                      <View key={`empty-${idx}`} style={styles.userItem} />
                    ))}
                </View>
              ))
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionButton} onPress={handleWhatsAppShare}>
              <View style={[styles.actionButtonIcon, styles.whatsappButton]}>
                <MaterialIcons name="photo-library" size={26} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.actionButtonLabel}>
                WhatsApp Status
              </ThemedText>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={handleWhatsAppShare}>
              <View style={[styles.actionButtonIcon, styles.whatsappButton]}>
                <MaterialIcons name="chat" size={26} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.actionButtonLabel}>WhatsApp</ThemedText>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={handleAddToStory}>
              <View style={[styles.actionButtonIcon, styles.addStoryButton]}>
                <MaterialIcons name="add-circle-outline" size={26} color="#1A1A1A" />
              </View>
              <ThemedText style={styles.actionButtonLabel}>Add to story</ThemedText>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={handleCopyLink}>
              <View style={[styles.actionButtonIcon, styles.copyLinkButton]}>
                <MaterialIcons name="link" size={26} color="#1A1A1A" />
              </View>
              <ThemedText style={styles.actionButtonLabel}>Copy link</ThemedText>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={handleNativeShare}>
              <View style={[styles.actionButtonIcon, styles.shareButton]}>
                <MaterialIcons name="share" size={26} color="#1A1A1A" />
              </View>
              <ThemedText style={styles.actionButtonLabel}>Share</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: brandYellow,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
  addFriendsButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usersList: {
    flex: 1,
    maxHeight: 400,
  },
  usersListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  userItem: {
    alignItems: 'center',
    width: 100,
  },
  userAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 8,
    position: 'relative',
  },
  userAvatarSelected: {
    borderColor: brandYellow,
  },
  userAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  userAvatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#666',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 100,
  },
  userName: {
    fontSize: 12,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0095F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  actionButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  addStoryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  copyLinkButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  shareButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonLabel: {
    fontSize: 11,
    color: '#1A1A1A',
    textAlign: 'center',
  },
});

