import { Pressable, StyleSheet, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';
import { DemisandLogo } from './logo';
import { brandYellow } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { useRouter } from 'expo-router';

interface HeaderProps {
  showSearch?: boolean;
  showBack?: boolean;
  showNotifications?: boolean;
  showMessages?: boolean;
  showMenu?: boolean;
  onBackPress?: () => void;
  rightAction?: {
    label?: string;
    onPress: () => void;
    icon?: string;
    circular?: boolean;
  };
  onMenuPress?: () => void;
}

export function Header({
  showSearch = true,
  showBack = true,
  showNotifications = false,
  showMessages = false,
  showMenu = false,
  onBackPress,
  rightAction,
  onMenuPress,
}: HeaderProps) {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <Pressable style={styles.backButton} onPress={handleBackPress}>
            <IconSymbol name="chevron.left" size={20} color="#1A1A1A" />
          </Pressable>
        )}
        <DemisandLogo size={18} />
      </View>
      <View style={styles.right}>
        {showSearch && (
          <Pressable
            style={styles.iconButton}
            onPress={() =>
              router.push({
                pathname: '/search',
              })
            }
          >
            <IconSymbol name="magnifyingglass" size={15} color="#1A1A1A" />
          </Pressable>
        )}
        {showNotifications && (
          <Pressable style={styles.iconButton}>
            <IconSymbol name="bell" size={15} color="#1A1A1A" />
            <View style={styles.badge} />
          </Pressable>
        )}
        {showMessages && (
          <Pressable style={[styles.iconButton, styles.messagesButton]}>
            <IconSymbol name="paperplane.fill" size={13} color="#FFFFFF" />
          </Pressable>
        )}
        {rightAction && (
          <Pressable
            style={[
              rightAction.circular ? styles.circularButton : styles.actionButton,
              rightAction.circular && !rightAction.label && styles.iconButton,
            ]}
            onPress={rightAction.onPress}
          >
            {rightAction.icon && (
              <IconSymbol
                name={rightAction.icon as any}
                size={rightAction.circular ? 20 : 16}
                color="#1A1A1A"
              />
            )}
            {rightAction.label && (
              <ThemedText style={styles.actionText}>{rightAction.label}</ThemedText>
            )}
          </Pressable>
        )}
        {showMenu && (
          <Pressable style={styles.iconButton} onPress={onMenuPress}>
            <IconSymbol name="ellipsis" size={22} color="#1A1A1A" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 2,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  messagesButton: {
    backgroundColor: '#6366F1',
    borderColor: '#4F46E5',
    width: 30,
    height: 30,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: brandYellow,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: brandYellow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  circularButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  actionText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});

