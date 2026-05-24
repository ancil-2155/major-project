import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const AdminApproveScreen = () => {
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    fetchPendingTeachers();
  }, []);

  const fetchPendingTeachers = async () => {
    const snapshot = await firestore()
      .collection('users')
      .where('role', '==', 'teacher')
      .where('approved', '==', false)
      .get();

    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    setTeachers(list);
  };

  const approveTeacher = async (id: string) => {
    await firestore().collection('users').doc(id).update({
      approved: true,
    });

    Alert.alert('Approved ✅');

    fetchPendingTeachers(); // refresh list
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.dept}>{item.department}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => approveTeacher(item.id)}
      >
        <Text style={styles.buttonText}>Approve</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Teacher Approvals</Text>

      <FlatList
        data={teachers}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No pending teachers 🎉
          </Text>
        }
      />
    </View>
  );
};

export default AdminApproveScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 3,
  },

  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  dept: {
    color: '#6B7280',
    marginBottom: 10,
  },

  button: {
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 20,
  },
});