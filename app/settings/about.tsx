import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Header } from '@/components/header';

export default function AboutScreen() {
  return (
    <ThemedView style={styles.container}>
      <Header showBack />
      <ThemedText style={styles.pageTitle}>About Demisand</ThemedText>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.paragraph}>
          Demisand is a brand owned and operated by Founder of Miranda Merchbish Private Limited (Sandeep Bisht),
          created with a vision to deliver quality, reliability, and innovation in everything we offer. We are committed
          to building products and experiences that meet modern needs while maintaining trust, transparency, and
          excellence at the core of our operations.
        </ThemedText>

        <ThemedText style={styles.paragraph}>
          At Demisand, we believe in thoughtful design, customer-focused solutions, and continuous improvement. Our
          approach combines creativity with practicality, ensuring that every product and service reflects our
          dedication to high standards and long-term value.
        </ThemedText>

        <ThemedText style={styles.paragraph}>
          Backed by the expertise and integrity of Miranda Merchbish Private Limited, Demisand strives to create
          meaningful connections with our customers by offering dependable solutions and responsive support. We focus on
          understanding evolving market trends and customer expectations to consistently deliver relevant and impactful
          offerings.
        </ThemedText>

        <ThemedText style={styles.paragraph}>
          Our mission is to grow responsibly, innovate continuously, and build a brand that customers can rely on with
          confidence.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', paddingVertical: 12 },
  paragraph: { fontSize: 14, lineHeight: 20, color: '#111', marginBottom: 12 },
});
