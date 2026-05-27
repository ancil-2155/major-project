import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// ═══════════════════════════════════════════════════
// ASSIGNMENT TYPES
// ═══════════════════════════════════════════════════

export type AssignmentStatus = 'active' | 'closed' | 'draft';
export type SubmissionStatus = 'submitted' | 'late' | 'reviewed' | 'resubmit_required';
export type AssignmentEducationLevel = 'school' | 'btech' | 'college';

export interface Assignment {
  assignmentId: string;
  teacherId: string;
  teacherName: string;

  title: string;
  description: string;
  instructions?: string;

  educationLevel: AssignmentEducationLevel;
  departmentCode?: string;
  department?: string;
  classLevel?: string;
  yearNumber?: number;
  semesterNumber?: number;
  subject: string;

  dueDate: FirebaseFirestoreTypes.Timestamp | Date;
  totalMarks?: number;

  attachmentUrl?: string;
  attachmentPublicId?: string;
  attachmentResourceType?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
  attachmentSize?: number;
  attachmentPath?: string;
  attachmentType?: string;
  cloudinaryPublicId?: string;
  cloudinarySecureUrl?: string;
  cloudinaryResourceType?: string;
  cloudinaryFormat?: string;
  bytes?: number;
  originalFilename?: string;
  width?: number;
  height?: number;
  duration?: number;

  status: AssignmentStatus;

  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface AssignmentSubmission {
  submissionId: string;
  assignmentId: string;

  studentId: string;
  studentName: string;
  rollNo?: string;
  email?: string;

  answerText?: string;
  fileUrl?: string;
  filePublicId?: string;
  fileResourceType?: string;
  filePath?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  cloudinaryFormat?: string;
  originalFilename?: string;
  width?: number;
  height?: number;
  duration?: number;

  submittedAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;

  status: SubmissionStatus;

  marksObtained?: number;
  feedback?: string;
  reviewedBy?: string;
  reviewedAt?: FirebaseFirestoreTypes.Timestamp;
}

// Helper to convert Firestore doc to Assignment
export const docToAssignment = (doc: FirebaseFirestoreTypes.DocumentSnapshot): Assignment => {
  const data = doc.data()!;
  return {
    ...data,
    assignmentId: doc.id,
  } as Assignment;
};

// Helper to convert Firestore doc to AssignmentSubmission
export const docToSubmission = (doc: FirebaseFirestoreTypes.DocumentSnapshot): AssignmentSubmission => {
  const data = doc.data()!;
  return {
    ...data,
    submissionId: doc.id,
  } as AssignmentSubmission;
};
