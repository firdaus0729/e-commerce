import React from 'react';
import { ScrollView, StyleSheet, View, Pressable, Linking } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Header } from '@/components/header';

function MultiSentence({ children, style }: { children: React.ReactNode; style?: any }) {
  if (typeof children === 'string') {
    const sentences = (children.match(/[^.!?]+[.!?]?/g) || []).map((s) => s.trim()).filter(Boolean);
    return (
      <>
        {sentences.map((s, i) => (
          <ThemedText key={i} style={style}>
            {s}
          </ThemedText>
        ))}
      </>
    );
  }
  return <ThemedText style={style}>{children}</ThemedText>;
}

export default function TermsScreen() {
  return (
    <ThemedView style={styles.container}>
      <Header showBack />
      <ThemedText style={styles.pageTitle}>Terms & Conditions</ThemedText>
      <ScrollView contentContainerStyle={styles.content}>
        <MultiSentence style={styles.paragraph}>
          Demisand is product of Miranda Merchbish Private Limited. Welcome to Demisand. By accessing or using our
          website, products, or services, you agree to comply with and be bound by these Terms & Conditions. If you do not
          agree, please do not use our services.
        </MultiSentence>

        <ThemedText style={styles.sectionTitle}>1. Definitions</ThemedText>
        <MultiSentence style={styles.paragraph}>
          “Demisand,” “we,” “us,” or “our” refers to Demisand. “User,” “you,” or “your” refers to anyone accessing or using
          our services. “Services” refers to all content, products, and features provided by Demisand.
        </MultiSentence>

        <ThemedText style={styles.sectionTitle}>2. Use of Our Services</ThemedText>
        <MultiSentence style={styles.paragraph}>
          You agree to use Demisand only for lawful purposes and in a way that does not: violate any applicable laws or
          regulations; infringe on the rights of others; disrupt or damage our services or systems; or attempt unauthorized
          access to our systems.
        </MultiSentence>

        <ThemedText style={styles.sectionTitle}>3. Intellectual Property</ThemedText>
        <MultiSentence style={styles.paragraph}>
          All content, trademarks, logos, designs, text, graphics, and software provided by Demisand are the exclusive
          property of Demisand or its licensors and are protected by intellectual property laws. You may not copy,
          reproduce, distribute, or exploit any content without prior written permission from Demisand.
        </MultiSentence>

        <ThemedText style={styles.sectionTitle}>4. User Content</ThemedText>
        <MultiSentence style={styles.paragraph}>
          If you submit or upload content to Demisand, you confirm you own or have rights to the content and grant
          Demisand a non-exclusive, royalty-free, worldwide license to use, display, and distribute the content in
          connection with our services. We reserve the right to remove any content that violates these Terms.
        </MultiSentence>

        <ThemedText style={styles.sectionTitle}>5. Accounts and Security</ThemedText>
        <MultiSentence style={styles.paragraph}>
          If you create an account with Demisand, you are responsible for maintaining account confidentiality, providing
          accurate information, and all activity under your account. Demisand reserves the right to suspend or terminate
          accounts for violations of these Terms.
        </MultiSentence>

        <ThemedText style={styles.sectionTitle}>6. Payments and Pricing (If Applicable)</ThemedText>
        <MultiSentence style={styles.paragraph}>
          Prices and fees are subject to change without notice. Payments must be made in full at the time of purchase.
          Refunds, if any, are subject to our refund policy.
        </MultiSentence>

        <ThemedText style={styles.sectionTitle}>7. Third-Party Links and Services</ThemedText>
        <MultiSentence style={styles.paragraph}>
          Demisand may contain links to third-party websites or services. We are not responsible for their content,
          policies, or practices.
        </MultiSentence>

        <ThemedText style={styles.sectionTitle}>8. Disclaimer of Warranties</ThemedText>
        <MultiSentence style={styles.paragraph}>
          Demisand’s services are provided “as is” and “as available”, without warranties of any kind, express or
          implied. We do not guarantee uninterrupted, error-free, or secure services.
        </MultiSentence>

        <ThemedText style={styles.sectionTitle}>9. Limitation of Liability</ThemedText>
        <MultiSentence style={styles.paragraph}>
          To the fullest extent permitted by law, Demisand shall not be liable for any indirect, incidental, special, or
          consequential damages arising from your use of our services.
        </MultiSentence>

        <ThemedText style={styles.sectionTitle}>10. Indemnification</ThemedText>
        <MultiSentence style={styles.paragraph}>
          You agree to indemnify and hold harmless Demisand from any claims, damages, losses, or expenses arising out of
          your use of our services or violation of these Terms.
        </MultiSentence>

        <ThemedText style={styles.sectionTitle}>11. Termination</ThemedText>
        <MultiSentence style={styles.paragraph}>
          We reserve the right to suspend or terminate your access to Demisand at any time, without notice, for any
          violation of these Terms.
        </MultiSentence>

        <ThemedText style={styles.sectionTitle}>12. Governing Law</ThemedText>
        <MultiSentence style={styles.paragraph}>
          These Terms & Conditions shall be governed by and interpreted in accordance with the laws of India, without
          regard to conflict of law principles.
        </MultiSentence>

        <ThemedText style={styles.sectionTitle}>13. Changes to These Terms</ThemedText>
        <MultiSentence style={styles.paragraph}>
          Demisand may update these Terms & Conditions at any time. Changes will be effective once posted on this page.
        </MultiSentence>

        <ThemedText style={styles.sectionTitle}>14. Contact Us</ThemedText>
        <ThemedText style={styles.paragraph}>If you have any questions about these Terms & Conditions, please contact us at:</ThemedText>
        <View style={styles.contactRow}>
          <ThemedText style={styles.contactLabel}>Email: </ThemedText>
          <Pressable onPress={() => Linking.openURL('mailto:info@mirandamerchofficial.com')}>
            <ThemedText style={styles.contactLink}>info@mirandamerchofficial.com</ThemedText>
          </Pressable>
        </View>
        <View style={styles.contactRow}>
          <ThemedText style={styles.contactLabel}>Website: </ThemedText>
          <Pressable onPress={() => Linking.openURL('https://mirandamerchbish.com')}>
            <ThemedText style={styles.contactLink}>https://mirandamerchbish.com</ThemedText>
          </Pressable>
        </View>

        <ThemedText style={styles.note}>
          Miranda Merchbish Private Limited
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 16, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  paragraph: { fontSize: 14, lineHeight: 20, color: '#111', marginBottom: 10 },
  note: { fontSize: 13, color: '#666', marginTop: 16 },
  pageTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', paddingVertical: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginTop: 12, marginBottom: 6, color: '#111' },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  contactLabel: { fontSize: 14, color: '#333', marginRight: 6 },
  contactLink: { fontSize: 14, color: '#1e90ff', textDecorationLine: 'underline' },
});
