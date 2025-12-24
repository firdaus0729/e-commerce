import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { MaterialIcons } from '@expo/vector-icons';
import { brandYellow } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const { cartItemCount } = useCart();
  const router = useRouter();

  useEffect(() => {
    // If auth finished loading and there's no user, redirect to login
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [loading, user, router]);

  return (
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: brandYellow,
        tabBarInactiveTintColor: '#9BA1A6',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#FFFEF9',
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.05)',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => (
            <MaterialIcons name="home-filled" size={24} color={focused ? '#000000' : '#9BA1A6'} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Store',
          tabBarIcon: ({ focused }) => (
            <MaterialIcons name="storefront" size={24} color={focused ? '#000000' : '#9BA1A6'} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <MaterialIcons name="shopping-cart" size={24} color={focused ? '#000000' : '#9BA1A6'} />
              {cartItemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartItemCount > 99 ? '99+' : cartItemCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live Streaming',
          tabBarIcon: ({ focused }) => (
            <MaterialIcons name="live-tv" size={24} color={focused ? '#000000' : '#9BA1A6'} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <MaterialIcons name="person" size={24} color={focused ? '#000000' : '#9BA1A6'} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFEF9',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
