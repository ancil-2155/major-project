import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const MeetingViewerScreen = () => {
  const [link, setLink] = useState('');

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('meeting')
      .doc('current')
      .onSnapshot(doc => {
        if (doc.exists()) {
  setLink(doc.data()?.link || '');
}
      });

    return unsubscribe;
  }, []);

  const openMeeting = () => {
    if (link) {
      Linking.openURL(link);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎥 Live Meeting</Text>

      {link ? (
        <TouchableOpacity style={styles.button} onPress={openMeeting}>
          <Text style={styles.text}>Join Meeting</Text>
        </TouchableOpacity>
      ) : (
        <Text>No meeting available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, marginBottom: 20 },
  button: {
    backgroundColor: '#16a34a',
    padding: 15,
    borderRadius: 10,
  },
  text: { color: '#fff', fontWeight: 'bold' },
});

export default MeetingViewerScreen;