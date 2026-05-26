import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { AttendanceSession, AttendanceRecord } from '../../types/attendance';
import { ClassFilter } from '../../types/teacher';

// Creates a new attendance session when the teacher starts scanning.
export const createAttendanceSession = async (
  teacherId: string,
  teacherName: string,
  filter: ClassFilter,
  totalStudents: number
): Promise<string> => {
  try {
    const sessionRef = firestore().collection('attendanceSessions').doc();
    const sessionId = sessionRef.id;

    const newSession: Omit<AttendanceSession, 'sessionId'> = {
      teacherId,
      teacherName,
      department: filter.department,
      year: filter.year,
      semester: filter.semester,
      subject: filter.subject,
      section: filter.section,
      startedAt: firestore.FieldValue.serverTimestamp() as any,
      submittedAt: null,
      status: 'active',
      totalStudents,
      totalPresent: 0,
      totalAbsent: totalStudents,
    };

    await sessionRef.set({
      sessionId,
      ...newSession,
    });

    return sessionId;
  } catch (error) {
    console.error('Error creating attendance session:', error);
    throw error;
  }
};

// Submits the finalized attendance records using a Firestore batch write to guarantee consistency.
export const submitAttendanceSession = async (
  sessionId: string,
  sessionData: Partial<AttendanceSession>,
  records: AttendanceRecord[]
): Promise<void> => {
  try {
    const db = firestore();
    const batch = db.batch();

    // 1. Update the session document
    const sessionRef = db.collection('attendanceSessions').doc(sessionId);
    batch.update(sessionRef, {
      ...sessionData,
      status: 'submitted',
      submittedAt: firestore.FieldValue.serverTimestamp(),
    });

    // 2. Write each attendance record to the subcollection
    // Using studentId as the doc ID ensures no duplicate records for the same student in this session.
    records.forEach(record => {
      const recordRef = sessionRef.collection('records').doc(record.studentId);
      const recordData = {
        ...record,
        createdAt: record.createdAt instanceof Date ? record.createdAt : firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };
      batch.set(recordRef, recordData, { merge: true });
    });

    // 3. (Optional) Write summary records to the general 'attendance' collection
    // This allows parents/students to easily query their attendance by date/subject without traversing sessions.
    const dateKey = new Date().toISOString().split('T')[0];
    
    records.forEach(record => {
      const summaryRef = db.collection('attendance').doc(`${sessionId}_${record.studentId}`);
      batch.set(summaryRef, {
        sessionId,
        studentId: record.studentId,
        studentName: record.studentName,
        rollNo: record.rollNo || '',
        teacherId: sessionData.teacherId,
        department: record.department,
        year: record.year,
        semester: record.semester,
        subject: record.subject,
        dateKey,
        status: record.status,
        method: record.method,
        matchScore: record.matchScore || null,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    });

    // Commit the batch
    await batch.commit();

  } catch (error) {
    console.error('Error submitting attendance session:', error);
    throw error;
  }
};
