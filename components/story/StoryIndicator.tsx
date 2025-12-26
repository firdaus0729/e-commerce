import React, { memo } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Pressable } from 'react-native';
import { StoryFeedItem } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '../themed-text';
import { brandYellow } from '@/constants/theme';

interface StoryIndicatorProps {
  item: StoryFeedItem;
  onPress: () => void;
  isOwnStory?: boolean;
}

export const StoryIndicator = memo(function StoryIndicator({ item, onPress, isOwnStory }: StoryIndicatorProps) {
  const hasUnviewed = !item.allViewed && item.stories.length > 0;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={[styles.avatarContainer, hasUnviewed && styles.avatarContainerUnviewed]}>
        {item.user.profilePhoto ? (
          <Image source={{ uri: item.user.profilePhoto }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MaterialIcons name="person" size={20} color="#666" />
          </View>
        )}
        {isOwnStory && (
          <View style={styles.addIcon}>
            <MaterialIcons name="add-circle" size={20} color={brandYellow} />
          </View>
        )}
      </View>
      <ThemedText style={styles.username} numberOfLines={1}>
        {isOwnStory ? 'Your Story' : item.user.name}
      </ThemedText>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 12,
    width: 70,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 35,
    padding: 2,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainerUnviewed: {
    borderWidth: 2,
    borderColor: brandYellow,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  username: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 70,
  },
});

