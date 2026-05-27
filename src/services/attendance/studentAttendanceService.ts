import firestore from '@react-native-firebase/firestore';

export type StudentAttendanceRecordView = {
  sessionId: string;
  studentId: string;
  studentName: string;
  rollNo?: string;
  status: 'present' | 'absent';
  subject: string;
  teacherName: string;
  markedBy: string;
  method: 'face_auto' | 'manual';
  matchScore: number | null;
  date: string;
  markedAtMs: number;
  department?: string;
  year?: string;
  semester?: string;
};

export type SubjectAttendanceSummary = {
  subject: string;
  teacherName: string;
  total: number;
  present: number;
  absent: number;
  percentage: number;
  records: StudentAttendanceRecordView[];
};

export type StudentAttendanceSummary = {
  overallPercentage: number;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  subjects: SubjectAttendanceSummary[];
  records: StudentAttendanceRecordView[];
};

const isIndexError = (error: any) =>
  error?.code === 'firestore/failed-precondition' ||
  String(error?.message || '').toLowerCase().includes('requires an index');

const toDateKey = (value: any): string => {
  if (typeof value === 'string' && value.length >= 10) {
    return value.slice(0, 10);
  }
  if (value?.toDate) {
    const date = value.toDate();
    return date.toISOString().split('T')[0];
  }
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};

const toMillis = (value: any): number => {
  if (value?.toMillis) {
    return value.toMillis();
  }
  if (value?.toDate) {
    return value.toDate().getTime();
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'number') {
    return value;
  }
  return Date.now();
};

const normalizeStatus = (value: any): 'present' | 'absent' => {
  const status = String(value || '').toLowerCase();
  return status === 'present' ? 'present' : 'absent';
};

const normalizeMethod = (value: any): 'face_auto' | 'manual' => {
  const method = String(value || '').toLowerCase();
  return method === 'face_auto' ? 'face_auto' : 'manual';
};

const normalizeRecord = (
  sessionId: string,
  recordData: any,
  sessionData?: any,
): StudentAttendanceRecordView => {
  const markedAt = recordData?.markedAt ?? recordData?.updatedAt ?? sessionData?.submittedAt ?? sessionData?.startedAt;
  const subject = String(recordData?.subject || sessionData?.subject || 'Unknown Subject');
  const teacherName = String(recordData?.teacherName || sessionData?.teacherName || 'Teacher');
  const markedBy = String(recordData?.markedBy || sessionData?.teacherId || '');
  const date = toDateKey(recordData?.date || sessionData?.dateKey || markedAt);

  return {
    sessionId,
    studentId: String(recordData?.studentId || ''),
    studentName: String(recordData?.studentName || 'Student'),
    rollNo: recordData?.rollNo ? String(recordData.rollNo) : undefined,
    status: normalizeStatus(recordData?.status),
    subject,
    teacherName,
    markedBy,
    method: normalizeMethod(recordData?.method),
    matchScore:
      recordData?.matchScore === undefined || recordData?.matchScore === null
        ? null
        : Number(recordData.matchScore),
    date,
    markedAtMs: toMillis(markedAt),
    department: recordData?.department || sessionData?.department || undefined,
    year: recordData?.year || sessionData?.year || undefined,
    semester: recordData?.semester || sessionData?.semester || undefined,
  };
};

const fallbackFromSessions = async (studentId: string): Promise<StudentAttendanceRecordView[]> => {
  const sessionsSnap = await firestore()
    .collection('attendanceSessions')
    .orderBy('startedAt', 'desc')
    .limit(80)
    .get();

  const results: StudentAttendanceRecordView[] = [];
  for (const sessionDoc of sessionsSnap.docs) {
    const sessionData = sessionDoc.data() || {};
    const recordDoc = await sessionDoc.ref.collection('records').doc(studentId).get();
    if (!recordDoc.exists) {
      continue;
    }
    const recordData = recordDoc.data() || {};
    results.push(normalizeRecord(sessionDoc.id, recordData, sessionData));
  }
  return results;
};

export const loadStudentAttendanceSummary = async (
  studentId: string,
): Promise<StudentAttendanceSummary> => {
  let records: StudentAttendanceRecordView[] = [];

  try {
    const snap = await firestore()
      .collectionGroup('records')
      .where('studentId', '==', studentId)
      .limit(300)
      .get();

    records = snap.docs.map(doc => {
      const sessionDoc = doc.ref.parent.parent;
      const sessionId = sessionDoc?.id || 'unknown-session';
      const data = doc.data() || {};
      return normalizeRecord(sessionId, data);
    });
  } catch (error) {
    if (!isIndexError(error)) {
      throw error;
    }
    records = await fallbackFromSessions(studentId);
  }

  records.sort((a, b) => b.markedAtMs - a.markedAtMs);

  const totalClasses = records.length;
  const presentCount = records.filter(item => item.status === 'present').length;
  const absentCount = totalClasses - presentCount;
  const overallPercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

  const grouped = new Map<string, SubjectAttendanceSummary>();
  records.forEach(record => {
    const key = record.subject.trim() || 'Unknown Subject';
    const current = grouped.get(key) || {
      subject: key,
      teacherName: record.teacherName || 'Teacher',
      total: 0,
      present: 0,
      absent: 0,
      percentage: 0,
      records: [],
    };
    current.total += 1;
    if (record.status === 'present') {
      current.present += 1;
    } else {
      current.absent += 1;
    }
    current.records.push(record);
    current.percentage = current.total > 0 ? Math.round((current.present / current.total) * 100) : 0;
    grouped.set(key, current);
  });

  const subjects = Array.from(grouped.values()).sort((a, b) => b.percentage - a.percentage);

  return {
    overallPercentage,
    totalClasses,
    presentCount,
    absentCount,
    subjects,
    records,
  };
};

