import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { getProfilePhotoUrl } from '../services/firebase/storageSafeService';
import AppBackButton from '../components/common/AppBackButton';

const StudentProfileScreen = ({ navigation }: any) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = auth().currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const doc = await firestore().collection('users').doc(user.uid).get();
        const data = doc.data();
        setUserData({ uid: user.uid, email: user.email, ...data });
        setPhone(data?.phone || '');
        const safeUrl = await getProfilePhotoUrl(data);
        setProfilePhotoUrl(safeUrl);
      } catch (error) {
        console.log('Error fetching profile', error);
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = auth().currentUser;
      if (!user) {
        setSaving(false);
        return;
      }

      await firestore().collection('users').doc(user.uid).update({
        phone: phone.trim(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      setUserData((prev: any) => ({ ...prev, phone: phone.trim() }));
      Alert.alert('Success', 'Phone number updated successfully.');
    } catch (error) {
      console.log('Error saving profile', error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerBar}>
        <AppBackButton
          navigation={navigation}
          fallbackRoute="StudentHome"
          iconColor="#374151"
          backgroundColor="#E5E7EB"
        />
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.idCardContainer}>
        <LinearGradient
          colors={['#4F46E5', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.idCardHeader}
        >
          <Text style={styles.institutionName}>ACAMS INSTITUTION</Text>
          <Text style={styles.idCardSubtitle}>STUDENT IDENTITY CARD</Text>
        </LinearGradient>

        <View style={styles.idCardBody}>
          <View style={styles.idCardTopSection}>
            <View style={styles.photoContainer}>
              {profilePhotoUrl ? (
                <Image source={{ uri: profilePhotoUrl }} style={styles.idPhoto} />
              ) : (
                <View style={styles.placeholderPhoto}>
                  <Text style={styles.placeholderPhotoText}>
                    {userData?.name?.charAt(0) || 'S'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrText}>UID: {userData?.uid?.substring(0, 8)}...</Text>
              {userData?.faces?.length > 0 ? (
                <Text style={styles.biometricBadge}>Face Enrolled</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.idCardDetails}>
            <Text style={styles.idName}>{userData?.name || 'Student Name'}</Text>
            <Text style={styles.idRole}>STUDENT</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Roll No:</Text>
              <Text style={styles.detailValue}>{userData?.rollNo || 'Not Set'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dept:</Text>
              <Text style={styles.detailValue}>{userData?.department || 'Not Set'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Year:</Text>
              <Text style={styles.detailValue}>{userData?.year || 'Not Set'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sem:</Text>
              <Text style={styles.detailValue}>{userData?.semester || 'Not Set'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Edit Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address (Read-Only)</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={userData?.email || 'N/A'}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number (Optional)</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 18,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  idCardContainer: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  idCardHeader: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  institutionName: { color: '#FFFFFF', fontWeight: '700', fontSize: 18 },
  idCardSubtitle: { color: '#E0E7FF', fontSize: 10, marginTop: 2, letterSpacing: 1 },
  idCardBody: {
    padding: 20,
  },
  idCardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  photoContainer: {
    width: 100,
    height: 120,
    borderWidth: 3,
    borderColor: '#4F46E5',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  idPhoto: { width: '100%', height: '100%' },
  placeholderPhoto: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
  },
  placeholderPhotoText: { fontSize: 40, color: '#9CA3AF', fontWeight: '700' },
  qrPlaceholder: {
    flex: 1,
    marginLeft: 15,
    alignItems: 'flex-end',
  },
  qrText: { fontSize: 10, color: '#6B7280', marginBottom: 10 },
  biometricBadge: {
    fontSize: 10,
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '700',
  },
  idCardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 15,
  },
  idName: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 2 },
  idRole: { fontSize: 12, color: '#4F46E5', fontWeight: '700', marginBottom: 15 },
  detailRow: { flexDirection: 'row', marginBottom: 6 },
  detailLabel: { width: 70, fontSize: 13, color: '#6B7280', fontWeight: '600' },
  detailValue: { flex: 1, fontSize: 13, color: '#1F2937', fontWeight: '700' },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: '#4B5563', fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  readOnlyInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default StudentProfileScreen;
