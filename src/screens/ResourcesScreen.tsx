import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AppBackButton from '../components/common/AppBackButton';

const ResourcesScreen = () => {
  const navigation = useNavigation<any>();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribeUser = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(userDoc => {
        const userData = userDoc.data();
        if (!userData?.department || !userData?.year) {
          setLoading(false);
          return;
        }

        const unsubscribeResources = firestore()
          .collection('resources')
          .where('department', '==', userData.department)
          .where('year', '==', userData.year)
          .orderBy('createdAt', 'desc')
          .onSnapshot(
            snapshot => {
              const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
              }));
              setResources(list);
              setLoading(false);
            },
            error => {
              console.log('Firestore error:', error);
              setLoading(false);
            },
          );

        return () => unsubscribeResources();
      });

    return () => unsubscribeUser();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading resources...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton
          navigation={navigation}
          fallbackRoute="StudentHome"
          iconColor="#1F2937"
          backgroundColor="#E5E7EB"
        />
        <Text style={styles.headerTitle}>Resources</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={resources}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No resources available</Text>
        }
        contentContainerStyle={styles.listContent}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    color: '#475569',
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontWeight: '700',
    fontSize: 16,
    color: '#111827',
  },
  file: {
    color: '#6B7280',
    marginTop: 5,
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
    color: '#6B7280',
  },
});

export default ResourcesScreen;
