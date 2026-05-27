import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type LibraryResourceType = 'pdf' | 'notes' | 'book' | 'video' | 'link' | 'image' | 'other';
export type EducationLevel = 'school' | 'btech' | 'college' | 'all';

export interface LibraryResource {
  resourceId: string;
  title: string;
  description: string;
  resourceType: LibraryResourceType;

  fileUrl: string | null;
  filePath: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  externalLink: string | null;

  educationLevel: EducationLevel;
  departmentCode: string | null;
  department: string | null;
  yearNumber: number | null;
  semesterNumber: number | null;
  classLevel: string | null;
  subject: string;

  uploadedBy: string;
  uploadedByName: string;
  uploadedByRole: 'teacher' | 'admin';
  uploaderPhotoUrl: string | null;

  viewCount: number;
  downloadCount: number;
  bookmarkCount: number;

  status: 'active' | 'hidden' | 'deleted';

  createdAt: FirebaseFirestoreTypes.Timestamp | Date;
  updatedAt: FirebaseFirestoreTypes.Timestamp | Date;
}

export interface LibraryBookmark {
  studentId: string;
  studentName: string;
  createdAt: FirebaseFirestoreTypes.Timestamp | Date;
}
