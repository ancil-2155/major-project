import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import { createNotice } from '../../services/admin/noticeService';
import { TargetRole } from '../../types/notice';

const Roles: TargetRole[] = ['all', 'student', 'teacher', 'parent'];

const NoticeManagerScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState<TargetRole>('all');
  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('notices')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        if (!snapshot) return;
        const list: any[] = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setNotices(list);
      });
    return () => unsubscribe();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Title and Message are required.');
      return;
    }

    setLoading(true);
    try {
      await createNotice(title, message, targetRole);
      Alert.alert('Success', 'Notice created successfully!');
      setTitle('');
      setMessage('');
      setTargetRole('all');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E3A8A', '#312E81']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notice Manager</Text>
          <View style={{ width: 60 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Create New Notice</Text>
          
          <Text style={styles.label}>Target Audience</Text>
          <View style={styles.rolesRow}>
            {Roles.map(role => (
              <TouchableOpacity
                key={role}
                style={[styles.roleBtn, targetRole === role && styles.activeRoleBtn]}
                onPress={() => setTargetRole(role)}
              >
                <Text style={[styles.roleBtnText, targetRole === role && styles.activeRoleText]}>
                  {role.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sports Day Announcement"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your announcement here..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Publish Notice</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginLeft: 4, marginTop: 16 }]}>Recent Notices</Text>
        {notices.length === 0 ? (
          <Text style={styles.emptyText}>No notices published yet.</Text>
        ) : (
          notices.map(notice => (
            <View key={notice.id} style={styles.noticeCard}>
              <View style={styles.noticeHeader}>
                <Text style={styles.noticeTarget}>{(notice.targetRole || 'all').toUpperCase()}</Text>
                <Text style={styles.noticeDate}>
                  {notice.createdAt ? new Date(notice.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                </Text>
              </View>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeMessage}>{notice.message}</Text>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default NoticeManagerScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  backText: { color: '#fff', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, elevation: 2, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#4B5563', marginBottom: 8, textTransform: 'uppercase' },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  activeRoleBtn: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  roleBtnText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  activeRoleText: { color: '#1D4ED8', fontWeight: 'bold' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 14, color: '#1F2937', marginBottom: 16 },
  textArea: { minHeight: 100 },
  submitBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 8, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 10 },
  noticeCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#3B82F6', elevation: 1 },
  noticeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  noticeTarget: { fontSize: 10, fontWeight: 'bold', color: '#3B82F6', backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  noticeDate: { fontSize: 12, color: '#9CA3AF' },
  noticeTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  noticeMessage: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
});
