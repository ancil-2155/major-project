import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const StudentBonafideListScreen = ({ navigation }: any) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const user = auth().currentUser;

      if (!user) return;
const snapshot = await firestore()
  .collection('bonafide_requests')
  .where('studentId', '==', user.uid)
  .get();

      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRequests(list);
    } catch (error) {
      console.log('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => {
        if (item.status === 'approved') {
          navigation.navigate('BonafideDocument', item);
        } else {
          Alert.alert('Not Ready', 'Certificate not approved yet');
        }
      }}
    >
      <Text style={styles.name}>{item.studentName}</Text>
      <Text>Roll No: {item.rollNo}</Text>
      <Text>Purpose: {item.purpose}</Text>

      <Text
        style={[
          styles.status,
          item.status === 'approved'
            ? styles.approved
            : styles.pending,
        ]}
      >
        {item.status.toUpperCase()}
      </Text>
    </TouchableOpacity>
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
      <Text style={styles.title}>My Bonafide Requests</Text>

      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No requests found
          </Text>
        }
      />
    </View>
  );
};

export default StudentBonafideListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 20,
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

  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  status: {
    marginTop: 10,
    fontWeight: 'bold',
  },

  approved: {
    color: 'green',
  },

  pending: {
    color: 'orange',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 20,
  },
});