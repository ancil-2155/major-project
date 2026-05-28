import firestore from '@react-native-firebase/firestore';
import { AttendanceSession, AttendanceRecord } from '../../types/attendance';
import { ClassFilter } from '../../types/teacher';

// Creates a new attendance session when the teacher starts scanning.
export const createAttendanceSession = async (
  teacherId: string,
  teacherName: string,
  filter: ClassFilter,
  totalStudents: number,
  classConfig?: any
): Promise<string> => {
  try {
    const sessionRef = firestore().collection('attendanceSessions').doc();
    const sessionId = sessionRef.id;

    const date = new Date().toISOString().split('T')[0];
    const newSession: Partial<AttendanceSession> = {
      teacherId,
      teacherName,
      educationLevel: classConfig?.educationLevel || 'btech',
      departmentCode: classConfig?.departmentCode || filter.department || null,
      department: filter.department,
      year: filter.year,
      semester: filter.semester,
      yearNumber: classConfig?.yearNumber || null,
      semesterNumber: classConfig?.semesterNumber || null,
      classLevel: classConfig?.classLevel || null,
      subject: filter.subject,
      section: filter.section,
      date,
      startedAt: firestore.FieldValue.serverTimestamp() as any,
      createdAt: firestore.FieldValue.serverTimestamp() as any,
      submittedAt: null,
      updatedAt: firestore.FieldValue.serverTimestamp() as any,
      status: 'draft',
      totalStudents,
      totalPresent: 0,
      totalAbsent: totalStudents,
      presentCount: 0,
      absentCount: totalStudents,
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
      presentCount: sessionData.totalPresent,
      absentCount: sessionData.totalAbsent,
      submittedAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // 2. Write each attendance record to the subcollection
    // Using studentId as the doc ID ensures no duplicate records for the same student in this session.
    records.forEach(record => {
      const recordRef = sessionRef.collection('records').doc(record.studentId);
      const normalizedDate = record.date || new Date().toISOString().split('T')[0];
      const recordData = {
        studentId: record.studentId,
        studentName: record.studentName,
        rollNo: record.rollNo || '',
        department: record.department,
        year: record.year,
        semester: record.semester,
        subject: record.subject,
        date: normalizedDate,
        status: record.status,
        markedBy: record.markedBy,
        teacherName: record.teacherName || sessionData.teacherName || '',
        method: record.method,
        matchScore: record.matchScore ?? null,
        markedAt:
          record.status === 'present'
            ? firestore.FieldValue.serverTimestamp()
            : null,
        createdAt:
          record.createdAt instanceof Date
            ? record.createdAt
            : firestore.FieldValue.serverTimestamp(),
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
        teacherName: record.teacherName || sessionData.teacherName || '',
        date: record.date || dateKey,
        matchScore: record.matchScore ?? null,
        markedAt: firestore.FieldValue.serverTimestamp(),
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
