import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera } from 'react-native-vision-camera-face-detector';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { processLiveFrameToEmbedding } from '../services/face/liveFaceEmbeddingService';
import {
  findBestFaceMatch,
  MATCH_THRESHOLD,
} from '../services/attendance/faceMatchingService';
import {
  getFaceModelDiagnostics,
  loadFaceNetModel,
  FaceModelDiagnostics,
} from '../services/face/faceEmbeddingService';
import { AttendanceRecord } from '../types/attendance';
import { StudentFaceEmbedding, StudentProfile } from '../types/academic';

const PROCESS_INTERVAL_MS = 850;
const MAX_FACES_PER_TICK = 2;
const REQUIRED_CONSECUTIVE_FRAMES = 2;
const MARK_COOLDOWN_MS = 10000;

type DebugState = {
  facesDetected: number;
  modelLoaded: boolean;
  modelPath: string;
  inputShape: string;
  outputShape: string;
  lastModelError: string;
  liveEmbeddingLength: number;
  storedEmbeddingCount: number;
  bestMatchName: string;
  bestScore: number | null;
  threshold: number;
  presentCount: number;
  pendingCount: number;
};

const getFaceBounds = (face: any) => {
  const bounds = face?.bounds || face?.frame || face;
  return {
    x: bounds?.x ?? bounds?.left ?? 0,
    y: bounds?.y ?? bounds?.top ?? 0,
    width: bounds?.width ?? (bounds?.right && bounds?.left ? bounds.right - bounds.left : 0),
    height: bounds?.height ?? (bounds?.bottom && bounds?.top ? bounds.bottom - bounds.top : 0),
  };
};

const getFaceArea = (face: any) => {
  const bounds = getFaceBounds(face);
  return Number(bounds.width || 0) * Number(bounds.height || 0);
};

