import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { api } from '@/lib/api';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { brandYellow } from '@/constants/theme';

interface StoryCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onStoryCreated?: () => void;
}

export function StoryCreationModal({
  visible,
  onClose,
  onStoryCreated,
}: StoryCreationModalProps) {
  const { user } = useAuth();
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const videoRef = React.useRef<Video>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType(asset.type === 'video' ? 'video' : 'image');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType('image');
    }
  };

  const uploadAndCreateStory = async () => {
    if (!mediaUri || !mediaType) return;

    setUploading(true);
    try {
      // Upload media
      const formData = new FormData();
      const filename = mediaUri.split('/').pop() || 'story';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append(mediaType === 'video' ? 'video' : 'image', {
        uri: Platform.OS === 'ios' ? mediaUri.replace('file://', '') : mediaUri,
        type: mediaType === 'video' ? 'video/mp4' : type,
        name: filename,
      } as any);

      const uploadResponse = await api.upload<{ url: string; filename?: string; size?: number; id?: string }>(
        mediaType === 'video' ? '/upload/video' : '/upload/image',
        formData
      );

      // Create story
      if (!uploadResponse || !uploadResponse.url) {
        throw new Error('Failed to upload media: No URL returned');
      }

      const storyResponse = await api.post('/stories', {
        mediaUrl: uploadResponse.url,
        mediaType,
        caption: caption.trim() || undefined,
      });

      if (!storyResponse) {
        throw new Error('Failed to create story: No response from server');
      }

      // Reset form
      setMediaUri(null);
      setMediaType(null);
      setCaption('');
      onStoryCreated?.();
      onClose();
    } catch (error: any) {
      console.error('Failed to create story:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to create story';
      console.error('Error details:', {
        message: errorMessage,
        error,
      });
      Alert.alert('Error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setMediaUri(null);
      setMediaType(null);
      setCaption('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={uploading}>
            <MaterialIcons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Create Story</ThemedText>
          <TouchableOpacity
            onPress={uploadAndCreateStory}
            disabled={!mediaUri || uploading}
            style={[styles.shareButton, (!mediaUri || uploading) && styles.shareButtonDisabled]}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.shareButtonText}>Share</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {!mediaUri ? (
          <View style={styles.pickerContainer}>
            <TouchableOpacity style={styles.pickerButton} onPress={takePhoto}>
              <MaterialIcons name="camera-alt" size={48} color={brandYellow} />
              <ThemedText style={styles.pickerButtonText}>Take Photo</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerButton} onPress={pickImage}>
              <MaterialIcons name="photo-library" size={48} color={brandYellow} />
              <ThemedText style={styles.pickerButtonText}>Choose from Library</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            {mediaType === 'image' ? (
              <Image source={{ uri: mediaUri }} style={styles.preview} resizeMode="contain" />
            ) : (
              <Video
                ref={videoRef}
                source={{ uri: mediaUri }}
                style={styles.preview}
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                shouldPlay
              />
            )}
            <View style={styles.captionContainer}>
              <TextInput
                style={styles.captionInput}
                placeholder="Add a caption..."
                placeholderTextColor="#999"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={200}
              />
            </View>
          </View>
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: brandYellow,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  pickerButton: {
    alignItems: 'center',
    gap: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: brandYellow,
  },
  previewContainer: {
    flex: 1,
  },
  preview: {
    flex: 1,
    width: '100%',
  },
  captionContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  captionInput: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

