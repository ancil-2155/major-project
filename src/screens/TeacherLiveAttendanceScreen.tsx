import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera } from 'react-native-vision-camera-face-detector';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { processLiveFrameToEmbedding } from '../services/face/liveFaceEmbeddingService';
import { ClassStudent, findBestMatch, MATCH_THRESHOLD } from '../services/attendance/faceMatchingService';
import { AttendanceRecord } from '../types/attendance';

const PROCESS_INTERVAL_MS = 850;
const MAX_FACES_PER_TICK = 2;
const REQUIRED_CONSECUTIVE_FRAMES = 3;

type DebugState = {
  facesDetected: number;
  loadedEmbeddings: number;
  liveEmbeddingLength: number;
  bestMatch: string;
  score: number;
  threshold: number;
  presentCount: number;
  pendingCount: number;
};

const TeacherLiveAttendanceScreen = ({ route, navigation }: any) => {
  const { filter, students, teacherId, teacherName } = route.params as {
    filter: { department: string; year: string; semester: string; subject: string; section?: string };
    students: ClassStudent[];
    teacherId: string;
    teacherName: string;
  };

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const cameraRef = useRef<any>(null);

  const [presentRecords, setPresentRecords] = useState<Record<string, AttendanceRecord>>({});
  const [lastMessage, setLastMessage] = useState('Scanning started. Keep students inside the frame.');
  const [isBusy, setIsBusy] = useState(false);
  const [debug, setDebug] = useState<DebugState>({
    facesDetected: 0,
    loadedEmbeddings: students.length,
    liveEmbeddingLength: 0,
    bestMatch: '-',
    score: 0,
    threshold: MATCH_THRESHOLD,
    presentCount: 0,
    pendingCount: students.length,
  });

  const lastProcessedAtRef = useRef(0);
  const processingRef = useRef(false);
  const consecutiveRef = useRef<Record<string, number>>({});
  const pauseUntilRef = useRef(0);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const presentCount = useMemo(() => Object.keys(presentRecords).length, [presentRecords]);
  const pendingCount = useMemo(() => Math.max(students.length - presentCount, 0), [students.length, presentCount]);

  useEffect(() => {
    setDebug(prev => ({
      ...prev,
      presentCount,
      pendingCount,
      loadedEmbeddings: students.length,
    }));
  }, [presentCount, pendingCount, students.length]);

  const updateFriendlyError = (error: any) => {
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('model')) {
      setLastMessage('Face model is loading or unavailable. Please wait and try again.');
      return;
    }
    if (msg.includes('crop')) {
      setLastMessage('Unable to crop detected face. Ask student to move closer.');
      return;
    }
    if (msg.includes('embedding')) {
      setLastMessage('Embedding generation failed. Retrying safely.');
      return;
    }
    if (msg.includes('firestore')) {
      setLastMessage('Cloud sync issue detected. Attendance is still being tracked locally.');
      return;
    }
    setLastMessage('Processing error. Retrying safely.');
  };

  const markStudentPresent = (
    student: { studentId: string; studentName: string; rollNo?: string },
    score: number,
  ) => {
    setPresentRecords(prev => {
      if (prev[student.studentId]) {
        return prev;
      }

      const dateKey = new Date().toISOString().split('T')[0];
      const record: AttendanceRecord = {
        studentId: student.studentId,
        studentName: student.studentName,
        rollNo: student.rollNo,
        department: filter.department,
        year: filter.year,
        semester: filter.semester,
        subject: filter.subject,
        date: dateKey,
        status: 'present',
        markedBy: teacherId,
        teacherName,
        method: 'face_auto',
        matchScore: score,
        markedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return { ...prev, [student.studentId]: record };
    });
  };

  const processFaces = async (faces: any[]) => {
    const now = Date.now();
    if (now - lastProcessedAtRef.current < PROCESS_INTERVAL_MS) {
      return;
    }
    if (processingRef.current) {
      return;
    }
    if (now < pauseUntilRef.current) {
      return;
    }
    if (!faces || faces.length === 0) {
      setLastMessage('Scanning... Place student face inside the frame.');
      setDebug(prev => ({ ...prev, facesDetected: 0, bestMatch: '-' }));
      return;
    }

    lastProcessedAtRef.current = now;
    processingRef.current = true;
    setIsBusy(true);
    setDebug(prev => ({ ...prev, facesDetected: faces.length }));

    try {
      const candidates = faces.slice(0, MAX_FACES_PER_TICK);
      for (const face of candidates) {
        const liveEmbedding = await processLiveFrameToEmbedding(new Uint8Array(0), face?.bounds || face);
        setDebug(prev => ({ ...prev, liveEmbeddingLength: liveEmbedding.length }));

        const match = findBestMatch(liveEmbedding, students);
        if (!match || match.confidence === 'low') {
          setDebug(prev => ({ ...prev, bestMatch: '-', score: 0 }));
          setLastMessage('Face detected but no confident match yet.');
          continue;
        }

        setDebug(prev => ({
          ...prev,
          bestMatch: match.studentName,
          score: Number(match.score.toFixed(4)),
        }));

        if (presentRecords[match.studentId]) {
          setLastMessage(`${match.studentName} already marked present.`);
          continue;
        }

        const count = (consecutiveRef.current[match.studentId] || 0) + 1;
        consecutiveRef.current[match.studentId] = count;

        if (count >= REQUIRED_CONSECUTIVE_FRAMES) {
          markStudentPresent(
            {
              studentId: match.studentId,
              studentName: match.studentName,
              rollNo: match.rollNo,
            },
            match.score,
          );
          setLastMessage(`Marked present: ${match.studentName}`);
          consecutiveRef.current[match.studentId] = 0;
        } else {
          setLastMessage(`Verifying ${match.studentName} (${count}/${REQUIRED_CONSECUTIVE_FRAMES})`);
        }
      }
    } catch (error: any) {
      console.error('Live attendance processing error:', error);
      pauseUntilRef.current = Date.now() + 1200;
      updateFriendlyError(error);
    } finally {
      processingRef.current = false;
      setIsBusy(false);
    }
  };

  const onFacesDetected = (faces: any[]) => {
    processFaces(faces);
  };

  const navigateToReview = () => {
    navigation.navigate('AttendanceReview', {
      filter,
      students,
      teacherId,
      teacherName,
      initialRecords: presentRecords,
    });
  };

  if (!hasPermission || !device) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Camera permission required to continue.</Text>
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
        onFacesDetected={onFacesDetected}
        onError={(error: any) => {
          console.error('Camera stream error:', error);
          setLastMessage('Camera stream issue detected. Please retry scanning.');
        }}
        performanceMode="fast"
        resizeMode="cover"
      />

      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.scannerBox} />
      </View>

      <View style={styles.headerCard}>
        <Text style={styles.title}>{filter.subject}</Text>
        <Text style={styles.subtitle}>
          {filter.department} • Year {filter.year} {filter.semester ? `• Sem ${filter.semester}` : ''}
        </Text>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Present: {presentCount}</Text>
          <Text style={styles.statLabel}>Pending: {pendingCount}</Text>
        </View>
      </View>

      <View style={styles.footerCard}>
        <Text style={styles.messageText}>{lastMessage}</Text>
        {isBusy ? <ActivityIndicator color="#FFFFFF" style={{ marginBottom: 12 }} /> : null}

        <TouchableOpacity style={styles.reviewButton} onPress={navigateToReview}>
          <Text style={styles.reviewText}>Review Attendance ({presentCount})</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.stopButton} onPress={() => navigation.goBack()}>
          <Text style={styles.stopText}>Stop Scanning</Text>
        </TouchableOpacity>
      </View>

      {__DEV__ ? (
        <View style={styles.debugCard}>
          <Text style={styles.debugText}>facesDetected: {debug.facesDetected}</Text>
          <Text style={styles.debugText}>loadedEmbeddings: {debug.loadedEmbeddings}</Text>
          <Text style={styles.debugText}>liveEmbeddingLength: {debug.liveEmbeddingLength}</Text>
          <Text style={styles.debugText}>bestMatch: {debug.bestMatch}</Text>
          <Text style={styles.debugText}>score: {debug.score}</Text>
          <Text style={styles.debugText}>threshold: {debug.threshold}</Text>
          <Text style={styles.debugText}>presentCount: {debug.presentCount}</Text>
          <Text style={styles.debugText}>pendingCount: {debug.pendingCount}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#FCA5A5', fontSize: 15, fontWeight: '700' },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerBox: {
    width: 240,
    height: 320,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  headerCard: {
    position: 'absolute',
    top: 46,
    left: 16,
    right: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(15,23,42,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    padding: 14,
  },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#CBD5E1', fontSize: 12, marginTop: 4 },
  statsRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { color: '#34D399', fontSize: 13, fontWeight: '700' },
  footerCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 22,
    borderRadius: 16,
    backgroundColor: 'rgba(15,23,42,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    padding: 14,
  },
  messageText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 14,
  },
  reviewButton: {
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 10,
  },
  reviewText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  stopButton: {
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stopText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  debugCard: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 176,
    borderRadius: 10,
    backgroundColor: 'rgba(2,6,23,0.85)',
    padding: 10,
  },
  debugText: {
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 16,
  },
});

export default TeacherLiveAttendanceScreen;
