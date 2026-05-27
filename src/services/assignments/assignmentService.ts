import firestore from '@react-native-firebase/firestore';
import { Assignment, AssignmentStatus, docToAssignment } from '../../types/assignment';
import { LocalUploadFile } from '../../types/cloudinary';
import { uploadLocalFileToCloudinary } from '../cloudinary/cloudinaryUploadService';

type TeacherAssignmentFilters = {
  status?: AssignmentStatus | 'all';
  subject?: string;
  classOrDepartment?: string;
  dueFrom?: string;
  dueTo?: string;
};

const isIndexError = (error: any) =>
  error?.code === 'firestore/failed-precondition' ||
  String(error?.message || '').toLowerCase().includes('requires an index');

const getDateKeyFromAssignment = (assignment: Assignment): string => {
  const dueDateValue: any = assignment.dueDate;
  const dueDate = dueDateValue?.toDate ? dueDateValue.toDate() : new Date(dueDateValue);
  return dueDate.toISOString().split('T')[0];
};

const matchesTeacherFilters = (
  assignment: Assignment,
  filters: TeacherAssignmentFilters,
): boolean => {
  if (filters.status && filters.status !== 'all' && assignment.status !== filters.status) {
    return false;
  }

  if (filters.subject) {
    const subjectNeedle = filters.subject.trim().toLowerCase();
    if (!assignment.subject?.toLowerCase().includes(subjectNeedle)) {
      return false;
    }
  }

  if (filters.classOrDepartment) {
    const needle = filters.classOrDepartment.trim().toLowerCase();
    const haystack = [
      assignment.classLevel || '',
      assignment.departmentCode || '',
      assignment.department || '',
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(needle)) {
      return false;
    }
  }

  if (filters.dueFrom || filters.dueTo) {
    const dueKey = getDateKeyFromAssignment(assignment);
    if (filters.dueFrom && dueKey < filters.dueFrom) {
      return false;
    }
    if (filters.dueTo && dueKey > filters.dueTo) {
      return false;
    }
  }

  return true;
};

const matchesStudentProfile = (
  assignment: Assignment,
  studentProfile: {
    educationLevel?: string;
    departmentCode?: string;
    department?: string;
    yearNumber?: number;
    semesterNumber?: number;
    classLevel?: string;
    year?: string | number;
    semester?: string | number;
    subject?: string;
  },
) => {
  if (assignment.status !== 'active') {
    return false;
  }

  const profileEducationLevel = String(studentProfile.educationLevel || 'btech').toLowerCase();
  const assignmentEducationLevel = String(assignment.educationLevel || 'btech').toLowerCase();
  if (assignmentEducationLevel !== profileEducationLevel) {
    return false;
  }

  const deptCode = String(studentProfile.departmentCode || studentProfile.department || '')
    .trim()
    .toLowerCase();
  if (deptCode && assignmentEducationLevel !== 'school') {
    const assignmentDept = String(
      assignment.departmentCode || assignment.department || '',
    ).toLowerCase();
    if (assignmentDept !== deptCode) {
      return false;
    }
  }

  if (assignmentEducationLevel === 'school') {
    const classLevel = String(studentProfile.classLevel || '').trim().toLowerCase();
    if (classLevel && String(assignment.classLevel || '').trim().toLowerCase() !== classLevel) {
      return false;
    }
  }

  const profileYear =
    studentProfile.yearNumber ?? Number(String(studentProfile.year || '').match(/\d+/)?.[0] || 0);
  if (profileYear && assignment.yearNumber && Number(assignment.yearNumber) !== Number(profileYear)) {
    return false;
  }

  const profileSemester =
    studentProfile.semesterNumber ??
    Number(String(studentProfile.semester || '').match(/\d+/)?.[0] || 0);
  if (
    profileSemester &&
    assignment.semesterNumber &&
    Number(assignment.semesterNumber) !== Number(profileSemester)
  ) {
    return false;
  }

  const subject = String(studentProfile.subject || '').trim().toLowerCase();
  if (subject && !String(assignment.subject || '').toLowerCase().includes(subject)) {
    return false;
  }

  return true;
};

export const createAssignment = async (
  data: Omit<Assignment, 'assignmentId' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
  const now = firestore.FieldValue.serverTimestamp();
  const cleanData: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanData[key] = value;
    }
  });

  const docRef = await firestore().collection('assignments').add({
    ...cleanData,
    createdAt: now,
    updatedAt: now,
  });
  await docRef.update({ assignmentId: docRef.id });
  return docRef.id;
};

