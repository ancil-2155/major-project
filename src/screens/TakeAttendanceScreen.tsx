import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets';
import firestore from '@react-native-firebase/firestore';

import { findClosestMatch, StudentFaceData } from '../services/face/attendanceMatcherService';
import { generateFaceEmbedding } from '../services/face/faceEmbeddingService';

const TakeAttendanceScreen = ({ route, navigation }: any) => {
  const { filters } = route.params;
  const { department, year, semester, subject } = filters;

  const [isLoadingDB, setIsLoadingDB] = useState(true);
  const [studentDatabase, setStudentDatabase] = useState<StudentFaceData[]>([]);
  const [markedPresent, setMarkedPresent] = useState<Record<string, boolean>>({});
  const [lastMatchText, setLastMatchText] = useState('Scanning...');

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  useEffect(() => {
    loadClassEmbeddings();
  }, []);

  const loadClassEmbeddings = async () => {
    setIsLoadingDB(true);
    try {
      // 1. Fetch users matching the class criteria
      const usersSnap = await firestore()
        .collection('users')
        .where('department', '==', department)
        .where('year', '==', year)
        .where('role', '==', 'student')
        .get();

      if (usersSnap.empty) {
        Alert.alert('No Students', 'No students found for this class setup.');
        setIsLoadingDB(false);
        return;
      }

      const classUids: string[] = [];
      const userMap: Record<string, any> = {};

      usersSnap.docs.forEach(doc => {
        classUids.push(doc.id);
        userMap[doc.id] = { id: doc.id, ...doc.data() };
      });

      // 2. Fetch their embeddings
      // Note: Firestore 'in' queries are limited to 10 items.
      // For a real production app with >10 students, we would chunk the query array,
      // or we duplicate 'department' and 'year' fields inside 'faceEmbeddings' to query directly.
      // For this implementation, we will chunk the array.
      
      const chunks = [];
      for (let i = 0; i < classUids.length; i += 10) {
        chunks.push(classUids.slice(i, i + 10));
      }

      const dbData: StudentFaceData[] = [];

      for (const chunk of chunks) {
        const directDocs = await Promise.all(
          chunk.map(uid => firestore().collection('faceEmbeddings').doc(uid).get())
        );

        const foundIds = new Set<string>();
        directDocs.forEach(doc => {
          if (!doc.exists) return;
          const embData = doc.data() || {};
          const uid = embData.studentId || doc.id;
          if (userMap[uid] && Array.isArray(embData.embedding) && embData.embedding.length === 128) {
            foundIds.add(uid);
            dbData.push({
              uid,
              name: userMap[uid].name,
              rollNo: userMap[uid].rollNo,
              embedding: embData.embedding,
            });
          }
        });

        const missingIds = chunk.filter(uid => !foundIds.has(uid));
        for (const uid of missingIds) {
          const fallbackSnap = await firestore()
            .collection('faceEmbeddings')
            .where('studentId', '==', uid)
            .limit(1)
            .get();
          if (fallbackSnap.empty) continue;
          const embData = fallbackSnap.docs[0].data() || {};
          if (Array.isArray(embData.embedding) && embData.embedding.length === 128) {
            dbData.push({
              uid,
              name: userMap[uid].name,
              rollNo: userMap[uid].rollNo,
              embedding: embData.embedding,
            });
          }
        }
      }

      setStudentDatabase(dbData);
      console.log(`Loaded ${dbData.length} face profiles for scanning.`);

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to load class data.');
    } finally {
      setIsLoadingDB(false);
    }
  };

  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    contourMode: 'none',
    landmarkMode: 'none',
    classificationMode: 'none',
  });

  // Debouncing setup: Prevent multiple UI updates per second
  const lastProcessTime = useRef(0);

  // We mock the frame processor extraction due to native plugin requirements.
  // In a real Vision Camera setup:
  /*
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const now = Date.now();
    if (now - lastProcessTime.current < 1000) return; // Process max 1 frame per second
    lastProcessTime.current = now;

    const faces = detectFaces(frame);
    if (faces && faces.length > 0) {
      // Crop frame using Worklet plugin or ImageResizer, get Uint8Array buffer
      // runOnJS(processLiveFace)(buffer);
    }
  }, [detectFaces]);
  */

  // Simulated live face processing for architecture completeness
  const processLiveFace = async (imageBuffer: Uint8Array) => {
    try {
      // 1. Generate live embedding
      const liveEmbedding = await generateFaceEmbedding(imageBuffer);

      // 2. Find closest match
      const match = findClosestMatch(liveEmbedding, studentDatabase);

      if (match.matched && match.student) {
        const uid = match.student.uid;

        // 3. Prevent duplicate attendance in the same session
        if (markedPresent[uid]) {
          setLastMatchText(`${match.student.name} already marked present`);
          return;
        }

        // 4. Mark present in Firestore
        await markStudentPresent(match.student);
        
        // 5. Update local state
        setMarkedPresent(prev => ({ ...prev, [uid]: true }));
        setLastMatchText(`✅ ${match.student.name} - Present`);
      } else {
        setLastMatchText('Face not recognized');
      }

    } catch (e) {
      console.error(e);
    }
  };

  const markStudentPresent = async (student: StudentFaceData) => {
    try {
      await firestore().collection('attendance').add({
        studentId: student.uid,
        studentName: student.name,
        rollNo: student.rollNo || '',
        department,
        year,
        semester,
        subject,
        date: firestore.FieldValue.serverTimestamp(),
        status: 'Present'
      });
    } catch (err) {
      console.error('Failed to save attendance', err);
    }
  };

  if (isLoadingDB) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Downloading class face profiles...</Text>
      </View>
    );
  }

  if (!hasPermission || !device) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>No camera access</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        // frameProcessor={frameProcessor} 
      />

      {/* Target Overlay */}
      <View style={styles.overlay}>
        <View style={styles.scannerBox} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Live Scanner</Text>
        <Text style={styles.subtitle}>{subject} - {department} Year {year}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.statusText}>{lastMatchText}</Text>
        <Text style={styles.countText}>Total Present: {Object.keys(markedPresent).length}</Text>
        
        <TouchableOpacity style={styles.stopButton} onPress={() => navigation.goBack()}>
          <Text style={styles.stopText}>Stop Scanning</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TakeAttendanceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 16 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', textShadowColor: '#000', textShadowRadius: 4 },
  subtitle: { fontSize: 16, color: '#10B981', marginTop: 4, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderRadius: 20,
  },
  statusText: { fontSize: 20, fontWeight: 'bold', color: '#10B981', marginBottom: 8, textAlign: 'center' },
  countText: { color: '#D1FAE5', fontSize: 16, marginBottom: 20 },
  stopButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  stopText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
