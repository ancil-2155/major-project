import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';


const CLOUD_NAME = 'drykzgx1b';
const UPLOAD_PRESET = 'acams_upload';

const uploadFileToCloudinary = async (file: any) => {
  const data = new FormData();

  data.append('file', {
    uri: file.uri,
    type: file.type || 'application/pdf',
    name: file.name || 'file.pdf',
  } as any);

  data.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    {
      method: 'POST',
      body: data,
    }
  );

  const json = await res.json();
  return json.secure_url;
};

type UploadResourceScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'UploadResource'>;
};

const UploadResourceScreen: React.FC<UploadResourceScreenProps> = () => {
  const [file, setFile] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');

 const pickFile = () => {
  Alert.alert(
    "Coming Soon 🚀",
    "File upload will be enabled soon (Cloudinary integration)"
  );
};

  const upload = async () => {
    if (!file || !title || !department || !year) {
      Alert.alert('Fill all fields');
      return;
    }

    const url = await uploadFileToCloudinary(file);

    if (!url) {
      Alert.alert('Upload failed');
      return;
    }

    await firestore().collection('resources').add({
      title,
      fileUrl: url,
      fileName: file.name,
      department,
      year,
      uploadedBy: auth().currentUser?.uid,
      createdAt: new Date(),
    });

    Alert.alert('Uploaded successfully 🎉');
    setFile(null);
    setTitle('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📂 Upload Resource</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="Department"
        value={department}
        onChangeText={setDepartment}
      />
      <TextInput
        style={styles.input}
        placeholder="Year"
        value={year}
        onChangeText={setYear}
      />
      <TouchableOpacity style={styles.button} onPress={pickFile}>
        <Text style={styles.buttonText}>Pick File</Text>
      </TouchableOpacity>
      {file && <Text>Selected: {file.name}</Text>}
      <TouchableOpacity style={styles.button} onPress={upload}>
        <Text style={styles.buttonText}>Upload</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default UploadResourceScreen;