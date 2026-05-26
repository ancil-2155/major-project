import React, { useEffect, useState, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  LeaveRequest,
  subscribeToLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  getTeacherSavedSignature,
} from '../services/teacher/requestService';

const TABS = ['pending', 'approved', 'rejected', 'all'];

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, { bg: string; text: string }> = {
    pending:  { bg: '#FEF3C7', text: '#92400E' },
    approved: { bg: '#D1FAE5', text: '#065F46' },
    rejected: { bg: '#FEE2E2', text: '#991B1B' },
  };
  const c = colors[status] || { bg: '#F3F4F6', text: '#374151' };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{(status || 'unknown').toUpperCase()}</Text>
    </View>
  );
};

const TeacherLeaveRequestsScreen = ({ navigation }: any) => {
  const [requests, setRequests]       = useState<LeaveRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [activeTab, setActiveTab]     = useState('pending');
  const [refreshing, setRefreshing]   = useState(false);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [actionLoading, setActionLoading]   = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal]   = useState(false);
  const [rejectTarget, setRejectTarget] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const uid = auth().currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    firestore().collection('users').doc(uid).get().then(doc => {
      if (doc.exists) setTeacherProfile({ uid, ...doc.data() });
    });

    getTeacherSavedSignature(uid).then(setSavedSignature);

    setLoading(true);
    setError('');
    const unsub = subscribeToLeaveRequests(
      uid,
      data => {
        setRequests(data);
        setLoading(false);
        setRefreshing(false);
      },
      err => {
        console.error('Leave requests error:', err);
        setError('Unable to load leave requests. Please try again.');
        setLoading(false);
        setRefreshing(false);
      }
    );
    return () => unsub();
  }, [uid]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (uid) getTeacherSavedSignature(uid).then(setSavedSignature);
    setTimeout(() => setRefreshing(false), 2000);
  }, [uid]);

  const filtered = requests.filter(r => {
    if (activeTab === 'all') return true;
    return (r.status || 'pending') === activeTab;
  });

  const handleApprove = (item: LeaveRequest) => {
    const teacherName = teacherProfile?.name || 'Teacher';

    if (!savedSignature) {
      Alert.alert(
        'No Signature Saved',
        'Please create your digital signature first, then approve this request.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create Signature', onPress: () => navigation.navigate('TeacherSignature') },
        ]
      );
      return;
    }

    Alert.alert(
      'Approve with Signature',
      `Approve leave request for ${item.studentName || 'this student'}?\nFrom: ${item.fromDate} To: ${item.toDate}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve ✓',
          onPress: async () => {
            try {
              setActionLoading(true);
              await approveLeaveRequest(item.id, teacherName, savedSignature);
              Alert.alert('Success ✅', 'Leave approved with your signature.');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Approval failed.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const openReject = (id: string) => {
    setRejectTarget(id);
    setRejectReason('');
    setRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Required', 'Please enter a rejection reason.');
      return;
    }
    const teacherName = teacherProfile?.name || 'Teacher';
    try {
      setActionLoading(true);
      await rejectLeaveRequest(rejectTarget, teacherName, rejectReason.trim());
      setRejectModal(false);
      Alert.alert('Done', 'Leave request has been rejected.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderCard = (item: LeaveRequest) => {
    const studentName = item.studentName || 'Unknown Student';
    const requestDate = item.createdAt?.toDate
      ? item.createdAt.toDate().toLocaleDateString()
      : '—';

    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.cardMeta}>Roll: {item.rollNo || '—'}</Text>
            <Text style={styles.cardMeta}>{item.department || '—'} · Year {item.year || '—'}</Text>
            <Text style={styles.cardMeta}>📅 Requested: {requestDate}</Text>
          </View>
          <StatusBadge status={item.status || 'pending'} />
        </View>

        {/* Leave details */}
        <View style={styles.leaveDetails}>
          {item.leaveType ? (
            <View style={styles.leaveTypeChip}>
              <Text style={styles.leaveTypeText}>{item.leaveType}</Text>
            </View>
          ) : null}
          <Text style={styles.dateRange}>
            🗓  {item.fromDate || '—'}  →  {item.toDate || '—'}
          </Text>
          {item.halfDay && (
            <Text style={styles.halfDayText}>Half Day: {item.halfDaySession || '—'}</Text>
          )}
        </View>

        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Reason</Text>
          <Text style={styles.reasonText}>{item.reason || '—'}</Text>
        </View>

        {item.status === 'approved' && item.signatureAttached && (
          <View style={styles.sigBadge}>
            <Text style={styles.sigBadgeText}>✍️ Signature Attached</Text>
          </View>
        )}

        {item.status === 'rejected' && item.rejectionReason ? (
          <View style={styles.rejectReasonBox}>
            <Text style={styles.rejectReasonLabel}>Rejection Reason:</Text>
            <Text style={styles.rejectReasonText}>{item.rejectionReason}</Text>
          </View>
        ) : null}

        {(item.status === 'pending' || !item.status) && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => handleApprove(item)}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>✓ Approve with Signature</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => openReject(item.id)}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>✕ Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Reject Modal */}
      <Modal visible={rejectModal} transparent animationType="fade" onRequestClose={() => setRejectModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reject Leave Request</Text>
            <Text style={styles.modalSubtitle}>Enter reason for rejection:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Insufficient reason, no supporting documents..."
              placeholderTextColor="#9CA3AF"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setRejectModal(false)} disabled={actionLoading}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalRejectBtn} onPress={confirmReject} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalConfirmText}>Reject</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <LinearGradient colors={['#0369A1', '#0284C7']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leave Requests</Text>
          <View style={{ width: 60 }} />
        </View>

        <TouchableOpacity
          style={styles.sigStatus}
          onPress={() => navigation.navigate('TeacherSignature')}
        >
          <Text style={styles.sigStatusText}>
            {savedSignature ? '✍️ Signature: Saved ✓' : '⚠️ No Signature — Tap to Create'}
          </Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab !== 'all' && ` (${requests.filter(r => (r.status || 'pending') === tab).length})`}
                {tab === 'all' && ` (${requests.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0369A1" />
          <Text style={styles.loadingText}>Loading leave requests...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No {activeTab} leave requests</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'pending'
                  ? 'No pending leave applications from students.'
                  : 'No requests in this category yet.'}
              </Text>
            </View>
          ) : (
            filtered.map(renderCard)
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

export default TeacherLeaveRequestsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingTop: 50, paddingBottom: 0, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  backText: { color: '#fff', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  sigStatus: { marginHorizontal: 20, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 8 },
  sigStatusText: { color: '#E0F2FE', fontSize: 12, textAlign: 'center', fontWeight: '600' },
  tabsScroll: { paddingHorizontal: 16, marginBottom: 0 },
  tab: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 3, borderBottomColor: 'transparent', marginRight: 4 },
  activeTab: { borderBottomColor: '#fff' },
  tabText: { color: '#BAE6FD', fontWeight: '600', fontSize: 13 },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  list: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { color: '#6B7280', marginTop: 12 },
  errorText: { color: '#DC2626', textAlign: 'center', fontSize: 15, marginBottom: 16 },
  retryBtn: { backgroundColor: '#0369A1', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, elevation: 2 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardLeft: { flex: 1 },
  studentName: { fontSize: 17, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  cardMeta: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  leaveDetails: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 },
  leaveTypeChip: { backgroundColor: '#EDE9FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  leaveTypeText: { color: '#5B21B6', fontSize: 12, fontWeight: '600' },
  dateRange: { fontSize: 13, color: '#0369A1', fontWeight: '500' },
  halfDayText: { fontSize: 12, color: '#6B7280' },
  reasonBox: { backgroundColor: '#F0F9FF', borderRadius: 8, padding: 10, marginBottom: 10 },
  reasonLabel: { fontSize: 11, fontWeight: 'bold', color: '#0369A1', marginBottom: 4, textTransform: 'uppercase' },
  reasonText: { fontSize: 14, color: '#374151' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  sigBadge: { backgroundColor: '#ECFDF5', borderRadius: 8, padding: 8, marginBottom: 8 },
  sigBadgeText: { color: '#059669', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  rejectReasonBox: { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10, marginBottom: 8 },
  rejectReasonLabel: { fontSize: 11, fontWeight: 'bold', color: '#DC2626', marginBottom: 2 },
  rejectReasonText: { fontSize: 13, color: '#7F1D1D' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  approveBtn: { flex: 1, backgroundColor: '#059669', borderRadius: 8, padding: 10, alignItems: 'center' },
  rejectBtn: { flex: 1, backgroundColor: '#DC2626', borderRadius: 8, padding: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: '#4B5563', marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 14, color: '#1F2937', backgroundColor: '#F9FAFB', minHeight: 80, marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  modalCancelText: { color: '#374151', fontWeight: '600' },
  modalRejectBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: '#DC2626', minWidth: 80, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: 'bold' },
});