export const updateAssignment = async (
  assignmentId: string,
  updates: Partial<Assignment>,
): Promise<void> => {
  const cleanUpdates: Record<string, any> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  });

  await firestore().collection('assignments').doc(assignmentId).update({
    ...cleanUpdates,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const getTeacherAssignments = async (
  teacherId: string,
  statusOrFilters?: AssignmentStatus | TeacherAssignmentFilters,
): Promise<Assignment[]> => {
  const filters: TeacherAssignmentFilters =
    typeof statusOrFilters === 'string'
      ? { status: statusOrFilters }
      : statusOrFilters || {};

  try {
    const snapshot = await firestore()
      .collection('assignments')
      .where('teacherId', '==', teacherId)
      .limit(100)
      .get();

    const assignments = snapshot.docs.map(docToAssignment);
    const filtered = assignments.filter(item => matchesTeacherFilters(item, filters));

    filtered.sort((a, b) => {
      const aTime = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
      const bTime = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
      return bTime - aTime;
    });

    return filtered;
  } catch (error) {
    if (!isIndexError(error)) {
      throw error;
    }

    // Fallback safe query for failed-precondition index errors.
    const snapshot = await firestore().collection('assignments').limit(100).get();
    const assignments = snapshot.docs
      .map(docToAssignment)
      .filter(item => item.teacherId === teacherId)
      .filter(item => matchesTeacherFilters(item, filters));

    assignments.sort((a, b) => {
      const aTime = (a.createdAt as any)?.toMillis ? (a.createdAt as any).toMillis() : 0;
      const bTime = (b.createdAt as any)?.toMillis ? (b.createdAt as any).toMillis() : 0;
      return bTime - aTime;
    });

    return assignments;
  }
};

export const getStudentAssignments = async (studentProfile: {
  educationLevel?: string;
  departmentCode?: string;
  department?: string;
  yearNumber?: number;
  semesterNumber?: number;
  classLevel?: string;
  year?: string | number;
  semester?: string | number;
  subject?: string;
}): Promise<Assignment[]> => {
  try {
    const snapshot = await firestore()
      .collection('assignments')
      .where('status', '==', 'active')
      .limit(100)
      .get();

    return snapshot.docs.map(docToAssignment).filter(item => matchesStudentProfile(item, studentProfile));
  } catch (error) {
    if (!isIndexError(error)) {
      throw error;
    }

    const snapshot = await firestore().collection('assignments').limit(100).get();
    return snapshot.docs.map(docToAssignment).filter(item => matchesStudentProfile(item, studentProfile));
  }
};

export const getAssignmentById = async (assignmentId: string): Promise<Assignment | null> => {
  const doc = await firestore().collection('assignments').doc(assignmentId).get();
  if (!doc.exists) {
    return null;
  }
  return docToAssignment(doc);
};

export const publishAssignment = async (assignmentId: string): Promise<void> => {
  await updateAssignment(assignmentId, { status: 'active' } as Partial<Assignment>);
};

export const closeAssignment = async (assignmentId: string): Promise<void> => {
  await updateAssignment(assignmentId, { status: 'closed' } as Partial<Assignment>);
};

export const uploadAssignmentAttachment = async (
  assignmentId: string,
  file: LocalUploadFile,
): Promise<{
  attachmentUrl: string;
  attachmentPublicId: string;
  attachmentResourceType: string;
  attachmentName: string;
  attachmentMimeType: string;
  attachmentSize: number;
  cloudinaryFormat: string;
  originalFilename: string;
  width?: number;
  height?: number;
  duration?: number;
}> => {
  const uploaded = await uploadLocalFileToCloudinary(file, {
    folder: `acams/assignments/${assignmentId}/teacher`,
    preferredResourceType: 'auto',
    useSignedUpload: false,
  });

  return {
    attachmentUrl: uploaded.cloudinarySecureUrl,
    attachmentPublicId: uploaded.cloudinaryPublicId,
    attachmentResourceType: uploaded.cloudinaryResourceType,
    attachmentName: file.name,
    attachmentMimeType: file.mimeType,
    attachmentSize: uploaded.bytes || file.sizeBytes || 0,
    cloudinaryFormat: uploaded.cloudinaryFormat,
    originalFilename: uploaded.originalFilename,
    width: uploaded.width,
    height: uploaded.height,
    duration: uploaded.duration,
  };
};
