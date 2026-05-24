import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const CreateAssignmentScreen = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');

  const createAssignment = async () => {
    const user = auth().currentUser;
    if (!user) return;

    if (!title || !description || !subject || !dueDate) {
      Alert.alert('Error', 'Fill all fields');
      return;
    }

    await firestore().collection('assignments').add({
      title,
      description,
      subject,
      dueDate,
      teacherId: user.uid,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    Alert.alert('Success', 'Assignment created');

    setTitle('');
    setDescription('');
    setSubject('');
    setDueDate('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Assignment</Text>

      <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={styles.input} />
      <TextInput placeholder="Subject" value={subject} onChangeText={setSubject} style={styles.input} />
      <TextInput placeholder="Due Date (YYYY-MM-DD)" value={dueDate} onChangeText={setDueDate} style={styles.input} />

      <TouchableOpacity style={styles.button} onPress={createAssignment}>
        <Text style={styles.buttonText}>Create</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CreateAssignmentScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, padding: 12, marginBottom: 10, borderRadius: 10 },
  button: { backgroundColor: '#2563EB', padding: 15, borderRadius: 10 },
  buttonText: { color: '#fff', textAlign: 'center' },
});