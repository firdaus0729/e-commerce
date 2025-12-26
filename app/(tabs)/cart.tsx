import { useState, useCallback } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import { CartItem } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { MaterialIcons } from '@expo/vector-icons';
import { brandYellow, brandYellowDark, brandYellowLight } from '@/constants/theme';

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, refreshCart, loading: cartLoading, removeFromCart } = useCart();
  const [refreshing, setRefreshing] = useState(false);

  // Refresh cart when page is focused
  useFocusEffect(
    useCallback(() => {
      if (user?.token) {
        refreshCart();
      }
    }, [user?.token, refreshCart])
  );

  const load = async () => {
    if (!user?.token) return;
    setRefreshing(true);
    try {
      await refreshCart();
    } catch (err: any) {
      Alert.alert('Cart', err.message);
    } finally {
      setRefreshing(false);
    }
  };


  // Initial load is handled by CartContext

  const total = cart?.items?.reduce(
    (sum, item: CartItem) => sum + (item.product?.price ?? 0) * item.quantity,
    0
  );

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <ThemedView style={styles.container}>
      {/* Custom Header */}
      {/* <View style={styles.customHeader}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#1A1A1A" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>CART</ThemedText>
        <View style={styles.headerRight} />
      </View> */}
        <Header showSearch />


      {isEmpty ? (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        >
          <View style={styles.emptyCartIconContainer}>
            <View style={styles.emptyCartCircle}>
              <View style={styles.cartIconWrapper}>
                <MaterialIcons name="shopping-cart" size={100} color={brandYellow} style={styles.cartIcon} />
              </View>
            </View>
          </View>
          <ThemedText style={styles.emptyTitle}>Your Cart Is Empty</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Looks like you haven&apos;t added anything to your cart yet
          </ThemedText>
          <Pressable 
            style={styles.startShoppingButton}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <ThemedText style={styles.startShoppingButtonText}>Start Shopping</ThemedText>
          </Pressable>
        </ScrollView>
      ) : (
        <FlatList
          data={cart.items}
          keyExtractor={(item) => item.product._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <ThemedText style={styles.cardTitle}>{item.product.title}</ThemedText>
              <ThemedText style={styles.cardPrice}>
                {`${item.quantity} × $${item.product.price.toFixed(2)} = $${(item.quantity * item.product.price).toFixed(2)}`}
              </ThemedText>
              <Pressable
                onPress={async () => {
                  if (!user?.token) return;
                  try {
                    await removeFromCart(item.product._id, user.token);
                  } catch (err: any) {
                    Alert.alert('Error', err.message);
                  }
                }}
                style={styles.removeButton}
              >
                <ThemedText style={styles.removeButtonText}>Remove</ThemedText>
              </Pressable>
            </View>
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              <ThemedText style={styles.totalText}>{`Total: $${total?.toFixed(2) ?? '0.00'}`}</ThemedText>
              <Pressable
                style={styles.checkoutButton}
                onPress={() => router.push('/checkout')}
              >
                <ThemedText style={styles.checkoutButtonText}>
                  Proceed to Checkout
                </ThemedText>
              </Pressable>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
          contentContainerStyle={styles.list}
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
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: brandYellow,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerRight: {
    width: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 40,
  },
  emptyCartIconContainer: {
    marginBottom: 32,
  },
  cartIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    opacity: 0.9,
  },
  emptyCartCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: brandYellowLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: brandYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: brandYellow,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  startShoppingButton: {
    backgroundColor: brandYellow,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: brandYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startShoppingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  list: {
    padding: 16,
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  removeButton: {
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    color: brandYellowDark,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    gap: 16,
  },
  totalText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  checkoutButton: {
    backgroundColor: brandYellow,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: brandYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

