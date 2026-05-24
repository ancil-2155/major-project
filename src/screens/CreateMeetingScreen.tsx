import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const CreateMeetingScreen = () => {
  const [link, setLink] = useState('');

  const createMeeting = async () => {
    if (!link) {
      Alert.alert('Error', 'Enter meeting link');
      return;
    }

    try {
      await firestore()
        .collection('meeting')
        .doc('current')
        .set({
          link: link,
          createdAt: new Date(),
        });

      Alert.alert('Success', 'Meeting created!');
      setLink('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Meeting</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter meeting link"
        value={link}
        onChangeText={setLink}
      />

      <TouchableOpacity style={styles.button} onPress={createMeeting}>
        <Text style={styles.buttonText}>Create</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, marginBottom: 15 },
  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', textAlign: 'center' },
});

export default CreateMeetingScreen;