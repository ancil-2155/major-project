import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera-face-detector';
import firestore from '@react-native-firebase/firestore';

import { signUpStudent, signInStudent } from '../../services/firebase/authService';
import { saveUserRecord, saveFaceEmbeddings } from '../../services/firebase/userService';
import { uploadProfilePhoto } from '../../services/firebase/storageSafeService';
import { averageEmbeddings } from '../../services/face/embeddingMathService';
import {
  generateFaceEmbeddingFromImage,
  getFaceModelDiagnostics,
  loadFaceNetModel,
} from '../../services/face/faceEmbeddingService';

type FaceCaptureStep = 'front' | 'left' | 'right' | 'done';

const STEP_INSTRUCTIONS: Record<FaceCaptureStep, string> = {
  front: 'Look straight at the camera',
  left: 'Turn your head to the LEFT',
  right: 'Turn your head to the RIGHT',
  done: 'All captured! Press Finish to register.',
};

const FaceEnrollmentScreen = ({ route, navigation }: any) => {
  const { userData } = route.params;

  const [step, setStep] = useState<FaceCaptureStep>('front');
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  
  // Real-time UI states for face validation
  const [isValidFace, setIsValidFace] = useState(false);
  const [validationMessage, setValidationMessage] = useState('Position your face inside the oval');

  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [frontEmbedding, setFrontEmbedding] = useState<number[]>([]);
  const [leftEmbedding, setLeftEmbedding] = useState<number[]>([]);
  const [rightEmbedding, setRightEmbedding] = useState<number[]>([]);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const cameraRef = useRef<any>(null);

  // Request camera permission once on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadFaceNetModel()
      .then(() => {
        if (!mounted) return;
        setModelReady(true);
        setModelError(null);
      })
      .catch(error => {
        if (!mounted) return;
        setModelReady(false);
        setModelError(error instanceof Error ? error.message : String(error));
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Handle real-time face detection
  const handleFacesDetected = useCallback(
    (faces: any[]) => {
      if (step === 'done') return;

      if (faces.length === 0) {
        setIsValidFace(false);
        setValidationMessage('No face detected. Position your face in the oval.');
        return;
      }

      if (faces.length > 1) {
        setIsValidFace(false);
        setValidationMessage('Only one person allowed in frame.');
        return;
      }

      const face = faces[0];
      const yaw = face.yawAngle;

      if (step === 'front') {
        if (yaw > -15 && yaw < 15) {
          setIsValidFace(true);
          setValidationMessage('Perfect! Hold still and capture.');
        } else {
          setIsValidFace(false);
          setValidationMessage('Look straight at the camera.');
        }
      } else if (step === 'left') {
        if (yaw < -20) {
          setIsValidFace(true);
          setValidationMessage('Perfect! Hold still and capture.');
        } else {
          setIsValidFace(false);
          setValidationMessage('Turn your head more to the left.');
        }
      } else if (step === 'right') {
        if (yaw > 20) {
          setIsValidFace(true);
          setValidationMessage('Perfect! Hold still and capture.');
        } else {
          setIsValidFace(false);
          setValidationMessage('Turn your head more to the right.');
        }
      }
    },
    [step]
  );

  const handleCapture = async () => {
    if (step === 'done') {
      setIsProcessing(true);
      await finalizeEnrollment();
      setIsProcessing(false);
      return;
    }

    if (!isValidFace) {
      Alert.alert('Invalid Pose', 'Please follow the on-screen instructions before capturing.');
      return;
    }

    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready. Please wait.');
      return;
    }

    setIsProcessing(true);
    try {
      // Use takeSnapshot to avoid multi-stream crash (photoOutput + faceDetector)
      // VisionCamera v5 takeSnapshot returns a Nitro Image, not a PhotoFile with a path
      const image = await cameraRef.current.takeSnapshot();
      const photoPath = await image.saveToTemporaryFileAsync('jpg', 85);
      console.log('Snapshot captured at:', photoPath);

      if (!modelReady) {
        const diagnostics = getFaceModelDiagnostics();
        throw new Error(
          diagnostics.lastModelError || modelError || 'Face recognition model is not ready.'
        );
      }

      const embedding = await generateFaceEmbeddingFromImage(photoPath, null);

      if (step === 'front') {
        setFrontImage(photoPath);
        setFrontEmbedding(embedding);
        setStep('left');
        setIsValidFace(false);
      } else if (step === 'left') {
        setLeftEmbedding(embedding);
        setStep('right');
        setIsValidFace(false);
      } else if (step === 'right') {
        setRightEmbedding(embedding);
        setStep('done');
        setIsValidFace(true);
        setValidationMessage('Face capture complete!');
      }
    } catch (e: any) {
      console.error('Capture error:', e);
      Alert.alert('Capture Error', e.message || 'Failed to take photo. Try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizeEnrollment = async () => {
    try {
      // 1. Firebase Auth — create or recover account
      let firebaseUser;
      try {
        firebaseUser = await signUpStudent(userData.email, userData.password);
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          firebaseUser = await signInStudent(userData.email, userData.password);
        } else {
          throw authError;
        }
      }

      // 2. Upload profile photo (with fallback to local file)
      let photoUrl = '';
      let photoPath = '';
      const localFilePath = frontImage!.startsWith('file://')
        ? frontImage!
        : `file://${frontImage!}`;
        
      try {
        const uploadResult = await uploadProfilePhoto(firebaseUser.uid, localFilePath);
        photoUrl = uploadResult.downloadUrl;
        photoPath = uploadResult.path;
      } catch (uploadError) {
        console.warn('Photo upload skipped or failed:', uploadError);
        // Fallback to local image so you can instantly see it on your dashboard
        photoUrl = localFilePath;
      }

      // 3. Average the 3 embeddings
      const finalEmbedding = averageEmbeddings([
        frontEmbedding,
        leftEmbedding,
        rightEmbedding,
      ]);

      // 4. Save face data to Firestore (NEW REQUIRED STRUCTURE)
      const faceData = {
        studentId: firebaseUser.uid,
        studentName: userData.name || '',
        studentEmail: userData.email || null,
        rollNo: userData.rollNo || null,
        educationLevel: userData.educationLevel || 'btech',
        departmentCode: userData.departmentCode || userData.department || null,
        department: userData.department || userData.departmentCode || null,
        yearNumber: userData.yearNumber || null,
        semesterNumber: userData.semesterNumber || null,
        classLevel: userData.classLevel || userData.className || null,
        
        embedding: finalEmbedding,
        frontEmbedding,
        leftEmbedding,
        rightEmbedding,
        
        modelName: 'facenet',
        modelVersion: 'v1',
        embeddingSize: 128,
        qualityScore: 0.95,
        profilePhotoUrl: photoUrl || null,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };
      await saveFaceEmbeddings(firebaseUser.uid, faceData);

      // 5. Save user profile (NEW REQUIRED STRUCTURE)
      const userDoc: any = {
        uid: firebaseUser.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        departmentCode: userData.departmentCode || userData.department || '',
        year: userData.year,
        yearNumber: userData.yearNumber || null,
        semester: userData.semester || '',
        semesterNumber: userData.semesterNumber || null,
        section: userData.section || '',
        rollNo: userData.rollNo || '',
        educationLevel: userData.educationLevel || 'btech',
        
        profilePhotoUrl: photoUrl,
        profilePhotoPath: photoPath,
        localProfilePhotoUri: localFilePath,
        
        faceEnrollmentStatus: true,
        faceEmbeddingDocId: firebaseUser.uid,
        faceEmbeddingUpdatedAt: firestore.FieldValue.serverTimestamp(),
        faceModelName: 'facenet',
        faceModelVersion: 'v1',
      };
      await saveUserRecord(userDoc);

      Alert.alert(
        '✅ Registration Complete!',
        'Your face has been enrolled successfully. You can now log in.',
        [{ text: 'Go to Login', onPress: () => navigation.replace('Login') }]
      );
    } catch (error: any) {
      console.error('Enrollment error:', error);
      Alert.alert('Enrollment Failed', error.message || 'Something went wrong. Try again.');
    }
  };

  // Step indicator dots
  const steps: FaceCaptureStep[] = ['front', 'left', 'right', 'done'];
  const stepIndex = steps.indexOf(step);

  // ---- RENDER: permission not granted ----
  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.whiteText}>Camera permission required</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---- RENDER: no camera device ----
  if (!device) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#667eea" size="large" />
        <Text style={styles.whiteText}>Loading camera...</Text>
      </View>
    );
  }

  // ---- MAIN RENDER ----
  return (
    <View style={styles.container}>
      {/* Real-time AI Face Detector Camera Preview */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={step !== 'done'}
        onFacesDetected={handleFacesDetected}
        performanceMode="fast"
        resizeMode="cover"
      />

      {/* Oval face guide overlay with dynamic colors */}
      <View style={styles.overlay} pointerEvents="none">
        <View
          style={[
            styles.oval,
            {
              borderColor: step === 'done' ? '#667eea' : isValidFace ? '#10B981' : '#EF4444',
            },
          ]}
        />
      </View>

      {/* Top header */}
      <View style={styles.header}>
        <Text style={styles.title}>Face Enrollment</Text>
        <Text style={styles.subtitle}>{STEP_INSTRUCTIONS[step]}</Text>

        {/* Step dots */}
        <View style={styles.dots}>
          {['front', 'left', 'right'].map((s, i) => (
            <View
              key={s}
              style={[
                styles.dot,
                i < stepIndex ? styles.dotDone : i === stepIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom panel */}
      <View style={styles.footer}>
        <Text
          style={[
            styles.instruction,
            step === 'done' ? { color: '#667eea' } : isValidFace ? { color: '#10B981' } : { color: '#EF4444' },
          ]}
        >
          {!modelReady && step !== 'done'
            ? 'Face model is loading. Please wait.'
            : validationMessage}
        </Text>

        <TouchableOpacity
          style={[
            styles.captureBtn,
            (isProcessing || (!modelReady && step !== 'done') || (!isValidFace && step !== 'done')) && styles.captureBtnDisabled,
          ]}
          onPress={handleCapture}
          disabled={isProcessing || (!modelReady && step !== 'done') || (!isValidFace && step !== 'done')}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.captureBtnText}>
              {step === 'done' ? '✅ Finish Registration' : `📸 Capture ${step.charAt(0).toUpperCase() + step.slice(1)}`}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.consent}>
          Face data is used only for secure attendance verification.
        </Text>
      </View>
    </View>
  );
};

export default FaceEnrollmentScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  whiteText: { color: '#fff', fontSize: 16, textAlign: 'center', paddingHorizontal: 24 },
  btn: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Camera overlay
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  oval: {
    width: 250,
    height: 350,
    borderRadius: 150,
    borderWidth: 4,
    backgroundColor: 'transparent',
  },

  // Header
  header: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E0E7FF',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  dots: { flexDirection: 'row', gap: 10, marginTop: 15 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotDone: { backgroundColor: '#10B981' },
  dotActive: { backgroundColor: '#667eea', transform: [{ scale: 1.3 }] },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.3)' },

  // Footer panel
  footer: {
    position: 'absolute',
    bottom: 36,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  instruction: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  captureBtn: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  captureBtnDisabled: { backgroundColor: '#4B5563' },
  captureBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  consent: { color: '#9CA3AF', fontSize: 10, textAlign: 'center' },
});
