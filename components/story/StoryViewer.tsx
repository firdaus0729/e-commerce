import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Text,
  Modal,
  ActivityIndicator,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Story, StoryFeedItem, StoryReply } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

interface StoryViewerProps {
  visible: boolean;
  feed: StoryFeedItem[];
  initialUserIndex?: number;
  initialStoryIndex?: number;
  onClose: () => void;
}

export function StoryViewer({
  visible,
  feed,
  initialUserIndex = 0,
  initialStoryIndex = 0,
  onClose,
}: StoryViewerProps) {
  const { user } = useAuth();
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<StoryReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<Video>(null);

  const currentUser = feed[currentUserIndex];
  const currentStory = currentUser?.stories[currentStoryIndex];

  useEffect(() => {
    if (!visible || !currentStory) return;

    // Mark story as viewed
    api.post(`/stories/${currentStory._id}/view`).catch(console.error);

    // Load story likes status
    setIsLiked(currentStory.isLiked || false);
    setLikesCount(currentStory.likesCount || 0);

    // Reset progress
    setProgress(0);
    setIsPaused(false);

    // Start progress timer
    if (currentStory.mediaType === 'image') {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNextStory();
            return 0;
          }
          return prev + 2; // Update every 100ms (5s total = 5000ms / 50 updates)
        });
      }, 100);
    } else {
      // For video, progress is handled by video playback
      setProgress(0);
      if (videoRef.current) {
        videoRef.current.playAsync().catch(console.error);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (videoRef.current) {
        videoRef.current.pauseAsync();
      }
    };
  }, [visible, currentUserIndex, currentStoryIndex, currentStory?._id]);

  const handleNextStory = () => {
    if (!currentUser) return;

    // Move to next story in current user's stories
    if (currentStoryIndex < currentUser.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      // Move to next user
      if (currentUserIndex < feed.length - 1) {
        setCurrentUserIndex(currentUserIndex + 1);
        setCurrentStoryIndex(0);
      } else {
        // End of all stories
        onClose();
      }
    }
  };

  const handlePreviousStory = () => {
    if (!currentUser) return;

    // Move to previous story in current user's stories
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      // Move to previous user
      if (currentUserIndex > 0) {
        const prevUser = feed[currentUserIndex - 1];
        setCurrentUserIndex(currentUserIndex - 1);
        setCurrentStoryIndex(prevUser.stories.length - 1);
      }
    }
  };

  const handleLike = async () => {
    if (!currentStory) return;

    try {
      const response = await api.post<{ liked: boolean; likesCount: number }>(
        `/stories/${currentStory._id}/like`
      );
      setIsLiked(response.liked);
      setLikesCount(response.likesCount);
    } catch (error) {
      console.error('Failed to like story:', error);
    }
  };

  const loadReplies = async () => {
    if (!currentStory || loadingReplies) return;

    setLoadingReplies(true);
    try {
      const data = await api.get<StoryReply[]>(`/stories/${currentStory._id}/replies`);
      setReplies(data);
      setShowReplies(true);
    } catch (error) {
      console.error('Failed to load replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const sendReply = async () => {
    if (!currentStory || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const newReply = await api.post<StoryReply>(`/stories/${currentStory._id}/reply`, {
        text: replyText.trim(),
      });
      setReplies([...replies, newReply]);
      setReplyText('');
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setSendingReply(false);
    }
  };

  const handleVideoPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        handleNextStory();
      } else if (status.durationMillis && status.positionMillis) {
        // Update progress bar for video
        const progressPercent = (status.positionMillis / status.durationMillis) * 100;
        setProgress(Math.min(progressPercent, 100));
      }
    }
  };

  if (!visible || !currentUser || !currentStory) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <ThemedView style={styles.container}>
        {/* Progress bars */}
        <View style={styles.progressContainer}>
          {currentUser.stories.map((_, index) => (
            <View key={index} style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  index < currentStoryIndex && styles.progressBarFilled,
                  index === currentStoryIndex && { width: `${progress}%` },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {currentUser.user.profilePhoto ? (
              <Image
                source={{ uri: currentUser.user.profilePhoto }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <MaterialIcons name="person" size={20} color="#666" />
              </View>
            )}
            <ThemedText style={styles.username}>{currentUser.user.name}</ThemedText>
            <ThemedText style={styles.time}>
              {new Date(currentStory.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </ThemedText>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Story content */}
        <Pressable
          style={styles.contentContainer}
          onPress={() => setIsPaused(!isPaused)}
          onLongPress={() => setIsPaused(true)}
          onPressOut={() => setIsPaused(false)}
        >
          <View style={styles.touchArea}>
            <TouchableOpacity
              style={[styles.touchZone, styles.leftZone]}
              onPress={handlePreviousStory}
              activeOpacity={0.9}
            />
            <TouchableOpacity
              style={[styles.touchZone, styles.rightZone]}
              onPress={handleNextStory}
              activeOpacity={0.9}
            />
          </View>

          {currentStory.mediaType === 'image' ? (
            <Image
              source={{ uri: currentStory.mediaUrl }}
              style={styles.media}
              resizeMode="contain"
            />
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: currentStory.mediaUrl }}
              style={styles.media}
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
              shouldPlay={!isPaused}
              onPlaybackStatusUpdate={handleVideoPlaybackStatusUpdate}
            />
          )}

          {currentStory.caption && (
            <View style={styles.captionContainer}>
              <ThemedText style={styles.caption}>{currentStory.caption}</ThemedText>
            </View>
          )}
        </Pressable>

        {/* Bottom actions */}
        <View style={styles.actions}>
          <View style={styles.actionRow}>
            <TextInput
              style={styles.replyInput}
              placeholder="Send message..."
              placeholderTextColor="#999"
              value={replyText}
              onChangeText={setReplyText}
              onSubmitEditing={sendReply}
              editable={!sendingReply}
            />
            <TouchableOpacity
              onPress={sendReply}
              disabled={!replyText.trim() || sendingReply}
              style={[
                styles.sendButton,
                (!replyText.trim() || sendingReply) && styles.sendButtonDisabled,
              ]}
            >
              {sendingReply ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
              <MaterialIcons
                name={isLiked ? 'favorite' : 'favorite-border'}
                size={24}
                color={isLiked ? '#ff3040' : '#fff'}
              />
              {likesCount > 0 && (
                <ThemedText style={styles.actionCount}>{likesCount}</ThemedText>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={loadReplies} style={styles.actionButton}>
              <MaterialIcons name="message" size={24} color="#fff" />
              {replies.length > 0 && (
                <ThemedText style={styles.actionCount}>{replies.length}</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Replies modal */}
        <Modal
          visible={showReplies}
          animationType="slide"
          transparent
          onRequestClose={() => setShowReplies(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.repliesModalContainer}
          >
            <View style={styles.repliesModal}>
              <View style={styles.repliesHeader}>
                <ThemedText style={styles.repliesTitle}>Replies</ThemedText>
                <TouchableOpacity onPress={() => setShowReplies(false)}>
                  <MaterialIcons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.repliesList}>
                {loadingReplies ? (
                  <ActivityIndicator style={styles.repliesLoading} />
                ) : replies.length === 0 ? (
                  <ThemedText style={styles.noReplies}>No replies yet</ThemedText>
                ) : (
                  replies.map((reply) => (
                    <View key={reply._id} style={styles.replyItem}>
                      {reply.user.profilePhoto ? (
                        <Image
                          source={{ uri: reply.user.profilePhoto }}
                          style={styles.replyAvatar}
                        />
                      ) : (
                        <View style={[styles.replyAvatar, styles.avatarPlaceholder]}>
                          <MaterialIcons name="person" size={16} color="#666" />
                        </View>
                      )}
                      <View style={styles.replyContent}>
                        <ThemedText style={styles.replyUsername}>{reply.user.name}</ThemedText>
                        <ThemedText style={styles.replyText}>{reply.text}</ThemedText>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    width: '0%',
  },
  progressBarFilled: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  time: {
    color: '#999',
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  touchZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
  },
  leftZone: {
    left: 0,
  },
  rightZone: {
    right: 0,
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  caption: {
    color: '#fff',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  repliesModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  repliesModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.6,
    paddingBottom: 20,
  },
  repliesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  repliesTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  repliesList: {
    padding: 16,
  },
  repliesLoading: {
    marginVertical: 20,
  },
  noReplies: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
  replyItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  replyContent: {
    flex: 1,
  },
  replyUsername: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  replyText: {
    fontSize: 14,
    color: '#333',
  },
});

