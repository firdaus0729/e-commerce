import React from 'react';
import { ScrollView, StyleSheet, View, Linking, Pressable } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Header } from '@/components/header';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const renderChildren = () => {
    if (typeof children === 'string') {
      const sentences = (children.match(/[^.!?]+[.!?]?/g) || []).map((s) => s.trim()).filter(Boolean);
      return sentences.map((s, i) => {
        const urlMatch = s.match(/https?:\/\/[^\s)]+/i);
        if (urlMatch && urlMatch[0]) {
          const url = urlMatch[0];
          const before = s.slice(0, s.indexOf(url)).trim();
          const after = s.slice(s.indexOf(url) + url.length).trim();
          return (
            <View key={i} style={{ marginBottom: 8 }}>
              {before ? <ThemedText style={styles.sentence}>{before}</ThemedText> : null}
              <Pressable onPress={() => Linking.openURL(url)}>
                <ThemedText style={styles.link}>{url}</ThemedText>
              </Pressable>
              {after ? <ThemedText style={styles.sentence}>{after}</ThemedText> : null}
            </View>
          );
        }

        return (
          <ThemedText key={i} style={styles.sentence}>
            {s}
          </ThemedText>
        );
      });
    }
    return children;
  };

  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <View>{renderChildren()}</View>
    </View>
  );
}

export default function PrivacyScreen() {
  return (
    <ThemedView style={styles.container}>
      <Header showBack />
      <ThemedText style={styles.pageTitle}>Privacy Policy</ThemedText>

      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Introduction">
          <ThemedText style={styles.sectionBody}>At Demisand, we respect your privacy and are committed to protecting your personal information. This Privacy
          Policy explains how we collect, use, disclose, and safeguard your information when you visit or use our
          website, products, or services.</ThemedText>
        </Section>

        <Section title="1. Information We Collect">
          <ThemedText style={styles.listHeader}>Personal Information</ThemedText>
          <ThemedText style={styles.listItem}>• Name</ThemedText>
          <ThemedText style={styles.listItem}>• Email address</ThemedText>
          <ThemedText style={styles.listItem}>• Contact details</ThemedText>
          <ThemedText style={styles.listItem}>• Any information you voluntarily provide through forms or communications</ThemedText>

          <ThemedText style={[styles.listHeader, { marginTop: 8 }]}>Non-Personal Information</ThemedText>
          <ThemedText style={styles.listItem}>• Browser type</ThemedText>
          <ThemedText style={styles.listItem}>• Device information</ThemedText>
          <ThemedText style={styles.listItem}>• Pages visited</ThemedText>
          <ThemedText style={styles.listItem}>• Time and date of visits</ThemedText>
          <ThemedText style={styles.listItem}>• General usage data</ThemedText>
        </Section>

        <Section title="2. How We Use Your Information">
          <ThemedText style={styles.sectionBody}>Demisand may use the information we collect to:</ThemedText>
          <ThemedText style={styles.listItem}>• Provide and maintain our services</ThemedText>
          <ThemedText style={styles.listItem}>• Improve user experience</ThemedText>
          <ThemedText style={styles.listItem}>• Respond to inquiries and customer support requests</ThemedText>
          <ThemedText style={styles.listItem}>• Send updates, notifications, or relevant communications</ThemedText>
          <ThemedText style={styles.listItem}>• Monitor and analyze usage and trends</ThemedText>
          <ThemedText style={styles.listItem}>• Ensure security and prevent fraud</ThemedText>
        </Section>

        <Section title="3. Sharing Your Information">
          <ThemedText style={styles.sectionBody}>We do not sell or rent your personal information. We may share information only:</ThemedText>
          <ThemedText style={styles.listItem}>• With trusted service providers who assist us in operating our services</ThemedText>
          <ThemedText style={styles.listItem}>• When required by law or legal process</ThemedText>
          <ThemedText style={styles.listItem}>• To protect the rights, safety, or property of Demisand or others</ThemedText>
        </Section>

        <Section title="4. Cookies and Tracking Technologies">
          <ThemedText style={styles.sectionBody}>Demisand may use cookies and similar technologies to enhance website functionality and analyze traffic and
          usage patterns. You can control or disable cookies through your browser settings.</ThemedText>
        </Section>

        <Section title="5. Data Security">
          <ThemedText style={styles.sectionBody}>We use reasonable administrative, technical, and physical security measures to protect your information. However,
          no method of transmission over the internet is 100% secure.</ThemedText>
        </Section>

        <Section title="6. Third-Party Links">
          <ThemedText style={styles.sectionBody}>Our website may contain links to third-party websites. Demisand is not responsible for the privacy practices or
          content of those sites.</ThemedText>
        </Section>

        <Section title="7. Children’s Privacy">
          <ThemedText style={styles.sectionBody}>Demisand does not knowingly collect personal information from children under the age of 13. If you believe such
          information has been collected, please contact us so we can remove it.</ThemedText>
        </Section>

        <Section title="8. Your Privacy Rights">
          <ThemedText style={styles.sectionBody}>Depending on your location, you may have the right to:</ThemedText>
          <ThemedText style={styles.listItem}>• Access your personal data</ThemedText>
          <ThemedText style={styles.listItem}>• Request corrections or deletion</ThemedText>
          <ThemedText style={styles.listItem}>• Withdraw consent for data processing</ThemedText>
          <ThemedText style={styles.sectionBody}>To exercise these rights, contact us using the details below.</ThemedText>
        </Section>

        <Section title="9. Changes to This Privacy Policy">
          <ThemedText style={styles.sectionBody}>Demisand may update this Privacy Policy from time to time. Any changes will be posted on this page with an
          updated effective date.</ThemedText>
        </Section>

        <Section title="10. Contact Us">
          <ThemedText style={styles.listItem}>If you have questions or concerns about this Privacy Policy, please contact us at:</ThemedText>
          <ThemedText style={styles.contact}>Miranda Merchbish Email: </ThemedText>
          <Pressable onPress={() => Linking.openURL('mailto:info@mirandamerchofficial.com')}>
            <ThemedText style={styles.link}>info@mirandamerchofficial.com</ThemedText>
          </Pressable>
          <ThemedText style={styles.contact}>Website: </ThemedText>
          <Pressable onPress={() => Linking.openURL('https://mirandamerchbish.com')}>
            <ThemedText style={styles.link}>https://mirandamerchbish.com</ThemedText>
          </Pressable>
        </Section>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 64 },
  pageTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center', paddingVertical: 12, marginBottom: 8 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#111' },
  sectionBody: { fontSize: 14, lineHeight: 22, color: '#333' },
  listHeader: { fontSize: 14, fontWeight: '600', marginTop: 6, color: '#111' },
  listItem: { fontSize: 14, lineHeight: 20, color: '#333', marginTop: 4 },
  contact: { marginTop: 8, fontSize: 14, color: '#0066cc' },
  sentence: { fontSize: 14, lineHeight: 22, color: '#333', marginBottom: 8 },
  link: { fontSize: 14, color: '#0066cc', textDecorationLine: 'underline', marginBottom: 8 },
});
