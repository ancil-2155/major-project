import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

type LeaveItem = {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  fromDate: string;
  toDate: string;
  reason: string;
  leaveType: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
};

const StudentLeaveListScreen = () => {
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore()
      .collection('leave_requests')
      .where('studentId', '==', user.uid)
      .onSnapshot(
        snapshot => {
          if (!snapshot) return;

          const list: LeaveItem[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<LeaveItem, 'id'>),
          }));

          // 🔥 Optional alert (simple version)
          list.forEach(item => {
            if (item.status === 'approved') {
              Alert.alert('Approved 🎉', 'Your leave is approved');
            }
            if (item.status === 'rejected') {
              Alert.alert('Rejected ❌', 'Your leave was rejected');
            }
          });

          setLeaves(list);
          setLoading(false);
        },
        error => {
          console.log('Firestore error:', error);
        }
      );

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }: { item: LeaveItem }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.leaveType}</Text>

      <Text>From: {item.fromDate}</Text>
      <Text>To: {item.toDate}</Text>
      <Text>Reason: {item.reason}</Text>

      {/* Status Badge */}
      <Text
        style={[
          styles.statusBadge,
          item.status === 'approved'
            ? styles.approved
            : item.status === 'rejected'
            ? styles.rejected
            : styles.pending,
        ]}
      >
        {item.status.toUpperCase()}
      </Text>

      {/* Status Icon */}
      <Text style={styles.statusIcon}>
        {item.status === 'approved' && '✅ Approved'}
        {item.status === 'rejected' && '❌ Rejected'}
        {item.status === 'pending' && '⏳ Pending'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Leave Requests</Text>

      <FlatList
        data={leaves}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No leave requests</Text>
        }
      />
    </View>
  );
};

export default StudentLeaveListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },

  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 3,
  },

  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },

  statusBadge: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    fontWeight: 'bold',
    color: '#fff',
  },

  approved: {
    backgroundColor: '#16a34a',
  },

  rejected: {
    backgroundColor: '#dc2626',
  },

  pending: {
    backgroundColor: '#f59e0b',
  },

  statusIcon: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '600',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#6B7280',
  },
});