import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const TeacherRequestsScreen = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const user = auth().currentUser;
      if (!user) return;

      const snapshot = await firestore()
        .collection('bonafide_requests')
        .where('teacherId', '==', user.uid)
        .where('status', '==', 'pending')
        .get();

      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRequests(list);
    } catch (error) {
      console.log('Fetch error:', error);
    }
  };

  // 🔥 FULL UPDATED APPROVE FUNCTION
  const approveRequest = async (id: string) => {
    try {
      const user = auth().currentUser;

      if (!user) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      setLoadingId(id);

      // 🔥 Fetch teacher data
      const teacherDoc = await firestore()
        .collection('users')
        .doc(user.uid)
        .get();

      const teacherData = teacherDoc.data();

      // ❌ No signature check
      if (!teacherData?.signature) {
        Alert.alert('Error', 'Please add your signature first');
        setLoadingId(null);
        return;
      }

      // 🔥 Update request with signature
      await firestore()
        .collection('bonafide_requests')
        .doc(id)
        .update({
          status: 'approved',
          approvedAt: firestore.FieldValue.serverTimestamp(),

          signature: teacherData.signature,
          signedBy: teacherData.name,
        });

      Alert.alert('Success', 'Approved with signature ✅');

      // 🔄 Refresh list
      fetchRequests();

    } catch (error) {
      console.log('Approve error:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoadingId(null);
    }
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.studentName}</Text>
      <Text>Roll: {item.rollNo}</Text>
      <Text>Dept: {item.department}</Text>
      <Text>Purpose: {item.purpose}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => approveRequest(item.id)}
        disabled={loadingId === item.id}
      >
        {loadingId === item.id ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Approve</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bonafide Requests</Text>

      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No pending requests
          </Text>
        }
      />
    </View>
  );
};

export default TeacherRequestsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },

  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  button: {
    marginTop: 10,
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
  },
});