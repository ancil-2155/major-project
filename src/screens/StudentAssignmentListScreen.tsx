import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import firestore from '@react-native-firebase/firestore';

const StudentAssignmentListScreen = ({ navigation }: any) => {
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('assignments')
      .onSnapshot(snapshot => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAssignments(list);
      });

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('SubmitAssignment', item)}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text>{item.subject}</Text>
      <Text>Due: {item.dueDate}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Assignments</Text>

      <FlatList
        data={assignments}
        keyExtractor={item => item.id}
        renderItem={renderItem}
      />
    </View>
  );
};

export default StudentAssignmentListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: { fontWeight: 'bold' },
});