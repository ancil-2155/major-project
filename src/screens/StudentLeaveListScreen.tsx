import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const StudentLeaveListScreen = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore()
      .collection('leave_requests')
      .where('studentId', '==', user.uid)
      .onSnapshot(
        snapshot => {
          const list: any[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          list.sort((a, b) => {
            const dateA = a.createdAt?.toDate()?.getTime() || 0;
            const dateB = b.createdAt?.toDate()?.getTime() || 0;
            return dateB - dateA;
          });
          setRequests(list);
          setLoading(false);
        },
        error => {
          console.log('Error fetching leave requests:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }: any) => {
    const requestDate = item.createdAt?.toDate
      ? item.createdAt.toDate().toLocaleDateString()
      : '—';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => {
          if (item.status === 'rejected') {
            Alert.alert('Rejected', item.rejectionReason || 'No reason provided.');
          }
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.leaveType}>{item.leaveType || 'Leave Request'}</Text>
          <Text
            style={[
              styles.statusBadge,
              item.status === 'approved'
                ? styles.statusApproved
                : item.status === 'rejected'
                ? styles.statusRejected
                : styles.statusPending,
            ]}
          >
            {(item.status || 'pending').toUpperCase()}
          </Text>
        </View>

        <Text style={styles.dateRange}>
          🗓 {item.fromDate || '—'}  →  {item.toDate || '—'}
        </Text>
        {item.halfDay && <Text style={styles.detail}>Half Day: {item.halfDaySession}</Text>}
        <Text style={styles.detail}>Reason: {item.reason}</Text>
        <Text style={styles.detailMeta}>📅 Requested: {requestDate}</Text>
        <Text style={styles.detailMeta}>👨‍🏫 Assigned to: {item.teacherName || 'Unknown Teacher'}</Text>

        {item.status === 'approved' && (
          <View style={styles.approvalBox}>
            <Text style={styles.approvalText}>✓ Approved by {item.reviewedByName || item.signedBy || 'Teacher'}</Text>
            {item.signatureAttached && <Text style={styles.signatureText}>✍️ Digital Signature Attached</Text>}
          </View>
        )}

        {item.status === 'rejected' && (
          <View style={styles.rejectBox}>
            <Text style={styles.rejectText}>✕ Rejected: {item.rejectionReason || 'No reason provided'}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0369A1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Leave Requests</Text>

      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No leave requests found</Text>
          </View>
        }
      />
    </View>
  );
};

export default StudentLeaveListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1F2937' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  leaveType: { fontSize: 16, fontWeight: 'bold', color: '#111827', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 10, fontWeight: 'bold', overflow: 'hidden' },
  statusApproved: { backgroundColor: '#D1FAE5', color: '#065F46' },
  statusRejected: { backgroundColor: '#FEE2E2', color: '#991B1B' },
  statusPending: { backgroundColor: '#FEF3C7', color: '#92400E' },
  dateRange: { fontSize: 15, fontWeight: '600', color: '#0369A1', marginBottom: 4 },
  detail: { fontSize: 14, color: '#374151', marginBottom: 4 },
  detailMeta: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  approvalBox: { marginTop: 12, backgroundColor: '#F0FDF4', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0' },
  approvalText: { color: '#166534', fontSize: 13, fontWeight: '500' },
  signatureText: { color: '#059669', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  rejectBox: { marginTop: 12, backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  rejectText: { color: '#991B1B', fontSize: 13, fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 10 },
  emptyText: { color: '#6B7280', fontSize: 16 },
});
