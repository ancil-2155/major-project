/**
 * resultService.ts
 * Firebase service for teacher result management.
 */
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface StudentResult {
  studentId: string;
  studentName: string;
  rollNo?: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  grade?: string;
  remarks?: string;
  updatedAt?: any;
}

export interface ResultBatch {
  id?: string;
  teacherId: string;
  teacherName: string;
  department: string;
  year: string;
  semester: string;
  subject: string;
  examType: string;
  totalMarks: number;
  status: 'draft' | 'published';
  createdAt?: any;
  updatedAt?: any;
  publishedAt?: any;
}

const gradeFromPercentage = (pct: number): string => {
  if (pct >= 90) return 'O';
  if (pct >= 80) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 60) return 'B+';
  if (pct >= 50) return 'B';
  if (pct >= 40) return 'C';
  return 'F';
};

export const createResultDraft = async (data: Omit<ResultBatch, 'id'>): Promise<string> => {
  const ref = await firestore().collection('results').add({
    ...data,
    status: 'draft',
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
};

export const saveStudentMarks = async (
  resultId: string,
  marks: StudentResult[]
): Promise<void> => {
  const batch = firestore().batch();
  marks.forEach(m => {
    const ref = firestore()
      .collection('results')
      .doc(resultId)
      .collection('students')
      .doc(m.studentId);
    batch.set(ref, {
      ...m,
      percentage: m.totalMarks > 0 ? Math.round((m.marksObtained / m.totalMarks) * 100) : 0,
      grade: gradeFromPercentage(
        m.totalMarks > 0 ? (m.marksObtained / m.totalMarks) * 100 : 0
      ),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();

  await firestore().collection('results').doc(resultId).update({
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const publishResult = async (resultId: string): Promise<void> => {
  await firestore().collection('results').doc(resultId).update({
    status: 'published',
    publishedAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const getTeacherResults = async (teacherUid: string): Promise<ResultBatch[]> => {
  try {
    const snap = await firestore()
      .collection('results')
      .where('teacherId', '==', teacherUid)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ResultBatch));
  } catch {
    return [];
  }
};

export const getStudentPublishedResults = async (studentId: string): Promise<any[]> => {
  try {
    const batches = await firestore()
      .collection('results')
      .where('status', '==', 'published')
      .get();

    const allResults: any[] = [];
    for (const batch of batches.docs) {
      const studentSnap = await batch.ref.collection('students').doc(studentId).get();
      if (studentSnap.exists) {
        allResults.push({
          resultId: batch.id,
          ...batch.data(),
          ...studentSnap.data(),
        });
      }
    }
    return allResults;
  } catch {
    return [];
  }
};
