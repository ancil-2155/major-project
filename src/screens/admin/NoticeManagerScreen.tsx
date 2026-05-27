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
import Icon from 'react-native-vector-icons/Ionicons';
import { createNotice, deleteNoticeSoft, hideNotice } from '../../services/notice/noticeService';
import { TargetRole, TargetEducationLevel, NoticePriority } from '../../types/notice';
import auth from '@react-native-firebase/auth';

const Roles: TargetRole[] = ['all', 'student', 'teacher', 'parent'];
const EdLevels: TargetEducationLevel[] = ['all', 'school', 'btech', 'college'];
const Priorities: NoticePriority[] = ['normal', 'important', 'urgent'];

const NoticeManagerScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState<TargetRole>('all');
  const [targetEd, setTargetEd] = useState<TargetEducationLevel>('all');
  const [priority, setPriority] = useState<NoticePriority>('normal');
  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('notices')
      .where('status', '!=', 'deleted')
      .orderBy('status')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(snapshot => {
        if (!snapshot) return;
        const list: any[] = [];
        snapshot.forEach(doc => list.push({ noticeId: doc.id, ...doc.data() }));
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
      const user = auth().currentUser;
      const userDoc = await firestore().collection('users').doc(user!.uid).get();
      const userName = userDoc.data()?.name || 'Admin';

      await createNotice({
        title,
        message,
        targetRole,
        targetEducationLevel: targetEd,
        priority,
        targetDepartmentCode: null,
        targetYearNumber: null,
        targetSemesterNumber: null,
        targetClassLevel: null,
        createdBy: user!.uid,
        createdByName: userName,
        createdByRole: 'admin',
        expiresAt: null
      });

      Alert.alert('Success', 'Notice created successfully!');
      setTitle('');
      setMessage('');
      setTargetRole('all');
      setTargetEd('all');
      setPriority('normal');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (id: string, action: 'hide' | 'delete') => {
    Alert.alert(`Confirm ${action}`, `Are you sure you want to ${action} this notice?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action.toUpperCase(),
        style: 'destructive',
        onPress: async () => {
          try {
            if (action === 'hide') await hideNotice(id);
            else await deleteNoticeSoft(id);
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E3A8A', '#312E81']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notice Manager</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Create New Notice</Text>
          
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Exam Schedule"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write your announcement..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>Target Role</Text>
          <View style={styles.rowWrapper}>
            {Roles.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, targetRole === r && styles.chipActive]}
                onPress={() => setTargetRole(r)}
              >
                <Text style={[styles.chipText, targetRole === r && styles.chipActiveText]}>
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Education Level</Text>
          <View style={styles.rowWrapper}>
            {EdLevels.map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.chip, targetEd === e && styles.chipActive]}
                onPress={() => setTargetEd(e)}
              >
                <Text style={[styles.chipText, targetEd === e && styles.chipActiveText]}>
                  {e.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Priority</Text>
          <View style={styles.rowWrapper}>
            {Priorities.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, priority === p && styles.chipActive, priority === p && p === 'urgent' && { borderColor: 'red', backgroundColor: '#FEE2E2' }]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.chipText, priority === p && styles.chipActiveText, priority === p && p === 'urgent' && { color: 'red' }]}>
                  {p.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Publish Notice</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginLeft: 4, marginTop: 16 }]}>Active & Hidden Notices</Text>
        {notices.length === 0 ? (
          <Text style={styles.emptyText}>No notices published yet.</Text>
        ) : (
          notices.map(notice => (
            <View key={notice.noticeId} style={[styles.noticeCard, notice.status === 'hidden' && { opacity: 0.6 }]}>
              <View style={styles.noticeHeader}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Text style={styles.noticeTarget}>{(notice.targetRole || 'all').toUpperCase()}</Text>
                  <Text style={[styles.noticeTarget, { backgroundColor: '#F3E8FF', color: '#9333EA' }]}>
                    {(notice.targetEducationLevel || 'all').toUpperCase()}
                  </Text>
                  {notice.priority === 'urgent' && (
                    <Text style={[styles.noticeTarget, { backgroundColor: '#FEE2E2', color: '#DC2626' }]}>URGENT</Text>
                  )}
                  {notice.status === 'hidden' && (
                    <Text style={[styles.noticeTarget, { backgroundColor: '#E5E7EB', color: '#4B5563' }]}>HIDDEN</Text>
                  )}
                </View>
              </View>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeMessage}>{notice.message}</Text>
              
              <View style={styles.actionRow}>
                <Text style={styles.noticeDate}>
                  {notice.createdAt ? new Date(notice.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {notice.status === 'active' && (
                    <TouchableOpacity onPress={() => handleAction(notice.noticeId, 'hide')}>
                      <Icon name="eye-off-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleAction(notice.noticeId, 'delete')}>
                    <Icon name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, elevation: 2, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#4B5563', marginBottom: 8, textTransform: 'uppercase' },
  rowWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  chipText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  chipActiveText: { color: '#1D4ED8', fontWeight: 'bold' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 14, color: '#1F2937', marginBottom: 16 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 8, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 10 },
  noticeCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#3B82F6', elevation: 1 },
  noticeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  noticeTarget: { fontSize: 10, fontWeight: 'bold', color: '#3B82F6', backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  noticeDate: { fontSize: 12, color: '#9CA3AF' },
  noticeTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  noticeMessage: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 10 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 }
});