const TeacherLiveAttendanceScreen = ({ route, navigation }: any) => {
  const {
    filter,
    students = [],
    validEmbeddings = [],
    classConfig,
    teacherId,
    teacherName,
  } = route.params as {
    filter: { department: string; year: string; semester: string; subject: string; section?: string };
    students: StudentProfile[];
    validEmbeddings: StudentFaceEmbedding[];
    classConfig?: any;
    teacherId: string;
    teacherName: string;
  };

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const cameraRef = useRef<any>(null);

  const [presentRecords, setPresentRecords] = useState<Record<string, AttendanceRecord>>({});
  const presentRecordsRef = useRef<Record<string, AttendanceRecord>>({});
  const [lastMessage, setLastMessage] = useState('Loading face recognition model...');
  const [isBusy, setIsBusy] = useState(false);
  const [modelDiagnostics, setModelDiagnostics] =
    useState<FaceModelDiagnostics>(getFaceModelDiagnostics());
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [debug, setDebug] = useState<DebugState>({
    facesDetected: 0,
    modelLoaded: false,
    modelPath: '',
    inputShape: '-',
    outputShape: '-',
    lastModelError: '-',
    liveEmbeddingLength: 0,
    storedEmbeddingCount: validEmbeddings.length,
    bestMatchName: '-',
    bestScore: null,
    threshold: MATCH_THRESHOLD,
    presentCount: 0,
    pendingCount: students.length,
  });

  const lastProcessedAtRef = useRef(0);
  const processingRef = useRef(false);
  const candidateMatchesRef = useRef<Map<string, number>>(new Map());
  const lastMarkedAtByStudentRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    presentRecordsRef.current = presentRecords;
  }, [presentRecords]);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const loadModel = async () => {
    setIsLoadingModel(true);
    setLastMessage('Loading face recognition model...');
    try {
      await loadFaceNetModel();
      const diagnostics = getFaceModelDiagnostics();
      setModelDiagnostics(diagnostics);
      setLastMessage(
        validEmbeddings.length > 0
          ? 'Model ready. Detecting face.'
          : 'No valid embeddings available for this class.'
      );
    } catch (error: any) {
      const diagnostics = getFaceModelDiagnostics();
      setModelDiagnostics(diagnostics);
      setLastMessage('Face recognition model is not ready. Please restart scanning.');
      if (__DEV__) {
        console.error('[FaceAttendance] Model load error:', error);
      }
    } finally {
      setIsLoadingModel(false);
    }
  };

  useEffect(() => {
    loadModel();
  }, []);

  const presentCount = useMemo(() => Object.keys(presentRecords).length, [presentRecords]);
  const pendingCount = useMemo(
    () => Math.max(students.length - presentCount, 0),
    [students.length, presentCount]
  );

  useEffect(() => {
    setDebug(prev => ({
      ...prev,
      modelLoaded: modelDiagnostics.modelLoaded,
      modelPath: modelDiagnostics.modelPath,
      inputShape: JSON.stringify(modelDiagnostics.inputShape || '-'),
      outputShape: JSON.stringify(modelDiagnostics.outputShape || '-'),
      lastModelError: modelDiagnostics.lastModelError || '-',
      storedEmbeddingCount: validEmbeddings.length,
      presentCount,
      pendingCount,
    }));
  }, [modelDiagnostics, pendingCount, presentCount, validEmbeddings.length]);

  const markStudentPresent = (
    student: { studentId: string; studentName: string; rollNo?: string | null },
    score: number
  ) => {
    setPresentRecords(prev => {
      if (prev[student.studentId]) {
        return prev;
      }

      const dateKey = new Date().toISOString().split('T')[0];
      const record: AttendanceRecord = {
        studentId: student.studentId,
        studentName: student.studentName,
        rollNo: student.rollNo || undefined,
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
    if (now - lastProcessedAtRef.current < PROCESS_INTERVAL_MS || processingRef.current) {
      return;
    }

    if (!modelDiagnostics.modelLoaded) {
      setLastMessage('Face recognition model is not ready. Please restart scanning.');
      return;
    }

    if (validEmbeddings.length === 0) {
      setLastMessage('No valid embeddings available for this class.');
      return;
    }

    if (!faces || faces.length === 0) {
      setLastMessage('Detecting face.');
      setDebug(prev => ({ ...prev, facesDetected: 0, bestMatchName: '-', bestScore: null }));
      return;
    }

    lastProcessedAtRef.current = now;
    processingRef.current = true;
    setIsBusy(true);
    setLastMessage('Matching...');
    setDebug(prev => ({ ...prev, facesDetected: faces.length }));

    try {
      if (!cameraRef.current?.takeSnapshot) {
        throw new Error('Camera snapshot capture is unavailable.');
      }

      const image = await cameraRef.current.takeSnapshot();
      const snapshotPath = await image.saveToTemporaryFileAsync('jpg', 85);
      const candidates = [...faces]
        .sort((a, b) => getFaceArea(b) - getFaceArea(a))
        .slice(0, MAX_FACES_PER_TICK);

      const seenStudentsThisTick = new Set<string>();

      for (const face of candidates) {
        const liveEmbedding = await processLiveFrameToEmbedding(snapshotPath, getFaceBounds(face));
        const match = findBestFaceMatch(liveEmbedding, validEmbeddings);
        const bestScore = Number.isFinite(match.score) ? Number(match.score.toFixed(4)) : null;

        setDebug(prev => ({
          ...prev,
          liveEmbeddingLength: liveEmbedding.length,
          bestMatchName: match.studentName || '-',
          bestScore,
        }));

        console.log('[FaceAttendance]', {
          facesDetected: faces.length,
          modelLoaded: modelDiagnostics.modelLoaded,
          liveEmbeddingLength: liveEmbedding.length,
          storedEmbeddingCount: validEmbeddings.length,
          bestMatchName: match.studentName,
          bestScore,
          threshold: MATCH_THRESHOLD,
        });

        if (!match.studentId || !match.matched || match.confidence === 'low') {
          setLastMessage(match.studentId ? 'Low confidence.' : 'Unknown face.');
          continue;
        }

        if (seenStudentsThisTick.has(match.studentId)) {
          continue;
        }
        seenStudentsThisTick.add(match.studentId);

        if (presentRecordsRef.current[match.studentId]) {
          setLastMessage(`${match.studentName} already marked present.`);
          continue;
        }

        const lastMarkedAt = lastMarkedAtByStudentRef.current.get(match.studentId) || 0;
        if (now - lastMarkedAt < MARK_COOLDOWN_MS) {
          continue;
        }

        const count = (candidateMatchesRef.current.get(match.studentId) || 0) + 1;
        candidateMatchesRef.current.set(match.studentId, count);

        if (count >= REQUIRED_CONSECUTIVE_FRAMES) {
          markStudentPresent(
            {
              studentId: match.studentId,
              studentName: match.studentName || 'Unknown Student',
              rollNo: match.rollNo,
            },
            match.score
          );
          lastMarkedAtByStudentRef.current.set(match.studentId, now);
          candidateMatchesRef.current.delete(match.studentId);
          setLastMessage(`Matched: ${match.studentName}`);
        } else {
          setLastMessage(
            `Verifying ${match.studentName} (${count}/${REQUIRED_CONSECUTIVE_FRAMES})`
          );
        }
      }

      Array.from(candidateMatchesRef.current.keys()).forEach(studentId => {
        if (!seenStudentsThisTick.has(studentId)) {
          candidateMatchesRef.current.delete(studentId);
        }
      });
    } catch (error: any) {
      console.error('[FaceAttendance] Live attendance processing error:', error);
      setLastMessage('Processing error. Retrying safely.');
      if (__DEV__) {
        setDebug(prev => ({
          ...prev,
          lastModelError: error instanceof Error ? error.message : String(error),
        }));
      }
    } finally {
      processingRef.current = false;
      setIsBusy(false);
    }
  };

  const navigateToReview = () => {
    navigation.navigate('AttendanceReview', {
      filter,
      classConfig,
      students,
      teacherId,
      teacherName,
      initialRecords: presentRecordsRef.current,
    });
  };

  if (!hasPermission || !device) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Camera permission required to continue.</Text>
      </View>
    );
  }

  const canScan = modelDiagnostics.modelLoaded && validEmbeddings.length > 0;

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={canScan}
        onFacesDetected={processFaces}
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
          {filter.department} - Year {filter.year} {filter.semester ? `- Sem ${filter.semester}` : ''}
        </Text>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Present: {presentCount}</Text>
          <Text style={styles.statLabel}>Pending: {pendingCount}</Text>
        </View>
      </View>

      {!canScan ? (
        <View style={styles.modelCard}>
          <Text style={styles.messageText}>
            {validEmbeddings.length === 0
              ? 'No valid embeddings available for this class.'
              : 'Face recognition model is not ready. Please restart scanning.'}
          </Text>
          {__DEV__ && modelDiagnostics.lastModelError ? (
            <Text style={styles.devErrorText}>{modelDiagnostics.lastModelError}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={loadModel}
            disabled={isLoadingModel}
          >
            {isLoadingModel ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.reviewText}>Retry Model Load</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

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
          <Text style={styles.debugText}>modelLoaded: {String(debug.modelLoaded)}</Text>
          <Text style={styles.debugText}>modelPath: {debug.modelPath}</Text>
          <Text style={styles.debugText}>inputShape: {debug.inputShape}</Text>
          <Text style={styles.debugText}>outputShape: {debug.outputShape}</Text>
          <Text style={styles.debugText}>lastModelError: {debug.lastModelError}</Text>
          <Text style={styles.debugText}>facesDetected: {debug.facesDetected}</Text>
          <Text style={styles.debugText}>liveEmbeddingLength: {debug.liveEmbeddingLength}</Text>
          <Text style={styles.debugText}>storedEmbeddingCount: {debug.storedEmbeddingCount}</Text>
          <Text style={styles.debugText}>bestMatchName: {debug.bestMatchName}</Text>
          <Text style={styles.debugText}>bestScore: {debug.bestScore ?? '-'}</Text>
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
  modelCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 160,
    borderRadius: 16,
    backgroundColor: 'rgba(127,29,29,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(252,165,165,0.45)',
    padding: 14,
  },
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
  devErrorText: {
    color: '#FECACA',
    fontSize: 11,
    marginBottom: 12,
    textAlign: 'center',
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
