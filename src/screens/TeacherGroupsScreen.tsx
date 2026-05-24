import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const TeacherGroupsScreen = ({ navigation }: any) => {
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    const user = auth().currentUser;

    if (!user) return;

    const unsubscribe = firestore()
      .collection('groupChats')
      .where('members', 'array-contains', user.uid) // 🔥 KEY LINE
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("GROUPS:", data); // 🔥 DEBUG
        setGroups(data);
      });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📚 My Groups</Text>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              console.log("OPEN GROUP:", item.id);

              navigation.navigate('GroupChat', {
                groupId: item.id,
              });
            }}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text>
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
  container: { flex: 1, padding: 10 },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  card: {
    padding: 15,
    borderWidth: 1,
    marginBottom: 10,
    borderRadius: 8,
  },

  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});