import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const ResourcesScreen = () => {
  const navigation = useNavigation<any>();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;

    if (!user) return;

    // 🔥 Listen to user data
    const unsubscribeUser = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(userDoc => {
        const userData = userDoc.data();

        // ✅ Wait until department & year exist
        if (!userData?.department || !userData?.year) {
          setLoading(false);
          return;
        }

        // 🔥 Fetch resources based on dept + year
        const unsubscribeResources = firestore()
          .collection('resources')
          .where('department', '==', userData.department)
          .where('year', '==', userData.year)
          .orderBy('createdAt', 'desc')
          .onSnapshot(
            snapshot => {
              // ✅ Prevent crash
              if (!snapshot || !snapshot.docs) {
                setLoading(false);
                return;
              }

              const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
              }));

              setResources(list);
              setLoading(false);
            },
            error => {
              console.log('Firestore Error:', error);
              setLoading(false);
            }
          );

        // cleanup inner listener
        return () => unsubscribeResources();
      });

    return () => unsubscribeUser();
  }, []);

  // 🟡 Loading UI
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text>Loading resources...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📚 Resources</Text>

      <FlatList
        data={resources}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No resources available</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
  navigation.navigate('PDFViewer', {
    fileUrl: item.fileUrl,
    fileName: item.fileName,
  })
}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.file}>{item.fileName}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default ResourcesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },

  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  card: {
    padding: 15,
    borderWidth: 1,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
  },

  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },

  file: {
    color: 'gray',
    marginTop: 5,
  },

  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: 'gray',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});