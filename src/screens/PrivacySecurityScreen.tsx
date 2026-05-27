import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const PrivacySecurityScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = auth().currentUser;
      if (!user) {
        setError('No user session found. Please log in again.');
        return;
      }

      // Fetch user data
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        setUserData(userDoc.data());
      }

      // Check face enrollment
      const faceDoc = await firestore()
        .collection('faceEmbeddings')
        .doc(user.uid)
        .get();
      setFaceEnrolled(faceDoc.exists);
    } catch (err: any) {
      console.log('Error fetching privacy data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    const user = auth().currentUser;
    if (!user || !user.email) {
      Alert.alert('Error', 'No user email found. Please log in again.');
      return;
    }
    Alert.alert(
      'Change Password',
      `A password reset email will be sent to:\n\n${user.email}\n\nDo you want to proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Email',
          onPress: async () => {
            try {
              await auth().sendPasswordResetEmail(user.email!);
              Alert.alert(
                'Email Sent ✓',
                'A password reset link has been sent to your email. Please check your inbox and follow the instructions.',
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to send password reset email.');
            }
          },
        },
      ],
    );
  };

  const hasProfilePhoto = !!(
    userData?.profilePhotoUrl || userData?.faceEnrollmentStatus === 'enrolled'
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Gradient Header */}
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy & Security</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>
          Your data protection & enrollment status
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Status Cards */}
        <Text style={styles.sectionHeader}>ENROLLMENT STATUS</Text>

        {/* Face Enrollment Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusIconContainer}>
              <Text style={styles.statusIcon}>🤖</Text>
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Face Enrollment</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: faceEnrolled ? '#22c55e' : '#f59e0b' },
                ]}>
                {faceEnrolled ? 'Enrolled' : 'Not Enrolled'}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: faceEnrolled
                    ? 'rgba(34, 197, 94, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                },
              ]}>
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: faceEnrolled ? '#22c55e' : '#f59e0b' },
                ]}>
                {faceEnrolled ? '✓' : '!'}
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Photo Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusIconContainer}>
              <Text style={styles.statusIcon}>📷</Text>
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Profile Photo</Text>
              <Text
                style={[
                  styles.statusValue,
                  { color: hasProfilePhoto ? '#22c55e' : '#94a3b8' },
                ]}>
                {hasProfilePhoto ? 'Available' : 'Missing'}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: hasProfilePhoto
                    ? 'rgba(34, 197, 94, 0.15)'
                    : 'rgba(148, 163, 184, 0.15)',
                },
              ]}>
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: hasProfilePhoto ? '#22c55e' : '#94a3b8' },
                ]}>
                {hasProfilePhoto ? '✓' : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy Information */}
        <Text style={styles.sectionHeader}>DATA PRIVACY</Text>
        <View style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyTitle}>How Your Data is Used</Text>
          </View>
          <Text style={styles.privacyText}>
            ACAMS uses face embeddings only for attendance verification. The app
            does not need to store live camera frames for attendance. Your
            enrolled face embedding is compared with the live camera embedding
            when attendance is taken.
          </Text>
          <View style={styles.privacyDivider} />
          <View style={styles.privacyBullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              Face data is stored securely in encrypted cloud storage
            </Text>
          </View>
          <View style={styles.privacyBullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              No live camera images are saved during attendance
            </Text>
          </View>
          <View style={styles.privacyBullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              Your data is only accessible to authorized administrators
            </Text>
          </View>
        </View>

        {/* Security Actions */}
        <Text style={styles.sectionHeader}>SECURITY</Text>
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.7}
          onPress={handleChangePassword}>
          <View style={styles.actionRow}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>🔑</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Change Password</Text>
              <Text style={styles.actionSubtitle}>
                Send a password reset email to your registered address
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Your privacy matters. ACAMS follows strict data protection guidelines.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#f87171',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 40,
  },
  retryButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
    marginTop: 8,
  },

  // Status Cards
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  statusIcon: {
    fontSize: 22,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 15,
    color: '#f8fafc',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Privacy Card
  privacyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  privacyIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  privacyTitle: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: 'bold',
  },
  privacyText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
    marginBottom: 14,
  },
  privacyDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 14,
  },
  privacyBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    color: '#0ea5e9',
    fontSize: 16,
    marginRight: 10,
    marginTop: -1,
  },
  bulletText: {
    fontSize: 13,
    color: '#cbd5e1',
    flex: 1,
    lineHeight: 20,
  },

  // Action Card
  actionCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    color: '#f8fafc',
    fontWeight: '600',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: '#475569',
    fontWeight: '300',
  },

  footerText: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 18,
  },
});

export default PrivacySecurityScreen;
