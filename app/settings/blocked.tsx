import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Header } from '@/components/header';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

export default function BlockedScreen() {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user?.token) return;
      try {
        const data = await api.get('/users/me/blocked', user.token);
        setBlocked(data || []);
      } catch (err) {
        setBlocked([]);
      }
    };
    load();
  }, [user?.token]);

  return (
    <ThemedView style={styles.container}>
      <Header showBack title="Blocked" />
      <View style={styles.content}>
        {blocked.length === 0 ? (
          <ThemedText style={styles.empty}>No blocked users</ThemedText>
        ) : (
          <FlatList
            data={blocked}
            keyExtractor={(i) => i._id}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <ThemedText style={styles.rowText}>{item.name}</ThemedText>
                <Pressable style={styles.unblockButton} onPress={() => {}}>
                  <ThemedText style={styles.unblockText}>Unblock</ThemedText>
                </Pressable>
              </View>
            )}
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, flex: 1 },
  empty: { color: '#666' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  rowText: { fontSize: 16 },
  unblockButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.05)' },
  unblockText: { color: '#111' },
});
