import React, { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AppBackButton from '../components/common/AppBackButton';

const TeacherGroupsScreen = ({ navigation }: any) => {
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      return;
    }

    const unsubscribe = firestore()
      .collection('groupChats')
      .where('members', 'array-contains', user.uid)
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGroups(data);
      });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton
          navigation={navigation}
          fallbackRoute="StudentHome"
          iconColor="#1F2937"
          backgroundColor="#E5E7EB"
        />
        <Text style={styles.title}>My Groups</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={groups}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No groups found</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('GroupChat', {
                groupId: item.id,
              })
            }
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.detail}>
              {item.department} - Year {item.year}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default TeacherGroupsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  detail: {
    marginTop: 4,
    color: '#64748B',
  },
  empty: {
    textAlign: 'center',
    marginTop: 30,
    color: '#64748B',
  },
});
