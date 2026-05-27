import firestore from '@react-native-firebase/firestore';
import { AssignmentSubmission, docToSubmission } from '../../types/assignment';
import { LocalUploadFile } from '../../types/cloudinary';
import { uploadLocalFileToCloudinary } from '../cloudinary/cloudinaryUploadService';

export const submitAssignment = async (
  assignmentId: string,
  studentId: string,
  data: {
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
    isLate: boolean;
  },
): Promise<void> => {
  const now = firestore.FieldValue.serverTimestamp();

  const cleanData: Record<string, any> = {
    submissionId: studentId,
    assignmentId,
    studentId,
    studentName: data.studentName,
    status: data.isLate ? 'late' : 'submitted',
    submittedAt: now,
    updatedAt: now,
  };

  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'isLate' && value !== undefined) {
      cleanData[key] = value;
    }
  });

  await firestore()
    .collection('assignments')
    .doc(assignmentId)
    .collection('submissions')
    .doc(studentId)
    .set(cleanData, { merge: true });
};

export const getMySubmission = async (
  assignmentId: string,
  studentId: string,
): Promise<AssignmentSubmission | null> => {
  const doc = await firestore()
    .collection('assignments')
    .doc(assignmentId)
    .collection('submissions')
    .doc(studentId)
    .get();

  if (!doc.exists) {
    return null;
  }
  return docToSubmission(doc);
};

export const getAllSubmissions = async (
  assignmentId: string,
): Promise<AssignmentSubmission[]> => {
  const snapshot = await firestore()
    .collection('assignments')
    .doc(assignmentId)
    .collection('submissions')
    .orderBy('submittedAt', 'desc')
    .get();

  return snapshot.docs.map(docToSubmission);
};

export const reviewSubmission = async (
  assignmentId: string,
  studentId: string,
  review: {
    marksObtained?: number;
    feedback?: string;
    reviewedBy: string;
    status: 'reviewed' | 'resubmit_required';
  },
): Promise<void> => {
  const cleanReview: Record<string, any> = {
    status: review.status,
    reviewedBy: review.reviewedBy,
    reviewedAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  if (review.marksObtained !== undefined && review.marksObtained !== null) {
    cleanReview.marksObtained = review.marksObtained;
  }
  if (review.feedback) {
    cleanReview.feedback = review.feedback;
  }

  await firestore()
    .collection('assignments')
    .doc(assignmentId)
    .collection('submissions')
    .doc(studentId)
    .update(cleanReview);
};

export const uploadSubmissionFile = async (
  assignmentId: string,
  studentId: string,
  file: LocalUploadFile,
): Promise<{
  fileUrl: string;
  filePublicId: string;
  fileResourceType: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  cloudinaryFormat: string;
  originalFilename: string;
  width?: number;
  height?: number;
  duration?: number;
}> => {
  const uploaded = await uploadLocalFileToCloudinary(file, {
    folder: `acams/assignments/${assignmentId}/submissions/${studentId}`,
    preferredResourceType: 'auto',
    useSignedUpload: false,
  });

  return {
    fileUrl: uploaded.cloudinarySecureUrl,
    filePublicId: uploaded.cloudinaryPublicId,
    fileResourceType: uploaded.cloudinaryResourceType,
    filePath: uploaded.cloudinaryPublicId,
    fileName: file.name,
    fileType: file.mimeType,
    fileSize: uploaded.bytes || file.sizeBytes || 0,
    cloudinaryFormat: uploaded.cloudinaryFormat,
    originalFilename: uploaded.originalFilename,
    width: uploaded.width,
    height: uploaded.height,
    duration: uploaded.duration,
  };
};

export const getSubmissionCount = async (assignmentId: string): Promise<number> => {
  const snapshot = await firestore()
    .collection('assignments')
    .doc(assignmentId)
    .collection('submissions')
    .get();
  return snapshot.size;
};
