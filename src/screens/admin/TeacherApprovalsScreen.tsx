import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import LinearGradient from 'react-native-linear-gradient';
import { User } from '../../types/user';
import { approveTeacher, rejectTeacher, suspendTeacher } from '../../services/admin/teacherApprovalService';

const Tabs = ['pending', 'approved', 'rejected', 'suspended'];

const TeacherApprovalsScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Cross-platform reject modal state (replaces iOS-only Alert.prompt)
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTargetUid, setRejectTargetUid] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('users')
      .where('role', '==', 'teacher')
      .onSnapshot(
        snapshot => {
          if (!snapshot) return;
          const list: User[] = [];
          snapshot.forEach(doc => {
            list.push({ uid: doc.id, ...doc.data() } as User);
          });
          setTeachers(list);
          setLoading(false);
        },
        error => {
          console.error('TeacherApprovals snapshot error:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  // Filter: support both new status field and old isApproved field
  const filteredTeachers = teachers.filter(t => {
    if (activeTab === 'pending') {
      return t.status === 'pending' || (!t.status && t.isApproved === false);
    }
    return t.status === activeTab;
  });

  const handleApprove = (uid: string) => {
    Alert.alert('Approve Teacher', 'Approve this teacher account and grant dashboard access?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await approveTeacher(uid);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Approval failed.');
          }
        },
      },
    ]);
  };

  const openRejectModal = (uid: string) => {
    setRejectTargetUid(uid);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    const reason = rejectReason.trim();
    if (!reason) {
      Alert.alert('Required', 'Please enter a reason for rejection.');
      return;
    }
    setRejectLoading(true);
    try {
      await rejectTeacher(rejectTargetUid, reason);
      setRejectModalVisible(false);
      setRejectReason('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Rejection failed.');
    } finally {
      setRejectLoading(false);
    }
  };

  const handleSuspend = (uid: string) => {
    Alert.alert('Suspend Account', 'This teacher will lose access immediately.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Suspend',
        style: 'destructive',
        onPress: async () => {
          try {
            await suspendTeacher(uid);
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Suspend failed.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Reject Reason Modal — cross-platform replacement for Alert.prompt */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reject Teacher</Text>
            <Text style={styles.modalSubtitle}>Enter the reason for rejection:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Incomplete documents..."
              placeholderTextColor="#9CA3AF"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
                disabled={rejectLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalRejectBtn}
                onPress={handleConfirmReject}
                disabled={rejectLoading}
              >
                {rejectLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalRejectText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <LinearGradient colors={['#1E3A8A', '#312E81']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Teacher Approvals</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.tabsContainer}>
          {Tabs.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={styles.listContainer} keyboardShouldPersistTaps="handled">
          {filteredTeachers.length === 0 ? (
            <Text style={styles.emptyText}>No {activeTab} teacher approvals.</Text>
          ) : (
            filteredTeachers.map(teacher => (
              <View key={teacher.uid} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{teacher.name || 'Unknown Teacher'}</Text>
                  <Text style={styles.dept}>{teacher.department || 'No Dept'}</Text>
                </View>
                <Text style={styles.detail}>📧 {teacher.email || 'No email'}</Text>
                {teacher.year ? (
                  <Text style={styles.detail}>📅 Year Incharge: {teacher.year}</Text>
                ) : null}

                <View style={styles.actions}>
                  {activeTab === 'pending' && (
                    <>
                      <TouchableOpacity
                        style={[styles.btn, styles.approveBtn]}
                        onPress={() => handleApprove(teacher.uid)}
                      >
                        <Text style={styles.btnText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btn, styles.rejectBtn]}
                        onPress={() => openRejectModal(teacher.uid)}
                      >
                        <Text style={styles.btnText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {activeTab === 'approved' && (
                    <TouchableOpacity
                      style={[styles.btn, styles.suspendBtn]}
                      onPress={() => handleSuspend(teacher.uid)}
                    >
                      <Text style={styles.btnText}>Suspend</Text>
                    </TouchableOpacity>
                  )}

                  {activeTab === 'suspended' && (
                    <TouchableOpacity
                      style={[styles.btn, styles.approveBtn]}
                      onPress={() => handleApprove(teacher.uid)}
                    >
                      <Text style={styles.btnText}>Reactivate</Text>
                    </TouchableOpacity>
                  )}

                  {activeTab === 'rejected' && (
                    <Text style={styles.reasonText}>
                      Reason: {teacher.rejectionReason || 'None given'}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

export default TeacherApprovalsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  backText: { color: '#fff', fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: '#fff' },
  tabText: { color: '#93C5FD', fontWeight: '600' },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  listContainer: { padding: 20 },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 40, fontSize: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: { fontSize: 17, fontWeight: 'bold', color: '#1F2937', flex: 1 },
  dept: {
    fontSize: 12,
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  detail: { fontSize: 14, color: '#4B5563', marginBottom: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 10 },
  btn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  approveBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#EF4444' },
  suspendBtn: { backgroundColor: '#F59E0B' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  reasonText: { color: '#EF4444', fontSize: 12, fontStyle: 'italic', marginTop: 8, flex: 1 },
  // Reject Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: '#4B5563', marginBottom: 14 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    minHeight: 80,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalCancelText: { color: '#374151', fontWeight: '600' },
  modalRejectBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    minWidth: 80,
    alignItems: 'center',
  },
  modalRejectText: { color: '#fff', fontWeight: 'bold' },
});
