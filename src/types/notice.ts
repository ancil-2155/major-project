import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type TargetRole = 'all' | 'student' | 'teacher' | 'parent';
export type NoticePriority = 'normal' | 'important' | 'urgent';
export type NoticeStatus = 'active' | 'hidden' | 'expired' | 'deleted';
export type TargetEducationLevel = 'all' | 'school' | 'btech' | 'college';

export interface Notice {
  noticeId: string;
  
  title: string;
  message: string;

  targetRole: TargetRole;
  targetEducationLevel: TargetEducationLevel;
  targetDepartmentCode: string | null;
  targetYearNumber: number | null;
  targetSemesterNumber: number | null;
  targetClassLevel: string | null;

  priority: NoticePriority;
  status: NoticeStatus;

  createdBy: string;
  createdByName: string | null;
  createdByRole: 'admin';

  createdAt: FirebaseFirestoreTypes.Timestamp | any;
  updatedAt: FirebaseFirestoreTypes.Timestamp | any;
  
  expiresAt: FirebaseFirestoreTypes.Timestamp | any | null;
}

export interface NoticeReadReceipt {
  userId: string;
  readAt: FirebaseFirestoreTypes.Timestamp | any;
}
