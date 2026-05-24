import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const ViewResultsScreen = () => {
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const user = auth().currentUser;

    const fetchData = async () => {
      if (!user) return;

      const userDoc = await firestore()
        .collection('users')
        .doc(user.uid)
        .get();

      const userData = userDoc.data();

      const unsubscribe = firestore()
        .collection('results')
        .where('department', '==', userData?.department)
        .onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setResults(data);
        });

      return unsubscribe;
    };

    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Results</Text>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>Subject: {item.subject}</Text>
            <Text>Marks: {item.marks}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 10 },
  card: {
    padding: 15,
    backgroundColor: '#f3f4f6',
    marginBottom: 10,
    borderRadius: 8,
  },
});

export default ViewResultsScreen;