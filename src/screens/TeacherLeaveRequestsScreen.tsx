import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const TeacherLeaveRequestsScreen = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const user = auth().currentUser;

      if (!user) return;

      console.log('Teacher UID:', user.uid); // 🔥 debug

      const snapshot = await firestore()
        .collection('leave_requests')
        .where('teacherId', '==', user.uid)
        .get();

      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRequests(list);
    } catch (error) {
      console.log('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ APPROVE
  const approveLeave = (item: any) => {
    Alert.alert(
      "Approve Leave",
      "Are you sure you want to approve this request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            await firestore()
              .collection('leave_requests')
              .doc(item.id)
              .update({ status: 'approved' });

            fetchRequests();
          },
        },
      ]
    );
  };

  // ❌ REJECT
  const rejectLeave = (item: any) => {
    Alert.alert(
      "Reject Leave",
      "Are you sure you want to reject this request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            await firestore()
              .collection('leave_requests')
              .doc(item.id)
              .update({ status: 'rejected' });

            fetchRequests();
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.studentName}</Text>

      <Text style={styles.text}>Roll: {item.rollNo}</Text>
      <Text style={styles.text}>From: {item.fromDate}</Text>
      <Text style={styles.text}>To: {item.toDate}</Text>
      <Text style={styles.text}>Reason: {item.reason}</Text>

      <Text
        style={[
          styles.status,
          item.status === 'approved'
            ? styles.approved
            : item.status === 'rejected'
            ? styles.rejected
            : styles.pending,
        ]}
      >
        Status: {item.status.toUpperCase()}
      </Text>

      {/* Buttons only if pending */}
      {item.status === 'pending' && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => approveLeave(item)}
          >
            <Text style={styles.btnText}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => rejectLeave(item)}
          >
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
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
      <Text style={styles.title}>Leave Requests</Text>

      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No requests</Text>
        }
      />
    </View>
  );
};

export default TeacherLeaveRequestsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },

  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  text: {
    fontSize: 14,
    marginBottom: 2,
  },

  status: {
    marginTop: 10,
    fontWeight: 'bold',
  },

  approved: {
    color: 'green',
  },

  rejected: {
    color: 'red',
  },

  pending: {
    color: 'orange',
  },

  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
  },

  approveBtn: {
    backgroundColor: '#16a34a',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },

  rejectBtn: {
    backgroundColor: '#dc2626',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },

  btnText: {
    color: '#fff',
    textAlign: 'center',
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