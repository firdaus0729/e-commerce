import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Header } from '@/components/header';

export default function PrivacyScreen() {
  return (
    <ThemedView style={styles.container}>
      <Header showBack />
      <ThemedText style={styles.pageTitle}>Privacy Policy</ThemedText>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.paragraph}>
          This Privacy Policy explains how Demisand collects, uses and shares your personal information. We collect
          information to provide and improve the Service, to communicate with you, and to personalize your experience.
        </ThemedText>

        <ThemedText style={styles.paragraph}>
          For details about information handling and your controls, please consult the full privacy policy provided by
          Demisand or contact support.
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
