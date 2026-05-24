import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Camera, useCameraDevice, useCameraFormat, useCameraPermission } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';

import { FaceCaptureStep, FaceData, FaceValidationResult } from '../../types/face';
import { validateFace } from '../../services/face/faceQualityService';
import { generateFaceEmbedding, averageEmbeddings } from '../../services/face/faceEmbeddingService';
import { signUpStudent } from '../../services/firebase/authService';
import { saveUserRecord, saveFaceEmbeddings } from '../../services/firebase/userService';
import { uploadProfilePhoto } from '../../services/firebase/storageService';
import { User, FaceEmbeddingsDoc } from '../../types/user';

const FaceEnrollmentScreen = ({ route, navigation }: any) => {
  const { userData } = route.params;

  const [step, setStep] = useState<FaceCaptureStep>('front');
  const [validationMessage, setValidationMessage] = useState('Position your face inside the oval');
  const [isValid, setIsValid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [frontEmbedding, setFrontEmbedding] = useState<number[]>([]);
  const [leftEmbedding, setLeftEmbedding] = useState<number[]>([]);
  const [rightEmbedding, setRightEmbedding] = useState<number[]>([]);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  // Use the face detector from vision-camera-face-detector
  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    contourMode: 'none',
    landmarkMode: 'none',
    classificationMode: 'none',
  });

  // A JS worklet to handle the validation message state from the UI thread
  const setValidationState = Worklets.createRunOnJS((valid: boolean, message: string) => {
    setIsValid(valid);
    setValidationMessage(message);
  });

  // TODO: Implement actual frame processor
  // The frame processor needs to run on the UI thread and detect faces.
  // We'll mock the frame processor validation here since vision camera frame processors 
  // require specific native setups to compile properly.
  /*
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const faces = detectFaces(frame);
    // validateFace would normally be a worklet too, but we keep it simple
    // setValidationState(valid, msg);
  }, [detectFaces, step]);
  */

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    
    setIsProcessing(true);
    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'speed',
        enableShutterSound: false,
      });

      // TODO: Here we should crop the photo based on face bounds and convert to Uint8Array.
      // For now, we'll mock the embedding generation with a dummy array since we don't 
      // have the cropping library (react-native-fs/image-resizer) set up yet.
      console.log('Photo captured at:', photo.path);
      const dummyEmbedding = Array.from({length: 128}, () => Math.random());

      if (step === 'front') {
        setFrontImage(photo.path);
        setFrontEmbedding(dummyEmbedding);
        setStep('left');
        setValidationMessage('Turn your face to the left');
      } else if (step === 'left') {
        setLeftEmbedding(dummyEmbedding);
        setStep('right');
        setValidationMessage('Turn your face to the right');
      } else if (step === 'right') {
        setRightEmbedding(dummyEmbedding);
        await finalizeEnrollment(frontImage!, frontEmbedding, leftEmbedding, dummyEmbedding);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizeEnrollment = async (
    localFrontPhoto: string,
    frontEmb: number[],
    leftEmb: number[],
    rightEmb: number[]
  ) => {
    try {
      // 1. Create Auth User
      const firebaseUser = await signUpStudent(userData.email, userData.password);

      // 2. Upload Profile Photo
      const photoUrl = await uploadProfilePhoto(firebaseUser.uid, localFrontPhoto);

      // 3. Average Embeddings
      const finalEmbedding = averageEmbeddings([frontEmb, leftEmb, rightEmb]);

      // 4. Save to Firestore (Isolated)
      const faceEmbeddingsData: Omit<FaceEmbeddingsDoc, 'uid' | 'createdAt' | 'updatedAt'> = {
        embedding: finalEmbedding,
        frontEmbedding: frontEmb,
        leftEmbedding: leftEmb,
        rightEmbedding: rightEmb,
        modelName: 'facenet',
        modelVersion: 'v1',
        qualityScore: 0.95, // mock score
      };

      await saveFaceEmbeddings(firebaseUser.uid, faceEmbeddingsData);

      const userDoc: User = {
        uid: firebaseUser.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        year: userData.year,
        profilePhotoUrl: photoUrl,
        faceEnrollmentStatus: true,
      };

      await saveUserRecord(userDoc);

      Alert.alert('Success', 'Enrollment completed!');
      // Navigate to Home or Login
      navigation.replace('Login');

    } catch (error: any) {
      console.error(error);
      Alert.alert('Enrollment Error', error.message);
    }
  };

  if (!hasPermission || !device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission denied or no camera found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!isProcessing}
        photo={true}
        // frameProcessor={frameProcessor}
      />

      {/* Oval Overlay */}
      <View style={styles.overlay}>
        <View style={styles.ovalMask} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Face Enrollment</Text>
        <Text style={styles.subtitle}>
          Step {step === 'front' ? 1 : step === 'left' ? 2 : 3} of 3: {step.toUpperCase()}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.validationText, isValid ? styles.textSuccess : styles.textError]}>
          {validationMessage}
        </Text>

        <TouchableOpacity 
          style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.captureText}>Capture {step}</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.consentText}>
          Your face data will be used only for attendance verification. 
          Your front face image will be used as your profile photo. 
          Face embeddings are stored securely for recognition.
        </Text>
      </View>
    </View>
  );
};

export default FaceEnrollmentScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ovalMask: {
    width: 250,
    height: 350,
    borderRadius: 150,
    borderWidth: 4,
    borderColor: '#667eea',
    backgroundColor: 'transparent',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#E0E7FF', marginTop: 4 },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 20,
  },
  validationText: { fontSize: 16, fontWeight: '600', marginBottom: 20, textAlign: 'center' },
  textError: { color: '#FCA5A5' },
  textSuccess: { color: '#6EE7B7' },
  captureButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  captureButtonDisabled: { backgroundColor: '#4B5563' },
  captureText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  consentText: { color: '#9CA3AF', fontSize: 10, textAlign: 'center', marginTop: 20 },
  text: { color: '#fff', textAlign: 'center', marginTop: 50 },
});
