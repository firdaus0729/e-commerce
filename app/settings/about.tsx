import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Header } from '@/components/header';

export default function AboutScreen() {
  return (
    <ThemedView style={styles.container}>
      <Header showBack />
      <ThemedText style={styles.pageTitle}>About Us</ThemedText>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.paragraph}>
          Demisand brings you closer to the people and things you love. Our platform helps creators and shoppers connect
          through posts, live streams, and storefronts.
        </ThemedText>

        <ThemedText style={styles.paragraph}>
          For more information about Demisand and our mission, visit our help center or contact support.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  paragraph: { fontSize: 14, lineHeight: 20, color: '#111', marginBottom: 10 },
  pageTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', paddingVertical: 12 },
});
