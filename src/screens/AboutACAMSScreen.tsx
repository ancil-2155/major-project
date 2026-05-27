import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ACAMSLogo from '../components/common/ACAMSLogo';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: '🤖', title: 'Face-based Attendance' },
  { icon: '📸', title: 'Student Face Enrollment' },
  { icon: '📹', title: 'Teacher Live Attendance Scanning' },
  { icon: '📝', title: 'Leave Request Management' },
  { icon: '📜', title: 'Bonafide Certificate Requests' },
  { icon: '✍️', title: 'Digital Teacher Signature' },
  { icon: '📊', title: 'Results Management' },
  { icon: '📚', title: 'Assignments' },
  { icon: '🖼️', title: 'Event Gallery' },
  { icon: '👤', title: 'Student Profile & Settings' },
  { icon: '🛠️', title: 'Admin Management' },
];

const DEVELOPERS = [
  { name: 'Ancil M Cheruvil', icon: '👨‍💻', color: '#0ea5e9' },
  { name: 'Niya Joy', icon: '👩‍💻', color: '#a78bfa' },
  { name: 'MOHD Muzammil Hasan', icon: '👨‍💻', color: '#34d399' },
];

const AboutACAMSScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Hero Header */}
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}>
          {/* Back Button */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.heroContent}>
            <View style={styles.logoContainer}>
              <ACAMSLogo size={88} />
            </View>
            <Text style={styles.heroTitle}>ACAMS</Text>
            <Text style={styles.heroSubtitle}>
              Automated Camera-based{'\n'}Attendance Management System
            </Text>
            <View style={styles.heroDivider} />
            <Text style={styles.heroDescription}>
              A smart digital attendance and academic management platform for
              students, teachers, parents, and administrators.
            </Text>
          </View>
        </LinearGradient>

        {/* Why ACAMS */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionEmoji}>💡</Text>
            <Text style={styles.sectionTitle}>Why ACAMS?</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              ACAMS was created to reduce manual attendance work, improve
              accuracy, save classroom time, and provide a modern digital system
              for managing attendance, requests, results, assignments, and
              school/college communication.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionEmoji}>⚡</Text>
            <Text style={styles.sectionTitle}>Features</Text>
          </View>
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconBg}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Developer Team */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionEmoji}>👥</Text>
            <Text style={styles.sectionTitle}>Development Team</Text>
          </View>

          {DEVELOPERS.map((dev, index) => (
            <View key={index} style={styles.developerCard}>
              <View
                style={[
                  styles.devAvatarContainer,
                  { backgroundColor: `${dev.color}20` },
                ]}>
                <Text style={styles.devAvatar}>{dev.icon}</Text>
              </View>
              <View style={styles.devInfo}>
                <Text style={styles.devName}>{dev.name}</Text>
                <Text style={styles.devRole}>Developer</Text>
              </View>
              <View
                style={[
                  styles.devBadge,
                  { backgroundColor: `${dev.color}20` },
                ]}>
                <Text style={[styles.devBadgeText, { color: dev.color }]}>
                  B.Tech
                </Text>
              </View>
            </View>
          ))}

          <View style={styles.teamCard}>
            <Text style={styles.teamText}>
              Developed by B.Tech Engineering students as a final-year academic
              project, ACAMS focuses on building a practical, secure, and
              user-friendly solution for educational institutions.
            </Text>
          </View>
        </View>

        {/* Quote */}
        <View style={styles.section}>
          <View style={styles.quoteCard}>
            <Text style={styles.quoteIcon}>💬</Text>
            <Text style={styles.quoteText}>
              "Technology should reduce repetitive work and give teachers more
              time to teach, while giving students a faster and smarter academic
              experience."
            </Text>
            <Text style={styles.quoteAuthor}>— The ACAMS Team</Text>
          </View>
        </View>

        {/* Project Note */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionEmoji}>📋</Text>
            <Text style={styles.sectionTitle}>Project Note</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              This application was built as an academic engineering project to
              demonstrate real-world use of React Native, Firebase, face
              recognition, and cloud-based academic management.
            </Text>
          </View>
        </View>

        {/* Version Footer */}
        <View style={styles.footerContainer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerVersion}>ACAMS</Text>
          <Text style={styles.footerVersionNumber}>Version 1.0.0</Text>
          <Text style={styles.footerCopy}>
            Built with ❤️ using React Native & Firebase
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero
  heroSection: {
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#f8fafc',
    fontWeight: 'bold',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoBg: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f8fafc',
    letterSpacing: 3,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  heroDivider: {
    width: 50,
    height: 3,
    backgroundColor: '#0ea5e9',
    borderRadius: 2,
    marginVertical: 18,
  },
  heroDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },

  // Cards
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  featureIcon: {
    fontSize: 18,
  },
  featureTitle: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
    flex: 1,
  },

  // Developers
  developerCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
  },
  devAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  devAvatar: {
    fontSize: 24,
  },
  devInfo: {
    flex: 1,
  },
  devName: {
    fontSize: 15,
    color: '#f8fafc',
    fontWeight: '600',
  },
  devRole: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  devBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  devBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Team Card
  teamCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 18,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  teamText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 21,
  },

  // Quote
  quoteCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
    alignItems: 'center',
  },
  quoteIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
  },
  quoteAuthor: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 12,
    fontWeight: '600',
  },

  // Footer
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: 20,
  },
  footerDivider: {
    width: 40,
    height: 3,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginBottom: 16,
  },
  footerVersion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 2,
  },
  footerVersionNumber: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  footerCopy: {
    fontSize: 11,
    color: '#475569',
    marginTop: 8,
  },
});

export default AboutACAMSScreen;
