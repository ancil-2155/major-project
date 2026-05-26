import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';

const StudentSettingsScreen = ({ navigation }: any) => {

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await auth().signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        },
      ]
    );
  };

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderSettingItem = (title: string, icon: string, onPress: () => void, isDestructive = false) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <Text style={[styles.settingTitle, isDestructive && styles.destructiveText]}>{title}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {renderSectionHeader('Account')}
        <View style={styles.card}>
          {renderSettingItem('My Profile', '👤', () => navigation.navigate('StudentProfile'))}
          <View style={styles.divider} />
          {renderSettingItem('Change Password', '🔑', () => Alert.alert('Coming Soon', 'Password change flow will be added later.'))}
        </View>

        {renderSectionHeader('App Preferences')}
        <View style={styles.card}>
          {renderSettingItem('Notifications', '🔔', () => Alert.alert('Coming Soon', 'Notification settings will be available soon.'))}
          <View style={styles.divider} />
          {renderSettingItem('Theme', '🎨', () => Alert.alert('Coming Soon', 'Dark mode is in development!'))}
          <View style={styles.divider} />
          {renderSettingItem('Language', '🌐', () => Alert.alert('Coming Soon', 'Multi-language support is planned.'))}
        </View>

        {renderSectionHeader('Privacy & Security')}
        <View style={styles.card}>
          {renderSettingItem('Face Enrollment Info', '🛡️', () => Alert.alert('Privacy', 'Your face enrollment data is securely encrypted and used only for attendance.'))}
          <View style={styles.divider} />
          {renderSettingItem('Request Data Correction', '✏️', () => Alert.alert('Coming Soon', 'Please contact admin to correct your data.'))}
        </View>

        {renderSectionHeader('Help & Support')}
        <View style={styles.card}>
          {renderSettingItem('Contact Admin', '✉️', () => Alert.alert('Contact', 'Please email admin@acams.edu for support.'))}
          <View style={styles.divider} />
          {renderSettingItem('About ACAMS', 'ℹ️', () => Alert.alert('About', 'ACAMS App v1.0.0'))}
        </View>

        {renderSectionHeader('Session')}
        <View style={styles.card}>
          {renderSettingItem('Logout', '🚪', handleLogout, true)}
        </View>

        <Text style={styles.versionText}>Version 1.0.0</Text>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 24, color: '#374151', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  
  scrollContent: { padding: 20, paddingBottom: 50 },
  sectionHeader: { fontSize: 13, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', marginBottom: 8, marginLeft: 12, marginTop: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: { fontSize: 20, marginRight: 12, width: 26, textAlign: 'center' },
  settingTitle: { fontSize: 16, color: '#1F2937', fontWeight: '500' },
  destructiveText: { color: '#EF4444' },
  chevron: { fontSize: 20, color: '#9CA3AF' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 54 },
  versionText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 20 },
});

export default StudentSettingsScreen;
