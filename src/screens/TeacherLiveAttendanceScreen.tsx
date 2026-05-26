import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { processLiveFrameToEmbedding } from '../services/face/liveFaceEmbeddingService';
import { findBestMatch, ClassStudent } from '../services/attendance/faceMatchingService';
import { AttendanceRecord } from '../types/attendance';

const TeacherLiveAttendanceScreen = ({ route, navigation }: any) => {
  const { filter, students, teacherId, teacherName } = route.params;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const cameraRef = useRef<Camera>(null);

  // Attendance State
  const [markedRecords, setMarkedRecords] = useState<Record<string, AttendanceRecord>>({});
  const [lastMessage, setLastMessage] = useState('Scanning... Place student face inside the box.');
  
  // Safety Rules State
  const consecutiveMatches = useRef<Record<string, number>>({});
  const cooldownEnd = useRef<number>(0);
  const REQUIRED_CONSECUTIVE_FRAMES = 3;
  const COOLDOWN_MS = 5000; // 5 seconds

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    contourMode: 'none',
    landmarkMode: 'none',
    classificationMode: 'none',
  });

  // Simulated live face processing triggered periodically for this implementation
  // In a fully configured native app, this would be invoked directly by the frameProcessor worklet.
  useEffect(() => {
    const mockFrameInterval = setInterval(() => {
      // If we are in cooldown, don't process
      if (Date.now() < cooldownEnd.current) return;
      
      // We pass null buffers here as a mock. liveFaceEmbeddingService handles it.
      processLiveFace(new Uint8Array(0));
    }, 1000);

    return () => clearInterval(mockFrameInterval);
  }, [markedRecords]);

  const processLiveFace = async (frameBuffer: Uint8Array) => {
    try {
      setLastMessage('Face detected. Matching...');

      // 1. Generate live embedding
      const liveEmbedding = await processLiveFrameToEmbedding(frameBuffer, null);

      // 2. Find best match in loaded class
      const match = findBestMatch(liveEmbedding, students);

      if (!match) {
        setLastMessage('Unknown face / not enrolled.');
        consecutiveMatches.current = {}; // reset
        return;
      }

      if (match.confidence === 'low') {
        setLastMessage('Low confidence match. Try again.');
        return;
      }

      const uid = match.studentId;

      // 3. Prevent duplicate attendance in the same session
      if (markedRecords[uid]) {
        setLastMessage(`Already marked Present: ${match.studentName}`);
        return;
      }

      // 4. Consecutive frame requirement
      const currentCount = (consecutiveMatches.current[uid] || 0) + 1;
      consecutiveMatches.current[uid] = currentCount;

      if (currentCount >= REQUIRED_CONSECUTIVE_FRAMES) {
        // MATCH CONFIRMED
        const newRecord: AttendanceRecord = {
          studentId: uid,
          studentName: match.studentName,
          rollNo: match.rollNo,
          department: filter.department,
          year: filter.year,
          semester: filter.semester,
          subject: filter.subject,
          status: 'present',
          matchScore: match.score,
          matchedAt: new Date(),
          markedBy: teacherId,
          method: 'face_auto',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setMarkedRecords(prev => ({ ...prev, [uid]: newRecord }));
        setLastMessage(`✅ ${match.studentName} marked Present.`);
        
        // Reset counters and trigger cooldown
        consecutiveMatches.current = {};
        cooldownEnd.current = Date.now() + COOLDOWN_MS;
      } else {
        setLastMessage(`Verifying ${match.studentName}... Hold still (${currentCount}/${REQUIRED_CONSECUTIVE_FRAMES})`);
      }

    } catch (e) {
      console.error('Frame processing error:', e);
      setLastMessage('Processing error. Retrying...');
    }
  };

  const navigateToReview = () => {
    navigation.navigate('AttendanceReview', {
      filter,
      students,
      teacherId,
      teacherName,
      initialRecords: markedRecords,
    });
  };

  if (!hasPermission || !device) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.textError}>Camera permission required.</Text>
      </View>
    );
  }

  const presentCount = Object.keys(markedRecords).length;

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
      />

      {/* Target Overlay */}
      <View style={styles.overlay}>
        <View style={styles.scannerBox} />
      </View>

      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{filter.subject}</Text>
        <Text style={styles.subtitle}>{filter.department} - Year {filter.year}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>Present: {presentCount}</Text>
          <Text style={styles.statText}>Total: {students.length}</Text>
        </View>
      </View>

      {/* Bottom Footer */}
      <View style={styles.footer}>
        <Text style={styles.statusMessage}>{lastMessage}</Text>
        
        <TouchableOpacity style={styles.reviewButton} onPress={navigateToReview}>
          <Text style={styles.reviewText}>Review Attendance ({presentCount})</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.stopButton} onPress={() => navigation.goBack()}>
          <Text style={styles.stopText}>Stop Scanning</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TeacherLiveAttendanceScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  textError: { color: '#EF4444', fontSize: 18, fontWeight: 'bold' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerBox: {
    width: 250,
    height: 350,
    borderWidth: 3,
    borderColor: '#10B981',
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
    borderRadius: 20,
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    borderRadius: 15,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#D1FAE5', marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  statText: { color: '#10B981', fontWeight: 'bold', fontSize: 16 },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 20,
    borderRadius: 20,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  reviewButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
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
