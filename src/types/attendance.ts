import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type AttendanceSessionStatus = 'draft' | 'submitted' | 'cancelled' | 'active';
export type AttendanceRecordStatus = 'present' | 'absent';
export type AttendanceMethod = 'face_auto' | 'manual';

export interface AttendanceSession {
  sessionId: string;
  teacherId: string;
  teacherName: string;
  department: string;
  year: string;
  semester: string;
  subject: string;
  section?: string;
  educationLevel?: 'school' | 'btech' | 'college';
  departmentCode?: string | null;
  classLevel?: string | null;
  yearNumber?: number | null;
  semesterNumber?: number | null;
  date?: string;
  startedAt: FirebaseFirestoreTypes.Timestamp | Date;
  createdAt?: FirebaseFirestoreTypes.Timestamp | Date;
  updatedAt?: FirebaseFirestoreTypes.Timestamp | Date;
  submittedAt: FirebaseFirestoreTypes.Timestamp | Date | null;
  status: AttendanceSessionStatus;
  totalStudents: number;
  presentCount?: number;
  absentCount?: number;
  totalPresent: number;
  totalAbsent: number;
}

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  rollNo?: string;
  department: string;
  year: string;
  semester: string;
  subject: string;
  date: string;
  status: AttendanceRecordStatus;
  matchScore?: number | null;
  markedBy: string;
  teacherName?: string;
  method: AttendanceMethod;
  markedAt?: FirebaseFirestoreTypes.Timestamp | Date;
  createdAt?: FirebaseFirestoreTypes.Timestamp | Date;
  updatedAt?: FirebaseFirestoreTypes.Timestamp | Date;
}

export interface AttendanceSummary {
  sessionId: string;
  studentId: string;
  studentName: string;
  rollNo?: string;
  teacherId: string;
  department: string;
  year: string;
  semester: string;
  subject: string;
  dateKey: string; // "YYYY-MM-DD"
  status: 'Present' | 'Absent';
  method: AttendanceMethod;
  matchScore?: number;
  createdAt: FirebaseFirestoreTypes.Timestamp | Date;
}

export interface MatchResult {
  studentId: string;
  studentName: string;
  rollNo?: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
}
