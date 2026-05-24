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

const UploadResultScreen = () => {
  const [studentEmail, setStudentEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [marks, setMarks] = useState('');
  const [department, setDepartment] = useState('');

  const uploadResult = async () => {
    if (!studentEmail || !subject || !marks || !department) {
      Alert.alert('Error', 'Fill all fields');
      return;
    }

    try {
      await firestore().collection('results').add({
        studentEmail,
        subject,
        marks,
        department,
        createdAt: new Date(),
      });

      Alert.alert('Success', 'Result uploaded!');
      setStudentEmail('');
      setSubject('');
      setMarks('');
      setDepartment('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Result</Text>

      <TextInput
        placeholder="Student Email"
        style={styles.input}
        value={studentEmail}
        onChangeText={setStudentEmail}
      />

      <TextInput
        placeholder="Subject"
        style={styles.input}
        value={subject}
        onChangeText={setSubject}
      />

      <TextInput
        placeholder="Marks"
        style={styles.input}
        value={marks}
        onChangeText={setMarks}
      />

      <TextInput
        placeholder="Department (CSE / ECE / MECH)"
        style={styles.input}
        value={department}
        onChangeText={setDepartment}
      />

      <TouchableOpacity style={styles.button} onPress={uploadResult}>
        <Text style={styles.buttonText}>Upload</Text>
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

export default UploadResultScreen;