import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Header } from '@/components/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/use-auth';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const Row = ({ title, onPress, destructive }: { title: string; onPress?: () => void; destructive?: boolean }) => (
    <Pressable onPress={onPress} style={styles.row}>
      <ThemedText style={[styles.rowText, destructive && styles.destructive]}>{title}</ThemedText>
      <IconSymbol name="chevron.right" size={20} color="#666" />
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <Header showBack />
      <ThemedText style={styles.pageTitle}>Settings and activity</ThemedText>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.sectionTitle}>Support</ThemedText>
        <View style={styles.card}>
          <Row title="Privacy Policy" onPress={() => router.push('/settings/privacy')} />
          <Row title="Terms & Conditions" onPress={() => router.push('/settings/terms')} />
          <Row title="About Us" onPress={() => router.push('/settings/about')} />
          <Row title="Log Out" onPress={() => { logout(); router.replace('/auth/login'); }} destructive />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', paddingVertical: 12 },
  sectionTitle: { color: '#666', marginTop: 18, marginBottom: 8, fontSize: 13 },
  card: { backgroundColor: '#FFF', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.03)' },
  rowText: { fontSize: 16, color: '#111' },
  destructive: { color: '#d9534f' },
});
