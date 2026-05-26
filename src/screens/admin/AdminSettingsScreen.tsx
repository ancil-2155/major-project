import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import { logAdminAction } from '../../services/admin/auditLogService';

const AdminSettingsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [teacherSignupEnabled, setTeacherSignupEnabled] = useState(true);
  const [studentSignupEnabled, setStudentSignupEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const doc = await firestore().collection('adminSettings').doc('global').get();
        if (doc.exists) {
          const data = doc.data();
          if (data) {
            setTeacherSignupEnabled(data.teacherSignupEnabled ?? true);
            setStudentSignupEnabled(data.studentSignupEnabled ?? true);
            setMaintenanceMode(data.maintenanceMode ?? false);
          }
        }
      } catch (e) {
        console.error('Failed to fetch settings', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await firestore().collection('adminSettings').doc('global').set({
        teacherSignupEnabled,
        studentSignupEnabled,
        maintenanceMode,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      await logAdminAction('settings_updated', undefined, undefined, {
        teacherSignupEnabled,
        studentSignupEnabled,
        maintenanceMode,
      });

      Alert.alert('Success', 'Settings updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E3A8A', '#312E81']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 60 }} />
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Global Application Toggles</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Teacher Signups</Text>
                <Text style={styles.settingDesc}>Allow new teachers to register.</Text>
              </View>
              <Switch
                value={teacherSignupEnabled}
                onValueChange={setTeacherSignupEnabled}
                trackColor={{ false: '#D1D5DB', true: '#34D399' }}
                thumbColor={teacherSignupEnabled ? '#10B981' : '#F3F4F6'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Student Signups</Text>
                <Text style={styles.settingDesc}>Allow new students to register.</Text>
              </View>
              <Switch
                value={studentSignupEnabled}
                onValueChange={setStudentSignupEnabled}
                trackColor={{ false: '#D1D5DB', true: '#34D399' }}
                thumbColor={studentSignupEnabled ? '#10B981' : '#F3F4F6'}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Maintenance Mode</Text>
                <Text style={styles.settingDesc}>Block all non-admin logins temporarily.</Text>
              </View>
              <Switch
                value={maintenanceMode}
                onValueChange={setMaintenanceMode}
                trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                thumbColor={maintenanceMode ? '#EF4444' : '#F3F4F6'}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save Settings</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default AdminSettingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  backText: { color: '#fff', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingTextContainer: { flex: 1, paddingRight: 16 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#374151' },
  settingDesc: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  saveBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 32 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
