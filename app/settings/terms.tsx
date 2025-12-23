import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Header } from '@/components/header';

export default function TermsScreen() {
  return (
    <ThemedView style={styles.container}>
      <Header showBack />
      <ThemedText style={styles.pageTitle}>Terms & Conditions</ThemedText>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.paragraph}>
          Welcome to Demisand!
        </ThemedText>

        <ThemedText style={styles.paragraph}>
          These Terms of Use (or “Terms”) govern your access and use of Demisand, except where we expressly state that
          separate terms (and not these) apply, and provide information about the Demisand Service (the “Service"),
          outlined below. If you do not agree to these Terms, then do not access or use Demisand.
        </ThemedText>

        <ThemedText style={styles.heading}>1. The Demisand Service</ThemedText>
        <ThemedText style={styles.paragraph}>
          We agree to provide you with the Demisand Service. The Service includes all Demisand products, features,
          applications, services, technologies, and software that we provide to advance Demisand’s mission: To bring you
          closer to the people and things you love. The Service is made up of the following aspects: offering personalized
          opportunities to create, connect, communicate, discover and share; fostering a positive, inclusive, and safe
          environment; developing and using technologies that help us consistently serve our growing community; and
          providing consistent experiences across Demisand Company Products.
        </ThemedText>

        <ThemedText style={styles.heading}>2. How Our Service Is Funded</ThemedText>
        <ThemedText style={styles.paragraph}>
          Instead of paying to use Demisand, by using the Service you acknowledge that we can show you ads that businesses
          and organizations pay us to promote. We use your personal data, such as information about your activity and
          interests, to show you ads that are more relevant to you.
        </ThemedText>

        <ThemedText style={styles.heading}>3. The Privacy Policy</ThemedText>
        <ThemedText style={styles.paragraph}>
          Providing our Service requires collecting and using your information. The Privacy Policy explains how we collect,
          use, and share information across Demisand Products. You must agree to the Privacy Policy to use Demisand.
        </ThemedText>

        <ThemedText style={styles.heading}>4. Your Commitments</ThemedText>
        <ThemedText style={styles.paragraph}>
          In return for our commitment to provide the Service, we require you to make the commitments listed in this
          section. These include age requirements, lawful use, and refraining from impersonation, fraud, or other
          prohibited conduct. You must follow our Community Standards and other policies when using Demisand.
        </ThemedText>

        <ThemedText style={styles.heading}>5. Additional Rights We Retain</ThemedText>
        <ThemedText style={styles.paragraph}>
          We retain certain rights over the Service and its content. For example, if you select a username we may change it
          if necessary, and we retain rights to content that we make available as part of the Service (but not to your
          content).
        </ThemedText>

        <ThemedText style={styles.heading}>6. Content Removal and Account Actions</ThemedText>
        <ThemedText style={styles.paragraph}>
          We can remove content or disable or terminate accounts that violate these Terms or our policies. Deletion of
          content may take time due to technical or legal constraints. If your account is terminated, certain sections of
          these Terms will remain in effect.
        </ThemedText>

        <ThemedText style={styles.heading}>7. Our Agreement and Disputes</ThemedText>
        <ThemedText style={styles.paragraph}>
          These Terms form an agreement between you and Demisand. Where additional feature-specific terms apply, those
          terms govern. If any aspect of this agreement is unenforceable, the rest will remain in effect.
        </ThemedText>

        <ThemedText style={styles.heading}>8. Updating These Terms</ThemedText>
        <ThemedText style={styles.paragraph}>
          We may change our Service and policies, and we may need to update these Terms. We will notify you before
          material changes and give you an opportunity to review them.
        </ThemedText>

        <ThemedText style={styles.note}>
          This is a condensed copy of the Terms for quick reference. For full legal text and any linked policies please
          consult the official resources or contact Demisand support.
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
});
