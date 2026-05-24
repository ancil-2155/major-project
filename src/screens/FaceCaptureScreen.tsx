import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import { launchCamera } from 'react-native-image-picker';

const FaceCaptureScreen = ({ navigation, route }: any) => {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const openCamera = async () => {
    const ok = await requestPermission();

    if (!ok) {
      Alert.alert('Permission denied');
      return;
    }

    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'front',
    });

    if (result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri || null);
    }
  };

  const confirm = () => {
    if (!imageUri) return Alert.alert('Capture image first');

    route.params?.onCapture(imageUri);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Capture Face</Text>

      <TouchableOpacity style={styles.btn} onPress={openCamera}>
        <Text style={styles.text}>Open Camera</Text>
      </TouchableOpacity>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.img} />}

      {imageUri && (
        <TouchableOpacity style={styles.btn} onPress={confirm}>
          <Text style={styles.text}>Use Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default FaceCaptureScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, marginBottom: 20 },
  btn: { backgroundColor: '#2563EB', padding: 12, borderRadius: 8, marginTop: 10 },
  text: { color: '#fff' },
  img: { width: 260, height: 320, borderRadius: 12, marginTop: 20 },
});
